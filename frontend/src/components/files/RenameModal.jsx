import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Edit3 } from 'lucide-react';
import { filesAPI, foldersAPI } from '../../api';

/**
 * RenameModal — Centered portal modal for renaming files or folders.
 * - Preloads current name
 * - Auto-selects filename (without extension) on open
 * - Validates empty input
 * - Renders via portal to stay above all z-index layers
 */
export default function RenameModal({ item, type = 'file', onClose, onRenameComplete }) {
  const [name, setName] = useState(item?.name || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  // Auto-focus & select filename (without extension) on open
  useEffect(() => {
    if (!inputRef.current) return;
    inputRef.current.focus();
    if (type === 'file') {
      const lastDot = name.lastIndexOf('.');
      if (lastDot > 0) {
        inputRef.current.setSelectionRange(0, lastDot);
      } else {
        inputRef.current.select();
      }
    } else {
      inputRef.current.select();
    }
  }, []); // eslint-disable-line

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();

    if (!trimmed) {
      setError('Name cannot be empty. Please enter a valid name.');
      inputRef.current?.focus();
      return;
    }
    if (trimmed === item.name) { onClose(); return; }

    setLoading(true);
    setError('');
    try {
      let updatedItem;
      if (type === 'folder') {
        const { data } = await foldersAPI.updateFolder(item._id, { name: trimmed });
        updatedItem = data.folder;
      } else {
        const { data } = await filesAPI.updateFile(item._id, { name: trimmed });
        updatedItem = data.file;
      }
      onRenameComplete?.(updatedItem);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to rename. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
          width: 'min(92vw, 440px)',
          boxShadow: '0 40px 80px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.04)',
          overflow: 'hidden',
          animation: 'modalScaleIn 0.28s cubic-bezier(0.34,1.56,0.64,1) forwards',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px 18px',
          borderBottom: '1px solid #f1f5f9',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '12px',
              background: 'linear-gradient(135deg, #f59e0b, #f97316)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(245,158,11,0.35)',
            }}>
              <Edit3 size={18} color="#ffffff" />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Rename {type === 'folder' ? 'Folder' : 'File'}
              </h2>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0' }}>
                Enter a new name below
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

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
              New Name
            </label>
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
              placeholder={`Enter ${type} name…`}
              style={{
                width: '100%', padding: '10px 14px',
                border: error ? '2px solid #ef4444' : '2px solid #e2e8f0',
                borderRadius: '12px', fontSize: '14px',
                color: '#0f172a', background: '#f8fafc',
                outline: 'none', boxSizing: 'border-box',
                transition: 'border-color 0.15s',
              }}
              onFocus={(e) => { if (!error) e.currentTarget.style.borderColor = '#7c3aed'; }}
              onBlur={(e) => { if (!error) e.currentTarget.style.borderColor = '#e2e8f0'; }}
            />
            {error && (
              <p style={{ fontSize: '12px', color: '#ef4444', margin: '6px 0 0' }}>{error}</p>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1, padding: '11px',
                borderRadius: '12px', border: '1px solid #e2e8f0',
                background: '#f8fafc', color: '#475569',
                fontWeight: 600, fontSize: '13px', cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#e2e8f0'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              style={{
                flex: 1, padding: '11px',
                borderRadius: '12px', border: 'none',
                background: loading || !name.trim()
                  ? 'rgba(124,58,237,0.4)'
                  : 'linear-gradient(135deg, #f59e0b, #f97316)',
                color: '#ffffff', fontWeight: 700, fontSize: '13px',
                cursor: loading || !name.trim() ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                boxShadow: loading || !name.trim() ? 'none' : '0 4px 14px rgba(245,158,11,0.4)',
              }}
            >
              {loading ? (
                <>
                  <span style={{
                    width: '14px', height: '14px',
                    border: '2px solid rgba(255,255,255,0.35)',
                    borderTopColor: '#fff', borderRadius: '50%',
                    animation: 'spin 0.6s linear infinite', display: 'inline-block',
                  }} />
                  Renaming…
                </>
              ) : 'Rename'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
