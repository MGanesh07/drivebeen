import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical, Download, Star, Trash2, Edit3, Eye, Move } from 'lucide-react';
import { filesAPI } from '../../api';
import { formatBytes, timeAgo, getMimeIcon, truncate } from '../../utils/helpers';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import RenameModal from './RenameModal';
import MoveModal from './MoveModal';
import SuccessOverlay from '../SuccessOverlay';
import { useFiles } from '../../context/FileContext';

/* ─── Confirm Dialog Portal ────────────────────────────────────────────── */
function ConfirmDialog({ open, onConfirm, onCancel, title, message }) {
  if (!open) return null;
  return createPortal(
    <div
      onClick={onCancel}
      style={{
        position: 'fixed', inset: 0, zIndex: 2000000,
        background: 'rgba(2,4,18,0.70)',
        backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px', animation: 'fadeIn 0.2s ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#ffffff', borderRadius: '20px',
          padding: '28px 28px 24px', maxWidth: '400px', width: '100%',
          boxShadow: '0 40px 80px rgba(0,0,0,0.25)',
          animation: 'scaleIn 0.18s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '50%',
            background: 'rgba(239,68,68,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px', fontSize: '28px',
          }}>🗑️</div>
          <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>{title}</h3>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0, lineHeight: 1.55 }}>{message}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, padding: '10px', borderRadius: '12px',
              background: '#f1f5f9', border: '1px solid #e2e8f0',
              color: '#475569', fontWeight: 600, fontSize: '13px',
              cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#e2e8f0'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#f1f5f9'; }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1, padding: '10px', borderRadius: '12px',
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              border: 'none',
              color: '#ffffff', fontWeight: 700, fontSize: '13px',
              cursor: 'pointer', transition: 'all 0.15s',
              boxShadow: '0 4px 12px rgba(239,68,68,0.35)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'scale(1.02)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scale(1)'; }}
          >
            Move to Trash
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ─── Portal Dropdown ───────────────────────────────────────────────────── */
const CATEGORY_COLORS = {
  document: 'bg-blue-900/30 text-blue-300',
  image: 'bg-emerald-900/30 text-emerald-300',
  video: 'bg-red-900/30 text-red-300',
  audio: 'bg-amber-900/30 text-amber-300',
  other: 'bg-gray-900/30 text-gray-300',
};

