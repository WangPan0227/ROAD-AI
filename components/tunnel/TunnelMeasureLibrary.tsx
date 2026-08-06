import React, { useState, useEffect } from 'react';
import { 
    BookOpen, Clock, Hammer, ShieldCheck, 
    FileText, Settings, Layers, Zap, Edit3, Save, X, Activity, HardHat
} from 'lucide-react';

const STORAGE_KEY_MEASURES = 'roadbedguard_tunnel_measures';
const STORAGE_KEY_ECONOMICS = 'roadbedguard_tunnel_economics'; 

const DEFAULT_MEASURES = [
  {
    id: 'polymer_grout', backendKey: 'cost_grout', name: '高聚物背后脱空与裂隙封闭注浆', category: '材料与缺陷修复',
    description: '采用双组份高分子聚合物材料，通过微孔注入二衬背后脱空区及结构裂缝中。材料迅速反应膨胀，填充空洞，并强力黏结裂缝两侧混凝土，恢复衬砌的整体受力性能。',
    standards: '《公路隧道加固技术规范》(JTG/T 5440-2018)\n《地下工程防水技术规范》(GB 50108-2008)',
    materials: '非水反应型双组份高聚物树脂、专用注浆管、封缝胶。',
    construction: '地质雷达探明脱空区/裂隙标定 -> 钻孔排气与注浆孔布置 -> 表面裂缝封堵 -> 动态压力量测注浆 -> 稳压与封孔。',
    theory: '在底层物理引擎中：消除【拱顶脱空/掉块】的致命影响，并将【表观裂隙深度 dCrack】强制归零，瞬间恢复结构的基准健康度，且不侵入隧道建筑限界。',
    ecoParams: {
        costNum: 300.0, costUnit: '元/kg', costDesc: '(包含打孔、材料与封缝综合费)',
        timeNum: 200.0, timeUnit: 'kg/天', timeDesc: '(单作业面注浆效率)',
        calcLogic: '算法依据隧道跨度及假定空洞体积计算所需材料重量 W。总造价 = W × 综合单价；总工期 = W / 施工进度。'
    }
  },
  {
    id: 'steel_arch', backendKey: 'cost_steel', name: '增设 H型钢/工字钢拱架强力支护', category: '刚度增大与被动支撑',
    description: '在衬砌严重开裂、变形持续发展或存在大面积掉块风险的区段，紧贴原衬砌内轮廓架设型钢拱架，通过纵向连接筋形成整体支撑体系。',
    standards: '《公路隧道设计规范》(JTG 3370.1-2018)',
    materials: 'H型钢或I18/I20工字钢、纵向连接钢筋、高强膨胀螺栓或锚杆。',
    construction: '拼装并架设型钢拱架 -> 打设锁脚锚杆固定 -> 焊接纵向拉杆 -> 拱背与原衬砌间隙用楔形块或喷射混凝土顶紧。',
    theory: '在底层物理引擎中：提供绝对的刚度兜底，消除掉块失稳风险，并强行向系统注入【+40的结构健康度补偿】。适用于高危抢险，但会侵入隧道净空限界。',
    ecoParams: {
        costNum: 4500.0, costUnit: '元/延米', costDesc: '(包含钢材加工、运输及现场拼装)',
        timeNum: 10.0, timeUnit: '延米/天', timeDesc: '(单台阶作业效率)',
        calcLogic: '算法依据隧道开挖半周长 L 计算单榀长度。总造价 = L × 延米单价；总工期 = L / 施工进度。'
    }
  },
  {
    id: 'shotcrete_mesh', backendKey: 'cost_shotcrete', name: '挂网喷射混凝土加固', category: '表面防护与厚度补偿',
    description: '清除表面剥落、劣化的混凝土，铺设钢筋网后，重新喷射一层高强混凝土。有效抑制表层裂隙继续向深部发育，同时增加衬砌的有效厚度。',
    standards: '《喷射混凝土应用技术规程》(JGJ/T 372-2016)',
    materials: 'HPB300/HRB400钢筋网片、C25/C30速凝喷射混凝土、短锚钉。',
    construction: '原衬砌表面凿毛及高压水清洗 -> 植入固定短锚钉 -> 绑扎钢筋网 -> 湿喷混凝土 -> 表面抹平与养护。',
    theory: '在底层物理引擎中：强行将【表观裂隙深度 dCrack】折减 80%，同时将【衬砌设计厚度 dLining】增加 100mm。适用于无整体失稳风险的浅表层病害区段。',
    ecoParams: {
        costNum: 500.0, costUnit: '元/m²', costDesc: '(包含凿毛、挂网及喷射作业)',
        timeNum: 50.0, timeUnit: 'm²/天', timeDesc: '(单台湿喷机效率)',
        calcLogic: '算法依据需加固的拱部展开面积 S 计算。总造价 = S × 综合单价；总工期 = S / 施工进度。'
    }
  }
];

