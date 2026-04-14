import React, { useState, useEffect } from 'react';
import { AlertTriangle, Activity, TrendingDown, Layers, FileJson, ShieldAlert, Edit3, Save, X } from 'lucide-react';

const STORAGE_KEY_DISEASE = 'roadbedguard_bridge_disease_matrix';

const DEFAULT_MATRIX = [
  {
    level: 1, id: 'LEVEL_I', name: 'Ⅰ级：弹性/轻微损伤 (Minor Damage)', color: 'emerald',
    features: '受撞击面出现轻微擦痕，墩柱表面可能出现细微受拉裂缝，混凝土保护层基本完好或局部极轻微剥落。',
    mechanism: '碰撞能量较低，等效静力尚未超过墩柱的屈服抗力。纵向钢筋和螺旋箍筋均处于弹性工作阶段，结构卸载后残余变形可忽略，不影响正常使用。',
    schema: { level: 1, min_alpha: 0.00, max_alpha: 0.02 }
  },
  {
    level: 2, id: 'LEVEL_II', name: 'Ⅱ级：中等塑性损伤 (Moderate Plasticity)', color: 'orange',
    features: '撞击侧保护层大面积剥落，受压区核心混凝土开始压碎；受拉侧出现明显贯通裂缝，部分纵向受力钢筋暴露。',
    mechanism: '冲击动能超过弹性极限吸收能力，结构进入弹塑性耗能阶段。受拉侧钢筋屈服，塑性铰区域开始发育，结构产生不可逆的残余位移，但仍具备一定的竖向承载力。',
    schema: { level: 2, min_alpha: 0.02, max_alpha: 0.10 }
  },
  {
    level: 3, id: 'LEVEL_III', name: 'Ⅲ级：极限破坏/倒塌风险 (Severe/Collapse)', color: 'red',
    features: '核心混凝土大范围崩裂、脱落，纵向钢筋严重屈曲鼓起甚至拉断，螺旋箍筋崩断。墩柱发生肉眼可见的巨大倾斜。',
    mechanism: '吸收能量达到或超过极限耗能能力。塑性铰完全形成并丧失转动能力，截面抗剪承载力急剧退化，竖向承载力急剧下降，桥梁面临局部或整体坍塌的极高风险。',
    schema: { level: 3, min_alpha: 0.10, max_alpha: 99.99 }
  }
];

const colorMap: Record<string, any> = {
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', icon: 'text-emerald-500', badge: 'bg-emerald-100 text-emerald-800' },
  orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800', icon: 'text-orange-500', badge: 'bg-orange-100 text-orange-800' },
  red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', icon: 'text-red-600', badge: 'bg-red-100 text-red-800' },
};

