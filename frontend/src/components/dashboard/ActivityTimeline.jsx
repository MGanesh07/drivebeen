import { Upload, Download, Trash2, Share2, FolderPlus, RotateCcw, Edit3, Star } from 'lucide-react';
import { timeAgo } from '../../utils/helpers';
import clsx from 'clsx';

const ACTION_CONFIG = {
  upload: { icon: Upload, color: 'text-violet-400', bg: 'bg-violet-900/30', label: 'Uploaded' },
  download: { icon: Download, color: 'text-blue-400', bg: 'bg-blue-900/30', label: 'Downloaded' },
  delete: { icon: Trash2, color: 'text-red-400', bg: 'bg-red-900/30', label: 'Deleted' },
  share: { icon: Share2, color: 'text-emerald-400', bg: 'bg-emerald-900/30', label: 'Shared' },
  folder_create: { icon: FolderPlus, color: 'text-amber-400', bg: 'bg-amber-900/30', label: 'Created folder' },
  restore: { icon: RotateCcw, color: 'text-cyan-400', bg: 'bg-cyan-900/30', label: 'Restored' },
  rename: { icon: Edit3, color: 'text-pink-400', bg: 'bg-pink-900/30', label: 'Renamed' },
  favorite: { icon: Star, color: 'text-amber-400', bg: 'bg-amber-900/30', label: 'Starred' },
};

export default function ActivityTimeline({ activities = [], loading = false }) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-start gap-3 animate-pulse">
            <div className="w-8 h-8 rounded-xl bg-violet-900/30 flex-shrink-0" />
            <div className="flex-1">
              <div className="h-3 w-40 bg-violet-900/30 rounded mb-1.5" />
              <div className="h-2.5 w-24 bg-violet-900/20 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!activities.length) {
    return <p className="text-sm text-[#6868a0] text-center py-4">No recent activity</p>;
  }

  return (
    <div className="space-y-3">
      {activities.slice(0, 8).map((activity, index) => {
        const config = ACTION_CONFIG[activity.action] || ACTION_CONFIG.upload;
        const Icon = config.icon;
        const fileName = activity.file?.name || activity.folder?.name || activity.metadata?.name || 'Unknown';
        return (
          <div key={activity._id || index} className="flex items-start gap-3 group">
            <div className={clsx('w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0', config.bg)}>
              <Icon size={13} className={config.color} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white font-medium">
                <span className="text-[#6868a0]">{config.label}</span>{' '}
                <span className="text-violet-300 truncate inline-block max-w-[160px] align-bottom">{fileName}</span>
              </p>
              <p className="text-[10px] text-[#6868a0] mt-0.5">{timeAgo(activity.createdAt)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
