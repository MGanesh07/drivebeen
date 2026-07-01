import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Move, ChevronRight } from 'lucide-react';
import { filesAPI, foldersAPI } from '../../api';

/**
 * MoveModal — Portal-based folder picker to move a file.
 * - Renders via createPortal to stay above all z-index layers
 * - Supports nested folder navigation with breadcrumbs
 * - Shows current file's folder so user can move to root or any other folder
 * - Calls onMoveComplete(updatedFile) on success
 */
export default function MoveModal({ file, onClose, onMoveComplete }) {
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [moving, setMoving] = useState(false);
  const [currentFolder, setCurrentFolder] = useState(null); // null = My Drive root
  const [path, setPath] = useState([]);
  const [moveError, setMoveError] = useState('');

  useEffect(() => {
    const fetchFolders = async () => {
      setLoading(true);
      try {
        const parentId = currentFolder ? currentFolder._id : 'root';
        const { data } = await foldersAPI.getFolders({ parent: parentId });
        setFolders(data.folders || []);
      } catch {
        toast.error('Failed to load folders');
      } finally {
        setLoading(false);
      }
    };
    fetchFolders();
  }, [currentFolder]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleMove = async () => {
    if (moving) return;

    const destinationId = currentFolder ? currentFolder._id : null;
    const currentFileFolder = file.folder?._id ?? file.folder ?? null;

    if (String(currentFileFolder) === String(destinationId)
      || (!currentFileFolder && destinationId === null)) {
      setMoveError('File is already in this location. Please choose a different folder.');
      return;
    }

    setMoveError('');
    setMoving(true);
    try {
      const { data } = await filesAPI.updateFile(file._id, { folder: destinationId });
      onMoveComplete?.(data.file);
      onClose();
    } catch (err) {
      setMoveError(err.response?.data?.message || 'Failed to move file. Please try again.');
    } finally {
      setMoving(false);
    }
  };

  const handleNavigate = (folder) => {
    setCurrentFolder(folder);
    setPath((prev) => [...prev, folder]);
    setMoveError(''); // Clear error on directory navigation
  };

  const handleBreadcrumb = (index) => {
    if (index === -1) { setCurrentFolder(null); setPath([]); }
    else { setCurrentFolder(path[index]); setPath(path.slice(0, index + 1)); }
    setMoveError(''); // Clear error on breadcrumb navigation
  };

  const targetLabel = currentFolder ? `📁 ${currentFolder.name}` : '💾 My Drive (Root)';

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000000,
        background: 'rgba(2, 4, 18, 0.72)',
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px', animation: 'fadeIn 0.2s ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#ffffff', borderRadius: '24px',
          width: 'min(92vw, 460px)',
          boxShadow: '0 40px 80px rgba(0,0,0,0.25)',
          overflow: 'hidden',
          animation: 'modalScaleIn 0.28s cubic-bezier(0.34,1.56,0.64,1) forwards',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px 18px', borderBottom: '1px solid #f1f5f9',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '12px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(16,185,129,0.35)',
            }}>
              <Move size={18} color="#ffffff" />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Move File</h2>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0' }}>
                Choose a destination for "{file.name}"
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
            onMouseEnter={(e) => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = '#fecaca'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px 24px' }}>
          {/* Breadcrumb */}
          <div style={{
            display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px',
            fontSize: '12px', color: '#64748b', marginBottom: '14px',
            padding: '8px 12px', background: '#f8fafc', borderRadius: '10px',
          }}>
            <button
              onClick={() => handleBreadcrumb(-1)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: currentFolder === null ? '#7c3aed' : '#64748b',
                fontWeight: currentFolder === null ? 700 : 500,
                fontSize: '12px', padding: 0, transition: 'color 0.15s',
              }}
            >
              My Drive
            </button>
            {path.map((f, i) => (
              <span key={f._id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ChevronRight size={10} />
                <button
                  onClick={() => handleBreadcrumb(i)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: currentFolder?._id === f._id ? '#7c3aed' : '#64748b',
                    fontWeight: currentFolder?._id === f._id ? 700 : 500,
                    fontSize: '12px', padding: 0, transition: 'color 0.15s',
                  }}
                >
                  {f.name}
                </button>
              </span>
            ))}
          </div>

          {/* Folder list */}
          <div style={{ maxHeight: '220px', overflowY: 'auto', marginBottom: '16px' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: '#94a3b8', fontSize: '13px' }}>
                Loading folders…
              </div>
            ) : folders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0' }}>
                <p style={{ fontSize: '24px', margin: '0 0 8px' }}>📂</p>
                <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>No subfolders here</p>
              </div>
            ) : (
              folders.map((f) => (
                <button
                  key={f._id}
                  onClick={() => handleNavigate(f)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '10px 14px', borderRadius: '12px',
                    border: '1px solid #f1f5f9', background: '#fafafa',
                    marginBottom: '6px', cursor: 'pointer', transition: 'all 0.15s',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#fafafa'; e.currentTarget.style.borderColor = '#f1f5f9'; }}
                >
                  <span style={{ fontSize: '20px' }}>📁</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {f.name}
                    </p>
                    <p style={{ fontSize: '11px', color: '#94a3b8', margin: '2px 0 0' }}>
                      {f.fileCount || 0} files
                    </p>
                  </div>
                  <ChevronRight size={14} style={{ color: '#94a3b8', flexShrink: 0 }} />
                </button>
              ))
            )}
          </div>

          {/* Target indicator */}
          <div style={{
            padding: '10px 16px', borderRadius: '12px',
            background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)',
            marginBottom: moveError ? '10px' : '18px', textAlign: 'center', fontSize: '13px',
            color: '#064e3b', fontWeight: 600,
          }}>
            Moving to: <span style={{ color: '#059669' }}>{targetLabel}</span>
          </div>

          {/* Inline error for same-location or network error */}
          {moveError && (
            <div style={{
              padding: '10px 14px', borderRadius: '10px',
              background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.25)',
              marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <span style={{ fontSize: '16px', flexShrink: 0 }}>⚠️</span>
              <p style={{ fontSize: '12px', color: '#dc2626', margin: 0, fontWeight: 500 }}>{moveError}</p>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={onClose}
              style={{
                flex: 1, padding: '11px', borderRadius: '12px',
                border: '1px solid #e2e8f0', background: '#f8fafc',
                color: '#475569', fontWeight: 600, fontSize: '13px',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#e2e8f0'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
            >
              Cancel
            </button>
            <button
              onClick={handleMove}
              disabled={moving || loading}
              style={{
                flex: 1, padding: '11px', borderRadius: '12px',
                border: 'none',
                background: moving || loading ? 'rgba(16,185,129,0.4)' : 'linear-gradient(135deg, #10b981, #059669)',
                color: '#ffffff', fontWeight: 700, fontSize: '13px',
                cursor: moving || loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                boxShadow: moving || loading ? 'none' : '0 4px 14px rgba(16,185,129,0.4)',
              }}
            >
              {moving ? (
                <>
                  <span style={{
                    width: '14px', height: '14px',
                    border: '2px solid rgba(255,255,255,0.35)',
                    borderTopColor: '#fff', borderRadius: '50%',
                    animation: 'spin 0.6s linear infinite', display: 'inline-block',
                  }} />
                  Moving…
                </>
              ) : 'Move Here'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
