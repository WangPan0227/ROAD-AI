import React from 'react';
import { Construction, Database, AlertCircle } from 'lucide-react';
import { InfrastructureState } from '../types';

interface EmptyStateProps {
  activeInfrastructure?: InfrastructureState;
  icon?: 'construction' | 'database' | 'alert';
}

const EmptyState: React.FC<EmptyStateProps> = ({ activeInfrastructure, icon = 'construction' }) => {
  const getIcon = () => {
    switch (icon) {
      case 'database': return <Database className="w-24 h-24 text-gray-300 mb-6 opacity-40" />;
      case 'alert': return <AlertCircle className="w-24 h-24 text-gray-300 mb-6 opacity-40" />;
      default: return <Construction className="w-24 h-24 text-gray-300 mb-6 opacity-40" />;
    }
  };

  const getInfraName = () => {
    if (!activeInfrastructure) return '当前结构物';
    if (activeInfrastructure.category === 'bridge') return '桥梁工程';
    if (activeInfrastructure.category === 'tunnel') return '隧道工程';
    if (activeInfrastructure.subCategory === 'slope') return '边坡模块';
    return '当前结构物';
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 m-6 animate-fade-in">
      {getIcon()}
      <h3 className="text-2xl font-bold text-gray-600 mb-2">
        【{getInfraName()}】数据持续接入中...
      </h3>
      <p className="text-gray-400 text-center max-w-md px-6 leading-relaxed">
        该模块目前仅针对<span className="text-primary font-bold mx-1">【路基】</span>开放完整数据与知识图谱，
        其他基础设施类型的数据正在加紧整理与标定。
      </p>
      <div className="mt-8 flex space-x-2">
        <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
    </div>
  );
};

export default EmptyState;
