import React, { useState, useEffect } from 'react';
import { AlertTriangle, Layers, TrendingDown, Zap, FileJson, ShieldAlert, Mountain, Edit3, Save, X } from 'lucide-react';

const STORAGE_KEY_DISEASE = 'roadbedguard_slope_disease_matrix';

const DEFAULT_MATRIX = [
  {
    level: 1, id: 'LEVEL_I', name: 'Ⅰ级病害：轻微变形 (微裂期)', color: 'emerald',
    features: '坡面局部出现细小裂纹，无明显整体变形，排水设施基本完好。',
    crackScope: '裂缝宽度 < 1cm，无贯通，无明显错断台阶。',
    geometry: '维持原状几何，不引入张裂缝。',
    schema: { level: 1, c_factor: 0.95, phi_factor: 0.98, crack_depth: 0, add_water_pressure: false }
  },
  {
    level: 2, id: 'LEVEL_II', name: 'Ⅱ级病害：中度损伤 (发展期)', color: 'yellow',
    features: '坡顶出现明显的弧形张裂缝，坡脚可能伴随轻微鼓胀，地表水可能沿裂缝下渗。',
    crackScope: '主裂缝宽 1~5cm，深度 < 1.5m，局部错台 < 5cm。',
    geometry: '强制在坡顶引入张裂缝 (裂缝内 c=0, φ=0)。',
    schema: { level: 2, c_factor: 0.80, phi_factor: 0.90, crack_depth: 1.5, add_water_pressure: false }
  },
  {
    level: 3, id: 'LEVEL_III', name: 'Ⅲ级病害：严重破坏 (剧滑期)', color: 'orange',
    features: '坡体整体下沉明显，后缘出现大错台(拉坡)，坡脚挡土墙等支护开裂或被剪断。',
    crackScope: '主裂缝宽 > 5cm，深度 > 2.5m，裂缝高度互联贯通，形成滑动边界。',
    geometry: '引入深度张裂缝；降雨工况下自动引入静水压力(水冲力)。',
    schema: { level: 3, c_factor: 0.55, phi_factor: 0.75, crack_depth: 2.5, add_water_pressure: true }
  },
  {
    level: 4, id: 'LEVEL_IV', name: 'Ⅳ级病害：灾难性失稳 (破坏期)', color: 'red',
    features: '滑坡已经发生剧烈滑动，土体结构完全解体，原有地貌彻底破坏。',
    crackScope: '大面积垮塌、碎石流或泥石流形态，后壁完全暴露。',
    geometry: '原有几何边界失效，需重新输入垮塌后的残余剖面坐标。',
    schema: { level: 4, c_factor: 0.25, phi_factor: 0.65, crack_depth: 5.0, add_water_pressure: true }
  }
];

const colorMap: Record<string, any> = {
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', icon: 'text-emerald-500', badge: 'bg-emerald-100 text-emerald-800' },
  yellow: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800', icon: 'text-yellow-600', badge: 'bg-yellow-100 text-yellow-800' },
  orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800', icon: 'text-orange-500', badge: 'bg-orange-100 text-orange-800' },
  red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', icon: 'text-red-600', badge: 'bg-red-100 text-red-800' },
};

