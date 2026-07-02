import { useState, useEffect, useRef } from 'react';
import { X, Download } from 'lucide-react';
import Portal from '../Portal';
import { filesAPI } from '../../api';
import { formatBytes, timeAgo, getMimeIcon } from '../../utils/helpers';
import toast from 'react-hot-toast';
import { useFiles } from '../../context/FileContext';

export default function FilePreviewModal({ file: initialFile, onClose }) {
  const { getFile } = useFiles();
  const activeFile = getFile(initialFile?._id) || initialFile;

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!activeFile) return null;

  const handleDownload = async () => {
    try {
      const { data } = await filesAPI.downloadFile(activeFile._id);
      const downloadUrl = data.downloadUrl;
      const a = document.createElement('a');
      a.href = downloadUrl;
      
      const ext = activeFile.originalName?.includes('.')
        ? `.${activeFile.originalName.split('.').pop()}`
        : '';
      const hasExt = activeFile.name.includes('.');
      a.download = hasExt ? activeFile.name : `${activeFile.name}${ext}`;
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success('Download started');
    } catch {
      toast.error('Download failed');
    }
  };

  const token = localStorage.getItem('drivebeen_token');
  const tokenParam = token ? `?token=${encodeURIComponent(token)}` : '';
  const apiUrl = `/api/files/serve/${activeFile._id}${tokenParam}`;

  const renderPreview = () => {
    const { mimeType, name } = activeFile;

    if (mimeType?.startsWith('image/')) {
      return (
        <img
          src={apiUrl}
          alt={name}
          style={{
            maxWidth: '100%', maxHeight: '52vh',
            objectFit: 'contain', borderRadius: '12px',
            display: 'block', margin: '0 auto',
          }}
        />
      );
    }

    if (mimeType?.startsWith('video/')) {
      return <VideoPreview src={apiUrl} />;
    }

    if (mimeType?.startsWith('audio/')) {
      return <AudioPreview src={apiUrl} name={name} />;
    }

    if (mimeType?.includes('pdf')) {
      return (
        <iframe
          src={apiUrl}
          style={{ width: '100%', height: '52vh', borderRadius: '12px', border: 'none', background: '#fff' }}
          title={name}
        />
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '40px 0' }}>
        <span style={{ fontSize: '72px' }}>{getMimeIcon(mimeType, name)}</span>
        <p style={{ color: '#475569', fontSize: '14px', fontWeight: 600, margin: 0 }}>Preview not available</p>
      </div>
    );
  };

  return (
    <Portal>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', top: 0, left: 0,
          width: '100vw', height: '100vh',
          zIndex: 99998,
          background: 'rgba(2, 6, 23, 0.72)',
          backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
          animation: 'fadeIn 0.2s ease forwards', pointerEvents: 'all',
        }}
      />
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 99999, width: 'min(88vw, 800px)',
          maxHeight: '88vh', display: 'flex', flexDirection: 'column',
          background: '#ffffff', borderRadius: '20px',
          boxShadow: '0 40px 100px rgba(0,0,0,0.4)',
          overflow: 'hidden',
          animation: 'previewModalIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
          pointerEvents: 'all',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: '1px solid #f1f5f9',
          flexShrink: 0, background: '#ffffff',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
            <span style={{ fontSize: '26px', flexShrink: 0 }}>{getMimeIcon(activeFile.mimeType, activeFile.name)}</span>
            <div style={{ minWidth: 0 }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {activeFile.name}
              </h3>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0' }}>
                {formatBytes(activeFile.size)} · Uploaded {timeAgo(activeFile.createdAt)}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, marginLeft: '12px' }}>
            <button
              onClick={handleDownload}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '7px 16px', borderRadius: '10px',
                background: '#f8fafc', border: '1px solid #e2e8f0',
                color: '#475569', fontSize: '12px', fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#0f172a'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#475569'; }}
            >
              <Download size={13} /> Download
            </button>
            <button
              onClick={onClose}
              style={{
                width: '32px', height: '32px', borderRadius: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'none', border: '1px solid #e2e8f0',
                color: '#94a3b8', cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = '#fecaca'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Preview Content */}
        <div style={{
          flex: 1, overflowY: 'auto', padding: '20px',
          background: '#f8fafc', display: 'flex',
          alignItems: 'center', justifyContent: 'center', minHeight: '160px',
        }}>
          {renderPreview()}
        </div>

        {/* Meta Footer */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          borderTop: '1px solid #f1f5f9', background: '#ffffff', flexShrink: 0,
        }}>
          {[
            { label: 'File Size', value: formatBytes(activeFile.size) },
            { label: 'Type', value: activeFile.category },
            { label: 'Uploaded', value: timeAgo(activeFile.createdAt) },
          ].map(({ label, value }, i) => (
            <div key={label} style={{ padding: '12px 20px', borderRight: i < 2 ? '1px solid #f1f5f9' : 'none' }}>
              <p style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>{label}</p>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', margin: '3px 0 0', textTransform: 'capitalize' }}>{value}</p>
            </div>
          ))}
        </div>
      </div>
    </Portal>
  );
}

// ─── Video Preview with loading state ───────────────────────────────────────
function VideoPreview({ src }) {
  const [ready, setReady] = useState(false);
  const videoRef = useRef(null);

  return (
    <div style={{ width: '100%', maxHeight: '52vh', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {!ready && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: '14px', background: 'rgba(15,23,42,0.06)', borderRadius: '12px',
        }}>
          <div style={{
            width: '40px', height: '40px',
            border: '3px solid #e2e8f0', borderTopColor: '#7c3aed',
            borderRadius: '50%', animation: 'spin 0.7s linear infinite',
          }} />
          <p style={{ fontSize: '13px', color: '#64748b', fontWeight: 500, margin: 0 }}>Loading video...</p>
        </div>
      )}
      <video
        ref={videoRef}
        src={src}
        controls
        preload="auto"
        onLoadedMetadata={() => setReady(true)}
        onCanPlayThrough={() => setReady(true)}
        style={{
          maxWidth: '100%', maxHeight: '52vh', borderRadius: '12px',
          display: 'block', margin: '0 auto',
          opacity: ready ? 1 : 0,
          transition: 'opacity 0.25s ease',
        }}
      />
    </div>
  );
}

// ─── Audio Preview with loading state ───────────────────────────────────────
function AudioPreview({ src, name }) {
  const [ready, setReady] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', padding: '24px 0', width: '100%' }}>
      <div style={{
        width: '90px', height: '90px', borderRadius: '50%',
        background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(124,58,237,0.05))',
        border: '2px solid rgba(124,58,237,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: '40px' }}>🎵</span>
      </div>
      <p style={{ fontSize: '14px', fontWeight: 600, color: '#334155', margin: 0, maxWidth: '300px', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {name}
      </p>
      {!ready && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#94a3b8', fontSize: '12px' }}>
          <div style={{
            width: '16px', height: '16px',
            border: '2px solid #e2e8f0', borderTopColor: '#7c3aed',
            borderRadius: '50%', animation: 'spin 0.7s linear infinite',
          }} />
          Loading audio...
        </div>
      )}
      <audio
        src={src}
        controls
        preload="auto"
        onLoadedMetadata={() => setReady(true)}
        onCanPlayThrough={() => setReady(true)}
        style={{
          width: '100%', maxWidth: '380px',
          opacity: ready ? 1 : 0,
          transition: 'opacity 0.25s ease',
        }}
      />
    </div>
  );
}
