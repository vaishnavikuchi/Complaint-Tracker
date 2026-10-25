# Complaint Tracker - Full-Stack Web Application

A full-stack, general-purpose **Complaint Tracker System** built for a web programming course project. Anyone can submit a grievance about any issue, track its progress and timeline with a unique Tracking ID, and administrators can review, comment, update status, or delete complaints.

---

## 🚀 Features

- **3-Page Architecture**:
  1. **Dashboard (Home)**: High-level metric summary cards (Total filed, Submitted, In Review, In Progress, Resolved, Rejected), an interactive category breakdown chart powered by Recharts, and a prominent "Track your complaint" lookup tool that immediately reveals status and full timeline history in an overlay modal.
  2. **File a Complaint**: Comprehensive submission form featuring client-side validation, 9 issue categories, 3 priority levels, submitter contact info, and immediate generation of a sequential tracking ID (e.g. `CMP-2026-0001`) with a one-click copy button and direct tracking access.
  3. **All Complaints**: Interactive directory with debounced live search as you type, filters by status, category, and priority, sortable table columns, pagination, and a slide-over detail drawer. Includes XML export and XML file import capabilities, plus an Admin mode modal with JWT authorization to update status, append remarks, and delete complaints.
- **Dark & Light Mode**: Accessible theme switcher persistent across reloads with customized CSS variables.
- **Status Workflow**: `Submitted` &rarr; `In Review` &rarr; `In Progress` &rarr; `Resolved` (or `Rejected`).
- **No Database Needed**: Pure in-memory state with atomic persistence to `server/data/complaints.json`.

---

## 🛠️ Required Technology Coverage

| Requirement | Implementation Details in This Codebase |
| :--- | :--- |
| **1. TypeScript** | Both client and server run in **strict mode** (`"strict": true`, `"noImplicitAny": true`, etc.) with zero use of `any`. Shared interfaces (`Complaint`, `Status`, `Priority`, `Category`, `TimelineEvent`, `ComplaintComment`) are defined in `/shared/types.ts` and consumed consistently across frontend and backend. |
| **2. JSON** | All REST API requests and responses are strictly formatted in JSON. Complaint records are stored in memory and persisted to disk in `server/data/complaints.json` using Node.js `fs/promises`. Formatted sample seed data with 12 realistic fictional complaints is preloaded. |
| **3. AJAX** | All client-server communication utilizes modern `fetch` with `async/await` without triggering page reloads. Handlers provide visual loading states, spinner indicators, error alerts, and a **debounced live search** (`useDebounce` hook, 300ms) that queries `/api/complaints?search=...` as the user types. |
| **4. XML** | **Export as XML**: The "Export as XML" button hits `GET /api/complaints/export/xml` and downloads a well-formed XML file. <br>**Import from XML**: The "Import from XML" button uploads an XML file to `POST /api/complaints/import/xml`, which is parsed server-side via `fast-xml-parser` and saved into the JSON store. A ready-to-test sample XML file is provided in `/server/samples/sample-complaints.xml`. |
| **5. Node.js + Express** | Organized in a modular structure: routes (`/routes`), controllers (`/controllers`), services (`/services`), and middleware (`/middleware` for input validation, request logging, CORS, and centralized error handling). Environment configurations are loaded using `dotenv`. |

---

## 📂 Project Structure

