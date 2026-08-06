import React from 'react';

interface KPICardProps {
  title: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  status?: 'safe' | 'warning' | 'critical' | 'neutral';
  icon?: React.ReactNode;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  unit,
  subtitle,
  status = 'neutral',
  icon
}) => {
  let valueColor = 'text-slate-100';
  if (status === 'safe') valueColor = 'text-emerald-400';
  if (status === 'warning') valueColor = 'text-amber-400';
  if (status === 'critical') valueColor = 'text-rose-400';

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md p-5 flex flex-col justify-between transition-all hover:border-slate-700">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</span>
        {icon && <div className="text-slate-400">{icon}</div>}
      </div>
      <div className="flex items-baseline space-x-1.5">
        <span className={`text-2xl lg:text-3xl font-extrabold font-mono tracking-tight ${valueColor}`}>
          {value}
        </span>
        {unit && <span className="text-xs font-mono font-medium text-slate-400 ml-1">{unit}</span>}
      </div>
      {subtitle && (
        <p className="text-[11px] text-slate-500 font-mono mt-2">{subtitle}</p>
      )}
    </div>
  );
};

export default KPICard;
