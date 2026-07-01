import { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import Header from './Header';
import FileUploadModal from '../files/FileUploadModal';

/**
 * AppLayout
 * 
 * Manages the upload modal lifecycle and broadcasts an 'drivebeen:fileUploaded'
 * custom event on the window when an upload completes. Pages (RecentPage,
 * MyDrivePage) listen for this event to auto-refresh their file lists.
 * This avoids prop-drilling through the Outlet context.
 */
export default function AppLayout() {
  const { user, loading } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadFolderId, setUploadFolderId] = useState(null);

  if (loading) {
    return (
      <div
        style={{
          height: '100vh', width: '100vw',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--bg-app, #f8fafc)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '48px', height: '48px', borderRadius: '16px',
              background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <span style={{ color: '#fff', fontSize: '22px', fontWeight: 700 }}>D</span>
          </div>
          <div
            style={{
              width: '24px', height: '24px',
              border: '2px solid #7c3aed', borderTopColor: 'transparent',
              borderRadius: '50%', animation: 'spin 0.7s linear infinite',
            }}
          />
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  const openUpload = (folderId = null) => {
    setUploadFolderId(folderId);
    setUploadModalOpen(true);
  };

  const handleUploadComplete = () => {
    // Broadcast a custom event — any page can listen without prop drilling
    window.dispatchEvent(new CustomEvent('drivebeen:fileUploaded', {
      detail: { folderId: uploadFolderId },
    }));
  };

  const handleUploadClose = () => {
    setUploadModalOpen(false);
    setUploadFolderId(null);
  };

  return (
    <div
      style={{
        height: '100vh', width: '100vw',
        display: 'flex', overflow: 'hidden',
        background: 'var(--bg-app, #f8fafc)',
      }}
    >
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#ffffff',
            color: '#0f172a',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            fontSize: '13px',
            fontWeight: 500,
          },
          success: {
            iconTheme: { primary: '#7c3aed', secondary: '#fff' },
            style: { background: '#ffffff', color: '#0f172a', border: '1px solid #e9d5ff' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#fff' },
          },
        }}
      />

      {/* Sidebar */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed((c) => !c)} />
      </div>

      {/* Main area */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, overflow: 'hidden' }}>
        <Header onUploadClick={() => openUpload(null)} />
        <main
          style={{ flex: 1, overflowY: 'auto', padding: '24px' }}
          className="animate-fade-in"
        >
          <Outlet context={{ openUpload }} />
        </main>
      </div>

      {/* Upload Modal — rendered via Portal inside FileUploadModal itself */}
      {uploadModalOpen && (
        <FileUploadModal
          folderId={uploadFolderId}
          onClose={handleUploadClose}
          onUploadComplete={handleUploadComplete}
        />
      )}
    </div>
  );
}
