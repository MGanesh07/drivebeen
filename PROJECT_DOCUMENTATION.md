# DriveBeen Cloud Storage — Project & Technology Documentation

This document provides a comprehensive overview of the **DriveBeen** architecture, the technology stack employed, directory structure, module functionalities, and the core centralized file state management system.

---

## 🛠️ Technology Stack

### Frontend Application
- **Runtime & Build Tool**: React 19 (Single Page Application) built with **Vite 8** for lightning-fast hot module replacement.
- **Styling & Theme System**: CSS variables and utilities tailored for a clean, light glassmorphic SaaS design.
- **Iconography**: **Lucide React** for modern vector icons.
- **State Management**: React Context (`AuthContext`, `FileContext`, `ThemeContext`) for lightweight, reactive global states.
- **Analytics Charts**: **Recharts** representing storage quotas, file type distribution, and upload trends.
- **Networking**: **Axios** with global interceptors for request signing (JWT) and error handling.
- **Toasts**: **React Hot Toast** for lightweight alerts.

### Backend API
- **Runtime Platform**: **Node.js** with **Express.js** web application server.
- **Database Engine**: **MongoDB** for metadata persistence using **Mongoose** Object Data Modeling (ODM).
- **File Processing**: **Multer** middleware handling multi-part file uploads and storing chunks locally or streaming to external adapters.
- **Storage Service Interface**: Abstracted storage adapter layer allowing seamless switches between local folder filesystem and **AWS S3** (`s3StorageAdapter.js`).
- **Security Middleware**: **Helmet** (HTTP headers), **CORS** (cross-origin resource sharing), **Express Rate Limit** (protection against DDoS), and **Compression** (gzip).

---

## 📂 Core Functionalities & Modules

### 1. Centralized File State Management (`FileContext.jsx`)
Coordinates and synchronizes metadata changes across disparate sections (e.g. My Drive, Recent, Favorites, Search, Previews) in real-time:
- **`addOrUpdateFiles(filesList)`**: Merges freshly fetched arrays of files from the database into the client-side store map.
- **`updateFile(updatedFile)`**: Instantly updates individual records (renamed metadata, favorited status, category) globally.
- **`removeFile(fileId)`**: Removes the file from context caches on deletion or movement.
- **`getFile(fileId, fallback)`**: Dynamically resolves the latest cached properties of a file, ensuring preview overlays and download handlers always access the live metadata.

### 2. User Authentication (`AuthContext.jsx` & `LoginPage.jsx`)
Handles security validations and token management:
- **Default Landing**: Defaults the route to the **Sign In** screen.
- **Rate-Limit Guard**: Restricts the user profile validation (`refreshUser`) to a 5-second cooldown to completely eliminate server rate limiting (HTTP 429).
- **Validation**: Enforces strict frontend validation (e.g. profile name inputs cannot be saved empty).

### 3. File Operations & Actions (`FileCard.jsx`)
- **Download**: Queries the server for the file stream, dynamically generating the browser download handle while preserving renamed values (e.g. downloads renamed names like `Ganesh_Resume.pdf` with the original file extension).
- **Move to Trash**: Deducts file sizes from active user space immediately.
- **Restore from Trash**: Dynamically walks folders to sum folder sizes and add them back to the active user's storage limits.
- **Directory Move (`MoveModal.jsx`)**: Supports directory selector picking, displaying inline warnings if the user attempts to move an item to its current location, and clears validation messages dynamically upon navigation.

### 4. Interactive Previews (`FilePreviewModal.jsx`)
- Supports rich native rendering for Images (`<img>`), Videos (`<video>`), Audio (`<audio>`), and PDFs (`<iframe>`) on absolute dark-blurred backdrops.
- Synchronizes with the centralized file state so metadata renames are reflected live while the modal is open.

### 5. Storage Insights Dashboard (`AnalyticsPage.jsx`)
- Aggregates file stats and renders three responsive charts representing space distribution per category, upload activity, and monthly upload trends. Updates the stats dynamically on mount by reloading user details.
