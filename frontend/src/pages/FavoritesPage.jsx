import { useState, useEffect, useCallback } from 'react';
import { filesAPI } from '../api';
import FileCard from '../components/files/FileCard';
import FilePreviewModal from '../components/files/FilePreviewModal';
import SuccessOverlay from '../components/SuccessOverlay';
import { Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useFiles } from '../context/FileContext';

export default function FavoritesPage() {
  const { refreshUser } = useAuth();
  const { addOrUpdateFiles, getFile } = useFiles();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState(null);
  const [overlay, setOverlay] = useState(null);

  useEffect(() => {
    filesAPI.getFavorites()
      .then(({ data }) => {
        addOrUpdateFiles(data.files);
        setFiles(data.files);
      })
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  }, [addOrUpdateFiles]);

  const handleUpdate = (updated) => {
    if (!updated.isFavorite) setFiles(p => p.filter(f => f._id !== updated._id));
    else setFiles(p => p.map(f => f._id === updated._id ? updated : f));
  };

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

  const handleMoveSuccess = useCallback(() => {
    setFiles([]);
    setLoading(true);
    filesAPI.getFavorites().then(({ data }) => setFiles(data.files)).finally(() => setLoading(false));
    refreshUser();
    setOverlay({
      variant: 'move',
      title: 'File Moved',
      message: 'File has been moved successfully.',
    });
  }, [refreshUser]);

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

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-900/30 flex items-center justify-center">
          <Star size={18} className="text-amber-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Favorites</h1>
          <p className="text-xs text-[#6868a0]">{files.length} starred file{files.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[1,2,3,4,5].map(i => <div key={i} className="card p-4 animate-pulse"><div className="aspect-video bg-violet-900/20 rounded-xl mb-3"/><div className="h-3 bg-violet-900/20 rounded w-3/4"/></div>)}
        </div>
      ) : files.length === 0 ? (
        <div className="flex flex-col items-center py-20">
          <span className="text-5xl mb-4">⭐</span>
          <p className="text-white font-semibold">No favorites yet</p>
          <p className="text-sm text-[#6868a0]">Star files to pin them here for quick access</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {files.map(file => {
            const liveFile = getFile(file._id, file);
            return (
              <FileCard
                key={liveFile._id}
                file={liveFile}
                onPreview={setPreview}
                onUpdate={handleUpdate}
                onDelete={handleFileDelete}
                onDeleteSuccess={handleDeleteSuccess}
                onMoveSuccess={handleMoveSuccess}
              />
            );
          })}
        </div>
      )}
      {preview && <FilePreviewModal file={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}
