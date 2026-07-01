import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/LoginPage';   // Combined sliding auth page
import DashboardPage from './pages/DashboardPage';
import MyDrivePage from './pages/MyDrivePage';
import RecentPage from './pages/RecentPage';
import FavoritesPage from './pages/FavoritesPage';
import TrashPage from './pages/TrashPage';
import StoragePage from './pages/AnalyticsPage';
import NotificationsPage from './pages/NotificationsPage';
import SettingsPage from './pages/SettingsPage';
import SearchPage from './pages/SearchPage';

import { FileProvider } from './context/FileContext';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <FileProvider>
          <BrowserRouter>
            <Routes>
            {/* Public routes — unauthenticated users land here */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<LoginPage />} />

            {/* Protected routes — AppLayout redirects to /login if not authenticated */}
            <Route element={<AppLayout />}>
              <Route path="/recent" element={<RecentPage />} />
              <Route path="/drive" element={<MyDrivePage />} />
              <Route path="/favorites" element={<FavoritesPage />} />
              <Route path="/trash" element={<TrashPage />} />
              <Route path="/storage" element={<StoragePage />} />
              <Route path="/analytics" element={<Navigate to="/storage" replace />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/search" element={<SearchPage />} />
            </Route>

            {/* Catch-all: redirect to login */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
        </FileProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