const TunnelMeasureLibrary: React.FC = () => {
  const [measures, setMeasures] = useState<any[]>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_MEASURES) : null;
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {
        console.error("Failed to parse saved tunnel measures", e);
      }
    }
    const initialMeasures = DEFAULT_MEASURES;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_MEASURES, JSON.stringify(initialMeasures));
      // Sync economics
      const ecoConfig: Record<string, [number, number]> = {};
      initialMeasures.forEach(m => {
        ecoConfig[m.backendKey] = [m.ecoParams.costNum, m.ecoParams.timeNum];
      });
      localStorage.setItem(STORAGE_KEY_ECONOMICS, JSON.stringify(ecoConfig));
    }
    return initialMeasures;
  });
  const [selectedId, setSelectedId] = useState<string>('polymer_grout');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {}, []);

  const selectedMeasure = measures.find(m => m.id === selectedId) || DEFAULT_MEASURES[0];

  const handleUpdate = (field: string, value: string) => {
    setMeasures(prev => prev.map(m => m.id === selectedId ? { ...m, [field]: value } : m));
  };

  const handleEcoUpdate = (field: string, value: number) => {
    setMeasures(prev => prev.map(m => m.id === selectedId ? { ...m, ecoParams: { ...m.ecoParams, [field]: value } } : m));
  };

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY_MEASURES, JSON.stringify(measures));
    syncEconomicsToEngine(measures); 
    setIsEditing(false);
    alert('隧道加固参数更新成功！新单价与工效已同步至底层推演引擎。');
  };

  const getIcon = (id: string) => {
      if (id === 'polymer_grout') return <Activity className="w-5 h-5" />;
      if (id === 'steel_arch') return <ShieldCheck className="w-5 h-5" />;
      if (id === 'shotcrete_mesh') return <Layers className="w-5 h-5" />;
      return <HardHat className="w-5 h-5" />;
  };

  return (
    <div className="flex h-full bg-gray-50">
      {/* 左侧侧边栏 */}
      <div className="w-1/3 max-w-sm bg-white border-r border-gray-200 flex flex-col h-full shadow-sm z-10">
        <div className="p-5 border-b border-gray-200 bg-white sticky top-0">
          <h2 className="text-xl font-bold text-gray-800 flex items-center mb-1">
            <Hammer className="w-6 h-6 mr-2 text-slate-800" />
            隧道加固与处治措施库
          </h2>
          <p className="text-xs text-gray-500">围岩稳定与衬砌修复经济基准中心</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50">
          {measures.map(m => (
             <div 
               key={m.id}
               onClick={() => { if (!isEditing) setSelectedId(m.id); }}
               className={`p-4 rounded-xl cursor-pointer transition-all border relative overflow-hidden ${
                 selectedId === m.id 
                   ? 'bg-white border-slate-400 shadow-md ring-1 ring-slate-200' 
                   : 'bg-white border-gray-200 hover:border-slate-300 hover:shadow-sm'
               } ${isEditing && selectedId !== m.id ? 'opacity-50 cursor-not-allowed' : ''}`}
             >
               {selectedId === m.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-800"></div>}
               <div className="flex justify-between items-center mb-1">
                 <h3 className="font-bold text-gray-800 flex items-center text-sm">
                    <span className={`mr-2 ${selectedId === m.id ? 'text-slate-800' : 'text-gray-400'}`}>
                        {getIcon(m.id)}
                    </span>
                    {m.name}
                 </h3>
               </div>
               <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] rounded font-bold mt-1">
                   {m.category}
               </span>
             </div>
          ))}
        </div>
      </div>

      {/* 右侧详情面板 */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto bg-gray-50 p-6 pb-16">
         <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-slate-800 px-8 py-6 relative">
                <div className="absolute top-6 right-8">
                    {isEditing ? (
                        <div className="flex space-x-2">
                            <button onClick={() => setIsEditing(false)} className="px-3 py-1.5 bg-slate-600 hover:bg-slate-500 text-white rounded text-sm font-bold flex items-center"><X className="w-4 h-4 mr-1"/> 取消</button>
                            <button onClick={handleSave} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-sm font-bold flex items-center"><Save className="w-4 h-4 mr-1"/> 保存并同步引擎</button>
                        </div>
                    ) : (
                        <button onClick={() => setIsEditing(true)} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded text-sm font-bold flex items-center transition-colors">
                            <Edit3 className="w-4 h-4 mr-2"/> 编辑参数与造价
                        </button>
                    )}
                </div>
                <div className="flex items-center space-x-3 mb-2">
                    <span className="px-2 py-1 bg-slate-700 text-slate-300 text-xs font-bold rounded border border-slate-600">{selectedMeasure.category}</span>
                </div>
                <h1 className="text-2xl font-black text-white flex items-center">{selectedMeasure.name}</h1>
                {isEditing ? (
                    <textarea className="w-full mt-3 bg-slate-700/50 border border-slate-600 text-slate-200 text-sm p-2 rounded focus:ring-emerald-500 focus:border-emerald-500" value={selectedMeasure.description} onChange={e => handleUpdate('description', e.target.value)} rows={2} />
                ) : (
                    <p className="text-slate-300 text-sm mt-3 leading-relaxed max-w-3xl">{selectedMeasure.description}</p>
                )}
            </div>

            <div className="p-8 space-y-8">
                {/* 常规资料区 (省略部分与桥梁一致的代码，重点展示经济配置区) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                        <h3 className="text-sm font-bold text-gray-800 flex items-center mb-3 border-b border-gray-200 pb-2"><BookOpen className="w-4 h-4 mr-2 text-slate-700" /> 参考规范 (Standards)</h3>
                        {isEditing ? <textarea className="w-full bg-white border border-gray-300 text-sm p-2 rounded h-24" value={selectedMeasure.standards} onChange={e => handleUpdate('standards', e.target.value)} /> : <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedMeasure.standards}</p>}
                    </div>
                    <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                        <h3 className="text-sm font-bold text-gray-800 flex items-center mb-3 border-b border-gray-200 pb-2"><Settings className="w-4 h-4 mr-2 text-slate-700" /> 装备与材料 (Materials)</h3>
                        {isEditing ? <textarea className="w-full bg-white border border-gray-300 text-sm p-2 rounded h-24" value={selectedMeasure.materials} onChange={e => handleUpdate('materials', e.target.value)} /> : <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedMeasure.materials}</p>}
                    </div>
                </div>

                <div>
                    <h2 className="text-lg font-black text-gray-800 flex items-center mb-4">
                        <Zap className="w-5 h-5 mr-2 text-emerald-600" /> 底层力学引擎联动机制
                    </h2>
                    <div className="border border-emerald-100 bg-emerald-50/30 rounded-xl p-5 relative overflow-hidden">
                        {isEditing && <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg">正在编辑底层参数</div>}
                        <h3 className="text-sm font-bold text-emerald-800 flex items-center mb-3"><Clock className="w-4 h-4 mr-2" /> 经济与工期计算基准 (Economics Config)</h3>
                        <p className="text-xs text-gray-600 mb-4">{selectedMeasure.theory}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="bg-white p-4 rounded-lg border border-emerald-200 shadow-sm flex flex-col justify-center">
                                <span className="text-xs font-bold text-gray-500 uppercase mb-2">系统内部造价基数</span>
                                <div className="flex items-end">
                                    {isEditing ? <input type="number" className="w-24 border-b-2 border-emerald-500 text-xl font-bold text-emerald-700 p-0 focus:ring-0 bg-transparent" value={selectedMeasure.ecoParams.costNum} onChange={e => handleEcoUpdate('costNum', parseFloat(e.target.value))} /> : <span className="text-2xl font-mono font-bold text-emerald-700 mr-2">{selectedMeasure.ecoParams.costNum.toLocaleString()}</span>}
                                    <span className="text-sm text-gray-600">{selectedMeasure.ecoParams.costUnit} <span className="text-xs text-gray-400 ml-1">{selectedMeasure.ecoParams.costDesc}</span></span>
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-lg border border-emerald-200 shadow-sm flex flex-col justify-center">
                                <span className="text-xs font-bold text-gray-500 uppercase mb-2">系统内部施工进度</span>
                                <div className="flex items-end">
                                    {isEditing ? <input type="number" step="0.1" className="w-24 border-b-2 border-emerald-500 text-xl font-bold text-emerald-700 p-0 focus:ring-0 bg-transparent" value={selectedMeasure.ecoParams.timeNum} onChange={e => handleEcoUpdate('timeNum', parseFloat(e.target.value))} /> : <span className="text-2xl font-mono font-bold text-emerald-700 mr-2">{selectedMeasure.ecoParams.timeNum}</span>}
                                    <span className="text-sm text-gray-600">{selectedMeasure.ecoParams.timeUnit} <span className="text-xs text-gray-400 ml-1">{selectedMeasure.ecoParams.timeDesc}</span></span>
                                </div>
                            </div>
                        </div>
                        <div className="text-sm text-emerald-900/80 bg-white p-3 rounded-lg border border-emerald-100 shadow-inner">
                            <span className="font-bold text-xs uppercase mb-1 block">模块经济指标输出逻辑：</span>
                            {selectedMeasure.ecoParams.calcLogic}
                        </div>
                    </div>
                </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default TunnelMeasureLibrary;