const SlopeDiseaseAtlas: React.FC = () => {
  const [matrix, setMatrix] = useState<any[]>([]);
  const [showDeveloperMode, setShowDeveloperMode] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY_DISEASE);
    if (saved) {
      setMatrix(JSON.parse(saved));
    } else {
      setMatrix(DEFAULT_MATRIX);
      localStorage.setItem(STORAGE_KEY_DISEASE, JSON.stringify(DEFAULT_MATRIX));
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY_DISEASE, JSON.stringify(matrix));
    setIsEditing(false);
    alert('病害等级规则更新成功！新的劣化系数已同步至底层仿真引擎。');
  };

  const updateSchema = (levelId: string, field: string, value: number | boolean) => {
    setMatrix(prev => prev.map(m => m.id === levelId ? { ...m, schema: { ...m.schema, [field]: value } } : m));
  };

  const updateText = (levelId: string, field: string, value: string) => {
    setMatrix(prev => prev.map(m => m.id === levelId ? { ...m, [field]: value } : m));
  };

  if (matrix.length === 0) return null;

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-hidden">
      {/* 头部区域 */}
      <div className="bg-white border-b border-gray-200 px-8 py-6 flex justify-between items-center shadow-sm z-10 flex-shrink-0">
        <div>
            <div className="flex items-center space-x-3 mb-2">
                <span className="px-2 py-1 bg-red-50 text-red-600 text-[10px] font-black tracking-wider rounded border border-red-100 uppercase">
                    应急抢修标准模块
                </span>
                <span className="text-xs text-gray-400 font-mono">v2.0 Data Engine</span>
            </div>
            <h2 className="text-2xl font-black text-gray-800 flex items-center">
                <AlertTriangle className="w-7 h-7 mr-3 text-red-500" />
                灾损与病害等级劣化图谱
            </h2>
            <p className="text-sm text-gray-500 mt-2 max-w-3xl">
                全局参数劣化规则库。将现场表观特征转化为底层力学引擎可识别的
                <span className="font-bold text-gray-700 mx-1">参数折减系数</span> 
                与 <span className="font-bold text-gray-700 mx-1">几何边界约束</span>。修改此处参数将直接影响【仿真模拟分析】的计算结果。
            </p>
        </div>
        
        <div className="flex space-x-3">
            {isEditing ? (
                <>
                    <button onClick={() => setIsEditing(false)} className="flex items-center px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-200 transition-all"><X className="w-4 h-4 mr-1"/> 取消</button>
                    <button onClick={handleSave} className="flex items-center px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-bold hover:bg-red-600 shadow transition-all"><Save className="w-4 h-4 mr-1"/> 保存并同步引擎</button>
                </>
            ) : (
                <button onClick={() => setIsEditing(true)} className="flex items-center px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-bold hover:bg-indigo-100 transition-all border border-indigo-200"><Edit3 className="w-4 h-4 mr-2"/> 编辑折减规则</button>
            )}
            <button 
                onClick={() => setShowDeveloperMode(!showDeveloperMode)}
                className={`flex items-center px-4 py-2 rounded-lg text-sm font-bold transition-all border ${showDeveloperMode ? 'bg-slate-800 text-white border-slate-700' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
            >
                <FileJson className="w-4 h-4 mr-2" />
                {showDeveloperMode ? '关闭底层 Schema' : '查看引擎数据 Schema'}
            </button>
        </div>
      </div>

      {/* 主体内容区 */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 max-w-7xl mx-auto">
            {matrix.map((item) => {
                const theme = colorMap[item.color];
                return (
                    <div key={item.id} className={`bg-white rounded-2xl shadow-sm border ${isEditing ? 'border-indigo-300 ring-2 ring-indigo-50' : theme.border} overflow-hidden hover:shadow-lg transition-all duration-300 relative group flex flex-col`}>
                        
                        {/* 等级头部 */}
                        <div className={`${theme.bg} px-6 py-4 flex justify-between items-center border-b ${theme.border}`}>
                            <h3 className={`text-lg font-black ${theme.text} flex items-center`}>
                                <ShieldAlert className={`w-5 h-5 mr-2 ${theme.icon}`} />
                                {item.name}
                            </h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${theme.badge}`}>损伤因子 Level {item.level}</span>
                        </div>

                        {/* 内容体 */}
                        <div className="p-6 flex-1 flex flex-col space-y-6">
                            {/* 视觉识别特征 */}
                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center"><Mountain className="w-3 h-3 mr-1" /> 表观形态特征</h4>
                                    {isEditing ? (
                                        <textarea className="w-full text-sm text-gray-700 bg-white p-2 rounded border border-indigo-200 focus:ring-indigo-500 focus:border-indigo-500" rows={2} value={item.features} onChange={(e) => updateText(item.id, 'features', e.target.value)} />
                                    ) : (
                                        <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100">{item.features}</p>
                                    )}
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center"><Zap className="w-3 h-3 mr-1" /> 裂缝破坏范围</h4>
                                    {isEditing ? (
                                        <textarea className="w-full text-sm text-gray-700 bg-white p-2 rounded border border-indigo-200 focus:ring-indigo-500 focus:border-indigo-500" rows={2} value={item.crackScope} onChange={(e) => updateText(item.id, 'crackScope', e.target.value)} />
                                    ) : (
                                        <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100">{item.crackScope}</p>
                                    )}
                                </div>
                            </div>

                            <div className="border-t border-gray-100 pt-6 mt-auto">
                                <h4 className="text-sm font-black text-gray-800 mb-4 flex items-center">
                                    <TrendingDown className="w-4 h-4 mr-2 text-blue-600" />
                                    向仿真引擎输出的劣化核心参数 (Schema)
                                </h4>
                                
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="border border-red-100 bg-red-50/50 rounded-lg p-3">
                                        <div className="text-[10px] font-bold text-red-400 uppercase mb-1">c 值保留比例 (0~1)</div>
                                        {isEditing ? (
                                            <input type="number" step="0.05" min="0" max="1" className="w-full bg-white border border-red-300 rounded p-1 text-red-700 font-bold" value={item.schema.c_factor} onChange={(e) => updateSchema(item.id, 'c_factor', parseFloat(e.target.value))} />
                                        ) : (
                                            <div className="text-lg font-black text-red-700 font-mono">{Math.round(item.schema.c_factor * 100)}%</div>
                                        )}
                                    </div>
                                    <div className="border border-orange-100 bg-orange-50/50 rounded-lg p-3">
                                        <div className="text-[10px] font-bold text-orange-400 uppercase mb-1">φ 值保留比例 (0~1)</div>
                                        {isEditing ? (
                                            <input type="number" step="0.05" min="0" max="1" className="w-full bg-white border border-orange-300 rounded p-1 text-orange-700 font-bold" value={item.schema.phi_factor} onChange={(e) => updateSchema(item.id, 'phi_factor', parseFloat(e.target.value))} />
                                        ) : (
                                            <div className="text-lg font-black text-orange-700 font-mono">{Math.round(item.schema.phi_factor * 100)}%</div>
                                        )}
                                    </div>
                                    <div className="border border-slate-200 bg-slate-50 rounded-lg p-3">
                                        <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">张裂缝深度 (m)</div>
                                        {isEditing ? (
                                            <input type="number" step="0.5" min="0" className="w-full bg-white border border-slate-300 rounded p-1 text-slate-700 font-bold" value={item.schema.crack_depth} onChange={(e) => updateSchema(item.id, 'crack_depth', parseFloat(e.target.value))} />
                                        ) : (
                                            <div className="text-lg font-black text-slate-700 font-mono">{item.schema.crack_depth} m</div>
                                        )}
                                    </div>
                                    <div className="border border-blue-100 bg-blue-50/50 rounded-lg p-3">
                                        <div className="text-[10px] font-bold text-blue-400 uppercase mb-1">裂缝是否考虑水推力</div>
                                        {isEditing ? (
                                            <select className="w-full bg-white border border-blue-300 rounded p-1 text-blue-700 font-bold text-sm" value={item.schema.add_water_pressure ? 'true' : 'false'} onChange={(e) => updateSchema(item.id, 'add_water_pressure', e.target.value === 'true')}>
                                                <option value="true">是 (True)</option>
                                                <option value="false">否 (False)</option>
                                            </select>
                                        ) : (
                                            <div className="text-lg font-black text-blue-700 font-mono">{item.schema.add_water_pressure ? 'True' : 'False'}</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 开发者底层 Schema 遮罩层 */}
                        {showDeveloperMode && (
                            <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-sm p-6 flex flex-col z-20 animate-in fade-in duration-200">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="text-emerald-400 font-mono text-sm font-bold border-b border-emerald-400/30 pb-1">payload_schema.json</h4>
                                    <span className="text-slate-400 text-xs">实时映射引擎结构</span>
                                </div>
                                <pre className="text-emerald-300 font-mono text-sm whitespace-pre-wrap flex-1 overflow-y-auto">
{`{
  "damage_level": ${item.schema.level},
  "degradation_factors": {
    "c_multiplier": ${item.schema.c_factor.toFixed(2)},
    "phi_multiplier": ${item.schema.phi_factor.toFixed(2)}
  },
  "geometry_modifiers": {
    "tension_crack_depth": ${item.schema.crack_depth},
    "apply_hydrostatic_pressure": ${item.schema.add_water_pressure}
  }
}`}
                                </pre>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
      </div>
    </div>
  );
};

export default SlopeDiseaseAtlas;