import { useState, useEffect, useCallback } from 'react';
import { filesAPI } from '../api';
import FileCard from '../components/files/FileCard';
import FilePreviewModal from '../components/files/FilePreviewModal';
import SuccessOverlay from '../components/SuccessOverlay';
import { Clock, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useFiles } from '../context/FileContext';

export default function RecentPage() {
  const { refreshUser } = useAuth();
  const { addOrUpdateFiles, getFile } = useFiles();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState(null);
  const [overlay, setOverlay] = useState(null); // { variant, title, message }

  const loadFiles = useCallback(() => {
    setLoading(true);
    filesAPI
      .getRecent()
      .then(({ data }) => {
        addOrUpdateFiles(data.files);
        setFiles(data.files);
      })
      .catch(() => toast.error('Failed to load recent files'))
      .finally(() => setLoading(false));
  }, [addOrUpdateFiles]);

  // Initial load
  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  // Auto-refresh whenever any upload completes (fired by AppLayout)
  useEffect(() => {
    const handleUpload = () => loadFiles();
    window.addEventListener('drivebeen:fileUploaded', handleUpload);
    return () => window.removeEventListener('drivebeen:fileUploaded', handleUpload);
  }, [loadFiles]);

  // File deleted: remove from list, show overlay, refresh storage
  const handleFileDelete = useCallback((fileId) => {
    setFiles((prev) => prev.filter((f) => f._id !== fileId));
    refreshUser();
  }, [refreshUser]);

  const handleDeleteSuccess = useCallback((fileName) => {
    setOverlay({
      variant: 'delete',
      title: 'File Deleted',
      message: `"${fileName}" has been moved to Trash.`,
    });
  }, []);

  // File moved: remove from recent list, refresh files + storage
  const handleMoveSuccess = useCallback(() => {
    loadFiles();
    refreshUser();
    setOverlay({
      variant: 'move',
      title: 'File Moved',
      message: 'File has been moved successfully.',
    });
  }, [loadFiles, refreshUser]);

  return (
    <div className="space-y-5 animate-slide-up">
      {/* Full-screen success overlay */}
      <SuccessOverlay
        open={!!overlay}
        onClose={() => setOverlay(null)}
        variant={overlay?.variant || 'generic'}
        title={overlay?.title || ''}
        message={overlay?.message || ''}
        autoCloseDuration={2400}
      />

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '12px',
            background: 'rgba(124,58,237,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Clock size={18} style={{ color: '#7c3aed' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-title)', margin: 0 }}>
              Recent Files
            </h1>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0' }}>
              Files you've accessed or uploaded recently
            </p>
          </div>
        </div>

        <button
          onClick={loadFiles}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '7px 14px', borderRadius: '10px',
            background: 'var(--bg-card)', border: '1px solid var(--border-color)',
            color: 'var(--text-muted)', fontSize: '12px', fontWeight: 500,
            cursor: 'pointer', transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#7c3aed'; e.currentTarget.style.borderColor = '#7c3aed'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
        >
          <RefreshCw size={13} />
          Refresh
        </button>
      </div>

      {/* File grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div style={{
                aspectRatio: '16/10', borderRadius: '10px', marginBottom: '12px',
                background: 'rgba(124,58,237,0.06)',
              }} />
              <div style={{ height: '12px', background: 'rgba(124,58,237,0.06)', borderRadius: '6px', width: '75%' }} />
            </div>
          ))}
        </div>
      ) : files.length === 0 ? (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: '80px 20px', textAlign: 'center',
        }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '24px',
            background: 'rgba(124,58,237,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '36px', marginBottom: '20px',
          }}>
            🕐
          </div>
          <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-title)', margin: '0 0 6px' }}>
            No recent files
          </p>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
            Files you access or upload will appear here
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {files.map((file) => {
            const liveFile = getFile(file._id, file);
            return (
              <FileCard
                key={liveFile._id}
                file={liveFile}
                onPreview={setPreview}
                onUpdate={(u) => setFiles((p) => p.map((f) => (f._id === u._id ? u : f)))}
                onDelete={handleFileDelete}
                onDeleteSuccess={handleDeleteSuccess}
                onMoveSuccess={handleMoveSuccess}
              />
            );
          })}
        </div>
      )}

      {preview && (
        <FilePreviewModal file={preview} onClose={() => setPreview(null)} />
      )}
    </div>
  );
}
