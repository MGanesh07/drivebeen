import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { CHART_COLORS } from '../../utils/helpers';

const LABELS = {
  document: 'Documents', image: 'Images', video: 'Videos',
  audio: 'Audio', other: 'Other',
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-xl px-4 py-3 shadow-xl">
      <p className="text-sm font-semibold text-white">{LABELS[payload[0]?.payload._id] || payload[0]?.payload._id}</p>
      <p className="text-xs text-violet-300">{payload[0]?.value} files</p>
    </div>
  );
};

export default function FileTypeBarChart({ data = [] }) {
  const chartData = data.map((d) => ({ ...d, label: LABELS[d._id] || d._id }));

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(124,58,237,0.08)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: '#6868a0', fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#6868a0', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(124,58,237,0.06)' }} />
          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
            {chartData.map((_, index) => (
              <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
