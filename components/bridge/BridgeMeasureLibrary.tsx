import React, { useState, useEffect } from 'react';
import { 
    BookOpen, Clock, Hammer, ShieldCheck, 
    FileText, Settings, Layers, Zap, Edit3, Save, X, Activity, LifeBuoy
} from 'lucide-react';

const STORAGE_KEY_MEASURES = 'roadbedguard_bridge_measures';
const STORAGE_KEY_ECONOMICS = 'roadbedguard_bridge_economics'; 

const DEFAULT_MEASURES = [
  {
    id: 'cfrp_wrap', backendKey: 'cost_cfrp', name: '碳纤维 (CFRP) 环向包裹', category: '材料与约束增强',
    description: '采用高强碳纤维布沿桥墩环向多层包裹，利用 CFRP 的高抗拉强度对核心混凝土形成强力侧向约束，显著提升桥墩的抗剪切能力与塑性变形延性。',
    standards: '《公路桥梁抗震设计规范》(JTG/T 2231-01-2020)\n《混凝土结构加固设计规范》(GB 50367-2013)',
    materials: '单向碳纤维布（抗拉强度≥3400MPa）、配套浸渍胶、底层树脂。',
    construction: '基面打磨处理 -> 涂刷底胶 -> 修补找平 -> 涂刷浸渍胶 -> 环向多层粘贴 CFRP 布 -> 表面防护处理。',
    theory: '在底层抗冲击引擎中：强行将【箍筋等效面积 Ast】放大 3 倍，并强制提升【延性系数 μd】至 8.0 以上，大幅提高名义抗剪承载力 Vn。',
    ecoParams: {
        costNum: 800.0, costUnit: '元/m²', costDesc: '(包含打磨、材料与多层粘贴)',
        timeNum: 50.0, timeUnit: 'm²/天', timeDesc: '(单作业面综合工效)',
        calcLogic: '算法依据墩径(D)与假定加固高度计算包裹面积 S。总造价 = S × 综合单价；总工期 = S / 施工进度。'
    }
  },
  {
    id: 'steel_jacket', backendKey: 'cost_jacket', name: '外包钢管混凝土套裙 (增大截面)', category: '截面与刚度增大',
    description: '在原有墩柱外侧套入两半拼装的钢管，并在钢管与原混凝土之间灌注微膨胀高强自密实混凝土，形成钢管-混凝土-原墩柱的强力复合截面。',
    standards: '《公路桥梁加固设计规范》(JTG/T J22-2008)',
    materials: 'Q345/Q355钢板卷制套管、环向加劲肋、C50/C60微膨胀自密实混凝土、高强植筋锚栓。',
    construction: '原墩表面凿毛并植筋 -> 吊装两半钢管并现场焊接 -> 底部封堵 -> 泵送高强自密实混凝土 -> 顶部封口防腐。',
    theory: '在底层抗冲击引擎中：强行将【墩径 D】增加 0.4m，【核心面积 Ag】放大 1.5 倍，【等效强度 fc】提升 20%，提供绝对的刚度与抗力保障。',
    ecoParams: {
        costNum: 15000.0, costUnit: '元/延米', costDesc: '(包含钢材、焊接、灌浆及防腐)',
        timeNum: 2.0, timeUnit: '延米/天', timeDesc: '(单台吊车及施工作业组)',
        calcLogic: '算法依据设定加固高度 h 计算。总造价 = h × 综合延米单价；总工期 = h / 施工进度。'
    }
  },
  {
    id: 'flexible_fender', backendKey: 'cost_fender', name: '复合材料柔性防撞套箱', category: '能量隔离与耗散',
    description: '在容易遭受船舶或车辆直接撞击的墩柱标高处，安装由纤维增强复合材料(FRP)外壳与内部高耗能闭孔泡沫/阻尼元件组成的防撞箱，不改变原桥墩结构。',
    standards: '《公路桥梁抗撞设计规范》(JTG/T 3360-02-2020)',
    materials: 'FRP玻璃钢外壳、闭孔聚氨酯吸能泡沫、内部波纹钢耗能板、高强不锈钢连接件。',
    construction: '工厂预制模块化防撞箱 -> 现场水上/陆地吊装 -> 螺栓或钢拉杆环向锁紧抱死 -> 缝隙密封。',
    theory: '在底层抗冲击引擎中：不改变桥墩本体任何力学参数，而是“以柔克刚”，强制将外部输入的【撞击动能 Ek】削减 60%（即 Ek × 0.4），直接降低损伤需求。',
    ecoParams: {
        costNum: 450000.0, costUnit: '元/套', costDesc: '(定制模块化成品与现场安装费)',
        timeNum: 0.5, timeUnit: '套/天', timeDesc: '(模块化快速拼装)',
        calcLogic: '算法按双柱墩需配置 2 套计算。总造价 = 2 × 单套造价；总工期 = 2 / 施工进度。'
    }
  }
];

