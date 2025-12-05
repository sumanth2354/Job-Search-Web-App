const API_BASE = "https://www.arbeitnow.com/api/job-board-api";


let allJobs = [];
let currentPage = 1;
let isLoading = false;

// DOM elements
const jobsListEl = document.getElementById("jobsList");
const statusMessageEl = document.getElementById("statusMessage");
const loadMoreBtn = document.getElementById("loadMoreBtn");
const searchInputEl = document.getElementById("searchInput");
const locationSelectEl = document.getElementById("locationSelect");
const remoteOnlyEl = document.getElementById("remoteOnly");
const clearFiltersBtn = document.getElementById("clearFiltersBtn");
const jobDetailsEl = document.getElementById("jobDetails");
const detailsPanelEl = document.getElementById("detailsPanel");

/**
 * Show a status or error message
 */
function showStatus(message, type = "info") {
  statusMessageEl.textContent = message;
  statusMessageEl.classList.remove("hidden", "info", "error");
  statusMessageEl.classList.add(type);
}

/**
 * Hide status message
 */
function hideStatus() {
  statusMessageEl.classList.add("hidden");
}

/**
 * Fetch jobs from API with timeout and simple caching (localStorage).
 */
async function fetchJobs(page = 1) {
  if (isLoading) return;

  isLoading = true;
  loadMoreBtn.disabled = true;
  showStatus(`Loading jobs (page ${page})...`, "info");

  // Cache key for this page
  const cacheKey = `arbeitnow_jobs_page_${page}`;
  const cached = localStorage.getItem(cacheKey);

  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      processJobsResponse(parsed, page, true);
      isLoading = false;
      loadMoreBtn.disabled = false;
      hideStatus();
      return;
    } catch {
      // If cache is corrupted, ignore it and re-fetch
      localStorage.removeItem(cacheKey);
    }
  }

  // Network fetch with timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    const url = page === 1 ? API_BASE : `${API_BASE}?page=${page}`;
    const res = await fetch(url, { signal: controller.signal });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}`);
    }

    const data = await res.json();
    // Cache the response
    localStorage.setItem(cacheKey, JSON.stringify(data));

    processJobsResponse(data, page, false);
    hideStatus();
  } catch (err) {
    clearTimeout(timeoutId);

    if (err.name === "AbortError") {
      showStatus("Request timed out. Please try again.", "error");
    } else {
      showStatus(`Failed to load jobs: ${err.message}`, "error");
    }
  } finally {
    isLoading = false;
    loadMoreBtn.disabled = false;
  }
}

/**
 * Process API response and update state.
 * The API returns an object with a "data" array.
 */
function processJobsResponse(data, page, fromCache) {
  if (!data || !Array.isArray(data.data)) {
    showStatus("Unexpected response format from API.", "error");
    return;
  }

  if (!fromCache) {
    showStatus(`Loaded ${data.data.length} jobs from page ${page}.`, "info");
    setTimeout(hideStatus, 1500);
  }

  // Merge new jobs into allJobs (avoid duplicates by slug)
  const existingSlugs = new Set(allJobs.map((j) => j.slug));
  const newJobs = data.data.filter((job) => job && !existingSlugs.has(job.slug));
  allJobs = [...allJobs, ...newJobs];

  populateLocationFilter();
  renderJobs();
}

/**
 * Build location dropdown based on jobs list
 */
function populateLocationFilter() {
  const locations = new Set();

  allJobs.forEach((job) => {
    const loc = job.location || "";
    if (loc.trim()) locations.add(loc.trim());
  });

  // Clear current options (keep "All locations")
  const currentValue = locationSelectEl.value;
  locationSelectEl.innerHTML = '<option value="">All locations</option>';

  Array.from(locations)
    .sort()
    .forEach((loc) => {
      const opt = document.createElement("option");
      opt.value = loc;
      opt.textContent = loc;
      locationSelectEl.appendChild(opt);
    });

  // keep previously selected value if still present
  locationSelectEl.value = currentValue;
}

/**
 * Apply filters and render job cards
 */
function renderJobs() {
  jobsListEl.innerHTML = "";

  if (!allJobs.length) {
    jobsListEl.innerHTML = "<p>No jobs loaded yet.</p>";
    return;
  }

  const searchTerm = searchInputEl.value.trim().toLowerCase();
  const locationFilter = locationSelectEl.value;
  const remoteOnly = remoteOnlyEl.checked;

  const filtered = allJobs.filter((job) => {
    if (!job) return false;

    // title/company search
    const title = (job.title || "").toLowerCase();
    const company = (job.company_name || "").toLowerCase();
    const matchesSearch =
      !searchTerm ||
      title.includes(searchTerm) ||
      company.includes(searchTerm);

    if (!matchesSearch) return false;

    // location filter
    const loc = job.location || "";
    if (locationFilter && loc !== locationFilter) {
      return false;
    }

    // remote filter
    const isRemote = Boolean(job.remote);
    if (remoteOnly && !isRemote) {
      return false;
    }

    return true;
  });

  if (!filtered.length) {
    jobsListEl.innerHTML = "<p>No jobs match your filters.</p>";
    return;
  }

  filtered.forEach((job) => {
    const card = document.createElement("article");
    card.className = "job-card";
    card.dataset.slug = job.slug;

    const title = job.title || "Untitled role";
    const company = job.company_name || "Unknown company";
    const location = job.location || "Location not specified";
    const isRemote = Boolean(job.remote);
    const jobTypes = Array.isArray(job.job_types) ? job.job_types : [];
    const tags = Array.isArray(job.tags) ? job.tags : [];
    const created = job.created_at || "";

    card.innerHTML = `
      <div class="job-header">
        <div>
          <div class="job-title">${title}</div>
          <div class="job-company">${company}</div>
        </div>
        <div>
          ${
            isRemote
              ? '<span class="badge badge-remote">Remote</span>'
              : ""
          }
        </div>
      </div>
      <div class="job-meta">
        <span class="badge">${location}</span>
        ${
          jobTypes.length
            ? `<span class="badge">${jobTypes.join(", ")}</span>`
            : ""
        }
        ${
          tags.length
            ? `<span class="badge">${
                tags.slice(0, 2).join(", ") +
                (tags.length > 2 ? " +" + (tags.length - 2) : "")
              }</span>`
            : ""
        }
      </div>
      ${
        created
          ? `<div class="job-meta">Posted: ${new Date(
              created
            ).toLocaleDateString()}</div>`
          : ""
      }
    `;

    card.addEventListener("click", () => {
      openJobDetails(job.slug);
    });

    jobsListEl.appendChild(card);
  });
}

/**
 * Show details for a single job by "ID" (we use slug as ID).
 */
function openJobDetails(slug) {
  const job = allJobs.find((j) => j.slug === slug);
  if (!job) {
    jobDetailsEl.innerHTML = "<p>Job not found.</p>";
    return;
  }

  const title = job.title || "Untitled role";
  const company = job.company_name || "Unknown company";
  const location = job.location || "Location not specified";
  const isRemote = Boolean(job.remote);
  const tags = Array.isArray(job.tags) ? job.tags : [];
  const jobTypes = Array.isArray(job.job_types) ? job.job_types : [];
  const url = job.url || job.apply_url || "";
  const rawDescription = job.description || "";

  // Many job descriptions are HTML – we render them as is but safely
  jobDetailsEl.innerHTML = `
    <div class="details-title">${title}</div>
    <div class="details-company">${company}</div>
    <div class="details-location">${location}${
    isRemote ? " · Remote" : ""
  }</div>

    <div class="details-tags">
      ${
        jobTypes.length
          ? `<span class="badge">${jobTypes.join(", ")}</span>`
          : ""
      }
      ${tags.map((t) => `<span class="badge">${t}</span>`).join(" ")}
    </div>

    <div class="details-description">${rawDescription}</div>

    <div class="details-actions">
      ${
        url
          ? `<a href="${url}" target="_blank" rel="noopener" class="primary-btn">Apply / View Job</a>`
          : ""
      }
    </div>
  `;

  detailsPanelEl.querySelector(".hint").textContent =
    "Showing job details (ID: " + slug + ")";
}

/**
 * Clear filters
 */
function clearFilters() {
  searchInputEl.value = "";
  locationSelectEl.value = "";
  remoteOnlyEl.checked = false;
  renderJobs();
}

/**
 * Attach event listeners
 */
function setupEvents() {
  loadMoreBtn.addEventListener("click", () => {
    currentPage += 1;
    fetchJobs(currentPage);
  });

  searchInputEl.addEventListener("input", () => {
    renderJobs();
  });

  locationSelectEl.addEventListener("change", () => {
    renderJobs();
  });

  remoteOnlyEl.addEventListener("change", () => {
    renderJobs();
  });

  clearFiltersBtn.addEventListener("click", clearFilters);
}

/**
 * Initialize app
 */
function init() {
  setupEvents();
  fetchJobs(1); // load first endpoint
}

document.addEventListener("DOMContentLoaded", init);
