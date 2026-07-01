# DriveBeen 🚀 — Cloud Storage Platform

DriveBeen is a modern, premium SaaS cloud storage platform inspired by Google Drive, Dropbox, and OneDrive. It is built with a decoupled React.js frontend, an Express.js backend API, and MongoDB for metadata persistence. It features an abstracted storage service layer designed for seamless migration from local disk storage to AWS S3.

---

## Key Features

- **Secure Authentication**: JWT-based user sign-up, login, and authorization.
- **File Management**: Upload, preview (images, videos, audio, PDFs), download, and rename files.
- **Folder Navigation**: Create folders, browse subfolders, and move files between them.
- **File Operations**:
  - ⭐ **Favorites**: Star critical files for quick access.
  - 📦 **Archive**: Move inactive files out of the main drive view.
  - 🗑️ **Trash**: Soft-delete files and folders with options to restore or permanently delete them.
- **General Access Links & Sharing**: Share files with specific users (via email with Viewer/Editor permissions) or generate public shareable links.
- **Storage Analytics**: Beautiful interactive dashboards using Recharts detailing storage utilization, file type distribution, and upload trends.
- **Activity Timeline**: Log actions such as uploads, shares, deletions, and moves.
- **Interactive UI**: Gorgeous dark/light glassmorphic UI built with Vite, React, and Tailwind CSS.

---

## Tech Stack

### Frontend
- **Framework**: React 19 + Vite
- **Styling**: Tailwind CSS v4 (Glassmorphism & animations)
- **Charts**: Recharts
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **File Drops**: React Dropzone
- **HTTP Client**: Axios

### Backend
- **Runtime**: Node.js + Express.js
- **Database**: MongoDB (via Mongoose)
- **File Upload Handler**: Multer
- **Security**: Helmet, CORS, Express Rate Limit, Compression

---

## Directory Structure

```
drivebeen/
├── backend/                   # Node.js + Express.js API
│   ├── src/
│   │   ├── config/            # DB, Env, and Multer configs
│   │   ├── controllers/       # Request handlers (Auth, Files, Folders, Sharing)
│   │   ├── middleware/        # Authentication, Error handling, Rate limits
│   │   ├── models/            # Mongoose schemas (User, File, Folder, Activity, etc.)
│   │   ├── routes/            # Route declarations
│   │   ├── services/          # Abstract Storage service & adapters (Local, S3)
│   │   └── app.js             # Bootstrap Express server
│   ├── uploads/               # Local disk storage folder
│   ├── .env                   # Environment config variables
│   └── package.json
│
     ├── src/
     │   ├── api/               # Axios API client requests
     │   ├── components/        # Reusable UI components (modals, charts, timeline)
     │   ├── context/           # Auth, Theme, and File (Centralized State) providers
     │   ├── pages/             # Layout and view files (11 distinct dashboards/views)
     │   ├── utils/             # Helper formatters and constants
     │   ├── App.jsx            # Router and layout configuration
     │   └── main.jsx           # App entry point
     ├── vite.config.js         # Port and local proxy settings
     └── package.json
```

---

## Centralized File State Management

DriveBeen uses a custom **`FileContext`** state provider (`FileProvider` / `useFiles`) to ensure all views, modal popups, and actions share the same source of truth:
- **Instant Propagation**: Any edit (rename, star/favorite, delete, or move) instantly propagates to all open pages (My Drive, Recent Files, Favorites, Search Results) and active modals (Preview Modal) without requiring manual refresh.
- **Preview Modal Syncing**: Opening a file preview fetches metadata from the live context store, meaning renames or updates instantly reflect in the preview header, footer details, and download filenames.
- **Rate-Limiter Cooldown**: Built-in 5-second throttling cooldown on the `refreshUser` profile statistics call to eliminate redundant network overhead (preventing HTTP 429 Too Many Requests errors).
- **Correct Storage Deductions**: Files and folder subtrees moved to Trash are deducted from user's `storageUsed` limits immediately. Restoring items correctly restores their cumulative file sizes to user storage.
- **Authentication Defaults**: Logging out or starting the server lands users directly on the **Sign In** panel by default.


---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16+)
- [MongoDB](https://www.mongodb.com/try/download/community) (Running locally or MongoDB Atlas connection string)

### 1. Configure the Backend
Navigate to the `backend` folder and create a `.env` file (one is pre-configured with default values):
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/drivebeen
JWT_SECRET=drivebeen_super_secret_jwt_key_2024_change_in_production
JWT_EXPIRE=7d
NODE_ENV=development
UPLOAD_PATH=uploads
MAX_FILE_SIZE=52428800
FRONTEND_URL=http://localhost:5173
STORAGE_ADAPTER=local
```

Install backend dependencies:
```bash
cd backend
npm install
```

### 2. Seed Demo Data
Populate the database with a pre-configured demo user (`alex@drivebeen.io`), sample folders, files, timelines, and notifications:
```bash
npm run seed
```
**Demo Credentials:**
*   **Email:** `alex@drivebeen.io`
*   **Password:** `password123`

### 3. Run the Backend API Server
Start the server in development mode (using nodemon) or standard start:
```bash
npm start
# or
npm run dev
```
The API will be available at `http://localhost:5000`.

### 4. Configure & Run the Frontend
Navigate to the `frontend` folder and install dependencies:
```bash
cd ../frontend
npm install
```

Start the Vite development server:
```bash
npm run dev
```
The application will open in your browser at `http://localhost:5173`. Vite is configured with a local proxy redirecting `/api` requests to `http://localhost:5000` automatically.

---

## AWS S3 Storage Adapter Migration Guide

DriveBeen is architected with a dedicated storage abstraction layer. The controllers query `storageService.js`, which wraps the active storage adapter without exposing disk/network specifics.

To migrate from **Local Disk** to **AWS S3**:

### 1. Install AWS SDK in Backend
```bash
cd backend
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

### 2. Update Backend Environment variables
Configure S3 in your backend `.env`:
```env
STORAGE_ADAPTER=s3
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-drivebeen-s3-bucket
```

### 3. Activate S3 Adapter
In [s3StorageAdapter.js](file:///d:/Projects/AWS%20Projects/drivebeen/backend/src/services/s3StorageAdapter.js):
1.  Uncomment imports and client initialization (Lines 9-20).
2.  Uncomment S3 operation commands inside `uploadFile`, `getFileStream`, and `deleteFile`.
3.  Remove the safeguard throw instructions (e.g., `throw new Error(...)`).

The backend controllers will immediately stream files to/from your AWS S3 bucket without requiring any refactoring!
