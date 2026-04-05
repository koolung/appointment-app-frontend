import { ReactNode } from 'react';

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  trend?: {
    direction: 'up' | 'down';
    percentage: number;
  };
  color: 'blue' | 'green' | 'purple' | 'orange' | 'white' | 'black';
}

const colorClasses = {
  blue: 'bg-blue-50 text-blue-600 border-blue-200',
  green: 'bg-green-50 text-green-600 border-green-200',
  purple: 'bg-purple-50 text-purple-600 border-purple-200',
  orange: 'bg-orange-50 text-orange-600 border-orange-200',
  black: 'bg-black text-white border-black',
  white: 'bg-white text-black border-gray-200',
};

export default function StatCard({ icon, label, value, trend, color }: StatCardProps) {
  return (
    <div className={`p-6 rounded-lg border ${colorClasses[color]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium opacity-75">{label}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
          {trend && (
            <p className={`text-sm mt-2 ${trend.direction === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              {trend.direction === 'up' ? '📈' : '📉'} {trend.percentage}% this month
            </p>
          )}
        </div>
        <span className="text-4xl">{icon}</span>
      </div>
    </div>
  );
}
