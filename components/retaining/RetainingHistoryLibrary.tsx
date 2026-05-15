
import React from 'react';
import { History, Search, Filter, Trash2, Download } from 'lucide-react';

const RetainingHistoryLibrary: React.FC = () => {
  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <History className="w-5 h-5 text-indigo-600" />
          <h2 className="font-bold text-slate-800">支挡工程：历史模拟与训练存档库</h2>
        </div>
        <div className="flex items-center space-x-2">
           <div className="relative">
             <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
             <input type="text" placeholder="搜索历史计算..." className="pl-9 pr-4 py-1.5 bg-slate-100 border-none rounded-full text-xs focus:ring-2 ring-indigo-500 transition-all outline-none" />
           </div>
           <button className="p-2 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full transition-all">
             <Filter className="w-4 h-4" />
           </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <th className="px-6 py-4">时间戳</th>
                <th className="px-6 py-4">场景名称</th>
                <th className="px-6 py-4">输入摘要 (H/B)</th>
                <th className="px-6 py-4">计算结果 (FS)</th>
                <th className="px-6 py-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[1, 2, 3, 4, 5].map(i => (
                <tr key={i} className="hover:bg-slate-50/50 transition-all group">
                  <td className="px-6 py-4 text-xs text-slate-500 font-mono">2026-05-15 10:{20+i}:45</td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-slate-700">支挡演进模拟_v{i}</div>
                    <div className="text-[10px] text-slate-400">重力式挡墙 - 沿江段 L{i}</div>
                  </td>
                  <td className="px-6 py-4">
                     <span className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded text-[10px] font-bold">H=6.5m</span>
                     <span className="px-2 py-1 bg-slate-50 text-slate-500 rounded text-[10px] font-bold ml-1">B=3.2m</span>
                  </td>
                  <td className="px-6 py-4">
                     <div className="text-sm font-black text-slate-800">1.{(25+i).toFixed(2)}</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-all">
                       <button className="p-1.5 text-slate-400 hover:text-indigo-600 bg-slate-100 rounded-lg"><Download className="w-3.5 h-3.5" /></button>
                       <button className="p-1.5 text-slate-400 hover:text-red-600 bg-slate-100 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RetainingHistoryLibrary;
