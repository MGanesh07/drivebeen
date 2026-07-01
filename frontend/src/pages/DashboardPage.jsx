import { useState, useEffect } from 'react';
import { Files, FolderOpen, HardDrive, Share2, TrendingUp, Activity, Clock, Star } from 'lucide-react';
import { analyticsAPI } from '../api';
import { formatBytes, timeAgo } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import StatsCard from '../components/dashboard/StatsCard';
import StoragePieChart from '../components/charts/StoragePieChart';
import UploadTrendChart from '../components/charts/UploadTrendChart';
import FileTypeBarChart from '../components/charts/FileTypeBarChart';
import ActivityTimeline from '../components/dashboard/ActivityTimeline';
import { useOutletContext } from 'react-router-dom';

export default function DashboardPage() {
  const { user } = useAuth();
  const { openUpload } = useOutletContext() || {};
  const [summary, setSummary] = useState(null);
  const [storageByType, setStorageByType] = useState([]);
  const [trends, setTrends] = useState([]);
  const [fileTypes, setFileTypes] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, st, tr, ft, act] = await Promise.all([
          analyticsAPI.getSummary(),
          analyticsAPI.getStorageByType(),
          analyticsAPI.getUploadTrends(),
          analyticsAPI.getFileTypes(),
          analyticsAPI.getActivity({ limit: 8 }),
        ]);
        setSummary(s.data.summary);
        setStorageByType(st.data.data);
        setTrends(tr.data.data);
        setFileTypes(ft.data.data);
        setActivities(act.data.activities);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-violet-900/60 via-violet-800/40 to-violet-950/60 border border-violet-700/30">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(124,58,237,0.3),transparent_60%)]" />
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-violet-300 text-sm font-medium mb-1">{greeting} 👋</p>
            <h2 className="text-2xl font-bold text-white">{user?.name?.split(' ')[0]}'s Drive</h2>
            <p className="text-violet-200/70 text-sm mt-1">
              {summary ? `${summary.totalFiles} files · ${formatBytes(summary.storageUsed)} used` : 'Loading your workspace...'}
            </p>
          </div>
          <button onClick={openUpload}
            className="btn-primary hidden sm:inline-flex">
            <TrendingUp size={15} /> Quick Upload
          </button>
        </div>
        <div className="absolute -bottom-8 -right-8 w-40 h-40 rounded-full bg-violet-600/10 blur-3xl" />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Files" value={summary?.totalFiles ?? '—'} icon={Files}
          growth={summary?.filesGrowth} subtitle="vs last month" color="#7c3aed" loading={loading} />
        <StatsCard title="Folders" value={summary?.totalFolders ?? '—'} icon={FolderOpen}
          color="#2563EB" loading={loading} />
        <StatsCard title="Storage Used" value={summary ? formatBytes(summary.storageUsed) : '—'}
          subtitle={summary ? `of ${formatBytes(summary.storageLimit)}` : ''} icon={HardDrive}
          color="#059669" loading={loading} />
        <StatsCard title="Shared Files" value={summary?.sharedFiles ?? '—'} icon={Share2}
          color="#D97706" loading={loading} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Storage by Type */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-white mb-1">Storage by Type</h3>
          <p className="text-xs text-[#6868a0] mb-4">Distribution across file categories</p>
          <StoragePieChart data={storageByType} />
        </div>

        {/* Upload Trends */}
        <div className="card p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-white mb-1">Upload Trends</h3>
          <p className="text-xs text-[#6868a0] mb-4">Monthly file uploads over the last 6 months</p>
          <UploadTrendChart data={trends} />
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* File Type Distribution */}
        <div className="card p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-white mb-1">File Type Distribution</h3>
          <p className="text-xs text-[#6868a0] mb-4">Number of files per category</p>
          <FileTypeBarChart data={fileTypes} />
        </div>

        {/* Recent Activity */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={15} className="text-violet-400" />
            <h3 className="text-sm font-semibold text-white">Recent Activity</h3>
          </div>
          <ActivityTimeline activities={activities} loading={loading} />
        </div>
      </div>

      {/* Storage Progress */}
      {summary && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <HardDrive size={15} className="text-violet-400" />
              <h3 className="text-sm font-semibold text-white">Storage Overview</h3>
            </div>
            <span className="text-xs text-violet-400 font-medium">{summary.storagePercent}% used</span>
          </div>
          <div className="w-full bg-violet-950/60 rounded-full h-2.5 mb-2">
            <div
              className="h-2.5 rounded-full transition-all duration-1000"
              style={{
                width: `${summary.storagePercent}%`,
                background: summary.storagePercent > 80
                  ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                  : 'linear-gradient(90deg, #7c3aed, #a78bfa)',
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-[#6868a0]">
            <span>{formatBytes(summary.storageUsed)} used</span>
            <span>{formatBytes(summary.storageLimit - summary.storageUsed)} free</span>
          </div>
        </div>
      )}
    </div>
  );
}
