# Acceptance Analytics Dashboard

## Overview

The Acceptance Analytics Dashboard is an executive-ready hiring analytics platform that tracks candidates throughout the complete offer lifecycle. Built with Node.js, Express.js, SQLite, and Chart.js, it provides real-time acceptance metrics, offer status tracking, tamper-evident verification using SHA-256 hashing, and interactive analytics for recruitment teams.

---

## Features

- Executive hiring analytics dashboard
- Real-time acceptance analytics
- End-to-end offer lifecycle tracking
- Candidate pipeline monitoring
- Offer journey funnel visualization
- Weekly hiring activity charts
- Final decision distribution
- SHA-256 tamper-evident offer verification
- Verification history and integrity validation
- Data quality monitoring
- CSV export functionality
- SQLite persistent storage
- Responsive dashboard design

---

## Tech Stack

- Node.js
- Express.js
- SQLite3
- HTML5
- CSS3
- JavaScript (ES6)
- Chart.js

---

## Project Structure

```
acceptance-analytics-dashboard/
│
├── controllers/
│   ├── analyticsController.js
│   ├── offerController.js
│   └── verificationController.js
│
├── models/
│   ├── analyticsModel.js
│   ├── offerModel.js
│   └── verificationModel.js
│
├── routes/
│   ├── analyticsRoutes.js
│   ├── offerRoutes.js
│   └── verificationRoutes.js
│
├── database/
│   ├── database.js
│   └── createDatabase.js
│
├── public/
│   ├── index.html
│   ├── style.css
│   └── app.js
│
├── utils/
│   └── hashUtil.js
│
├── package.json
├── app.js
└── README.md
```

---

## Installation

Clone the repository

```bash
git clone https://github.com/your-username/acceptance-analytics-dashboard.git
```

Move into the project

```bash
cd acceptance-analytics-dashboard
```

Install dependencies

```bash
npm install
```

Start the server

```bash
npm start
```

Application runs at

```
http://localhost:10000
```

---

## Dashboard Highlights

- Total Offers
- Accepted Offers
- Rejected Offers
- Expired Offers
- Acceptance Rate
- Active Pipeline
- Average Acceptance Time
- Verification Summary
- Recent Activity
- Data Quality Metrics
- Offer Journey Funnel
- Weekly Offer Activity
- Final Decision Distribution

---

## Verification Workflow

Each offer is protected using SHA-256 hashing.

Verification compares:

- Stored SHA-256 hash
- Current SHA-256 hash

The dashboard reports:

- Verified
- Tampered
- Verification Timestamp
- Verification History

---

## API Endpoints

### Analytics

```
GET /api/analytics/overview
GET /api/analytics/activity
GET /api/analytics/funnel
GET /api/analytics/decisions
GET /api/analytics/weekly
```

### Offers

```
GET /api/offers
POST /api/offers
PATCH /api/offers/:id/advance
PATCH /api/offers/:id/accept
PATCH /api/offers/:id/reject
PATCH /api/offers/:id/expire
```

### Verification

```
GET /api/verification
GET /api/verification/:id
```

---

## Deployment

The application is deployed on Render.

Live Demo:

https://acceptance-analytics-dashboard.onrender.com

---

## License

This project is developed for educational and portfolio purposes.
