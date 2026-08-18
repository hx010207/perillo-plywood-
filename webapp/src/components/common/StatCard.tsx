import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: string;
  borderColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  borderColor,
}) => {
  return (
    <div 
      className={`bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between transition-all hover:shadow-md ${
        borderColor ? `border-l-4 ${borderColor}` : ''
      }`}
    >
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
        <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{value}</h3>
      </div>
      {icon && (
        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center text-xl shadow-inner">
          {icon}
        </div>
      )}
    </div>
  );
};
