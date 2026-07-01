import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Sun, Moon, Upload, LogOut, User, Settings, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { searchAPI } from '../../api';
import { getMimeIcon, timeAgo } from '../../utils/helpers';
import Portal from '../Portal';
import FilePreviewModal from '../files/FilePreviewModal';
import clsx from 'clsx';

export default function Header({ onUploadClick }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [previewFile, setPreviewFile] = useState(null); // file to preview from search

  const searchRef = useRef(null);
  const profileRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchResults(null);
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults(null); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await searchAPI.search({ q: searchQuery, limit: 6 });
        setSearchResults(data);
      } catch { setSearchResults(null); }
      finally { setSearching(false); }
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults(null);
  };

  // When user selects a FILE result — open preview modal (quick access from dropdown)
  const handleFileSelect = (file) => {
    clearSearch();
    setPreviewFile(file);
  };

  // When user selects a FOLDER result — navigate to My Drive
  const handleFolderSelect = (folder) => {
    clearSearch();
    navigate(`/drive?folder=${folder._id}`);
  };

  const handleSearchSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      clearSearch();
    }
  };

  const initials = user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <>
      <header
        className="h-16 flex items-center justify-between px-6 gap-4 flex-shrink-0"
        style={{
          background: 'var(--bg-card, #ffffff)',
          borderBottom: '1px solid var(--border-color, #e2e8f0)',
          position: 'relative',
          zIndex: 100,
          overflow: 'visible',
        }}
      >
        {/* Search */}
        <div className="flex-1 max-w-lg" ref={searchRef} style={{ position: 'relative' }}>
          <form onSubmit={handleSearchSubmit}>
            <div style={{ position: 'relative' }}>
              <Search
                size={16}
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}
              />
              <input
                className="input-field pl-9 pr-4 h-9 text-sm"
                placeholder="Search files and folders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoComplete="off"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={clearSearch}
                  style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    color: 'var(--text-muted)', background: 'none', border: 'none',
                    cursor: 'pointer', display: 'flex', padding: 0,
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </form>

          {/* Search Results Dropdown */}
          {searchResults && (
            <div
              className="animate-scale-in"
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                left: 0,
                right: 0,
                background: 'var(--bg-dropdown, #ffffff)',
                border: '1px solid var(--border-dropdown, #e2e8f0)',
                borderRadius: '16px',
                boxShadow: '0 24px 48px rgba(0,0,0,0.14)',
                zIndex: 9999,
                padding: '8px',
                overflow: 'visible',
              }}
            >
              {searching && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px' }}>
                  <div style={{ width: '14px', height: '14px', border: '2px solid #e2e8f0', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>Searching...</p>
                </div>
              )}

              {!searching && searchResults.files?.length === 0 && searchResults.folders?.length === 0 && (
                <div style={{ padding: '20px', textAlign: 'center' }}>
                  <p style={{ fontSize: '20px', margin: '0 0 6px' }}>🔍</p>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>No results for "{searchQuery}"</p>
                </div>
              )}

              {!searching && (
                <>
                  {/* Folders */}
                  {searchResults.folders?.length > 0 && (
                    <div>
                      <p style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '4px 12px 2px' }}>
                        Folders
                      </p>
                      {searchResults.folders.map((f) => (
                        <button
                          key={f._id}
                          onClick={() => handleFolderSelect(f)}
                          style={{
                            width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                            padding: '8px 12px', borderRadius: '10px', cursor: 'pointer',
                            background: 'none', border: 'none', textAlign: 'left',
                            transition: 'background 0.15s ease',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-dropdown-hover, #f1f5f9)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                        >
                          <span style={{ fontSize: '20px', flexShrink: 0 }}>📁</span>
                          <div style={{ minWidth: 0 }}>
                            <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-title)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {f.name}
                            </p>
                            <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>Folder</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Files — clicking opens preview modal directly */}
                  {searchResults.files?.length > 0 && (
                    <div>
                      {searchResults.folders?.length > 0 && (
                        <div style={{ borderTop: '1px solid var(--border-dropdown, #e2e8f0)', margin: '4px 0' }} />
                      )}
                      <p style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '4px 12px 2px' }}>
                        Files — click to preview
                      </p>
                      {searchResults.files.map((f) => (
                        <button
                          key={f._id}
                          onClick={() => handleFileSelect(f)}
                          style={{
                            width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                            padding: '8px 12px', borderRadius: '10px', cursor: 'pointer',
                            background: 'none', border: 'none', textAlign: 'left',
                            transition: 'background 0.15s ease',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-dropdown-hover, #f1f5f9)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                        >
                          <span style={{ fontSize: '20px', flexShrink: 0 }}>{getMimeIcon(f.mimeType, f.name)}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-title)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {f.name}
                            </p>
                            <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
                              {f.category} · {timeAgo(f.createdAt)}
                            </p>
                          </div>
                          <span style={{
                            fontSize: '10px', color: '#7c3aed', background: 'rgba(124,58,237,0.08)',
                            padding: '2px 8px', borderRadius: '6px', flexShrink: 0, fontWeight: 600,
                          }}>
                            Preview
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* See all results */}
                  {(searchResults.files?.length > 0 || searchResults.folders?.length > 0) && (
                    <button
                      onClick={() => {
                        navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                        clearSearch();
                      }}
                      style={{
                        width: '100%', textAlign: 'center', fontSize: '12px',
                        color: '#7c3aed', padding: '9px 8px', background: 'none',
                        border: 'none', cursor: 'pointer', fontWeight: 600,
                        borderTop: '1px solid var(--border-dropdown, #e2e8f0)',
                        marginTop: '4px', transition: 'color 0.15s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#6d28d9'}
                      onMouseLeave={(e) => e.currentTarget.style.color = '#7c3aed'}
                    >
                      See all results for "{searchQuery}" →
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Upload */}
          <button
            onClick={onUploadClick}
            className="btn-primary h-9 text-xs"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Upload size={14} /> Upload
          </button>



          {/* Avatar / Profile Dropdown */}
          <div ref={profileRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setShowProfile((s) => !s)}
              style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#ffffff', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                border: showProfile ? '2px solid #7c3aed' : '2px solid transparent',
                boxShadow: showProfile ? '0 0 0 3px rgba(124,58,237,0.2)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              {initials}
            </button>

            {showProfile && (
              <div
                className="animate-scale-in"
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 10px)',
                  width: '220px',
                  background: 'var(--bg-dropdown, #ffffff)',
                  border: '1px solid var(--border-dropdown, #e2e8f0)',
                  borderRadius: '16px',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.08)',
                  zIndex: 9999,
                  padding: '8px',
                }}
              >
                {/* User info */}
                <div style={{ padding: '12px 14px 10px', borderBottom: '1px solid var(--border-dropdown, #e2e8f0)', marginBottom: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <div style={{
                      width: '34px', height: '34px', borderRadius: '8px',
                      background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontSize: '12px', fontWeight: 700, flexShrink: 0,
                    }}>
                      {initials}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-title)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {user?.name}
                      </p>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {user?.email}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Settings */}
                <button
                  onClick={() => { navigate('/settings'); setShowProfile(false); }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '9px 14px', borderRadius: '10px', cursor: 'pointer',
                    background: 'none', border: 'none', fontSize: '13px',
                    color: 'var(--text-body)', fontWeight: 500, textAlign: 'left',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-dropdown-hover, #f1f5f9)'; e.currentTarget.style.color = 'var(--text-title)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-body)'; }}
                >
                  <Settings size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  Settings
                </button>

                {/* Sign Out */}
                <button
                  onClick={logout}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '9px 14px', borderRadius: '10px', cursor: 'pointer',
                    background: 'none', border: 'none', fontSize: '13px',
                    color: '#ef4444', fontWeight: 500, textAlign: 'left',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                >
                  <LogOut size={15} style={{ flexShrink: 0 }} />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* File preview modal — rendered via Portal, covers full viewport */}
      {previewFile && (
        <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
      )}
    </>
  );
}
