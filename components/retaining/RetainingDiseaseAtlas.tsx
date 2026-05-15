
import React from 'react';
import { Microscope, AlertTriangle, Layers, Info } from 'lucide-react';

const RetainingDiseaseAtlas: React.FC = () => {
  const diseases = [
    { title: '墙身结构性裂缝', level: 'III ~ IV', features: '竖向或倾斜贯穿裂缝', impact: '降低整体性，可能诱发断裂', color: 'red' },
    { title: '墙顶整体前倾', level: 'II ~ III', features: '墙顶位移 > 1%H', impact: '失稳先兆，FS 过近临界点', color: 'orange' },
    { title: '基础沉降/错位', level: 'II', features: '墙身与基础连接点错开', impact: '受力重分布，局部应力集中', color: 'amber' },
    { title: '泄水孔阻塞/渗水', level: 'I', features: '墙面大面积泛潮或白华', impact: '增加墙后静水压力，侵蚀材料', color: 'blue' },
  ];

  return (
    <div className="p-8 bg-slate-50 min-h-full">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center space-x-3 mb-10">
          <div className="bg-indigo-600 p-2.5 rounded-2xl shadow-lg shadow-indigo-200">
            <Microscope className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">支挡工程：病害类型与等级甄别图谱</h2>
            <p className="text-slate-500 text-sm font-medium">支撑视觉智能识别的底层病害标签库与结构健康定义</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {diseases.map((d, i) => (
            <div key={i} className="bg-white overflow-hidden rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row group hover:border-indigo-300 transition-all">
              <div className="w-full md:w-64 h-48 md:h-auto bg-slate-100 flex items-center justify-center relative overflow-hidden">
                <Layers className="w-12 h-12 text-slate-300 opacity-50" />
                <div className={`absolute top-4 left-4 px-3 py-1 bg-${d.color}-500 text-white text-[10px] font-black rounded-lg shadow-lg`}>等级 {d.level}</div>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent flex items-end p-4">
                  <span className="text-white text-[10px] font-bold">仿真图示片段 ID: DIS-RT-{i+100}</span>
                </div>
              </div>
              <div className="flex-1 p-8">
                <div className="flex items-center justify-between mb-4">
                   <h3 className="text-xl font-black text-slate-800 tracking-tight">{d.title}</h3>
                   <button className="text-slate-400 hover:text-indigo-600 transition-all"><Info className="w-5 h-5" /></button>
                </div>
                <div className="space-y-4">
                   <div className="flex items-start space-x-3">
                      <div className="mt-1"><AlertTriangle className="w-4 h-4 text-amber-500" /></div>
                      <div className="text-sm">
                         <span className="font-bold text-slate-700">表观特征：</span>
                         <span className="text-slate-500">{d.features}</span>
                      </div>
                   </div>
                   <div className="flex items-start space-x-3">
                      <div className="mt-1"><Info className="w-4 h-4 text-indigo-500" /></div>
                      <div className="text-sm">
                         <span className="font-bold text-slate-700">结构性能影响：</span>
                         <span className="text-slate-500">{d.impact}</span>
                      </div>
                   </div>
                </div>
                <div className="mt-8 flex items-center space-x-3">
                   <button className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-indigo-600 transition-all">关联计算模型</button>
                   <button className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 transition-all">查看修复工法</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RetainingDiseaseAtlas;