const BridgeDiseaseAtlas: React.FC = () => {
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
    alert('桥梁损伤判定阈值更新成功！系统预警逻辑已同步至仿真引擎。');
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
                <span className="px-2 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black tracking-wider rounded border border-indigo-100 uppercase">
                    动力学损伤诊断配置
                </span>
            </div>
            <h2 className="text-2xl font-black text-gray-800 flex items-center">
                <AlertTriangle className="w-7 h-7 mr-3 text-indigo-600" />
                桥梁双柱墩受冲病害与损伤指标图谱
            </h2>
            <p className="text-sm text-gray-500 mt-2 max-w-3xl">
                将底层双折线引擎计算输出的
                <span className="font-bold text-indigo-700 mx-1">无量纲损伤度指标 (αD)</span> 
                精准映射为真实的工程表观破坏形态。修改此处的阈值将直接改变仿真工作台的预警触发时机。
            </p>
        </div>
        
        <div className="flex space-x-3">
            {isEditing ? (
                <>
                    <button onClick={() => setIsEditing(false)} className="flex items-center px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-200"><X className="w-4 h-4 mr-1"/> 取消</button>
                    <button onClick={handleSave} className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 shadow"><Save className="w-4 h-4 mr-1"/> 保存并同步引擎</button>
                </>
            ) : (
                <button onClick={() => setIsEditing(true)} className="flex items-center px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-bold hover:bg-indigo-100 border border-indigo-200"><Edit3 className="w-4 h-4 mr-2"/> 编辑判定阈值</button>
            )}
            <button 
                onClick={() => setShowDeveloperMode(!showDeveloperMode)}
                className={`flex items-center px-4 py-2 rounded-lg text-sm font-bold border ${showDeveloperMode ? 'bg-slate-800 text-white border-slate-700' : 'bg-white text-gray-600 border-gray-300'}`}
            >
                <FileJson className="w-4 h-4 mr-2" />
                {showDeveloperMode ? '关闭底层 Schema' : '查看数据 Schema'}
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {matrix.map((item, idx) => {
                const theme = colorMap[item.color] || colorMap.emerald;
                return (
                    <div key={item.id || `level-${idx}`} className={`bg-white rounded-2xl shadow-sm border ${isEditing ? 'border-indigo-300 ring-2 ring-indigo-50' : theme.border} overflow-hidden hover:shadow-lg transition-all relative flex flex-col`}>
                        <div className={`${theme.bg} px-6 py-4 flex justify-between items-center border-b ${theme.border}`}>
                            <h3 className={`text-lg font-black ${theme.text} flex items-center`}>
                                <ShieldAlert className={`w-5 h-5 mr-2 ${theme.icon}`} /> {item.name}
                            </h3>
                        </div>
                        <div className="p-6 flex-1 flex flex-col space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center"><Layers className="w-3 h-3 mr-1" /> 表观破坏形态</h4>
                                    {isEditing ? <textarea className="w-full text-sm p-2 rounded border border-indigo-200" rows={3} value={item.features} onChange={e => updateText(item.id, 'features', e.target.value)} /> : <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100">{item.features}</p>}
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center"><Activity className="w-3 h-3 mr-1" /> 底层力学演化机理</h4>
                                    {isEditing ? <textarea className="w-full text-sm p-2 rounded border border-indigo-200" rows={4} value={item.mechanism} onChange={e => updateText(item.id, 'mechanism', e.target.value)} /> : <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100">{item.mechanism}</p>}
                                </div>
                            </div>
                            <div className="border-t border-gray-100 pt-6 mt-auto">
                                <h4 className="text-sm font-black text-gray-800 mb-4 flex items-center">
                                    <TrendingDown className="w-4 h-4 mr-2 text-indigo-600" /> 引擎研判触发阈值 (αD)
                                </h4>
                                <div className="bg-indigo-50/50 border border-indigo-100 rounded-lg p-4">
                                    <div className="text-[10px] font-bold text-indigo-500 uppercase mb-1">损伤度指标 αD 起始区间</div>
                                    <p className="text-[9px] text-gray-400 mb-3 leading-tight">当计算出的等效位移与墩径比值落入此区间时，触发该级报警。</p>
                                    <div className="flex items-center space-x-2">
                                        <span className="text-sm font-bold text-gray-500">αD ≥</span>
                                        {isEditing ? (
                                            <input type="number" step="0.01" min="0" className="w-20 bg-white border border-indigo-300 rounded p-1 text-indigo-700 font-bold text-center" value={item.schema?.min_alpha || 0} onChange={e => updateSchema(item.id, 'min_alpha', parseFloat(e.target.value))} />
                                        ) : (
                                            <span className="text-2xl font-black text-indigo-700 font-mono">{(item.schema?.min_alpha || 0).toFixed(2)}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {showDeveloperMode && (
                            <div className="absolute inset-0 bg-slate-900/95 p-6 flex flex-col z-20">
                                <div className="flex justify-between items-center mb-4 border-b border-indigo-400/30 pb-1">
                                    <h4 className="text-indigo-400 font-mono text-sm font-bold">diagnostic_schema.json</h4>
                                </div>
                                <pre className="text-indigo-300 font-mono text-sm whitespace-pre-wrap flex-1 overflow-y-auto">
{`{
  "diagnosis_id": "${item.id}",
  "trigger_condition": {
    "metric": "alpha_D",
    "operator": ">=",
    "value": ${(item.schema?.min_alpha || 0).toFixed(2)}
  },
  "structural_state": {
    "plastic_hinge": ${(item.schema?.min_alpha || 0) >= 0.1 ? 'true' : 'false'},
    "steel_yield": ${(item.schema?.min_alpha || 0) >= 0.02 ? 'true' : 'false'}
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

export default BridgeDiseaseAtlas;
