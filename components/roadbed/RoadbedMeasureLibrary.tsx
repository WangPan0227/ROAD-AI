import React, { useState, useEffect } from 'react';
import { 
    BookOpen, Clock, Hammer, ShieldCheck, 
    FileText, Settings, Layers, Droplets, Edit3, Save, X, Activity
} from 'lucide-react';

const STORAGE_KEY_MEASURES = 'roadbedguard_roadbed_measures';
const STORAGE_KEY_ECONOMICS = 'roadbedguard_roadbed_economics'; 

const DEFAULT_MEASURES = [
  {
    id: 'polymer_grout', backendKey: 'cost_grout', name: '高聚物无损注浆 (Polymer Grouting)', category: '材料改性',
    description: '采用双组份高分子聚合物材料，通过微孔注入路基内部。材料在地下迅速发生化学反应，体积膨胀并固化，挤密周边土体，排出积水，实现路基模量的快速恢复。',
    standards: '《公路路基路面高聚物注浆加固技术规程》\n具有 2 小时快速开放交通的应急响应优势。',
    materials: '非水反应型双组份高聚物树脂材料、16mm微型注浆管、专用双液注浆成套设备。',
    construction: '地质雷达探明脱空/软弱区 -> 标定孔位 -> 钻孔 (孔径约16-20mm) -> 下管 -> 封闭拔管 -> 动态监测压力量测注浆 -> 封孔。',
    theory: '在底层水-力耦合引擎中：强行将注浆区域的【饱和渗透系数 Ks】降低 2 个数量级（阻水），同时强制将该层的【压实度 Comp】提升至 0.98 以上，瞬间大幅恢复基础工作模量。',
    ecoParams: {
        costNum: 450.0, costUnit: '元/kg', costDesc: '(包含打孔与高聚物材料费)',
        timeNum: 2000.0, timeUnit: 'kg/天', timeDesc: '(单台设备综合工效)',
        calcLogic: '算法依据软弱层体积及目标孔隙率计算所需高聚物材料质量 W。总造价 = W × 综合单价；总工期 = W / 施工进度。'
    }
  },
  {
    id: 'replacement', backendKey: 'cost_replace', name: '原槽换填与表面封闭 (Replacement & Sealing)', category: '地形与表层改造',
    description: '挖除路床表层翻浆冒泥或受水浸泡严重丧失承载力的软弱土体，换填透水性好、强度高的粗颗粒材料，并重做防水封层。',
    standards: '《公路路基设计规范》(JTG D30-2015)\n《公路沥青路面养护技术规范》',
    materials: '级配碎石、碎石土或工业废渣（如钢渣）；改性沥青封层材料。',
    construction: '划定病害范围 -> 铣刨路面 -> 开挖软弱路基至稳定层 -> 分层填筑换填材料并压实 -> 施作封水层 -> 恢复面层。',
    theory: '在底层引擎中：强行将【地表径流系数 Runoff_coeff】重置为 0.80（切断降雨入渗），并将表层替换为高 CBR 值的填料，重置其初始状态。',
    ecoParams: {
        costNum: 180.0, costUnit: '元/m³', costDesc: '(包含铣刨、开挖、换填与恢复)',
        timeNum: 150.0, timeUnit: 'm³/天', timeDesc: '(标准化机械作业)',
        calcLogic: '算法设定换填深度 h_r，计算换填体积 V。总造价 = V × 综合单价；总工期 = V / 施工进度。'
    }
  },
  {
    id: 'deep_drainage', backendKey: 'cost_drain', name: '增设深层盲沟/排水管 (Deep Drainage)', category: '水文干预',
    description: '在路基侧坡或中央分隔带开挖深沟，内部铺设透水土工布和打孔波纹管，回填碎石，用于快速降低路基内部的高地下水位。',
    standards: '《公路排水设计规范》(JTG/T D33-2012)',
    materials: 'HDPE打孔波纹管、无纺土工布、单一粒径反滤碎石。',
    construction: '沟槽开挖 -> 铺设防淤堵土工布 -> 底部找坡铺设透水管 -> 填筑碎石滤料 -> 顶部封闭包扎。',
    theory: '在底层引擎中：强行修改【地下水位 Groundwater_Depth】边界条件，将其拉低至盲沟标高，从而消除土层孔隙水压力，使湿化软化系数 (Ks) 回升。',
    ecoParams: {
        costNum: 350.0, costUnit: '元/延米', costDesc: '(开挖、材料与回填综合造价)',
        timeNum: 80.0, timeUnit: '延米/天', timeDesc: '(单工作面)',
        calcLogic: '算法依据需排干的路段长度 L 计算。总造价 = L × 综合单价；总工期 = L / 施工进度。'
    }
  },
  {
    id: 'micropile_rb', backendKey: 'cost_mpile', name: '微型钢管桩树根网 (Micro-piles)', category: '结构支护',
    description: '采用小孔径钻孔灌注桩，通过多次高压注浆使桩体与土体胶结，形成树根状网状结构，提高路基整体抗剪与抗压承载力。',
    standards: '《公路路基支挡结构设计规范》(JTG/T 3334-2018)',
    materials: 'Q345高强无缝钢管（D=89~108mm），M30纯水泥浆。',
    construction: '小导孔钻进 -> 下放钢管 -> 一次常压注浆 -> 二次高压劈裂注浆 -> 顶部连系梁。',
    theory: '在底层引擎中：基于复合地基理论，桩体直接分担竖向附加荷载 q_load，并提供等效竖向变形模量 E_composite，从而大幅减小最终沉降量。',
    ecoParams: {
        costNum: 480.0, costUnit: '元/m', costDesc: '(钻孔、下管及注浆综合单价)',
        timeNum: 50.0, timeUnit: 'm/天', timeDesc: '(单台钻机效率)',
        calcLogic: '算法穷举桩长(L)与布桩间距。造价 = 总桩长 × 单价；工期 = 总桩长 / 施工进度。'
    }
  }
];

