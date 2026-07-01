import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Grid, List, FolderPlus, MoreVertical, Trash2, Edit3 } from 'lucide-react';
import { filesAPI, foldersAPI } from '../api';
import FileCard from '../components/files/FileCard';
import FilePreviewModal from '../components/files/FilePreviewModal';
import FileUploadModal from '../components/files/FileUploadModal';
import RenameModal from '../components/files/RenameModal';
import SuccessOverlay from '../components/SuccessOverlay';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';
import { useFiles } from '../context/FileContext';

const SORT_OPTIONS = [
  { value: '-createdAt', label: 'Recently Added' },
  { value: 'createdAt', label: 'Oldest First' },
  { value: 'name', label: 'Name A-Z' },
  { value: '-name', label: 'Name Z-A' },
  { value: '-size', label: 'Largest Size' },
  { value: 'size', label: 'Smallest Size' },
];

const CATEGORY_FILTERS = [
  { value: '', label: 'All Files' },
  { value: 'document', label: '📄 Documents' },
  { value: 'image', label: '🖼️ Images' },
  { value: 'video', label: '🎬 Videos' },
  { value: 'audio', label: '🎵 Audio' },
];

const FOLDER_COLORS = ['#7C3AED', '#2563EB', '#059669', '#DC2626', '#D97706', '#0891B2'];