function DropdownPortal({ anchorRef, open, onClose, children }) {
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open || !anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    const menuWidth = 176;
    const menuHeight = 230;
    let left = rect.right - menuWidth;
    let top = rect.bottom + 6;
    if (left < 8) left = 8;
    if (left + menuWidth > window.innerWidth - 8) left = window.innerWidth - menuWidth - 8;
    if (top + menuHeight > window.innerHeight - 8) top = rect.top - menuHeight - 6;
    setPos({ top, left });
  }, [open, anchorRef]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (anchorRef.current && anchorRef.current.contains(e.target)) return;
      if (menuRef.current && menuRef.current.contains(e.target)) return;
      onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onClose, anchorRef]);

  if (!open) return null;

  return createPortal(
    <div
      ref={menuRef}
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'fixed', top: pos.top, left: pos.left,
        width: '176px',
        background: 'rgba(15, 10, 40, 0.96)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(124,58,237,0.25)',
        borderRadius: '14px',
        boxShadow: '0 24px 60px rgba(0,0,0,0.5), 0 4px 16px rgba(124,58,237,0.2)',
        zIndex: 999999, padding: '6px',
        animation: 'scaleIn 0.12s cubic-bezier(0.34,1.56,0.64,1)',
      }}
    >
      {children}
    </div>,
    document.body
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────── */
export default function FileCard({ file, onUpdate, onDelete, onDeleteSuccess, onMoveSuccess, onPreview, view = 'grid' }) {
  const { getFile, updateFile, removeFile } = useFiles();
  const activeFile = getFile(file?._id) || file;

  const [menuOpen, setMenuOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Per-action loading states to prevent duplicate clicks
  const [downloading, setDownloading] = useState(false);
  const [favoriting, setFavoriting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Success overlays
  const [overlay, setOverlay] = useState(null); // { variant, title, message }

  const menuBtnRef = useRef(null);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  /* ── Actions ── */
  const handlePreview = (e) => {
    e?.stopPropagation();
    closeMenu();
    onPreview?.(activeFile);
  };

  const handleDownload = async (e) => {
    e?.stopPropagation();
    if (downloading) return;
    closeMenu();
    setDownloading(true);
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
    } finally {
      setDownloading(false);
    }
  };

  const handleFavorite = async (e) => {
    e?.stopPropagation();
    if (favoriting) return;
    closeMenu();
    setFavoriting(true);
    try {
      const { data } = await filesAPI.toggleFavorite(activeFile._id);
      const updated = { ...activeFile, isFavorite: data.isFavorite };
      // Update globally and locally
      updateFile(updated);
      onUpdate?.(updated);
      toast.success(data.isFavorite ? 'Added to favorites' : 'Removed from favorites');
    } catch {
      toast.error('Failed to update favorite');
    } finally {
      setFavoriting(false);
    }
  };

  const handleDeleteConfirmed = async () => {
    setConfirmDelete(false);
    if (deleting) return;
    setDeleting(true);
    try {
      await filesAPI.deleteFile(activeFile._id);
      // Remove globally first, then trigger local removal from page view
      removeFile(activeFile._id);
      onDelete?.(activeFile._id);
      onDeleteSuccess?.(activeFile.name); // parent shows the animated success overlay
    } catch {
      toast.error('Failed to delete file');
    } finally {
      setDeleting(false);
    }
  };

  const handleRenameComplete = (updatedFile) => {
    updateFile(updatedFile);
    onUpdate?.(updatedFile);
    setOverlay({
      variant: 'rename',
      title: 'File Renamed',
      message: `File has been renamed to "${updatedFile?.name || ''}" successfully.`,
    });
  };

  const handleMoveComplete = (updatedFile) => {
    updateFile(updatedFile);
    // Remove from current folder view and refresh page so destination folder counts update
    removeFile(activeFile._id);
    onDelete?.(activeFile._id);
    onMoveSuccess?.(); // triggers loadData() in parent so storage + folder counts refresh
  };

  const icon = getMimeIcon(activeFile.mimeType, activeFile.name);
  const colorClass = CATEGORY_COLORS[activeFile.category] || CATEGORY_COLORS.other;

  const token = localStorage.getItem('drivebeen_token');
  const tokenParam = token ? `?token=${encodeURIComponent(token)}` : '';
  const fileServeUrl = `/api/files/serve/${activeFile._id}${tokenParam}`;

  /* ── Dropdown Items ── */
  const dropdownItems = (
    <>
      <DropBtn icon={<Eye size={12} />} label="Preview" onClick={handlePreview} />
      <DropBtn
        icon={downloading ? <Spinner /> : <Download size={12} />}
        label={downloading ? 'Downloading…' : 'Download'}
        onClick={handleDownload}
        disabled={downloading}
      />
      <DropBtn
        icon={favoriting ? <Spinner /> : <Star size={12} />}
        label={favoriting ? 'Updating…' : (activeFile.isFavorite ? 'Unfavorite' : 'Favorite')}
        onClick={handleFavorite}
        disabled={favoriting}
      />
      <DropBtn
        icon={<Move size={12} />}
        label="Move File"
        onClick={(e) => { e.stopPropagation(); setMoveOpen(true); closeMenu(); }}
      />
      <DropBtn
        icon={<Edit3 size={12} />}
        label="Rename"
        onClick={(e) => { e.stopPropagation(); setRenameOpen(true); closeMenu(); }}
      />
      <div style={{ borderTop: '1px solid rgba(124,58,237,0.2)', margin: '4px 0' }} />
      <DropBtn
        icon={deleting ? <Spinner /> : <Trash2 size={12} />}
        label={deleting ? 'Deleting…' : 'Delete'}
        onClick={(e) => { e.stopPropagation(); closeMenu(); setConfirmDelete(true); }}
        danger
        disabled={deleting}
      />
    </>
  );

  /* ── List View ── */
  if (view === 'list') {
    return (
      <>
        <div
          className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-white/4 transition-all group cursor-pointer border border-transparent hover:border-violet-800/20 relative"
          onClick={handlePreview}
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 bg-violet-900/20">{icon}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{activeFile.name}</p>
            <p className="text-xs text-[#6868a0]">{activeFile.folder?.name || 'My Drive'} • {timeAgo(activeFile.createdAt)}</p>
          </div>
          <span className={clsx('badge text-[10px] hidden sm:inline-flex', colorClass)}>{activeFile.category}</span>
          <p className="text-xs text-[#6868a0] w-16 text-right hidden md:block">{formatBytes(activeFile.size)}</p>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleFavorite}
              disabled={favoriting}
              className={clsx('w-7 h-7 rounded-lg flex items-center justify-center transition-all', activeFile.isFavorite ? 'text-amber-400' : 'text-[#6868a0] hover:text-amber-400')}
            >
              <Star size={14} fill={activeFile.isFavorite ? 'currentColor' : 'none'} />
            </button>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[#6868a0] hover:text-violet-400 transition-all"
            >
              <Download size={14} />
            </button>
            <button
              ref={menuBtnRef}
              onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o); }}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[#6868a0] hover:text-white hover:bg-violet-900/30 transition-all"
            >
              <MoreVertical size={14} />
            </button>
          </div>

          <DropdownPortal anchorRef={menuBtnRef} open={menuOpen} onClose={closeMenu}>
            {dropdownItems}
          </DropdownPortal>
        </div>

        {/* Modals & overlays */}
        <ConfirmDialog
          open={confirmDelete}
          title="Move to Trash?"
          message={`"${activeFile.name}" will be moved to Trash. You can restore it later.`}
          onConfirm={handleDeleteConfirmed}
          onCancel={() => setConfirmDelete(false)}
        />
        {renameOpen && (
          <RenameModal
            item={activeFile} type="file"
            onClose={() => setRenameOpen(false)}
            onRenameComplete={handleRenameComplete}
          />
        )}
        {moveOpen && (
          <MoveModal
            file={activeFile}
            onClose={() => setMoveOpen(false)}
            onMoveComplete={handleMoveComplete}
          />
        )}
        <SuccessOverlay
          open={!!overlay}
          onClose={() => setOverlay(null)}
          variant={overlay?.variant}
          title={overlay?.title}
          message={overlay?.message}
          autoCloseDuration={2500}
        />
      </>
    );
  }

  /* ── Grid View ── */
  return (
    <>
      <div className="card p-4 cursor-pointer group relative animate-fade-in" onClick={handlePreview}>
        {/* Thumbnail */}
        <div className="aspect-video rounded-xl flex items-center justify-center text-4xl mb-3 bg-violet-900/20 overflow-hidden relative">
          {activeFile.mimeType?.startsWith('image/') ? (
            <img src={fileServeUrl} alt={activeFile.name} className="w-full h-full object-cover" />
          ) : (
            <span>{icon}</span>
          )}
        </div>

        {/* Info row */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white truncate">{truncate(activeFile.name, 24)}</p>
            <p className="text-xs text-[#6868a0] mt-0.5">{formatBytes(activeFile.size)} • {timeAgo(activeFile.createdAt)}</p>
          </div>
          <div className="flex-shrink-0">
            <button
              ref={menuBtnRef}
              onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o); }}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[#6868a0] hover:text-white hover:bg-violet-900/30 transition-all opacity-0 group-hover:opacity-100"
            >
              <MoreVertical size={14} />
            </button>
          </div>
        </div>

        {/* Star */}
        <button
          onClick={handleFavorite}
          disabled={favoriting}
          className={clsx(
            'absolute top-3 right-3 w-6 h-6 rounded-lg flex items-center justify-center transition-all',
            activeFile.isFavorite ? 'text-amber-400' : 'text-[#6868a0] opacity-0 group-hover:opacity-100 hover:text-amber-400'
          )}
        >
          <Star size={12} fill={activeFile.isFavorite ? 'currentColor' : 'none'} />
        </button>

        {/* Category badge */}
        <span className={clsx('absolute top-3 left-3 badge text-[9px]', colorClass)}>{activeFile.category}</span>

        <DropdownPortal anchorRef={menuBtnRef} open={menuOpen} onClose={closeMenu}>
          {dropdownItems}
        </DropdownPortal>
      </div>

      {/* Modals & overlays */}
      <ConfirmDialog
        open={confirmDelete}
        title="Move to Trash?"
        message={`"${activeFile.name}" will be moved to Trash. You can restore it later.`}
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setConfirmDelete(false)}
      />
      {renameOpen && (
        <RenameModal
          item={activeFile} type="file"
          onClose={() => setRenameOpen(false)}
          onRenameComplete={handleRenameComplete}
        />
      )}
      {moveOpen && (
        <MoveModal
          file={activeFile}
          onClose={() => setMoveOpen(false)}
          onMoveComplete={handleMoveComplete}
        />
      )}
      <SuccessOverlay
        open={!!overlay}
        onClose={() => setOverlay(null)}
        variant={overlay?.variant}
        title={overlay?.title}
        message={overlay?.message}
        autoCloseDuration={2500}
      />
    </>
  );
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function Spinner() {
  return (
    <span style={{
      display: 'inline-block',
      width: '10px', height: '10px',
      border: '2px solid rgba(200,190,240,0.3)',
      borderTopColor: '#a78bfa',
      borderRadius: '50%',
      animation: 'spin 0.6s linear infinite',
      flexShrink: 0,
    }} />
  );
}

function DropBtn({ icon, label, onClick, danger = false, disabled = false }) {
  const base = {
    width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
    padding: '8px 10px', borderRadius: '10px', background: 'none', border: 'none',
    fontSize: '12px', fontWeight: 500, cursor: disabled ? 'not-allowed' : 'pointer',
    textAlign: 'left', transition: 'all 0.12s', opacity: disabled ? 0.5 : 1,
    color: danger ? 'rgba(248,113,113,0.9)' : 'rgba(200,190,240,0.85)',
  };
  return (
    <button
      style={base}
      onClick={disabled ? undefined : onClick}
      onMouseEnter={(e) => {
        if (disabled) return;
        e.currentTarget.style.background = danger ? 'rgba(239,68,68,0.15)' : 'rgba(124,58,237,0.2)';
        e.currentTarget.style.color = danger ? '#f87171' : '#ffffff';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'none';
        e.currentTarget.style.color = danger ? 'rgba(248,113,113,0.9)' : 'rgba(200,190,240,0.85)';
      }}
    >
      {icon} {label}
    </button>
  );
}
