import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { CHART_COLORS } from '../../utils/helpers';
import { formatBytes } from '../../utils/helpers';

const CATEGORY_LABELS = {
  document: 'Documents', image: 'Images', video: 'Videos',
  audio: 'Audio', other: 'Other',
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-xl px-4 py-3 shadow-xl">
      <p className="text-sm font-semibold text-white">{CATEGORY_LABELS[payload[0].name] || payload[0].name}</p>
      <p className="text-xs text-violet-300">{formatBytes(payload[0].value)}</p>
      <p className="text-xs text-[#6868a0]">{payload[0].payload.count} files</p>
    </div>
  );
};

export default function StoragePieChart({ data = [] }) {
  const chartData = data.map((d, i) => ({
    name: d._id,
    value: d.totalSize,
    count: d.count,
    fill: CHART_COLORS[i % CHART_COLORS.length],
  }));

  if (chartData.length === 0) {
    return (
      <div className="h-48 flex flex-col items-center justify-center gap-2">
        <div className="w-16 h-16 rounded-full bg-violet-900/20 flex items-center justify-center">
          <span className="text-2xl">📊</span>
        </div>
        <p className="text-sm text-[#6868a0]">No files uploaded yet</p>
      </div>
    );
  }

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="45%"
            innerRadius={60}
            outerRadius={95}
            paddingAngle={3}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={index} fill={entry.fill} stroke="transparent" />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value) => (
              <span className="text-xs text-[#9898b8]">{CATEGORY_LABELS[value] || value}</span>
            )}
            iconType="circle"
            iconSize={8}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
