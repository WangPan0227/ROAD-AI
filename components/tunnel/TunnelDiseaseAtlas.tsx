import React, { useState, useEffect } from 'react';
import { AlertTriangle, Activity, TrendingDown, Layers, FileJson, ShieldAlert, Edit3, Save, X } from 'lucide-react';

const STORAGE_KEY_DISEASE = 'roadbedguard_tunnel_disease_matrix';

const DEFAULT_MATRIX = [
  {
    level: 1, id: 'LEVEL_I', name: 'Ⅰ级：弹性/轻微受损 (Minor Damage)', color: 'emerald',
    features: '二衬表面出现微小干缩裂缝或温度裂缝，无渗漏水，未贯通。敲击无空鼓声。',
    mechanism: '围岩压力极小或结构具有足够的安全储备。裂隙未削弱有效承载截面，整体处于弹性工作阶段，无需特殊处治。',
    schema: { level: 1, max_deep_rate: 0.30, allows_debris: false }
  },
  {
    level: 2, id: 'LEVEL_II', name: 'Ⅱ级：中度损伤 (Moderate Damage)', color: 'yellow',
    features: '表层裂缝进一步发育，裂缝宽度 1-3mm，深度达到衬砌厚度的 30%-50%。局部伴随轻微渗漏或结晶。',
    mechanism: '受压区应力集中，拉应变超限导致裂缝向内延伸。有效抗压/抗剪截面积开始被削弱，结构刚度轻微退化，建议加强观测或表面封闭。',
    schema: { level: 2, max_deep_rate: 0.50, allows_debris: false }
  },
  {
    level: 3, id: 'LEVEL_III', name: 'Ⅲ级：严重损伤 (Severe Damage)', color: 'orange',
    features: '裂缝深度达到衬砌厚度的 50%-70%，甚至形成贯通裂缝；出现错台、拱顶沉降或边墙内挤现象，裂缝宽度 > 3mm。',
    mechanism: '围岩偏压或松动圈扩大导致围岩压力远超设计值。结构截面严重削弱，受力钢筋可能已屈服，承载力大幅下降，需立即采取结构性加固干预。',
    schema: { level: 3, max_deep_rate: 0.70, allows_debris: false }
  },
  {
    level: 4, id: 'LEVEL_IV', name: 'Ⅳ级：灾难性破坏 (Catastrophic)', color: 'red',
    features: '裂缝深度 > 70%，大面积压碎剥落。特别是【拱顶出现大块掉块或背后存在严重脱空空洞】。',
    mechanism: '背后脱空导致围岩与衬砌脱离接触，局部受力急剧恶化形成“集中荷载点”或完全丧失承载力。随时存在大面积坍塌风险，触发系统最高等级红色预警。',
    schema: { level: 4, max_deep_rate: 99.99, allows_debris: true }
  }
];

const colorMap: Record<string, any> = {
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', icon: 'text-emerald-500' },
  yellow: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800', icon: 'text-yellow-600' },
  orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800', icon: 'text-orange-500' },
  red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', icon: 'text-red-600' },
};

