import React, { useState, useEffect } from 'react';
import { AlertTriangle, CloudRain, TrendingDown, Layers, FileJson, ShieldAlert, Edit3, Save, X } from 'lucide-react';

const STORAGE_KEY_DISEASE = 'roadbedguard_roadbed_disease_matrix';

const DEFAULT_MATRIX = [
  {
    level: 1, id: 'LEVEL_I', name: 'Ⅰ级病害：轻微病害 (微细裂缝)', color: 'emerald',
    features: '路面出现少量微细裂缝或接缝轻微错台，表面基本完整。',
    crackScope: '雨水入渗能力较弱，大部分降雨仍可通过路面横坡排出。路基土体压实度基本保持设计状态。',
    schema: { level: 1, runoff_coeff: 0.60, compaction_loss: 0.95 }
  },
  {
    level: 2, id: 'LEVEL_II', name: 'Ⅱ级病害：中度病害 (网裂/局部坑槽)', color: 'yellow',
    features: '路面出现明显龟裂、网裂，伴随局部轻度坑槽或沉陷，路肩挡水。',
    crackScope: '表面封闭结构被打破，雨水下渗通道开放，形成局部滞水层。上部路床压实度受水分浸泡开始出现不可逆折减。',
    schema: { level: 2, runoff_coeff: 0.30, compaction_loss: 0.85 }
  },
  {
    level: 3, id: 'LEVEL_III', name: 'Ⅲ级病害：严重病害 (大面积翻浆/脱空)', color: 'orange',
    features: '路面大面积破损、唧泥、翻浆冒泥，路基发生显著不均匀沉降或脱空。',
    crackScope: '降雨几乎全部转化为垂直入渗，径流能力丧失。路基持力层处于“泡水软化”状态，压实骨架遭到严重破坏。',
    schema: { level: 3, runoff_coeff: 0.05, compaction_loss: 0.70 }
  },
  {
    level: 4, id: 'LEVEL_IV', name: 'Ⅳ级病害：灾难性水毁 (路基掏空)', color: 'red',
    features: '边坡冲刷淘挖导致路基侧向约束丧失，或发生管涌、深层水毁垮塌。',
    crackScope: '水分在土体内部形成贯通流道，细粒土大量流失，宏观压实度断崖式暴跌，剩余承载力几近枯竭。',
    schema: { level: 4, runoff_coeff: 0.00, compaction_loss: 0.40 }
  }
];

const colorMap: Record<string, any> = {
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', icon: 'text-emerald-500', badge: 'bg-emerald-100 text-emerald-800' },
  yellow: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800', icon: 'text-yellow-600', badge: 'bg-yellow-100 text-yellow-800' },
  orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800', icon: 'text-orange-500', badge: 'bg-orange-100 text-orange-800' },
  red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', icon: 'text-red-600', badge: 'bg-red-100 text-red-800' },
};

