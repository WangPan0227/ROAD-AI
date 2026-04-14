import React from 'react';
import { Settings } from 'lucide-react';

const BridgePlaceholder: React.FC<{title: string}> = ({title}) => (
    <div className="flex items-center justify-center h-full text-gray-400 flex-col bg-gray-50/50">
        <Settings className="w-16 h-16 mb-4 opacity-20 animate-spin-slow" />
        <h3 className="text-2xl font-bold text-gray-600">{title}</h3>
        <p className="text-sm mt-2 font-medium">桥梁下部结构模块建设中...</p>
    </div>
);

export default BridgePlaceholder;
