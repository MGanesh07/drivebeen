import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import clsx from 'clsx';

export default function StatsCard({ title, value, subtitle, growth, icon: Icon, color = '#7c3aed', loading = false }) {
  const growthNum = parseFloat(growth);
  const isPositive = growthNum > 0;
  const isNeutral = growthNum === 0 || isNaN(growthNum);

  if (loading) {
    return (
      <div className="card p-5 animate-pulse">
        <div className="flex justify-between items-start mb-4">
          <div className="h-4 w-24 bg-violet-900/40 rounded" />
          <div className="w-10 h-10 rounded-xl bg-violet-900/40" />
        </div>
        <div className="h-7 w-20 bg-violet-900/40 rounded mb-2" />
        <div className="h-3 w-32 bg-violet-900/40 rounded" />
      </div>
    );
  }

  return (
    <div className="card p-5 group">
      <div className="flex justify-between items-start mb-4">
        <p className="text-xs font-semibold text-[#6868a0] uppercase tracking-wide">{title}</p>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
          style={{ background: `${color}20` }}>
          <Icon size={18} style={{ color }} />
        </div>
      </div>
      <p className="text-2xl font-bold text-white mb-1">{value}</p>
      <div className="flex items-center gap-2">
        {!isNeutral && (
          <span className={clsx('flex items-center gap-0.5 text-xs font-semibold',
            isPositive ? 'text-emerald-400' : 'text-red-400')}>
            {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(growthNum)}%
          </span>
        )}
        {subtitle && <p className="text-xs text-[#6868a0]">{subtitle}</p>}
      </div>
    </div>
  );
}