const RoadbedDiseaseAtlas: React.FC = () => {
  const [matrix, setMatrix] = useState<any[]>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_DISEASE) : null;
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {
        console.error("Failed to parse saved roadbed disease matrix", e);
      }
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_DISEASE, JSON.stringify(DEFAULT_MATRIX));
    }
    return DEFAULT_MATRIX;
  });
  const [showDeveloperMode, setShowDeveloperMode] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {}, []);

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY_DISEASE, JSON.stringify(matrix));
    setIsEditing(false);
    alert('路基病害参数更新成功！径流系数与压实损伤已同步至底层水力学引擎。');
  };

  const updateSchema = (levelId: string, field: string, value: number) => {
    setMatrix(prev => prev.map(m => m.id === levelId ? { ...m, schema: { ...m.schema, [field]: value } } : m));
  };

  const updateText = (levelId: string, field: string, value: string) => {
    setMatrix(prev => prev.map(m => m.id === levelId ? { ...m, [field]: value } : m));
  };

  if (matrix.length === 0) return null;

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-hidden">
      <div className="bg-white border-b border-gray-200 px-8 py-6 flex justify-between items-center shadow-sm z-10 flex-shrink-0">
        <div>
            <div className="flex items-center space-x-3 mb-2">
                <span className="px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-black tracking-wider rounded border border-blue-100 uppercase">
                    路基水力学边界配置
                </span>
            </div>
            <h2 className="text-2xl font-black text-gray-800 flex items-center">
                <AlertTriangle className="w-7 h-7 mr-3 text-blue-500" />
                路基表观病害与水力劣化图谱
            </h2>
            <p className="text-sm text-gray-500 mt-2 max-w-3xl">
                将路面的表观病害特征，量化映射为底层单柱模型可识别的
                <span className="font-bold text-blue-700 mx-1">地表径流系数 (入渗边界)</span> 
                与 <span className="font-bold text-orange-700 mx-1">初始压实度损伤比例</span>。修改此处将直接改变仿真的沉降速率。
            </p>
        </div>
        
        <div className="flex space-x-3">
            {isEditing ? (
                <>
                    <button onClick={() => setIsEditing(false)} className="flex items-center px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-200"><X className="w-4 h-4 mr-1"/> 取消</button>
                    <button onClick={handleSave} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 shadow"><Save className="w-4 h-4 mr-1"/> 保存并同步引擎</button>
                </>
            ) : (
                <button onClick={() => setIsEditing(true)} className="flex items-center px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-bold hover:bg-indigo-100 border border-indigo-200"><Edit3 className="w-4 h-4 mr-2"/> 编辑劣化规则</button>
            )}
            <button 
                onClick={() => setShowDeveloperMode(!showDeveloperMode)}
                className={`flex items-center px-4 py-2 rounded-lg text-sm font-bold border ${showDeveloperMode ? 'bg-slate-800 text-white border-slate-700' : 'bg-white text-gray-600 border-gray-300'}`}
            >
                <FileJson className="w-4 h-4 mr-2" />
                {showDeveloperMode ? '关闭底层 Schema' : '查看引擎数据 Schema'}
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 max-w-7xl mx-auto">
            {matrix.map((item) => {
                const theme = colorMap[item.color] || colorMap.emerald;
                return (
                    <div key={item.id} className={`bg-white rounded-2xl shadow-sm border ${isEditing ? 'border-blue-300 ring-2 ring-blue-50' : theme.border} overflow-hidden hover:shadow-lg transition-all relative flex flex-col`}>
                        <div className={`${theme.bg} px-6 py-4 flex justify-between items-center border-b ${theme.border}`}>
                            <h3 className={`text-lg font-black ${theme.text} flex items-center`}>
                                <ShieldAlert className={`w-5 h-5 mr-2 ${theme.icon}`} /> {item.name}
                            </h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${theme.badge}`}>病害等级 {item.level}</span>
                        </div>
                        <div className="p-6 flex-1 flex flex-col space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center"><Layers className="w-3 h-3 mr-1" /> 表观形态与机理</h4>
                                    {isEditing ? <textarea className="w-full text-sm p-2 rounded border border-blue-200" rows={2} value={item.features} onChange={e => updateText(item.id, 'features', e.target.value)} /> : <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100">{item.features}</p>}
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center"><CloudRain className="w-3 h-3 mr-1" /> 水分入渗演化规律</h4>
                                    {isEditing ? <textarea className="w-full text-sm p-2 rounded border border-blue-200" rows={2} value={item.crackScope} onChange={e => updateText(item.id, 'crackScope', e.target.value)} /> : <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100">{item.crackScope}</p>}
                                </div>
                            </div>
                            <div className="border-t border-gray-100 pt-6 mt-auto">
                                <h4 className="text-sm font-black text-gray-800 mb-4 flex items-center">
                                    <TrendingDown className="w-4 h-4 mr-2 text-blue-600" /> 向仿真引擎输出的水力学参数 (Schema)
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="border border-blue-100 bg-blue-50/50 rounded-lg p-3">
                                        <div className="text-[10px] font-bold text-blue-500 uppercase mb-1">地表径流系数 Runoff (0~1)</div>
                                        <p className="text-[9px] text-gray-400 mb-2 leading-tight">数值越小，代表雨水排走越少，全部灌入路基内部。</p>
                                        {isEditing ? (
                                            <input type="number" step="0.05" min="0" max="1" className="w-full bg-white border border-blue-300 rounded p-1 text-blue-700 font-bold" value={item.schema.runoff_coeff} onChange={e => updateSchema(item.id, 'runoff_coeff', parseFloat(e.target.value))} />
                                        ) : (
                                            <div className="text-xl font-black text-blue-700 font-mono">{item.schema.runoff_coeff.toFixed(2)}</div>
                                        )}
                                    </div>
                                    <div className="border border-orange-100 bg-orange-50/50 rounded-lg p-3">
                                        <div className="text-[10px] font-bold text-orange-500 uppercase mb-1">初始压实度损伤保留比例 (0~1)</div>
                                        <p className="text-[9px] text-gray-400 mb-2 leading-tight">病害造成的不可逆结构松散，1.0为无损。</p>
                                        {isEditing ? (
                                            <input type="number" step="0.05" min="0" max="1" className="w-full bg-white border border-orange-300 rounded p-1 text-orange-700 font-bold" value={item.schema.compaction_loss} onChange={e => updateSchema(item.id, 'compaction_loss', parseFloat(e.target.value))} />
                                        ) : (
                                            <div className="text-xl font-black text-orange-700 font-mono">{Math.round(item.schema.compaction_loss * 100)}%</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {showDeveloperMode && (
                            <div className="absolute inset-0 bg-slate-900/95 p-6 flex flex-col z-20">
                                <div className="flex justify-between items-center mb-4 border-b border-emerald-400/30 pb-1">
                                    <h4 className="text-emerald-400 font-mono text-sm font-bold">payload_schema.json</h4>
                                </div>
                                <pre className="text-emerald-300 font-mono text-sm whitespace-pre-wrap flex-1 overflow-y-auto">
{`{
  "disease_level": ${item.schema.level},
  "hydraulic_boundary": {
    "runoff_coefficient": ${item.schema.runoff_coeff.toFixed(2)},
    "infiltration_mode": "${item.schema.runoff_coeff < 0.2 ? 'FULL_PENETRATION' : 'PARTIAL'}"
  },
  "structural_degradation": {
    "compaction_retention": ${item.schema.compaction_loss.toFixed(2)}
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

export default RoadbedDiseaseAtlas;