const BridgeMeasureLibrary: React.FC = () => {
  const [measures, setMeasures] = useState<any[]>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_MEASURES) : null;
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {
        console.error("Failed to parse saved bridge measures", e);
      }
    }
    const initialMeasures = DEFAULT_MEASURES;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_MEASURES, JSON.stringify(initialMeasures));
      // Sync economics
      const ecoConfig: Record<string, [number, number]> = {};
      initialMeasures.forEach(m => {
        ecoConfig[m.backendKey] = [m.ecoParams?.costNum || 0, m.ecoParams?.timeNum || 0];
      });
      localStorage.setItem(STORAGE_KEY_ECONOMICS, JSON.stringify(ecoConfig));
    }
    return initialMeasures;
  });
  const [selectedId, setSelectedId] = useState<string>('cfrp_wrap');
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
    alert('桥梁防撞加固参数更新成功！新单价与工效已同步至底层推演引擎。');
  };

  const getIcon = (id: string) => {
      if (id === 'cfrp_wrap') return <Layers className="w-5 h-5" />;
      if (id === 'steel_jacket') return <ShieldCheck className="w-5 h-5" />;
      if (id === 'flexible_fender') return <LifeBuoy className="w-5 h-5" />;
      return <Activity className="w-5 h-5" />;
  };

  return (
    <div className="flex h-full bg-gray-50">
      {/* 左侧侧边栏 */}
      <div className="w-1/3 max-w-sm bg-white border-r border-gray-200 flex flex-col h-full shadow-sm z-10">
        <div className="p-5 border-b border-gray-200 bg-white sticky top-0">
          <h2 className="text-xl font-bold text-gray-800 flex items-center mb-1">
            <Hammer className="w-6 h-6 mr-2 text-indigo-600" />
            桥梁加固与防撞措施库
          </h2>
          <p className="text-xs text-gray-500">抗冲击工艺与造价基准中心</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50">
          {measures.map(m => (
             <div 
               key={m.id}
               onClick={() => { if (!isEditing) setSelectedId(m.id); }}
               className={`p-4 rounded-xl cursor-pointer transition-all border relative overflow-hidden ${
                 selectedId === m.id 
                   ? 'bg-white border-indigo-300 shadow-md ring-1 ring-indigo-100' 
                   : 'bg-white border-gray-200 hover:border-indigo-300 hover:shadow-sm'
               } ${isEditing && selectedId !== m.id ? 'opacity-50 cursor-not-allowed' : ''}`}
             >
               {selectedId === m.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500"></div>}
               <div className="flex justify-between items-center mb-1">
                 <h3 className="font-bold text-gray-800 flex items-center text-sm">
                    <span className={`mr-2 ${selectedId === m.id ? 'text-indigo-600' : 'text-gray-400'}`}>
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
      <div className="flex-1 flex flex-col h-full overflow-y-auto bg-gray-50 p-6">
         <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            
            <div className="bg-slate-800 px-8 py-6 relative">
                <div className="absolute top-6 right-8">
                    {isEditing ? (
                        <div className="flex space-x-2">
                            <button onClick={() => setIsEditing(false)} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm font-bold flex items-center"><X className="w-4 h-4 mr-1"/> 取消</button>
                            <button onClick={handleSave} className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-400 text-white rounded text-sm font-bold flex items-center"><Save className="w-4 h-4 mr-1"/> 保存并同步引擎</button>
                        </div>
                    ) : (
                        <button onClick={() => setIsEditing(true)} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-indigo-300 hover:text-white rounded text-sm font-bold flex items-center transition-colors">
                            <Edit3 className="w-4 h-4 mr-2"/> 编辑参数与造价
                        </button>
                    )}
                </div>
                <div className="flex items-center space-x-3 mb-2">
                    <span className="px-2 py-1 bg-indigo-500/30 text-indigo-200 text-xs font-bold rounded border border-indigo-400/30">{selectedMeasure.category}</span>
                </div>
                <h1 className="text-2xl font-black text-white flex items-center">{selectedMeasure.name}</h1>
                {isEditing ? (
                    <textarea className="w-full mt-3 bg-slate-700/50 border border-slate-600 text-slate-200 text-sm p-2 rounded focus:ring-indigo-500 focus:border-indigo-500" value={selectedMeasure.description} onChange={e => handleUpdate('description', e.target.value)} rows={2} />
                ) : (
                    <p className="text-slate-300 text-sm mt-3 leading-relaxed max-w-3xl">{selectedMeasure.description}</p>
                )}
            </div>

            <div className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                        <h3 className="text-sm font-bold text-gray-800 flex items-center mb-3 border-b border-gray-200 pb-2">
                            <BookOpen className="w-4 h-4 mr-2 text-indigo-600" /> 参考规范 (Standards)
                        </h3>
                        {isEditing ? (
                            <textarea className="w-full bg-white border border-gray-300 text-gray-700 text-sm p-2 rounded h-24" value={selectedMeasure.standards || ''} onChange={e => handleUpdate('standards', e.target.value)} />
                        ) : (
                            <ul className="space-y-2">
                                {(selectedMeasure.standards || '').split('\n').map((s:string, i:number) => (
                                    <li key={i} className="text-sm text-gray-600 flex items-start"><span className="text-indigo-400 mr-2 mt-0.5">•</span> {s}</li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                        <h3 className="text-sm font-bold text-gray-800 flex items-center mb-3 border-b border-gray-200 pb-2">
                            <Settings className="w-4 h-4 mr-2 text-indigo-600" /> 装备与材料 (Materials)
                        </h3>
                        {isEditing ? (
                            <textarea className="w-full bg-white border border-gray-300 text-gray-700 text-sm p-2 rounded h-24" value={selectedMeasure.materials} onChange={e => handleUpdate('materials', e.target.value)} />
                        ) : (
                            <p className="text-sm text-gray-600 leading-relaxed">{selectedMeasure.materials}</p>
                        )}
                    </div>

                    <div className="md:col-span-2 bg-gray-50 p-5 rounded-xl border border-gray-100">
                        <h3 className="text-sm font-bold text-gray-800 flex items-center mb-3 border-b border-gray-200 pb-2">
                            <Hammer className="w-4 h-4 mr-2 text-indigo-600" /> 核心施工工艺 (Construction Process)
                        </h3>
                        {isEditing ? (
                            <textarea className="w-full bg-white border border-gray-300 text-gray-700 text-sm p-2 rounded h-20" value={selectedMeasure.construction} onChange={e => handleUpdate('construction', e.target.value)} />
                        ) : (
                            <p className="text-sm text-gray-600 leading-relaxed">{selectedMeasure.construction}</p>
                        )}
                    </div>
                </div>

                <div>
                    <h2 className="text-lg font-black text-gray-800 flex items-center mb-4">
                        <Zap className="w-5 h-5 mr-2 text-indigo-600" />
                        底层动力学引擎联动机制
                    </h2>
                    <div className="space-y-4">
                        <div className="border border-emerald-100 bg-emerald-50/30 rounded-xl p-5 relative overflow-hidden">
                            {isEditing && <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg">正在编辑底层参数</div>}
                            <h3 className="text-sm font-bold text-emerald-800 flex items-center mb-3">
                                <Clock className="w-4 h-4 mr-2" /> 经济与工期计算基准 (Economics Config)
                            </h3>
                            
                            <p className="text-xs text-gray-600 mb-4">{selectedMeasure.theory}</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div className="bg-white p-4 rounded-lg border border-emerald-200 shadow-sm flex flex-col justify-center">
                                    <span className="text-xs font-bold text-gray-500 uppercase mb-2">系统内部造价基数</span>
                                    <div className="flex items-end">
                                        {isEditing ? (
                                            <input type="number" className="w-24 border-b-2 border-emerald-500 text-xl font-bold text-emerald-700 p-0 focus:ring-0 focus:border-emerald-600 mr-2 bg-transparent" value={selectedMeasure.ecoParams?.costNum || 0} onChange={e => handleEcoUpdate('costNum', parseFloat(e.target.value))} />
                                        ) : (
                                            <span className="text-2xl font-mono font-bold text-emerald-700 mr-2">{(selectedMeasure.ecoParams?.costNum || 0).toLocaleString()}</span>
                                        )}
                                        <span className="text-sm text-gray-600">{selectedMeasure.ecoParams?.costUnit} <span className="text-xs text-gray-400 ml-1">{selectedMeasure.ecoParams?.costDesc}</span></span>
                                    </div>
                                </div>
                                <div className="bg-white p-4 rounded-lg border border-emerald-200 shadow-sm flex flex-col justify-center">
                                    <span className="text-xs font-bold text-gray-500 uppercase mb-2">系统内部施工进度</span>
                                    <div className="flex items-end">
                                        {isEditing ? (
                                            <input type="number" step="0.1" className="w-24 border-b-2 border-emerald-500 text-xl font-bold text-emerald-700 p-0 focus:ring-0 focus:border-emerald-600 mr-2 bg-transparent" value={selectedMeasure.ecoParams?.timeNum || 0} onChange={e => handleEcoUpdate('timeNum', parseFloat(e.target.value))} />
                                        ) : (
                                            <span className="text-2xl font-mono font-bold text-emerald-700 mr-2">{selectedMeasure.ecoParams?.timeNum || 0}</span>
                                        )}
                                        <span className="text-sm text-gray-600">{selectedMeasure.ecoParams?.timeUnit} <span className="text-xs text-gray-400 ml-1">{selectedMeasure.ecoParams?.timeDesc}</span></span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-sm text-emerald-900/80 bg-white p-3 rounded-lg border border-emerald-100 shadow-inner">
                                <span className="font-bold text-xs uppercase mb-1 block">模块经济指标输出逻辑：</span>
                                {selectedMeasure.ecoParams?.calcLogic}
                            </div>
                        </div>
                    </div>
                </div>

            </div>
         </div>
      </div>
    </div>
  );
};

export default BridgeMeasureLibrary;
