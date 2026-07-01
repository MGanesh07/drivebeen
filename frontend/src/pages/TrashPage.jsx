import { useState, useEffect } from 'react';
import { trashAPI } from '../api';
import { Trash2, RotateCcw, AlertTriangle, X, Clock } from 'lucide-react';
import { formatBytes, timeAgo, getMimeIcon } from '../utils/helpers';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export default function TrashPage() {
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    trashAPI.getTrash().then(({ data }) => { setFiles(data.files); setFolders(data.folders); })
      .catch(() => toast.error('Failed to load trash')).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleRestore = async (id, isFolder = false) => {
    try {
      if (isFolder) await trashAPI.restoreFolder(id);
      else await trashAPI.restoreFile(id);
      toast.success('Restored successfully');
      load();
    } catch { toast.error('Restore failed'); }
  };

  const handlePermanentDelete = async (id) => {
    if (!confirm('Permanently delete this file? This cannot be undone.')) return;
    try {
      await trashAPI.permanentDelete(id);
      toast.success('Permanently deleted');
      load();
    } catch { toast.error('Delete failed'); }
  };

  const handleEmptyTrash = async () => {
    if (!confirm('Empty all trash? This cannot be undone.')) return;
    try {
      await trashAPI.emptyTrash();
      toast.success('Trash emptied');
      setFiles([]); setFolders([]);
    } catch { toast.error('Failed to empty trash'); }
  };

  const total = files.length + folders.length;

  return (
    <div className="space-y-5 animate-slide-up max-w-[768px] mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-900/30 flex items-center justify-center">
            <Trash2 size={18} className="text-red-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Trash</h1>
            <p className="text-xs text-[#6868a0]">{total} item{total !== 1 ? 's' : ''} in trash</p>
          </div>
        </div>
        {total > 0 && (
          <button onClick={handleEmptyTrash}
            className="flex items-center gap-2 text-xs text-red-400 hover:text-red-300 border border-red-900/40 hover:border-red-700/60 px-4 py-2 rounded-xl transition-all">
            <AlertTriangle size={13} /> Empty Trash
          </button>
        )}
      </div>

      {total > 0 && (
        <div style={{
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          borderRadius: '14px',
          background: 'rgba(239, 68, 68, 0.06)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          marginBottom: '16px',
        }}>
          <Clock size={16} style={{ color: '#dc2626', flexShrink: 0 }} />
          <p style={{
            fontSize: '12px',
            fontWeight: 700,
            color: '#b91c1c',
            margin: 0,
          }}>
            Files in trash will be permanently deleted after 30 days.
          </p>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="card p-4 animate-pulse flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-violet-900/20"/><div className="flex-1"><div className="h-3 w-40 bg-violet-900/20 rounded mb-1.5"/><div className="h-2.5 w-24 bg-violet-900/20 rounded"/></div></div>)}
        </div>
      ) : total === 0 ? (
        <div className="flex flex-col items-center py-20">
          <span className="text-5xl mb-4">🗑️</span>
          <p className="text-white font-semibold">Trash is empty</p>
          <p className="text-sm text-[#6868a0]">Deleted files will appear here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {folders.map(folder => (
            <div key={folder._id} className="card p-4 flex items-center gap-3 group">
              <span className="text-2xl">📁</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">{folder.name}</p>
                <p className="text-xs text-[#6868a0]">Folder · Deleted {timeAgo(folder.deletedAt)}</p>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleRestore(folder._id, true)} className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 px-3 py-1.5 rounded-lg hover:bg-violet-900/20 transition-all">
                  <RotateCcw size={12} /> Restore
                </button>
              </div>
            </div>
          ))}
          {files.map(file => (
            <div key={file._id} className="card p-4 flex items-center gap-3 group">
              <span className="text-2xl">{getMimeIcon(file.mimeType, file.name)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{file.name}</p>
                <p className="text-xs text-[#6868a0]">{formatBytes(file.size)} · Deleted {timeAgo(file.deletedAt)}</p>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleRestore(file._id)} className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 px-3 py-1.5 rounded-lg hover:bg-violet-900/20 transition-all">
                  <RotateCcw size={12} /> Restore
                </button>
                <button onClick={() => handlePermanentDelete(file._id)} className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg hover:bg-red-900/20 transition-all">
                  <X size={12} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
