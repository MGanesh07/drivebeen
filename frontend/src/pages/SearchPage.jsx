import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { searchAPI } from '../api';
import FileCard from '../components/files/FileCard';
import FilePreviewModal from '../components/files/FilePreviewModal';
import clsx from 'clsx';
import { useFiles } from '../context/FileContext';

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const { addOrUpdateFiles, getFile } = useFiles();

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [files, setFiles] = useState([]);

  const doSearch = useCallback(async (query) => {
    if (!query.trim()) { setResults(null); setFiles([]); return; }
    setLoading(true);
    try {
      const { data } = await searchAPI.search({ q: query, limit: 50 });
      setResults(data);
      addOrUpdateFiles(data.files || []);
      setFiles(data.files || []);
    } catch { setResults(null); setFiles([]); }
    finally { setLoading(false); }
  }, [addOrUpdateFiles]);

  useEffect(() => {
    doSearch(q);
  }, [q, doSearch]);

  const handleFileUpdate = (updated) => {
    setFiles((prev) => prev.map((f) => f._id === updated._id ? updated : f));
  };
  const handleFileDelete = (id) => {
    setFiles((prev) => prev.filter((f) => f._id !== id));
  };

  const totalCount = (results?.files?.length || 0) + (results?.folders?.length || 0);

  return (
    <div className="space-y-5 animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Search size={20} className="text-violet-400" />
          Search Results
        </h1>
        {q && !loading && results && (
          <p className="text-xs text-[#6868a0] mt-1">
            {totalCount} result{totalCount !== 1 ? 's' : ''} for <span className="text-violet-300 font-semibold">"{q}"</span>
          </p>
        )}
        {q && !loading && !results && (
          <p className="text-xs text-[#6868a0] mt-1">No results found for <span className="text-violet-300 font-semibold">"{q}"</span></p>
        )}
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="aspect-video bg-violet-900/20 rounded-xl mb-3" />
              <div className="h-3 bg-violet-900/20 rounded w-3/4 mb-1.5" />
              <div className="h-2.5 bg-violet-900/20 rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* No query */}
      {!q && !loading && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-3xl bg-violet-900/20 flex items-center justify-center text-4xl mb-4">🔍</div>
          <p className="text-base font-semibold text-white mb-1">Search your files</p>
          <p className="text-sm text-[#6868a0]">Use the search bar above to find files and folders</p>
        </div>
      )}

      {/* Empty state */}
      {q && !loading && totalCount === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-3xl bg-violet-900/20 flex items-center justify-center text-4xl mb-4">📭</div>
          <p className="text-base font-semibold text-white mb-1">No files found</p>
          <p className="text-sm text-[#6868a0]">No results matched "{q}". Try a different keyword.</p>
        </div>
      )}

      {/* Folders results */}
      {!loading && results?.folders?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-[#6868a0] uppercase tracking-widest mb-3">Folders</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {results.folders.map((folder) => (
              <div key={folder._id} className="card p-4 text-left hover:scale-105 transition-transform cursor-pointer">
                <div className="text-3xl mb-2">📁</div>
                <p className="text-xs font-semibold text-white truncate">{folder.name}</p>
                <p className="text-[10px] text-[#6868a0] mt-0.5">{folder.fileCount || 0} files</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* File results */}
      {!loading && files.length > 0 && (
        <div>
          {results?.folders?.length > 0 && (
            <p className="text-xs font-semibold text-[#6868a0] uppercase tracking-widest mb-3">Files</p>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {files.map((file) => {
              const liveFile = getFile(file._id, file);
              return (
                <FileCard
                  key={liveFile._id}
                  file={liveFile}
                  view="grid"
                  onPreview={setPreviewFile}
                  onUpdate={handleFileUpdate}
                  onDelete={handleFileDelete}
                />
              );
            })}
          </div>
        </div>
      )}

      {previewFile && <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />}
    </div>
  );
}