```text
complaint-tracker/
├── package.json               # Root scripts (starts client & server together via concurrently)
├── README.md                  # Project documentation & tech coverage report
├── shared/
│   └── types.ts               # Shared TypeScript strict definitions
├── server/
│   ├── package.json           # Server dependencies (Express, fast-xml-parser, multer, jwt)
│   ├── tsconfig.json          # Strict TypeScript configuration
│   ├── .env                   # Environment variables (PORT, JWT_SECRET, ADMIN credentials)
│   ├── .env.example           # Environment template
│   ├── data/
│   │   └── complaints.json    # JSON storage seeded with 12 realistic sample complaints
│   ├── samples/
│   │   └── sample-complaints.xml # Sample XML file for testing XML imports
│   └── src/
│       ├── index.ts           # Server port listener entrypoint
│       ├── app.ts             # Express app (middleware, routes, CORS, error handler)
│       ├── types/             # Re-exports shared types
│       ├── middleware/
│       │   ├── auth.ts        # Admin JWT verification middleware
│       │   ├── validation.ts  # Input validation for complaints and comments
│       │   ├── logger.ts      # HTTP request logging middleware
│       │   └── errorHandler.ts# Centralized error handler returning { "error": "message" }
│       ├── routes/
│       │   ├── complaints.ts  # Complaints endpoints (CRUD, tracking, XML export/import)
│       │   ├── stats.ts       # Stats endpoint
│       │   └── auth.ts        # Admin login endpoint
│       ├── controllers/
│       │   ├── complaintsController.ts # Complaint HTTP handlers
│       │   ├── statsController.ts      # Stats HTTP handlers
│       │   └── authController.ts       # Authentication HTTP handlers
│       └── services/
│           ├── complaintService.ts     # In-memory store + fs JSON persistence
│           └── xmlService.ts           # XML builder & XML parser
└── client/
    ├── package.json           # React 18, Vite, React Router, Recharts, Lucide icons
    ├── tsconfig.json          # Strict TypeScript configuration
    ├── vite.config.ts         # Vite bundler configuration with /api proxy to port 5000
    ├── index.html             # HTML root
    └── src/
        ├── main.tsx           # React DOM mounting
        ├── App.tsx            # Main router and layout
        ├── context/
        │   ├── ThemeContext.tsx # Dark/Light theme manager
        │   └── AuthContext.tsx  # Admin JWT authentication state
        ├── services/
        │   └── api.ts         # Typed API client (AJAX fetch requests, JSON, XML)
        ├── hooks/
        │   ├── useDebounce.ts   # Custom debounce hook for live search
        │   └── useComplaints.ts # Custom hook for querying complaints with pagination
        ├── components/
        │   ├── Navbar.tsx       # Header with theme toggle and admin indicator
        │   ├── Modal.tsx        # Accessible dialog component
        │   ├── Drawer.tsx       # Slide-over detail drawer
        │   ├── TrackingModal.tsx# Status & timeline display for tracking ID
        │   ├── AdminLoginModal.tsx # Admin login modal
        │   ├── StatusBadge.tsx  # Status pill with icons
        │   ├── PriorityBadge.tsx# Priority level badge
        │   ├── Timeline.tsx     # Complaint progress timeline
        │   └── Pagination.tsx   # Pagination navigation
        ├── pages/
        │   ├── Dashboard.tsx    # Page 1: Stats, category chart, track input
        │   ├── FileComplaint.tsx# Page 2: Complaint submission form & ID copy
        │   └── AllComplaints.tsx# Page 3: Directory, search, filters, XML & Admin drawer
        └── styles/
            └── index.css        # Clean, modern, responsive CSS design system
```

---

## 📡 REST API Documentation

All API requests and responses use JSON (except XML endpoints). Errors consistently conform to `{ "error": "message" }`.

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/complaints` | Public | List complaints with search, category, priority, status, sort, page & limit query parameters. |
| `GET` | `/api/complaints/track/:trackingId` | Public | Retrieve a specific complaint by Tracking ID (e.g. `CMP-2026-0001`). |
| `POST` | `/api/complaints` | Public | Submit a new complaint; generates tracking ID and persists to `data/complaints.json`. |
| `PUT` | `/api/complaints/:id/status` | Admin | Update complaint status and append timeline event. |
| `POST` | `/api/complaints/:id/comments` | Admin | Add an internal admin remark/comment. |
| `DELETE` | `/api/complaints/:id` | Admin | Delete a complaint permanently. |
| `GET` | `/api/stats` | Public | Aggregated counts by status, priority, and category. |
| `GET` | `/api/complaints/export/xml` | Public | Export all complaints as a well-formed downloadable XML document. |
| `POST` | `/api/complaints/import/xml` | Public | Import complaints from uploaded XML file (`multipart/form-data`) or raw XML payload. |
| `POST` | `/api/auth/login` | Public | Admin login. Returns JWT token and admin user profile. |

---

## 🔐 Admin Credentials

Default credentials set in `server/.env`:
- **Username**: `admin`
- **Password**: `admin123`

---

## 🏃 Getting Started & Running

### Prerequisites
- Node.js (v18 or newer)
- npm

### 1. Installation
Run from the repository root:
```bash
# Install root, server, and client dependencies
npm run install:all
```
*(Or navigate into `/server` and `/client` individually and run `npm install`)*

### 2. Start Both Client and Server Together
```bash
npm run dev
```

- **Client**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000`

---

## 🧪 End-to-End Verification Guide

1. **File a Complaint**:
   - Go to `http://localhost:5173/file`.
   - Fill in the required fields and submit.
   - Note the generated tracking ID (e.g. `CMP-2026-0013`) and copy it using the copy button.
2. **Track Complaint by ID**:
   - Go to the **Dashboard** (`/`).
   - Enter your tracking ID in the search box and click **Track Now**.
   - Verify the modal shows the current status (`Submitted`) and initial timeline entry.
3. **Admin Review & Workflow Update**:
   - Open **All Complaints** (`/complaints`).
   - Click **Admin Login** in the navbar or page header (Credentials: `admin` / `admin123`).
   - Click on any complaint row to open the details drawer.
   - Change the status (e.g. from `Submitted` to `In Review` or `In Progress`), add an optional remark, and click **Update Status**.
   - Verify the timeline and status badge update immediately without refreshing the page.
   - Add an administrative comment and verify it appears under Administrative Remarks.
4. **XML Export**:
   - On the **All Complaints** page, click **Export as XML**.
   - An XML file (`complaints-export-YYYY-MM-DD.xml`) will download.
5. **XML Import**:
   - On the **All Complaints** page, click **Import from XML**.
   - Select the included sample XML file located at `server/samples/sample-complaints.xml`.
   - Verify the success notification appears and the new complaints are added to the table.
