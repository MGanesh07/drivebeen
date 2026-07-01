import { useState, useEffect, useCallback } from 'react';
import { analyticsAPI } from '../api';
import { HardDrive, Files, FolderOpen, TrendingUp } from 'lucide-react';
import StoragePieChart from '../components/charts/StoragePieChart';
import UploadTrendChart from '../components/charts/UploadTrendChart';
import FileTypeBarChart from '../components/charts/FileTypeBarChart';
import ActivityTimeline from '../components/dashboard/ActivityTimeline';
import { formatBytes } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';

export default function StoragePage() {
  const { user, refreshUser } = useAuth();
  const [storageByType, setStorageByType] = useState([]);
  const [trends, setTrends] = useState([]);
  const [fileTypes, setFileTypes] = useState([]);
  const [activities, setActivities] = useState([]);
  const [largestFiles, setLargestFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  const storagePercent = user ? Math.min((user.storageUsed / user.storageLimit) * 100, 100) : 0;
  const totalFiles = fileTypes.reduce((acc, t) => acc + t.count, 0);
  const totalFolders = 0; // placeholder — could add foldersAPI.getCount()

  useEffect(() => {
    // Refresh user storage stats from server so values are live
    refreshUser();

    Promise.all([
      analyticsAPI.getStorageByType(),
      analyticsAPI.getUploadTrends(),
      analyticsAPI.getFileTypes(),
      analyticsAPI.getActivity({ limit: 10 }),
      analyticsAPI.getLargestFiles(),
    ]).then(([st, tr, ft, act, lf]) => {
      setStorageByType(st.data.data);
      setTrends(tr.data.data);
      setFileTypes(ft.data.data);
      setActivities(act.data.activities);
      setLargestFiles(lf.data.files);
    }).finally(() => setLoading(false));
  }, [refreshUser]);

  const statCards = [
    {
      label: 'Storage Used',
      value: formatBytes(user?.storageUsed || 0),
      sub: `${storagePercent.toFixed(0)}% of ${formatBytes(user?.storageLimit || 0)}`,
      icon: HardDrive,
      color: '#7c3aed',
      bg: 'rgba(124,58,237,0.1)',
    },
    {
      label: 'Total Files',
      value: totalFiles,
      sub: 'across all categories',
      icon: Files,
      color: '#2563eb',
      bg: 'rgba(37,99,235,0.1)',
    },
    {
      label: 'Storage Limit',
      value: formatBytes(user?.storageLimit || 0),
      sub: `${formatBytes((user?.storageLimit || 0) - (user?.storageUsed || 0))} remaining`,
      icon: FolderOpen,
      color: '#10b981',
      bg: 'rgba(16,185,129,0.1)',
    },
    {
      label: 'Upload Activity',
      value: `${trends.reduce((a, t) => a + (t.count || 0), 0)}`,
      sub: 'uploads this period',
      icon: TrendingUp,
      color: '#f59e0b',
      bg: 'rgba(245,158,11,0.1)',
    },
  ];

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '14px',
            background: 'rgba(124,58,237,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <HardDrive size={20} style={{ color: '#7c3aed' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-title)', margin: 0, letterSpacing: '-0.02em' }}>
              Storage
            </h1>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0' }}>
              Detailed insights into your storage usage and file activity
            </p>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {statCards.map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div key={label} className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '12px', background: bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={18} style={{ color }} />
              </div>
            </div>
            <p style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-title)', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
              {value}
            </p>
            <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', margin: '0 0 4px' }}>
              {label}
            </p>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
              {sub}
            </p>
          </div>
        ))}
      </div>

      {/* Storage progress bar */}
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div>
            <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-title)', margin: 0 }}>Storage Quota</p>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0' }}>
              {formatBytes(user?.storageUsed || 0)} used of {formatBytes(user?.storageLimit || 0)}
            </p>
          </div>
          <span style={{
            fontSize: '13px', fontWeight: 700, color: storagePercent > 80 ? '#ef4444' : '#7c3aed',
            background: storagePercent > 80 ? 'rgba(239,68,68,0.1)' : 'rgba(124,58,237,0.1)',
            padding: '4px 10px', borderRadius: '8px',
          }}>
            {storagePercent.toFixed(0)}%
          </span>
        </div>
        <div style={{ width: '100%', height: '8px', background: 'var(--border-color)', borderRadius: '9999px', overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: '9999px',
            background: storagePercent > 80
              ? 'linear-gradient(90deg, #ef4444, #dc2626)'
              : 'linear-gradient(90deg, #7c3aed, #a78bfa)',
            width: `${storagePercent}%`,
            transition: 'width 1s ease',
          }} />
        </div>
        {storagePercent > 80 && (
          <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '8px', fontWeight: 500 }}>
            ⚠️ Storage is almost full. Consider deleting old files or emptying Trash.
          </p>
        )}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        <div className="card" style={{ padding: '20px' }}>
          <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-title)', margin: '0 0 2px' }}>
            Storage by File Type
          </p>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 16px' }}>
            Space distribution per category
          </p>
          <StoragePieChart data={storageByType} />
        </div>
        <div className="card" style={{ padding: '20px' }}>
          <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-title)', margin: '0 0 2px' }}>
            File Count Distribution
          </p>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 16px' }}>
            Number of files per category
          </p>
          <FileTypeBarChart data={fileTypes} />
        </div>
      </div>

      {/* Upload trends */}
      <div className="card" style={{ padding: '20px' }}>
        <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-title)', margin: '0 0 2px' }}>
          Monthly Upload Trend
        </p>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 16px' }}>
          Upload activity over the last 6 months
        </p>
        <UploadTrendChart data={trends} />
      </div>

      {/* Bottom row: largest files + activity */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
        {/* Largest Files */}
        <div className="card" style={{ padding: '20px' }}>
          <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-title)', margin: '0 0 16px' }}>
            Largest Files
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {largestFiles.map((file, i) => (
              <div key={file._id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', width: '16px', textAlign: 'right', flexShrink: 0 }}>
                  {i + 1}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-title)', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {file.name}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ flex: 1, height: '4px', background: 'var(--border-color)', borderRadius: '9999px', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%', borderRadius: '9999px',
                          background: 'linear-gradient(90deg, #7c3aed, #a78bfa)',
                          width: `${(file.size / (largestFiles[0]?.size || 1)) * 100}%`,
                        }}
                      />
                    </div>
                    <span style={{ fontSize: '11px', color: '#7c3aed', fontWeight: 600, width: '60px', textAlign: 'right', flexShrink: 0 }}>
                      {formatBytes(file.size)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {largestFiles.length === 0 && (
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>
                No files yet
              </p>
            )}
          </div>
        </div>

        {/* Activity Log */}
        <div className="card" style={{ padding: '20px' }}>
          <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-title)', margin: '0 0 16px' }}>
            Recent Activity
          </p>
          <ActivityTimeline activities={activities} loading={loading} />
        </div>
      </div>
    </div>
  );
}
