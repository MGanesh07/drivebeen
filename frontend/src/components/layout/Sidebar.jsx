import { NavLink } from 'react-router-dom';
import {
  HardDrive, Clock, Star, Share2, Trash2,
  BarChart3, Settings, ChevronLeft, ChevronRight, Cloud,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { formatBytes } from '../../utils/helpers';
import clsx from 'clsx';

const navItems = [
  { path: '/recent', icon: Clock, label: 'Recent Files' },
  { path: '/drive', icon: HardDrive, label: 'My Drive' },
  { path: '/favorites', icon: Star, label: 'Favorites' },
  { path: '/trash', icon: Trash2, label: 'Trash' },
];

const toolItems = [
  { path: '/storage', icon: BarChart3, label: 'Storage' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar({ collapsed, onToggle }) {
  const { user } = useAuth();
  const storagePercent = user ? Math.min((user.storageUsed / user.storageLimit) * 100, 100) : 0;

  return (
    <aside
      className={clsx(
        'flex flex-col h-full transition-all duration-300 ease-in-out relative',
        'border-r',
        collapsed ? 'w-16' : 'w-64'
      )}
      style={{ background: '#0f172a', borderColor: '#1e293b' }}
    >
      {/* Logo */}
      <div
        className={clsx('flex items-center gap-3 px-4 py-5 border-b', collapsed && 'justify-center')}
        style={{ borderColor: '#1e293b' }}
      >
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center flex-shrink-0 shadow-lg">
          <Cloud size={18} className="text-white" />
        </div>
        {!collapsed && (
          <div>
            <h1 className="text-base font-bold leading-tight" style={{ color: '#ffffff' }}>DriveBeen</h1>
            <p className="text-[10px] font-medium" style={{ color: '#a78bfa' }}>Cloud Storage</p>
          </div>
        )}
      </div>

      {/* Collapse Button */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-16 w-6 h-6 rounded-full flex items-center justify-center text-white hover:bg-violet-500 transition-colors z-10 shadow-lg"
        style={{ background: '#7c3aed', border: '2px solid #0f172a' }}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {!collapsed && (
          <p className="text-[10px] font-semibold uppercase tracking-widest px-2 mb-2" style={{ color: '#475569' }}>
            Menu
          </p>
        )}
        {navItems.map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              clsx('sidebar-link', isActive && 'active', collapsed && 'justify-center px-2')
            }
            title={collapsed ? label : undefined}
          >
            <Icon size={18} className="flex-shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}

        {/* Tools Section */}
        {!collapsed && (
          <p className="text-[10px] font-semibold uppercase tracking-widest px-2 mb-2 mt-6" style={{ color: '#475569' }}>
            Tools
          </p>
        )}
        {collapsed && <div className="my-3 border-t mx-1" style={{ borderColor: '#1e293b' }} />}
        <div className={collapsed ? '' : 'mt-1'}>
          {toolItems.map(({ path, icon: Icon, label }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                clsx('sidebar-link', isActive && 'active', collapsed && 'justify-center px-2')
              }
              title={collapsed ? label : undefined}
            >
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Storage Card */}
      {!collapsed && user && (
        <div className="mx-3 mb-4 p-4 rounded-2xl" style={{ background: '#1e293b', border: '1px solid #334155' }}>
          <div className="flex justify-between items-center mb-2">
            <p className="text-xs font-semibold" style={{ color: '#94a3b8' }}>Storage Used</p>
            <p className="text-xs font-medium" style={{ color: '#7c3aed' }}>{storagePercent.toFixed(0)}%</p>
          </div>
          <div className="w-full rounded-full h-1.5 mb-2" style={{ background: '#0f172a' }}>
            <div
              className="h-1.5 rounded-full transition-all duration-700"
              style={{
                width: `${storagePercent}%`,
                background: storagePercent > 80
                  ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                  : 'linear-gradient(90deg, #7c3aed, #a78bfa)',
              }}
            />
          </div>
          <p className="text-[11px]" style={{ color: '#64748b' }}>
            {formatBytes(user.storageUsed)} of {formatBytes(user.storageLimit)}
          </p>
          {storagePercent > 80 && (
            <p className="text-[10px] text-red-400 mt-1 font-medium">⚠️ Storage almost full</p>
          )}
        </div>
      )}
    </aside>
  );
}
