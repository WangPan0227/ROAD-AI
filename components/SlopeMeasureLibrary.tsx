import React, { useState, useEffect } from 'react';
import { 
    BookOpen, Calculator, Clock, Hammer, ShieldCheck, 
    FileText, Settings, Layers, Anchor, Mountain, Edit3, Save, X 
} from 'lucide-react';

const STORAGE_KEY_MEASURES = 'roadbedguard_slope_measures_v2';
const STORAGE_KEY_ECONOMICS = 'roadbedguard_slope_economics'; // 供仿真模块读取的桥梁

const DEFAULT_MEASURES = [
  {
    id: 'cut', backendKey: 'cost_cut', name: '削方减载 (Cut & Unload)', category: '地形改造',
    description: '通过削减边坡上部的岩土体，减小滑坡体的体积和重量，从而降低下滑力，是滑坡治理最直接、最经济的首选措施。',
    standards: '《公路路基设计规范》(JTG D30-2015)\n《建筑边坡工程技术规范》(GB 50330-2013)',
    materials: '无需特殊材料。依托挖掘机、推土机及自卸汽车等常规土石方机械。',
    construction: '必须遵循“自上而下、分层开挖”的原则，严禁全面抽槽或掏底开挖。削坡后应及时跟进坡面防护（如植草、护面墙）。',
    theory: '在极限平衡法（LEM）中，通过改变地表几何轮廓边界条件 [Geometry]，直接减小滑裂面以上的土体自重 (W)。从而减小下滑驱动力 T = W*sin(α) + k_h*W*cos(α)。',
    ecoParams: {
        costNum: 35.0, costUnit: '元/m³', costDesc: '(包含开挖与短途弃方)',
        timeNum: 500.0, timeUnit: 'm³/天', timeDesc: '(单工作面)',
        calcLogic: '算法依据几何面积分差积分求得总削方体积 V。总造价 = V × 综合单价；总工期 = V / 施工进度。'
    }
  },
  {
    id: 'berm', backendKey: 'cost_berm', name: '坡角反压 (Toe Berm)', category: '地形改造',
    description: '在边坡或滑坡体前缘（阻滑段）堆填土石方，增加抗滑段的重量，产生反向力矩，阻止滑体滑动。',
    standards: '《滑坡防治工程设计与施工技术规范》(DZ/T 0219-2006)',
    materials: '优先利用削坡产生的弃方（移挖作填），或采用透水性好、抗剪强度高的块石、碎石土。',
    construction: '填筑前应清理地表植被及软弱层，设置良好的地下水排导系统（如盲沟），分层填筑并压实，压实度需满足规范要求。',
    theory: '在算法中，改变坡脚前缘的几何边界。增加的土体自重 (W_berm) 作用于滑面倾角为负或较小的区段，直接增加抗滑力 R = W_berm*cos(α)*tan(φ) + c*L，同时抑制坡脚剪出。',
    ecoParams: {
        costNum: 55.0, costUnit: '元/m³', costDesc: '(包含借土、填筑与压实)',
        timeNum: 300.0, timeUnit: 'm³/天', timeDesc: '(标准化作业)',
        calcLogic: '算法设定压重平台高度 H_b 和宽度 B_b，计算填方体积 V。总造价 = V × 综合单价；总工期 = V / 施工进度。'
    }
  },
  {
    id: 'micropile', backendKey: 'cost_pile', name: '微型群桩支护 (Micro-piles)', category: '结构支护',
    description: '采用小孔径（通常 D<300mm）的钻孔灌注桩，内置钢管或钢筋笼，以群桩形式布置，抗弯刚度大，施工快。',
    standards: '《公路路基支挡结构设计规范》(JTG/T 3334-2018)',
    materials: '主筋常采用 Q345/Q390 高强无缝钢管（D=108~273mm，壁厚 6~12mm），孔内注浆采用 M30/M40 纯水泥浆。',
    construction: '钻孔 -> 下放钢管 -> 清孔 -> 底部压力注浆 -> 顶部浇筑连系梁。设备小巧，适合应急抢险及狭窄空间。',
    theory: '在仿真矩阵中，程序根据最危险滑面深度提取单桩悬臂长度。计算钢管的抗弯截面模量，转化为等效集中抗滑力 (R_prov)，补偿剩余下滑力缺口。',
    ecoParams: {
        costNum: 550.0, costUnit: '元/m', costDesc: '(钻孔、下管及注浆综合单价)',
        timeNum: 40.0, timeUnit: 'm/天', timeDesc: '(单台钻机效率)',
        calcLogic: '算法穷举桩长(L)与间距(s)。造价 = (总宽/s+1) × L × 单价；工期 = 桩总长 / 施工进度。'
    }
  },
  {
    id: 'anchor', backendKey: 'cost_anchor', name: '预应力锚索支护 (Ground Anchors)', category: '结构支护',
    description: '将受拉构件一端锚固在稳定地层中，另一端通过框架梁或锚墩张拉施加预应力，主动加固边坡。',
    standards: '《岩土锚杆与喷射混凝土支护工程技术规范》(GB 50086-2015)',
    materials: '1860级高强低松弛钢绞线（通常 3~6 束），M40 水泥砂浆，OVM 锚具，高强度混凝土框架梁。',
    construction: '钻孔 -> 编索与下索 -> 一次常压注浆 -> 二次高压劈裂注浆 -> 浇筑地梁 -> 张拉锁定 -> 封锚。',
    theory: '仿真模型计算地层极限握裹力 (τ_bond) 和钢绞线抗拉强度，取两者较小值得到设计轴力 T_design。向下倾斜的锚索不仅提供切向抗滑力，更增加滑面法向正应力以提升摩擦力。',
    ecoParams: {
        costNum: 220.0, costUnit: '元/m', costDesc: '(含钻孔、钢绞线、注浆与锚具)',
        timeNum: 60.0, timeUnit: 'm/天', timeDesc: '(单台钻机效率)',
        calcLogic: '算法穷举锚固段长度(L_b)与间距。造价 = (总宽/s+1) × (L_b+自由段) × 单价；工期 = 总长 / 施工进度。'
    }
  }
];

