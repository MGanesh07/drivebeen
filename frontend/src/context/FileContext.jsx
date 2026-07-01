import { createContext, useContext, useState, useCallback } from 'react';

const FileContext = createContext(null);

export const FileProvider = ({ children }) => {
  const [filesMap, setFilesMap] = useState({});

  const addOrUpdateFiles = useCallback((filesList) => {
    if (!filesList || !Array.isArray(filesList)) return;
    setFilesMap((prev) => {
      let changed = false;
      const next = { ...prev };
      filesList.forEach((file) => {
        if (file && file._id) {
          const old = prev[file._id];
          if (!old || old.name !== file.name || old.isFavorite !== file.isFavorite || old.isArchived !== file.isArchived || old.isDeleted !== file.isDeleted) {
            next[file._id] = { ...old, ...file };
            changed = true;
          }
        }
      });
      return changed ? next : prev;
    });
  }, []);

  const updateFile = useCallback((updatedFile) => {
    if (!updatedFile || !updatedFile._id) return;
    setFilesMap((prev) => ({
      ...prev,
      [updatedFile._id]: { ...prev[updatedFile._id], ...updatedFile },
    }));
  }, []);

  const removeFile = useCallback((fileId) => {
    if (!fileId) return;
    setFilesMap((prev) => {
      const next = { ...prev };
      delete next[fileId];
      return next;
    });
  }, []);

  const getFile = useCallback((fileId, fallbackFile) => {
    return filesMap[fileId] || fallbackFile;
  }, [filesMap]);

  return (
    <FileContext.Provider value={{ filesMap, addOrUpdateFiles, updateFile, removeFile, getFile }}>
      {children}
    </FileContext.Provider>
  );
};

export const useFiles = () => {
  const ctx = useContext(FileContext);
  if (!ctx) throw new Error('useFiles must be used within a FileProvider');
  return ctx;
};
