import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { formatBytes } from '../../utils/helpers';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-xl px-4 py-3 shadow-xl">
      <p className="text-xs text-[#6868a0] mb-1">{label}</p>
      <p className="text-sm font-semibold text-violet-300">{payload[0]?.value} files</p>
      {payload[1] && <p className="text-xs text-blue-300">{formatBytes(payload[1]?.value)}</p>}
    </div>
  );
};

export default function UploadTrendChart({ data = [] }) {
  if (data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center">
        <p className="text-sm text-[#6868a0]">No upload data yet</p>
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="colorFiles" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(124,58,237,0.08)" />
          <XAxis dataKey="month" tick={{ fill: '#6868a0', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#6868a0', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(124,58,237,0.2)' }} />
          <Area
            type="monotone" dataKey="files" stroke="#7c3aed" strokeWidth={2.5}
            fill="url(#colorFiles)" dot={{ fill: '#7c3aed', r: 3 }}
            activeDot={{ r: 5, fill: '#a78bfa' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
