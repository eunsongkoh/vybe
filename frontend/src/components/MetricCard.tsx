interface MetricCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: 'increase' | 'decrease';
}

export default function MetricCard({ title, value, change, changeType }: MetricCardProps) {
  const changeColor = changeType === 'increase' ? 'text-green-500' : 'text-red-500';

  return (
    <div className="bg-neutral-900 p-6 rounded-lg">
      <h3 className="text-neutral-400 text-sm mb-2">{title}</h3>
      <p className="text-3xl font-bold">{value}</p>
      {change && (
        <p className={`text-sm ${changeColor}`}>{change}</p>
      )}
    </div>
  );
}
