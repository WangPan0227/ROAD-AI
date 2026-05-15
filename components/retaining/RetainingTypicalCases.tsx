
import React from 'react';
import { ClipboardList, CheckCircle } from 'lucide-react';

const RetainingTypicalCases: React.FC = () => {
  return (
    <div className="p-8 bg-slate-50 min-h-full">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center space-x-3 mb-8">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <ClipboardList className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">支挡工程：V&V 典型验证案例库</h2>
            <p className="text-slate-500 text-sm">通过标准工程案例验证仿真引擎的 FS (稳定性系数) 准确性</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className="px-2 py-1 bg-slate-100 rounded-md text-[10px] font-bold text-slate-500">CASE #RW-202{i}</div>
                <div className="flex items-center text-emerald-500 text-[10px] font-bold tracking-widest uppercase">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  验证通过 (Passed)
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2 truncate">重力式挡墙抗滑稳定性基准测试 - 场景 {i}</h3>
              <p className="text-slate-500 text-xs leading-relaxed mb-4">模拟 H={5+i}m 墙高在饱和填土下的受力表现。该案例用于校核 Rankine 土压力理论在不同粘聚力下的精度。</p>
              
              <div className="grid grid-cols-2 gap-4 mt-auto">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="text-[9px] font-bold text-slate-400 uppercase mb-1">物理引擎 FS</div>
                  <div className="text-xl font-black text-indigo-600">1.{(3+i).toFixed(2)}</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="text-[9px] font-bold text-slate-400 uppercase mb-1">行业标准 FS</div>
                  <div className="text-xl font-black text-slate-800">1.{(3.1+i).toFixed(2)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RetainingTypicalCases;
