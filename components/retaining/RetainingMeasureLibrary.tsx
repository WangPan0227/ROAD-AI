
import React from 'react';
import { ShieldCheck, ArrowRight, Zap, Target, Construction } from 'lucide-react';

const RetainingMeasureLibrary: React.FC = () => {
  const measures = [
    { title: '墙背注浆加固', group: '压力补偿', efficiency: '高', complexity: '中', icon: Zap, desc: '通过向挡墙背部土体注入水泥浆，提高土体 c、phi 值，降低主动土压力。' },
    { title: '预应力锚索补强', group: '主动抗拔', efficiency: '极高', complexity: '高', icon: Target, desc: '在墙身设置穿孔，向深部稳定岩土层打入锚索，提供额外的水平抗滑抗倾动力。' },
    { title: '墙前反压护道', group: '被动平衡', efficiency: '中', complexity: '低', icon: Construction, desc: '在挡墙趾部堆载，利用被动土压力平衡墙后推力，施工简便但占用空间。' },
    { title: '泄水孔疏掏/增设', group: '水压力疏解', efficiency: '高', complexity: '低', icon: ShieldCheck, desc: '排除墙后积水，消除静水压力 Ew，是最经济且立竿见影的除险手段。' },
  ];

  return (
    <div className="p-8 pb-16 bg-slate-50 min-h-full">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center space-x-3 mb-10">
          <div className="bg-indigo-600 p-2.5 rounded-2xl shadow-lg shadow-indigo-200">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">支挡工程：加固与处治模块措施库</h2>
            <p className="text-slate-500 text-sm font-medium">针对不同失效模式的“工程物理 - 加固策略”精准映射</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           {measures.map((m, i) => (
             <div key={i} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group">
                <div className="flex items-start justify-between mb-6">
                  <div className="bg-slate-50 p-4 rounded-2xl group-hover:bg-indigo-50 transition-all">
                    <m.icon className="w-8 h-8 text-slate-600 group-hover:text-indigo-600" />
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-tighter mb-1">{m.group}</span>
                    <span className="text-[10px] font-bold text-slate-400">效率：{m.efficiency}</span>
                  </div>
                </div>
                <h3 className="text-xl font-black text-slate-800 mb-3 tracking-tight">{m.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-8">{m.desc}</p>
                <div className="flex items-center text-indigo-600 font-black text-xs group-hover:translate-x-2 transition-all">
                  查看技术规格与物理参数映射 <ArrowRight className="w-4 h-4 ml-2" />
                </div>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
};

export default RetainingMeasureLibrary;