const TunnelDiseaseAtlas: React.FC = () => {
  const [matrix, setMatrix] = useState<any[]>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_DISEASE) : null;
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {
        console.error("Failed to parse saved tunnel disease matrix", e);
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
    alert('隧道病害判定阈值更新成功！系统预警逻辑已同步至仿真引擎。');
  };

  const updateSchema = (levelId: string, field: string, value: number | boolean) => {
    setMatrix(prev => prev.map(m => m.id === levelId ? { ...m, schema: { ...m.schema, [field]: value } } : m));
  };

  if (matrix.length === 0) return null;

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-hidden">
      <div className="bg-white border-b border-gray-200 px-8 py-6 flex justify-between items-center shadow-sm z-10 flex-shrink-0">
        <div>
            <div className="flex items-center space-x-3 mb-2">
                <span className="px-2 py-1 bg-slate-100 text-slate-700 text-[10px] font-black tracking-wider rounded border border-slate-200 uppercase">
                    洞身病害指标配置
                </span>
            </div>
            <h2 className="text-2xl font-black text-gray-800 flex items-center">
                <AlertTriangle className="w-7 h-7 mr-3 text-slate-800" />
                隧道二次衬砌病害与损伤指标图谱
            </h2>
            <p className="text-sm text-gray-500 mt-2 max-w-3xl">
                将表观检查获取的 <span className="font-bold text-red-600 mx-1">裂缝深度比 (Deep-Rate)</span> 和 <span className="font-bold text-orange-600 mx-1">脱空/掉块状态</span> 精准映射为底层引擎的预警等级。修改此处的区间阈值将直接干预仿真工作台的健康度评判。
            </p>
        </div>
        
        <div className="flex space-x-3">
            {isEditing ? (
                <>
                    <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-200 flex items-center"><X className="w-4 h-4 mr-1"/> 取消</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-bold hover:bg-slate-700 shadow flex items-center"><Save className="w-4 h-4 mr-1"/> 保存并同步引擎</button>
                </>
            ) : (
                <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-bold hover:bg-indigo-100 border border-indigo-200 flex items-center"><Edit3 className="w-4 h-4 mr-2"/> 编辑判定阈值</button>
            )}
            <button onClick={() => setShowDeveloperMode(!showDeveloperMode)} className={`px-4 py-2 rounded-lg text-sm font-bold border flex items-center ${showDeveloperMode ? 'bg-slate-800 text-white border-slate-700' : 'bg-white text-gray-600 border-gray-300'}`}>
                <FileJson className="w-4 h-4 mr-2" /> {showDeveloperMode ? '关闭底层 Schema' : '查看数据 Schema'}
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 max-w-7xl mx-auto">
            {matrix.map((item) => {
                const theme = colorMap[item.color];
                return (
                    <div key={item.id} className={`bg-white rounded-2xl shadow-sm border ${isEditing ? 'border-slate-400 ring-2 ring-slate-100' : theme.border} overflow-hidden hover:shadow-lg transition-all flex flex-col relative`}>
                        <div className={`${theme.bg} px-6 py-4 flex justify-between items-center border-b ${theme.border}`}>
                            <h3 className={`text-lg font-black ${theme.text} flex items-center`}><ShieldAlert className={`w-5 h-5 mr-2 ${theme.icon}`} /> {item.name}</h3>
                        </div>
                        <div className="p-6 flex-1 flex flex-col space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center"><Layers className="w-3 h-3 mr-1" /> 表观破坏形态</h4>
                                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100">{item.features}</p>
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center"><Activity className="w-3 h-3 mr-1" /> 底层力学演化机理</h4>
                                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100">{item.mechanism}</p>
                                </div>
                            </div>
                            <div className="border-t border-gray-100 pt-6 mt-auto">
                                <h4 className="text-sm font-black text-gray-800 mb-4 flex items-center"><TrendingDown className="w-4 h-4 mr-2 text-slate-600" /> 引擎研判触发上限 (Threshold)</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                                        <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">裂缝深度比上限 (Deep-Rate)</div>
                                        <div className="flex items-center space-x-2">
                                            <span className="text-sm font-bold text-gray-500">&lt;</span>
                                            {isEditing ? (
                                                <input type="number" step="0.05" className="w-20 bg-white border border-slate-300 rounded p-1 text-slate-800 font-bold text-center" value={item.schema.max_deep_rate} onChange={e => updateSchema(item.id, 'max_deep_rate', parseFloat(e.target.value))} />
                                            ) : (
                                                <span className="text-2xl font-black text-slate-800 font-mono">{((item.schema?.max_deep_rate ?? 0) * 100).toFixed(0)}%</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="bg-red-50 border border-red-100 rounded-lg p-4 flex flex-col justify-center">
                                        <div className="text-[10px] font-bold text-red-500 uppercase mb-1">是否允许脱空/掉块</div>
                                        <div className="text-sm font-bold text-red-800 mt-1">
                                            {item.schema.allows_debris ? '✅ 包含掉块/脱空工况' : '❌ 无掉块/脱空'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {showDeveloperMode && (
                            <div className="absolute inset-0 bg-slate-900/95 p-6 flex flex-col z-20">
                                <div className="flex justify-between items-center mb-4 border-b border-slate-600 pb-1">
                                    <h4 className="text-emerald-400 font-mono text-sm font-bold">diagnostic_schema.json</h4>
                                </div>
                                <pre className="text-emerald-300 font-mono text-sm whitespace-pre-wrap">
{`{
  "diagnosis_id": "${item.id}",
  "trigger_condition": {
    "metric": "deep_rate",
    "operator": "<",
    "value": ${(item.schema?.max_deep_rate ?? 0).toFixed(2)}
  },
  "fatal_flag": {
    "has_debris": ${item.schema.allows_debris}
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

export default TunnelDiseaseAtlas;