const RoadbedMeasureLibrary: React.FC = () => {
  const [measures, setMeasures] = useState<any[]>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_MEASURES) : null;
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {
        console.error("Failed to parse saved roadbed measures", e);
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
    alert('参数更新成功！系统已自动同步路基新单价与工效至底层推演引擎。');
  };

  const getIcon = (id: string) => {
      if (id === 'polymer_grout') return <Activity className="w-5 h-5" />;
      if (id === 'replacement') return <Layers className="w-5 h-5" />;
      if (id === 'deep_drainage') return <Droplets className="w-5 h-5" />;
      return <ShieldCheck className="w-5 h-5" />;
  };

  return (
    <div className="flex h-full bg-gray-50">
      {/* 左侧侧边栏 */}
      <div className="w-1/3 max-w-sm bg-white border-r border-gray-200 flex flex-col h-full shadow-sm z-10">
        <div className="p-5 border-b border-gray-200 bg-white sticky top-0">
          <h2 className="text-xl font-bold text-gray-800 flex items-center mb-1">
            <Hammer className="w-6 h-6 mr-2 text-blue-600" />
            路基加固措施库
          </h2>
          <p className="text-xs text-gray-500">水毁/沉降处治工艺与造价基准中心</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50">
          {measures.map(m => (
             <div 
               key={m.id}
               onClick={() => { if (!isEditing) setSelectedId(m.id); }}
               className={`p-4 rounded-xl cursor-pointer transition-all border relative overflow-hidden ${
                 selectedId === m.id 
                   ? 'bg-white border-blue-300 shadow-md ring-1 ring-blue-100' 
                   : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm'
               } ${isEditing && selectedId !== m.id ? 'opacity-50 cursor-not-allowed' : ''}`}
             >
               {selectedId === m.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>}
               <div className="flex justify-between items-center mb-1">
                 <h3 className="font-bold text-gray-800 flex items-center text-sm">
                    <span className={`mr-2 ${selectedId === m.id ? 'text-blue-600' : 'text-gray-400'}`}>
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
                            <button onClick={() => setIsEditing(false)} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm font-bold flex items-center"><X className="w-4 h-4 mr-1"/> 取消</button>
                            <button onClick={handleSave} className="px-3 py-1.5 bg-blue-500 hover:bg-blue-400 text-white rounded text-sm font-bold flex items-center"><Save className="w-4 h-4 mr-1"/> 保存并同步引擎</button>
                        </div>
                    ) : (
                        <button onClick={() => setIsEditing(true)} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-blue-300 hover:text-white rounded text-sm font-bold flex items-center transition-colors">
                            <Edit3 className="w-4 h-4 mr-2"/> 编辑参数与造价
                        </button>
                    )}
                </div>
                <div className="flex items-center space-x-3 mb-2">
                    <span className="px-2 py-1 bg-blue-500/30 text-blue-200 text-xs font-bold rounded border border-blue-400/30">{selectedMeasure.category}</span>
                </div>
                <h1 className="text-2xl font-black text-white flex items-center">{selectedMeasure.name}</h1>
                {isEditing ? (
                    <textarea className="w-full mt-3 bg-slate-700/50 border border-slate-600 text-slate-200 text-sm p-2 rounded focus:ring-blue-500 focus:border-blue-500" value={selectedMeasure.description} onChange={e => handleUpdate('description', e.target.value)} rows={2} />
                ) : (
                    <p className="text-slate-300 text-sm mt-3 leading-relaxed max-w-3xl">{selectedMeasure.description}</p>
                )}
            </div>

            <div className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                        <h3 className="text-sm font-bold text-gray-800 flex items-center mb-3 border-b border-gray-200 pb-2">
                            <BookOpen className="w-4 h-4 mr-2 text-blue-600" /> 参考规范 (Standards)
                        </h3>
                        {isEditing ? (
                            <textarea className="w-full bg-white border border-gray-300 text-gray-700 text-sm p-2 rounded h-24" value={selectedMeasure.standards || ''} onChange={e => handleUpdate('standards', e.target.value)} />
                        ) : (
                            <ul className="space-y-2">
                                {(selectedMeasure.standards || '').split('\n').map((s:string, i:number) => (
                                    <li key={i} className="text-sm text-gray-600 flex items-start"><span className="text-blue-400 mr-2 mt-0.5">•</span> {s}</li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                        <h3 className="text-sm font-bold text-gray-800 flex items-center mb-3 border-b border-gray-200 pb-2">
                            <Settings className="w-4 h-4 mr-2 text-blue-600" /> 装备与材料 (Materials)
                        </h3>
                        {isEditing ? (
                            <textarea className="w-full bg-white border border-gray-300 text-gray-700 text-sm p-2 rounded h-24" value={selectedMeasure.materials} onChange={e => handleUpdate('materials', e.target.value)} />
                        ) : (
                            <p className="text-sm text-gray-600 leading-relaxed">{selectedMeasure.materials}</p>
                        )}
                    </div>

                    <div className="md:col-span-2 bg-gray-50 p-5 rounded-xl border border-gray-100">
                        <h3 className="text-sm font-bold text-gray-800 flex items-center mb-3 border-b border-gray-200 pb-2">
                            <Hammer className="w-4 h-4 mr-2 text-blue-600" /> 核心施工工艺 (Construction Process)
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
                        <FileText className="w-5 h-5 mr-2 text-blue-600" />
                        底层物理引擎联动机制
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
                                            <span className="text-2xl font-mono font-bold text-emerald-700 mr-2">{(selectedMeasure.ecoParams?.costNum || 0).toFixed(2)}</span>
                                        )}
                                        <span className="text-sm text-gray-600">{selectedMeasure.ecoParams?.costUnit} <span className="text-xs text-gray-400 ml-1">{selectedMeasure.ecoParams?.costDesc}</span></span>
                                    </div>
                                </div>
                                <div className="bg-white p-4 rounded-lg border border-emerald-200 shadow-sm flex flex-col justify-center">
                                    <span className="text-xs font-bold text-gray-500 uppercase mb-2">系统内部施工进度</span>
                                    <div className="flex items-end">
                                        {isEditing ? (
                                            <input type="number" className="w-24 border-b-2 border-emerald-500 text-xl font-bold text-emerald-700 p-0 focus:ring-0 focus:border-emerald-600 mr-2 bg-transparent" value={selectedMeasure.ecoParams?.timeNum || 0} onChange={e => handleEcoUpdate('timeNum', parseFloat(e.target.value))} />
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

export default RoadbedMeasureLibrary;