const SlopeMeasureLibrary: React.FC = () => {
  const [measures, setMeasures] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string>('cut');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY_MEASURES);
    if (saved) {
      setMeasures(JSON.parse(saved));
    } else {
      setMeasures(DEFAULT_MEASURES);
      // 初始化时就同步经济参数到桥梁
      syncEconomicsToEngine(DEFAULT_MEASURES);
    }
  }, []);

  const syncEconomicsToEngine = (data: any[]) => {
      const ecoConfig: Record<string, [number, number]> = {};
      data.forEach(m => {
          ecoConfig[m.backendKey] = [m.ecoParams?.costNum || 0, m.ecoParams?.timeNum || 0];
      });
      localStorage.setItem(STORAGE_KEY_ECONOMICS, JSON.stringify(ecoConfig));
  };

  const selectedMeasure = measures.find(m => m.id === selectedId) || DEFAULT_MEASURES[0];

  const handleUpdate = (field: string, value: string) => {
    setMeasures(prev => prev.map(m => m.id === selectedId ? { ...m, [field]: value } : m));
  };

  const handleEcoUpdate = (field: string, value: number) => {
    setMeasures(prev => prev.map(m => m.id === selectedId ? { ...m, ecoParams: { ...m.ecoParams, [field]: value } } : m));
  };

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY_MEASURES, JSON.stringify(measures));
    syncEconomicsToEngine(measures); // 更新并分发经济参数
    setIsEditing(false);
    alert('参数更新成功！系统已自动同步新单价与工效至底层仿真计算引擎。');
  };

  const getIcon = (id: string) => {
      if (id === 'cut') return <Mountain className="w-5 h-5" />;
      if (id === 'berm') return <Layers className="w-5 h-5" />;
      if (id === 'micropile') return <ShieldCheck className="w-5 h-5" />;
      return <Anchor className="w-5 h-5" />;
  };

  return (
    <div className="flex h-full bg-gray-50">
      {/* 左侧侧边栏 */}
      <div className="w-1/3 max-w-sm bg-white border-r border-gray-200 flex flex-col h-full shadow-sm z-10">
        <div className="p-5 border-b border-gray-200 bg-white sticky top-0">
          <h2 className="text-xl font-bold text-gray-800 flex items-center mb-1">
            <Hammer className="w-6 h-6 mr-2 text-indigo-600" />
            边坡加固措施库
          </h2>
          <p className="text-xs text-gray-500">结构理论、施工参数与经济计算基准</p>
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
            
            {/* Header */}
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
                        <FileText className="w-5 h-5 mr-2 text-indigo-600" />
                        系统仿真算法计算参数
                    </h2>
                    <div className="space-y-4">
                        <div className="border border-emerald-100 bg-emerald-50/30 rounded-xl p-5 relative overflow-hidden">
                            {isEditing && <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg">正在编辑底层参数</div>}
                            <h3 className="text-sm font-bold text-emerald-800 flex items-center mb-3">
                                <Clock className="w-4 h-4 mr-2" /> 经济与工期计算基准 (Economics Config)
                            </h3>
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
                                <span className="font-bold text-xs uppercase mb-1 block">模块联动计算逻辑：</span>
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

export default SlopeMeasureLibrary;