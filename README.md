Job Search Web App – Arbeitnow API Integration
📖 Overview

This project is a mini web application built using HTML, CSS, and JavaScript that integrates the public Arbeitnow Job Board REST API. The app fetches real-time job listings from multiple API endpoints, stores them in memory and browser cache, and displays them in a structured and user-friendly way. It supports filtering and viewing detailed information of individual jobs.

Note: The Arbeitnow API returns job listings mainly from European countries (especially Germany and nearby EU regions). Therefore, the application naturally focuses on Europe-only job results, satisfying the assignment requirement.

🚀 Features

Fetch job data from multiple API endpoints

Pagination (Load More Jobs)

Keyword search (title / company)

Location filter (dynamic dropdown)

Remote-only filter

Detailed job view using slug as unique ID

Caching using localStorage

Error handling for network failures, invalid responses & timeouts

🌐 API Endpoints Used
Purpose	Endpoint
First batch of jobs	https://www.arbeitnow.com/api/job-board-api
Second batch of jobs	https://www.arbeitnow.com/api/job-board-api?page=2

These two endpoints satisfy the assignment requirement to fetch data from multiple endpoints.

🛠 Tech Stack
Technology	Usage
HTML	Page layout and UI container
CSS	Styling and responsive design
JavaScript	API calls, filtering, caching, rendering, event handling
REST API	External data source
🧠 Architecture / Workflow

Fetch job listing from API (page 1)

Store jobs in internal array allJobs

Cache responses in localStorage

Render job list on UI

Apply filters (search, location, remote)

Click Load More → fetch next endpoint ?page=2

Click a job → display full job details using slug

⚠ Error Handling

The application gracefully handles:

Network failures

Timeout errors (via AbortController)

Non-200 responses

Missing or malformed fields (fallback values used)

💻 How to Run the Project
Option 1 — Open directly

Just open index.html in any browser.

Option 2 — Run using a simple local server (recommended)
python -m http.server 8000


Then open:

http://localhost:8000

Assignment Requirement Checklist: 
Requirement	Status    ✔ 
Uses public REST API	✔
Two different API endpoints	✔
Stores/caches data	✔
Filtering feature	✔
Single item detail view	✔
Error handling	✔
Clear output	✔
Documentation	✔
🏁 Conclusion

This project demonstrates complete REST API integration in a web environment, including fetching data from multiple endpoints, storing data, dynamic UI updates, filtering, pagination, error handling, and displaying detailed information by ID — fulfilling all assignment goals.

👤 Developer

Sumanth Banisettii