/* ─── Folder Confirm Dialog ──────────────────────────────────────────────── */
function FolderConfirmDialog({ open, folder, onConfirm, onCancel }) {
  if (!open || !folder) return null;
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
          <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>
            Delete Folder?
          </h3>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0, lineHeight: 1.55 }}>
            "{folder.name}" and all its contents will be moved to Trash. You can restore it later.
          </p>
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
              border: 'none', color: '#ffffff', fontWeight: 700, fontSize: '13px',
              cursor: 'pointer', transition: 'all 0.15s',
              boxShadow: '0 4px 12px rgba(239,68,68,0.35)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
          >
            Move to Trash
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ─── Folder Card with Portal Menu ──────────────────────────────────────── */
function FolderCard({ folder, onClick, onRename, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const menuBtnRef = useRef(null);
  const menuRef = useRef(null);

  const openMenu = (e) => {
    e.stopPropagation();
    if (menuBtnRef.current) {
      const rect = menuBtnRef.current.getBoundingClientRect();
      const w = 148;
      const h = 90;
      let left = rect.right - w;
      let top = rect.bottom + 6;
      if (left < 8) left = 8;
      if (left + w > window.innerWidth - 8) left = window.innerWidth - w - 8;
      if (top + h > window.innerHeight - 8) top = rect.top - h - 6;
      setPos({ top, left });
    }
    setMenuOpen(true);
  };

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (menuBtnRef.current && menuBtnRef.current.contains(e.target)) return;
      if (menuRef.current && menuRef.current.contains(e.target)) return;
      setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const menuPortal = menuOpen
    ? createPortal(
        <div
          ref={menuRef}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed', top: pos.top, left: pos.left,
            width: '148px',
            background: 'rgba(15,10,40,0.96)',
            backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(124,58,237,0.25)',
            borderRadius: '12px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            zIndex: 999999, padding: '5px',
            animation: 'scaleIn 0.12s cubic-bezier(0.34,1.56,0.64,1)',
          }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onRename(folder); }}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 10px', borderRadius: '8px', background: 'none', border: 'none',
              color: 'rgba(200,190,240,0.85)', fontSize: '12px', fontWeight: 500,
              cursor: 'pointer', textAlign: 'left',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(124,58,237,0.2)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'rgba(200,190,240,0.85)'; }}
          >
            <Edit3 size={12} /> Rename
          </button>
          <div style={{ borderTop: '1px solid rgba(124,58,237,0.2)', margin: '3px 0' }} />
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDelete(folder); }}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 10px', borderRadius: '8px', background: 'none', border: 'none',
              color: 'rgba(248,113,113,0.9)', fontSize: '12px', fontWeight: 500,
              cursor: 'pointer', textAlign: 'left',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.color = '#f87171'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'rgba(248,113,113,0.9)'; }}
          >
            <Trash2 size={12} /> Delete
          </button>
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <div
        className="card p-4 text-left hover:scale-105 transition-transform group relative cursor-pointer"
        onClick={() => onClick(folder)}
      >
        <div className="flex justify-between items-start">
          <div className="text-3xl mb-2">📁</div>
          <button
            ref={menuBtnRef}
            onClick={openMenu}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[#6868a0] hover:text-white hover:bg-violet-900/30 transition-all opacity-0 group-hover:opacity-100 flex-shrink-0"
          >
            <MoreVertical size={14} />
          </button>
        </div>
        <p className="text-xs font-semibold text-white truncate">{folder.name}</p>
        <p className="text-[10px] text-[#6868a0] mt-0.5">{folder.fileCount || 0} files</p>
      </div>
      {menuPortal}
    </>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────────── */
export default function MyDrivePage() {
  const { refreshUser } = useAuth();
  const { addOrUpdateFiles, getFile } = useFiles();
  const [view, setView] = useState('grid');
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('-createdAt');
  const [category, setCategory] = useState('');
  const [previewFile, setPreviewFile] = useState(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [currentFolder, setCurrentFolder] = useState(null);

  // Folder action states
  const [renameFolderItem, setRenameFolderItem] = useState(null);
  const [confirmDeleteFolder, setConfirmDeleteFolder] = useState(null); // folder object
  const [folderDeleting, setFolderDeleting] = useState(false);

  // Success overlay
  const [overlay, setOverlay] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        sort,
        ...(category && { category }),
        ...(currentFolder ? { folder: currentFolder._id } : { folder: 'root' }),
      };
      const [filesRes, foldersRes] = await Promise.all([
        filesAPI.getFiles(params),
        foldersAPI.getFolders(currentFolder ? { parent: currentFolder._id } : { parent: 'root' }),
        refreshUser(), // sync storage usage in sidebar
      ]);
      addOrUpdateFiles(filesRes.data.files);
      setFiles(filesRes.data.files);
      setFolders(foldersRes.data.folders);
    } catch { toast.error('Failed to load files'); }
    finally { setLoading(false); }
  }, [sort, category, currentFolder, refreshUser]);

  useEffect(() => { loadData(); }, [loadData]);

  // Refresh when file is uploaded
  useEffect(() => {
    const handleUpload = (e) => {
      const uploadedFolderId = e.detail?.folderId ?? null;
      if ((uploadedFolderId ?? null) === (currentFolder?._id ?? null)) loadData();
    };
    window.addEventListener('drivebeen:fileUploaded', handleUpload);
    return () => window.removeEventListener('drivebeen:fileUploaded', handleUpload);
  }, [loadData, currentFolder]);

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      await foldersAPI.createFolder({
        name: newFolderName,
        parent: currentFolder?._id || null,
        color: FOLDER_COLORS[Math.floor(Math.random() * FOLDER_COLORS.length)],
      });
      setNewFolderName('');
      setShowNewFolder(false);
      toast.success('Folder created');
      loadData();
    } catch { toast.error('Failed to create folder'); }
  };

  const handleDeleteFolderConfirmed = async () => {
    if (!confirmDeleteFolder || folderDeleting) return;
    setFolderDeleting(true);
    const folder = confirmDeleteFolder;
    setConfirmDeleteFolder(null);
    try {
      await foldersAPI.deleteFolder(folder._id);
      setFolders((prev) => prev.filter((f) => f._id !== folder._id));
      setOverlay({
        variant: 'delete',
        title: 'Folder Deleted',
        message: `"${folder.name}" has been moved to Trash.`,
      });
    } catch {
      toast.error('Failed to delete folder');
    } finally {
      setFolderDeleting(false);
    }
  };

  const handleFolderRenameComplete = (updatedFolder) => {
    setFolders((prev) => prev.map((f) => f._id === updatedFolder._id ? updatedFolder : f));
    setOverlay({
      variant: 'rename',
      title: 'Folder Renamed',
      message: `Folder renamed to "${updatedFolder?.name || ''}" successfully.`,
    });
  };

  const handleFileUpdate = (updatedFile) => {
    setFiles((prev) => prev.map((f) => f._id === updatedFile._id ? updatedFile : f));
  };

  // Called when a file card reports deletion – refresh data so storage & folder counts update
  const handleFileDelete = useCallback((fileId) => {
    setFiles((prev) => prev.filter((f) => f._id !== fileId));
    // Refresh to sync storage usage & folder item counts
    loadData();
  }, [loadData]);

  // Called from FileCard after successful trash – show delete overlay at page level
  // (card unmounts immediately so it can't own the overlay)
  const handleDeleteSuccess = useCallback((fileName) => {
    setOverlay({
      variant: 'delete',
      title: 'File Deleted',
      message: `"${fileName}" has been moved to Trash.`,
    });
  }, []);

  // Called from FileCard after successful move – reload so destination folder counts update
  const handleMoveSuccess = useCallback(() => {
    loadData();
  }, [loadData]);

  return (
    <>
      {/* Folder delete confirm */}
      <FolderConfirmDialog
        open={!!confirmDeleteFolder}
        folder={confirmDeleteFolder}
        onConfirm={handleDeleteFolderConfirmed}
        onCancel={() => setConfirmDeleteFolder(null)}
      />

      {/* Folder rename modal */}
      {renameFolderItem && (
        <RenameModal
          item={renameFolderItem}
          type="folder"
          onClose={() => setRenameFolderItem(null)}
          onRenameComplete={(updated) => {
            setRenameFolderItem(null);
            handleFolderRenameComplete(updated);
          }}
        />
      )}

      {/* Shared success overlay */}
      <SuccessOverlay
        open={!!overlay}
        onClose={() => setOverlay(null)}
        variant={overlay?.variant}
        title={overlay?.title}
        message={overlay?.message}
        autoCloseDuration={2400}
      />

      <div className="space-y-5 animate-slide-up">
        {/* Page Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-white">My Drive</h1>
            <p className="text-xs text-[#6868a0] mt-0.5">
              {files.length} file{files.length !== 1 ? 's' : ''} · {folders.length} folder{folders.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowNewFolder(true)} className="btn-ghost text-xs h-9">
              <FolderPlus size={14} /> New Folder
            </button>
            <button onClick={() => setUploadOpen(true)} className="btn-primary text-xs h-9">
              Upload Files
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1 flex-wrap">
            {CATEGORY_FILTERS.map((f) => (
              <button key={f.value} onClick={() => setCategory(f.value)}
                className={clsx('text-xs px-3 py-1.5 rounded-xl font-medium transition-all',
                  category === f.value ? 'bg-violet-600 text-white' : 'text-[#9898b8] hover:bg-violet-900/20 hover:text-violet-300')}>
                {f.label}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <select value={sort} onChange={(e) => setSort(e.target.value)}
              className="text-xs bg-[#141428] border border-violet-800/30 text-[#9898b8] rounded-xl px-3 py-1.5 outline-none focus:border-violet-600 cursor-pointer">
              {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <div className="flex items-center bg-[#141428] border border-violet-800/30 rounded-xl p-1">
              <button onClick={() => setView('grid')}
                className={clsx('w-7 h-7 rounded-lg flex items-center justify-center transition-all',
                  view === 'grid' ? 'bg-violet-600 text-white' : 'text-[#6868a0] hover:text-white')}>
                <Grid size={14} />
              </button>
              <button onClick={() => setView('list')}
                className={clsx('w-7 h-7 rounded-lg flex items-center justify-center transition-all',
                  view === 'list' ? 'bg-violet-600 text-white' : 'text-[#6868a0] hover:text-white')}>
                <List size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* New Folder Input */}
        {showNewFolder && (
          <div className="flex items-center gap-3 p-4 card animate-scale-in">
            <FolderPlus size={16} className="text-violet-400 flex-shrink-0" />
            <input
              autoFocus
              className="input-field flex-1 h-9"
              placeholder="Folder name..."
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreateFolder(); if (e.key === 'Escape') setShowNewFolder(false); }}
            />
            <button onClick={handleCreateFolder} className="btn-primary text-xs h-9">Create</button>
            <button onClick={() => setShowNewFolder(false)} className="btn-ghost text-xs h-9">Cancel</button>
          </div>
        )}

        {/* Folders */}
        {folders.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-[#6868a0] uppercase tracking-widest mb-3">Folders</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {folders.map((folder) => (
                <FolderCard
                  key={folder._id}
                  folder={folder}
                  onClick={setCurrentFolder}
                  onRename={setRenameFolderItem}
                  onDelete={setConfirmDeleteFolder}
                />
              ))}
            </div>
          </div>
        )}

        {/* Files */}
        <div>
          {currentFolder && (
            <div className="flex items-center gap-2 mb-3">
              <button onClick={() => setCurrentFolder(null)} className="text-xs text-violet-400 hover:text-violet-300">My Drive</button>
              <span className="text-[#6868a0]">/</span>
              <span className="text-xs text-white font-medium">{currentFolder.name}</span>
            </div>
          )}

          {!currentFolder && folders.length > 0 && files.length > 0 && (
            <p className="text-xs font-semibold text-[#6868a0] uppercase tracking-widest mb-3">Files</p>
          )}

          {loading ? (
            <div className={clsx(view === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4' : 'space-y-2')}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="card p-4 animate-pulse">
                  <div className="aspect-video bg-violet-900/20 rounded-xl mb-3" />
                  <div className="h-3 bg-violet-900/20 rounded w-3/4 mb-1.5" />
                  <div className="h-2.5 bg-violet-900/20 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : files.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 rounded-3xl bg-violet-900/20 flex items-center justify-center text-4xl mb-4">📂</div>
              <p className="text-base font-semibold text-white mb-1">No files here</p>
              <p className="text-sm text-[#6868a0]">Upload your first file to get started</p>
              <button onClick={() => setUploadOpen(true)} className="btn-primary mt-4 text-sm">Upload Files</button>
            </div>
          ) : (
            <div className={clsx(view === 'grid'
              ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4'
              : 'space-y-1')}>
              {files.map((file) => {
                const liveFile = getFile(file._id, file);
                return (
                  <FileCard
                    key={liveFile._id}
                    file={liveFile}
                    view={view}
                    onUpdate={handleFileUpdate}
                    onDelete={handleFileDelete}
                    onDeleteSuccess={handleDeleteSuccess}
                    onMoveSuccess={handleMoveSuccess}
                    onPreview={setPreviewFile}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Modals */}
        {previewFile && <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />}
        {uploadOpen && (
          <FileUploadModal
            folderId={currentFolder?._id}
            onClose={() => setUploadOpen(false)}
            onUploadComplete={loadData}
          />
        )}
      </div>
    </>
  );
}
