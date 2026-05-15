
import React from 'react';
import { BookOpen, Search, Bookmark, ExternalLink, Hash } from 'lucide-react';

const RetainingClassicCases: React.FC = () => {
  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-black rounded-2xl flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">支挡工程：RAG 灾毁事故经典案例抽取库</h2>
            <p className="text-slate-500 text-xs font-medium uppercase tracking-[0.1em]">抽取挡土墙坍塌事故共性特征，为仿真提供物理边界建议</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1 border border-slate-200 px-3 py-1.5 rounded-xl bg-slate-50">
             <Search className="w-3.5 h-3.5 text-slate-400" />
             <input type="text" placeholder="多模态检索..." className="bg-transparent border-none text-xs focus:ring-0 outline-none w-48" />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-10">
        <div className="max-w-4xl mx-auto space-y-8">
           {[1, 2, 3].map(i => (
             <div key={i} className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm relative group overflow-hidden">
                <div className="absolute top-0 right-0 p-8">
                   <div className="text-[10px] font-black text-slate-200 uppercase rotate-90 origin-right">Classic Case Archive</div>
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                   <span className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-[10px] font-black uppercase tracking-tight">事故类型：持续强降雨诱发坍塌</span>
                   <span className="px-3 py-1 bg-slate-50 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-tight">山区高陡路堤挡墙</span>
                </div>

                <h3 className="text-2xl font-black text-slate-800 mb-6 group-hover:text-indigo-600 transition-all leading-tight">
                   G{i}0{i} 线 K{i}22+{400+i*50} 段重力式挡墙垮塌事故特征多维分析
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-8">
                   <div>
                      <h4 className="text-xs font-black text-slate-400 uppercase mb-4 flex items-center">
                         <Hash className="w-3 h-3 mr-1" /> 物理共性特征抽取
                      </h4>
                      <ul className="space-y-3">
                        {['墙后排水系统失效率 100%', '临界状态 FS < 1.05', '土压力发生动力突增', '基底摩擦系数受水浸泡折减'].map((item, idx) => (
                          <li key={idx} className="flex items-start text-sm text-slate-600">
                             <div className="w-1.5 h-1.5 bg-red-400 rounded-full mt-1.5 mr-3 flex-shrink-0" />
                             {item}
                          </li>
                        ))}
                      </ul>
                   </div>
                   <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 italic text-slate-400 text-xs leading-relaxed">
                      "该案例表明，在极端降雨场景下，忽略静水压力 Ew 是导致稳定性计算失真的主因。InfraGuard 仿真引擎已将此特征集成至 '水文耦合' 模型中..."
                   </div>
                </div>

                <div className="flex items-center justify-between pt-8 border-t border-slate-100">
                   <div className="flex items-center space-x-6 text-slate-400">
                      <button className="flex items-center space-x-2 text-xs font-bold hover:text-indigo-600"><Bookmark className="w-4 h-4" /> <span>收藏研判</span></button>
                      <button className="flex items-center space-x-2 text-xs font-bold hover:text-indigo-600"><ExternalLink className="w-4 h-4" /> <span>引用来源</span></button>
                   </div>
                   <button className="px-6 py-2.5 bg-slate-900 text-white rounded-2xl text-xs font-black hover:bg-indigo-600 transition-all">导出分析简报</button>
                </div>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
};

export default RetainingClassicCases;
