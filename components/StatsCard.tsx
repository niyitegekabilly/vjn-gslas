
import React from 'react';

interface StatsCardProps {
  title: string;
  value: string;
  subValue?: string;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  color?: string;
  onClick?: () => void;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, subValue, icon, trend, trendUp, color = 'blue', onClick }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    teal: 'bg-teal-50 text-teal-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    orange: 'bg-orange-50 text-orange-600',
    slate: 'bg-slate-100 text-slate-700',
  };

  // Default to blue if color not found
  const activeColorClass = colorClasses[color as keyof typeof colorClasses] || colorClasses.blue;

  return (
    <div 
      className={`bg-white rounded-xl shadow-sm p-6 border border-gray-100 transition-all ${onClick ? 'cursor-pointer hover:shadow-md hover:border-blue-200' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="overflow-hidden">
          <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
          <p className="mt-2 text-2xl font-bold text-gray-900 truncate">{value}</p>
          {subValue && (
            <p className="text-xs text-gray-400 font-medium mt-1 truncate">{subValue}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg flex-shrink-0 ${activeColorClass}`}>
          {icon}
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center text-sm">
          <span className={`font-medium ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
            {trend}
          </span>
          <span className="text-gray-400 ml-2">vs last month</span>
        </div>
      )}
    </div>
  );
};

export default StatsCard;
