import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { X, Upload, File, Cloud, CloudUpload, CheckCircle } from 'lucide-react';
import Portal from '../Portal';
import { filesAPI } from '../../api';
import { formatBytes } from '../../utils/helpers';

/*
  Upload phases:
  ┌─────────────┐
  │    idle     │  Modal open, user picks files
  └──────┬──────┘
         │ click Upload
  ┌──────▼──────┐
  │  uploading  │  Modal gone, full-screen blur + cloud animation
  └──────┬──────┘
         │ all done
  ┌──────▼──────┐
  │   success   │  Centered ✓ card, 2s then auto-close
  └─────────────┘
*/

export default function FileUploadModal({ onClose, folderId, onUploadComplete }) {
  const [files, setFiles] = useState([]);
  const [phase, setPhase] = useState('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const fileCount = files.length;

  // Lock scroll whenever not idle
  useEffect(() => {
    if (phase !== 'idle') {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [phase]);

  // Auto-dismiss after success
  useEffect(() => {
    if (phase === 'success') {
      const t = setTimeout(() => onClose(), 2200);
      return () => clearTimeout(t);
    }
  }, [phase, onClose]);

  const onDrop = useCallback((accepted) => {
    const mapped = accepted.map((f) => ({
      file: f,
      id: Math.random().toString(36).slice(2),
    }));
    setFiles((prev) => [...prev, ...mapped]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
  });

  const removeFile = (id) => setFiles((prev) => prev.filter((f) => f.id !== id));

  const uploadAll = async () => {
    if (files.length === 0) return;

    // Immediately switch to upload phase — modal disappears, overlay appears
    setPhase('uploading');
    setUploadProgress(0);

    let done = 0;
    let succeeded = 0;
    const total = files.length;
    let lastError = '';

    for (const fileObj of files) {
      try {
        const formData = new FormData();
        formData.append('file', fileObj.file);
        if (folderId) formData.append('folder', folderId);

        await filesAPI.upload(formData, (pct) => {
          const overall = Math.round(((done + pct / 100) / total) * 100);
          setUploadProgress(Math.min(overall, 99));
        });
        succeeded++;
      } catch (err) {
        lastError = err.response?.data?.message || 'Upload failed. Please check your connection or file.';
      }
      done++;
      setUploadProgress(Math.round((done / total) * 100));
    }

    setUploadProgress(100);
    setSuccessCount(succeeded);

    // Notify parent to refresh file lists BEFORE showing success screen
    onUploadComplete?.();

    // Small pause so the 100% bar renders, then show success/error
    await new Promise((r) => setTimeout(r, 350));
    if (succeeded === 0) {
      setErrorMessage(lastError);
      setPhase('error');
    } else {
      setPhase('success');
    }
  };

  /* ────────────────────────────────────────────────────────── */
  /*  Phase: uploading / success — full-screen Portal overlay  */
  /* ────────────────────────────────────────────────────────── */
  if (phase === 'uploading' || phase === 'success' || phase === 'error') {
    return (
      <Portal>
        {/* Full-viewport overlay — blocks ALL interaction with the app */}
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0,
            width: '100vw', height: '100vh',
            zIndex: 99997,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'fadeIn 0.25s ease forwards',
            pointerEvents: 'all',
            userSelect: 'none',
          }}
        >
          {phase === 'uploading' ? (
            /* ── Cloud Upload Animation ── */
            <div style={{ textAlign: 'center', animation: 'slideUp 0.3s ease forwards' }}>

              {/* Animated cloud */}
              <div style={{ position: 'relative', width: '130px', height: '130px', margin: '0 auto 28px' }}>
                {/* Pulse rings */}
                <div style={{
                  position: 'absolute',
                  top: '-22px', left: '-22px', right: '-22px', bottom: '-22px',
                  borderRadius: '50%',
                  border: '2px solid rgba(167, 139, 250, 0.2)',
                  animation: 'pulseRing 2s ease-out infinite',
                }} />
                <div style={{
                  position: 'absolute',
                  top: '-10px', left: '-10px', right: '-10px', bottom: '-10px',
                  borderRadius: '50%',
                  border: '2px solid rgba(167, 139, 250, 0.35)',
                  animation: 'pulseRing 2s ease-out infinite 0.4s',
                }} />

                {/* Main cloud circle */}
                <div style={{
                  width: '130px', height: '130px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 0 60px rgba(124,58,237,0.5), 0 20px 50px rgba(0,0,0,0.3)',
                  animation: 'cloudFloat 2.2s ease-in-out infinite',
                }}>
                  <Cloud size={52} color="#ffffff" strokeWidth={1.5} />
                </div>

                {/* Orbiting upload dots */}
                {[0, 72, 144, 216, 288].map((deg, i) => (
                  <div
                    key={i}
                    style={{
                      position: 'absolute',
                      width: '9px', height: '9px', borderRadius: '50%',
                      background: ['#a78bfa', '#c4b5fd', '#7c3aed', '#ddd6fe', '#8b5cf6'][i],
                      top: '50%', left: '50%',
                      marginTop: '-4.5px', marginLeft: '-4.5px',
                      transform: `rotate(${deg}deg) translateX(82px)`,
                      animation: `dotOrbit 3.5s linear infinite ${i * 0.3}s`,
                      boxShadow: '0 0 6px rgba(167,139,250,0.8)',
                    }}
                  />
                ))}
              </div>

              <h3 style={{
                fontSize: '22px', fontWeight: 800, color: '#ffffff',
                margin: '0 0 8px', letterSpacing: '-0.02em',
              }}>
                Uploading {fileCount > 1 ? `${fileCount} Files` : 'File'}...
              </h3>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', margin: '0 0 28px' }}>
                Please wait, do not close the window
              </p>

              {/* Progress bar */}
              <div style={{ width: '300px', margin: '0 auto' }}>
                <div style={{
                  width: '100%', height: '6px',
                  background: 'rgba(255,255,255,0.15)',
                  borderRadius: '9999px', overflow: 'hidden',
                }}>
                  <div style={{
                     height: '100%', borderRadius: '9999px',
                     background: 'linear-gradient(90deg, #7c3aed, #a78bfa, #c4b5fd)',
                     backgroundSize: '200% 100%',
                     width: `${uploadProgress}%`,
                     transition: 'width 0.4s ease',
                     animation: 'shimmer 1.5s linear infinite',
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                    Uploading...
                  </span>
                  <span style={{ fontSize: '12px', color: '#a78bfa', fontWeight: 600 }}>
                    {uploadProgress}%
                  </span>
                </div>
              </div>
            </div>

          ) : phase === 'success' ? (
            /* ── Success State ── */
            <div style={{
              textAlign: 'center',
              animation: 'successEnter 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
            }}>
              {/* Success circle */}
              <div style={{
                width: '110px', height: '110px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 24px',
                boxShadow: '0 0 60px rgba(16,185,129,0.5), 0 20px 50px rgba(0,0,0,0.3)',
              }}>
                <CheckCircle size={52} color="#ffffff" strokeWidth={2} />
              </div>

              <h3 style={{
                fontSize: '26px', fontWeight: 800, color: '#ffffff',
                margin: '0 0 8px', letterSpacing: '-0.02em',
              }}>
                ✓ File{successCount > 1 ? 's' : ''} Uploaded Successfully
              </h3>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', margin: '0 0 6px' }}>
                {successCount} file{successCount > 1 ? 's have' : ' has'} been saved to your drive
              </p>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                Closing in a moment...
              </p>

              {/* Confetti particles (static positions, no Math.random in render) */}
              {[
                { top: '18%', left: '12%', bg: '#7c3aed', delay: '0s' },
                { top: '22%', left: '88%', bg: '#10b981', delay: '0.1s' },
                { top: '72%', left: '8%',  bg: '#f59e0b', delay: '0.2s' },
                { top: '75%', left: '90%', bg: '#ef4444', delay: '0.05s' },
                { top: '40%', left: '5%',  bg: '#3b82f6', delay: '0.15s' },
                { top: '55%', left: '92%', bg: '#ec4899', delay: '0.08s' },
                { top: '15%', left: '50%', bg: '#14b8a6', delay: '0.25s' },
                { top: '80%', left: '48%', bg: '#f97316', delay: '0.12s' },
              ].map((p, i) => (
                <div
                  key={i}
                  style={{
                    position: 'fixed',
                    top: p.top, left: p.left,
                    width: '12px', height: '12px',
                    borderRadius: '50%',
                    background: p.bg,
                    opacity: 0,
                    animation: `confettiFall 1s ease-out forwards ${p.delay}`,
                    pointerEvents: 'none',
                  }}
                />
              ))}
            </div>
          ) : (
            /* ── Error State ── */
            <div style={{
              textAlign: 'center',
              animation: 'successEnter 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
            }}>
              {/* Error circle */}
              <div style={{
                width: '110px', height: '110px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 24px',
                boxShadow: '0 0 60px rgba(239,68,68,0.5), 0 20px 50px rgba(0,0,0,0.3)',
              }}>
                <span style={{ fontSize: '48px', fontWeight: 'bold', color: '#ffffff' }}>⚠️</span>
              </div>

              <h3 style={{
                fontSize: '26px', fontWeight: 800, color: '#ffffff',
                margin: '0 0 8px', letterSpacing: '-0.02em',
              }}>
                Upload Failed
              </h3>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', margin: '0 0 24px', maxWidth: '380px', lineHeight: 1.5 }}>
                {errorMessage}
              </p>
              <button
                onClick={() => setPhase('idle')}
                style={{
                  background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '11px 32px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 8px 24px rgba(124,58,237,0.35)',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </Portal>
    );
  }

  /* ────────────────────────────────────────────────────── */
  /*  Phase: idle — Upload modal via Portal                 */
  /* ────────────────────────────────────────────────────── */
  return (
    <Portal>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0, left: 0,
          width: '100vw', height: '100vh',
          zIndex: 99996,
          background: 'rgba(2, 6, 23, 0.55)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          animation: 'fadeIn 0.2s ease forwards',
          pointerEvents: 'all',
        }}
      />

      {/* Modal */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 99997,
          width: 'min(92vw, 520px)',
          background: '#ffffff',
          borderRadius: '20px',
          boxShadow: '0 40px 80px rgba(0,0,0,0.3)',
          animation: 'previewModalIn 0.22s cubic-bezier(0.34,1.56,0.64,1) forwards',
          pointerEvents: 'all',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 20px', borderBottom: '1px solid #f1f5f9',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '12px',
              background: 'rgba(124,58,237,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <CloudUpload size={18} style={{ color: '#7c3aed' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Upload Files
              </h2>
              <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                {folderId ? 'Uploading to current folder' : 'Uploading to My Drive'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '32px', height: '32px', borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'none', border: '1px solid #e2e8f0',
              color: '#94a3b8', cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.color = '#ef4444'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#94a3b8'; }}
          >
            <X size={15} />
          </button>
        </div>

        <div style={{ padding: '20px' }}>
          {/* Dropzone */}
          <div
            {...getRootProps()}
            style={{
              border: `2px dashed ${isDragActive ? '#7c3aed' : '#e2e8f0'}`,
              background: isDragActive ? 'rgba(124,58,237,0.05)' : '#fafafa',
              borderRadius: '14px',
              padding: '36px 16px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <input {...getInputProps()} />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '18px',
                background: isDragActive ? 'rgba(124,58,237,0.15)' : 'rgba(124,58,237,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transform: isDragActive ? 'scale(1.1)' : 'scale(1)',
                transition: 'all 0.2s ease',
              }}>
                <Upload size={24} style={{ color: '#7c3aed' }} />
              </div>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', margin: '0 0 4px' }}>
                  {isDragActive ? 'Drop files here...' : 'Drag & drop files here'}
                </p>
                <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                  or{' '}
                  <span style={{ color: '#7c3aed', textDecoration: 'underline', cursor: 'pointer' }}>
                    browse files
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* File list */}
          {files.length > 0 && (
            <div style={{
              marginTop: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              maxHeight: '190px',
              overflowY: 'auto',
            }}>
              {files.map((f) => (
                <div
                  key={f.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '10px 12px', borderRadius: '12px',
                    background: '#f8fafc', border: '1px solid #f1f5f9',
                  }}
                >
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '8px',
                    background: 'rgba(124,58,237,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <File size={13} style={{ color: '#7c3aed' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: '12px', fontWeight: 600, color: '#0f172a',
                      margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {f.file.name}
                    </p>
                    <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>
                      {formatBytes(f.file.size)}
                    </p>
                  </div>
                  <button
                    onClick={() => removeFile(f.id)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: '#94a3b8', display: 'flex', flexShrink: 0,
                      transition: 'color 0.15s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; }}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button
              onClick={onClose}
              style={{
                padding: '9px 22px', borderRadius: '10px', cursor: 'pointer',
                background: '#f1f5f9', border: '1px solid #e2e8f0',
                color: '#475569', fontSize: '13px', fontWeight: 600,
                transition: 'all 0.15s', display: 'inline-flex', alignItems: 'center',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#0f172a'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#475569'; }}
            >
              Cancel
            </button>
            <button
              onClick={uploadAll}
              disabled={files.length === 0}
              style={{
                padding: '9px 22px', borderRadius: '10px',
                cursor: files.length === 0 ? 'not-allowed' : 'pointer',
                background: files.length === 0 ? '#c4b5fd' : '#7c3aed',
                border: 'none', color: '#ffffff', fontSize: '13px', fontWeight: 600,
                transition: 'all 0.15s', display: 'inline-flex', alignItems: 'center', gap: '6px',
                opacity: files.length === 0 ? 0.6 : 1,
              }}
              onMouseEnter={(e) => { if (files.length > 0) e.currentTarget.style.background = '#6d28d9'; }}
              onMouseLeave={(e) => { if (files.length > 0) e.currentTarget.style.background = '#7c3aed'; }}
            >
              <Upload size={13} />
              Upload{files.length > 0 ? ` (${files.length})` : ''}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}
