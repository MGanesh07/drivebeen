import { useState, useEffect } from 'react';
import { notificationsAPI } from '../api';
import { Bell, Check, CheckCheck, Trash2, Upload, Share2, AlertTriangle, User, Download } from 'lucide-react';
import { timeAgo } from '../utils/helpers';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const TYPE_CONFIG = {
  upload_success: { icon: Upload, color: 'text-violet-400', bg: 'bg-violet-900/30' },
  share_invite: { icon: Share2, color: 'text-emerald-400', bg: 'bg-emerald-900/30' },
  storage_warning: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-900/30' },
  account: { icon: User, color: 'text-blue-400', bg: 'bg-blue-900/30' },
  download: { icon: Download, color: 'text-cyan-400', bg: 'bg-cyan-900/30' },
  delete: { icon: Trash2, color: 'text-red-400', bg: 'bg-red-900/30' },
  system: { icon: Bell, color: 'text-violet-400', bg: 'bg-violet-900/30' },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = () => {
    notificationsAPI.getNotifications({ limit: 50 })
      .then(({ data }) => { setNotifications(data.notifications); setUnreadCount(data.unreadCount); })
      .catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const markRead = async (id) => {
    try {
      await notificationsAPI.markAsRead(id);
      setNotifications(p => p.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(c => Math.max(0, c - 1));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications(p => p.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All marked as read');
    } catch { toast.error('Failed'); }
  };

  const deleteNotif = async (id) => {
    try {
      await notificationsAPI.deleteNotification(id);
      setNotifications(p => p.filter(n => n._id !== id));
    } catch {}
  };

  const clearAll = async () => {
    if (!confirm('Clear all notifications?')) return;
    try {
      await notificationsAPI.clearAll();
      setNotifications([]); setUnreadCount(0);
      toast.success('Cleared');
    } catch {}
  };

  return (
    <div className="space-y-5 animate-slide-up max-w-2xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-900/30 flex items-center justify-center relative">
            <Bell size={18} className="text-violet-400" />
            {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-violet-600 text-white text-[9px] flex items-center justify-center font-bold">{unreadCount}</span>}
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Notifications</h1>
            <p className="text-xs text-[#6868a0]">{unreadCount} unread</p>
          </div>
        </div>
        {notifications.length > 0 && (
          <div className="flex items-center gap-2">
            <button onClick={markAllRead} className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 px-3 py-1.5 rounded-xl hover:bg-violet-900/20 transition-all">
              <CheckCheck size={13} /> Mark all read
            </button>
            <button onClick={clearAll} className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 px-3 py-1.5 rounded-xl hover:bg-red-900/20 transition-all">
              <Trash2 size={13} /> Clear all
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="card p-4 animate-pulse flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-violet-900/20"/><div className="flex-1"><div className="h-3 w-48 bg-violet-900/20 rounded mb-1.5"/><div className="h-2.5 w-32 bg-violet-900/20 rounded"/></div></div>)}</div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center py-20">
          <span className="text-5xl mb-4">🔔</span>
          <p className="text-white font-semibold">No notifications</p>
          <p className="text-sm text-[#6868a0]">You're all caught up!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(notif => {
            const config = TYPE_CONFIG[notif.type] || TYPE_CONFIG.system;
            const Icon = config.icon;
            return (
              <div key={notif._id}
                className={clsx('card p-4 flex items-start gap-3 group transition-all cursor-pointer', !notif.isRead && 'border-violet-700/30 bg-violet-950/30')}
                onClick={() => !notif.isRead && markRead(notif._id)}>
                <div className={clsx('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', config.bg)}>
                  <Icon size={15} className={config.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-white">{notif.title}</p>
                    {!notif.isRead && <span className="w-2 h-2 rounded-full bg-violet-500 flex-shrink-0 mt-1" />}
                  </div>
                  <p className="text-xs text-[#9898b8] mt-0.5">{notif.message}</p>
                  <p className="text-[10px] text-[#6868a0] mt-1">{timeAgo(notif.createdAt)}</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); deleteNotif(notif._id); }}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-[#6868a0] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
                  <Trash2 size={12} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
