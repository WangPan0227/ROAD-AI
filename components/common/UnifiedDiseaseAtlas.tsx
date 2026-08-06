import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, Layers, FileJson, ShieldAlert, Edit3, Save, X, RefreshCw,
  Zap, ArrowRight, CheckCircle2, Sliders, Cpu
} from 'lucide-react';
import { 
  DiseaseLevelSchema, 
  getScenarioDiseaseLevels, 
  saveScenarioDiseaseLevels, 
  resetScenarioDiseaseLevels,
  normalizeScenarioKey
} from '../../data/diseaseMatrixData';

export interface UnifiedDiseaseAtlasProps {
  scenarioKey: string;
  scenarioTitle: string;
  categoryName: string;
  subtitle?: string;
  availableScenarios?: { key: string; name: string }[];
  onSelectScenario?: (key: string) => void;
  onInjectAndSimulate?: (scenarioKey: string, level: DiseaseLevelSchema) => void;
}

const colorStyles: Record<string, { bg: string; border: string; text: string; badge: string; ring: string; btn: string }> = {
  emerald: {
    bg: 'bg-emerald-50/80',
    border: 'border-emerald-200',
    text: 'text-emerald-800',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    ring: 'focus:ring-emerald-400',
    btn: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'
  },
  amber: {
    bg: 'bg-amber-50/80',
    border: 'border-amber-200',
    text: 'text-amber-800',
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
    ring: 'focus:ring-amber-400',
    btn: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-200'
  },
  orange: {
    bg: 'bg-orange-50/80',
    border: 'border-orange-200',
    text: 'text-orange-800',
    badge: 'bg-orange-100 text-orange-800 border-orange-200',
    ring: 'focus:ring-orange-400',
    btn: 'bg-orange-600 hover:bg-orange-700 text-white shadow-orange-200'
  },
  rose: {
    bg: 'bg-rose-50/80',
    border: 'border-rose-200',
    text: 'text-rose-800',
    badge: 'bg-rose-100 text-rose-800 border-rose-200',
    ring: 'focus:ring-rose-400',
    btn: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200'
  }
};

// Friendly labels for parameter keys across all 9 scenarios
const PARAM_LABELS: Record<string, { label: string; unit?: string }> = {
  compaction_loss: { label: '压实度损耗比例', unit: '' },
  cbr_multiplier: { label: 'CBR承载力因子', unit: 'x' },
  c_factor: { label: '粘聚力折减系数', unit: 'x' },
  phi_factor: { label: '内摩擦角折减系数', unit: 'x' },
  crack_depth: { label: '张裂缝扩展深度', unit: 'm' },
  delta_water: { label: '墙后附加水头', unit: 'm' },
  mu_factor: { label: '基底摩擦衰减因子', unit: 'x' },
  miu_d: { label: '墩柱位移延性系数', unit: '' },
  cc_loss: { label: '保护层剥落厚度', unit: 'cm' },
  intensity_boost: { label: '设防烈度提档', unit: '度' },
  support_loss: { label: '有效支撑残余衰减', unit: 'mm' },
  rho_df: { label: '泥石流流体密度', unit: 'kg/m³' },
  v_df: { label: '泥石流龙头流速', unit: 'm/s' },
  M_boost: { label: '衬砌弯矩放大倍数', unit: 'x' },
  N_factor: { label: '衬砌有效轴力因子', unit: 'x' },
  strain_max: { label: '等效塑性应变阈值', unit: '' },
  sigma_y_factor: { label: '围岩屈服强度折减', unit: 'x' },
  void_width: { label: '壁后脱空张角', unit: '°' },
  void_factor: { label: '脱空区支撑力系数', unit: 'x' },
};

export const UnifiedDiseaseAtlas: React.FC<UnifiedDiseaseAtlasProps> = ({
  scenarioKey,
  scenarioTitle,
  categoryName,
  subtitle,
  availableScenarios,
  onSelectScenario,
  onInjectAndSimulate
}) => {
  const normKey = normalizeScenarioKey(scenarioKey);
  const [matrix, setMatrix] = useState<DiseaseLevelSchema[]>(() => getScenarioDiseaseLevels(normKey));
  const [isEditing, setIsEditing] = useState(false);
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [activeJsonIndex, setActiveJsonIndex] = useState<number>(0);
  const [injectedSuccessLevel, setInjectedSuccessLevel] = useState<number | null>(null);

  // Reload matrix when scenarioKey changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setMatrix(getScenarioDiseaseLevels(normKey));
      setIsEditing(false);
    }, 0);
    return () => clearTimeout(timer);
  }, [normKey]);

  const handleSave = () => {
    saveScenarioDiseaseLevels(normKey, matrix);
    setIsEditing(false);
    alert(`【${scenarioTitle}】病害劣化规则已保存！更新的物理参数已同步至底层仿真计算引擎。`);
  };

  const handleReset = () => {
    if (confirm(`确定要恢复【${scenarioTitle}】的病害等级默认定义与物理参数吗？`)) {
      const def = resetScenarioDiseaseLevels(normKey);
      setMatrix(def);
      setIsEditing(false);
    }
  };

  const updateText = (index: number, field: 'levelName' | 'description' | 'physicalEffects', val: string) => {
    setMatrix(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
  };

  const updateInjectedParam = (index: number, paramKey: string, val: number | boolean) => {
    setMatrix(prev => {
      const next = [...prev];
      const params = { ...next[index].injectedParameters, [paramKey]: val };
      next[index] = { ...next[index], injectedParameters: params };
      return next;
    });
  };

  const handleInjectAndRun = (levelItem: DiseaseLevelSchema) => {
    // Save current matrix first
    saveScenarioDiseaseLevels(normKey, matrix);
    
    // Write injected params to pending localStorage
    if (typeof window !== 'undefined') {
      const ts = new Date().getTime();
      localStorage.setItem(`pending_injected_disease_${normKey}`, JSON.stringify({
        level: levelItem.level,
        levelName: levelItem.levelName,
        injectedParameters: levelItem.injectedParameters,
        timestamp: ts
      }));
    }

    // Show feedback effect
    setInjectedSuccessLevel(levelItem.level);
    setTimeout(() => setInjectedSuccessLevel(null), 2500);

    // Call parent handler or dispatch window event
    if (onInjectAndSimulate) {
      onInjectAndSimulate(normKey, levelItem);
    } else {
      window.dispatchEvent(new CustomEvent('disease-inject-simulate', {
        detail: { scenarioKey: normKey, level: levelItem }
      }));
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 overflow-hidden font-sans">
      {/* Header */}
      <div className="bg-slate-950/90 border-b border-slate-800 px-6 py-5 flex flex-wrap justify-between items-center gap-4 flex-shrink-0 z-10">
        <div>
          <div className="flex items-center space-x-3 mb-1.5">
            <span className="px-2.5 py-0.5 bg-blue-500/10 text-blue-400 text-xs font-bold rounded-md border border-blue-500/20 uppercase tracking-wider">
              {categoryName} · 病害等级劣化图谱 (Tab 2)
            </span>
            {availableScenarios && availableScenarios.length > 1 && (
              <span className="text-xs text-slate-400">切换场景:</span>
            )}
          </div>
          
          <h2 className="text-xl font-black text-white flex items-center tracking-tight">
            <AlertTriangle className="w-6 h-6 mr-2.5 text-amber-400" />
            {scenarioTitle} — 4级病害演化与物理参数映射
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
            {subtitle || '将结构表观表观病害特征（裂缝、沉降、变形）精确定量映射为物理仿真计算引擎的入参，实现病害等级与【仿真计算】物理特性的 100% 动态联动。'}
          </p>
        </div>

        <div className="flex items-center space-x-2.5 flex-wrap">
          {isEditing ? (
            <>
              <button 
                onClick={() => setIsEditing(false)} 
                className="flex items-center px-3.5 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-700 transition-all border border-slate-700"
              >
                <X className="w-3.5 h-3.5 mr-1" /> 取消
              </button>
              <button 
                onClick={handleSave} 
                className="flex items-center px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-500 transition-all shadow-md shadow-blue-900/30"
              >
                <Save className="w-3.5 h-3.5 mr-1" /> 保存病害规则
              </button>
            </>
          ) : (
            <button 
              onClick={() => setIsEditing(true)} 
              className="flex items-center px-3.5 py-1.5 bg-slate-800/80 text-blue-400 hover:text-blue-300 rounded-lg text-xs font-bold hover:bg-slate-800 transition-all border border-blue-500/30"
            >
              <Edit3 className="w-3.5 h-3.5 mr-1.5" /> 编辑病害规则
            </button>
          )}

          <button 
            onClick={handleReset}
            title="重置为系统默认物理映射规则"
            className="flex items-center px-3 py-1.5 bg-slate-800/80 text-slate-400 hover:text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-all border border-slate-700"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> 重置默认
          </button>

          <button 
            onClick={() => setShowJsonModal(true)}
            className="flex items-center px-3 py-1.5 bg-slate-800/80 text-slate-300 hover:text-white rounded-lg text-xs font-bold border border-slate-700 transition-all"
          >
            <FileJson className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
            查看 Schema
          </button>
        </div>
      </div>

      {/* Scenario Sub-Tabs selector if multiple scenarios are available in this component */}
      {availableScenarios && availableScenarios.length > 1 && (
        <div className="bg-slate-950/60 border-b border-slate-800/80 px-6 py-2.5 flex items-center space-x-2 overflow-x-auto custom-scrollbar flex-shrink-0">
          <span className="text-xs font-bold text-slate-400 mr-2 flex items-center">
            <Sliders className="w-3.5 h-3.5 mr-1 text-blue-400" /> 场景切换:
          </span>
          {availableScenarios.map(sc => {
            const isCurrent = normalizeScenarioKey(sc.key) === normKey;
            return (
              <button
                key={sc.key}
                onClick={() => onSelectScenario && onSelectScenario(sc.key)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 border ${
                  isCurrent
                    ? 'bg-blue-600 text-white border-blue-500 shadow-sm shadow-blue-900/50'
                    : 'bg-slate-800/60 text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span>{sc.name}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Content Area - 4 Level Cards */}
      <div className="flex-1 overflow-y-auto p-6 pb-16 custom-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 max-w-7xl mx-auto">
          {matrix.map((item, idx) => {
            const style = colorStyles[item.color] || colorStyles.emerald;
            const isJustInjected = injectedSuccessLevel === item.level;

            return (
              <div 
                key={item.level} 
                className={`bg-slate-900 rounded-xl border ${isEditing ? 'border-blue-500/80 ring-2 ring-blue-500/20' : 'border-slate-800'} shadow-lg hover:border-slate-700 transition-all flex flex-col overflow-hidden relative group`}
              >
                {/* Level Card Header */}
                <div className={`px-4 py-3 border-b ${style.border} ${style.bg} flex justify-between items-center`}>
                  <div className="flex items-center space-x-2">
                    <ShieldAlert className={`w-4 h-4 ${style.text}`} />
                    {isEditing ? (
                      <input 
                        type="text"
                        value={item.levelName}
                        onChange={e => updateText(idx, 'levelName', e.target.value)}
                        className={`text-sm font-bold bg-white/90 text-slate-900 px-2 py-0.5 rounded border border-blue-400 ${style.ring}`}
                      />
                    ) : (
                      <span className={`text-sm font-bold ${style.text}`}>{item.levelName}</span>
                    )}
                  </div>
                  <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded border ${style.badge}`}>
                    {item.level}级病害
                  </span>
                </div>

                {/* Level Card Body */}
                <div className="p-4 flex-1 flex flex-col space-y-4">
                  {/* Visual Features Description */}
                  <div>
                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center">
                      <Layers className="w-3 h-3 mr-1 text-blue-400" /> 表观特征描述
                    </h4>
                    {isEditing ? (
                      <textarea
                        rows={2}
                        value={item.description}
                        onChange={e => updateText(idx, 'description', e.target.value)}
                        className="w-full text-xs bg-slate-950 text-slate-100 p-2 rounded border border-slate-700 focus:border-blue-500 focus:outline-none"
                      />
                    ) : (
                      <p className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 leading-relaxed min-h-[50px]">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* Physical Effects */}
                  <div>
                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center">
                      <Zap className="w-3 h-3 mr-1 text-amber-400" /> 物理机制与损伤影响
                    </h4>
                    {isEditing ? (
                      <textarea
                        rows={2}
                        value={item.physicalEffects}
                        onChange={e => updateText(idx, 'physicalEffects', e.target.value)}
                        className="w-full text-xs bg-slate-950 text-slate-100 p-2 rounded border border-slate-700 focus:border-blue-500 focus:outline-none"
                      />
                    ) : (
                      <p className="text-xs text-amber-200/90 bg-amber-950/20 p-2.5 rounded-lg border border-amber-900/30 leading-relaxed min-h-[50px]">
                        {item.physicalEffects}
                      </p>
                    )}
                  </div>

                  {/* Injected Simulation Parameters */}
                  <div className="mt-auto pt-3 border-t border-slate-800">
                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                      <span className="flex items-center">
                        <Cpu className="w-3 h-3 mr-1 text-emerald-400" /> 注入仿真引擎参数 (Schema)
                      </span>
                    </h4>

                    <div className="space-y-2">
                      {Object.entries(item.injectedParameters).map(([pKey, pVal]) => {
                        const meta = PARAM_LABELS[pKey] || { label: pKey, unit: '' };
                        return (
                          <div 
                            key={pKey}
                            className="bg-slate-950/80 border border-slate-800 rounded-lg p-2 flex items-center justify-between"
                          >
                            <span className="text-[11px] text-slate-400 font-medium">
                              {meta.label}
                            </span>
                            {isEditing ? (
                              <input
                                type="number"
                                step="any"
                                value={Number(pVal)}
                                onChange={e => updateInjectedParam(idx, pKey, parseFloat(e.target.value) || 0)}
                                className="w-20 text-xs font-mono font-bold bg-slate-900 text-emerald-400 border border-emerald-500/50 rounded px-1.5 py-0.5 text-right"
                              />
                            ) : (
                              <span className="text-xs font-mono font-bold text-emerald-400">
                                {typeof pVal === 'number' ? pVal : String(pVal)} {meta.unit}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Card Footer: Inject & Run Simulation Button */}
                <div className="p-3 bg-slate-950/80 border-t border-slate-800">
                  <button
                    onClick={() => handleInjectAndRun(item)}
                    className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition-all shadow-md ${
                      isJustInjected
                        ? 'bg-emerald-600 text-white border border-emerald-400'
                        : `${style.btn}`
                    }`}
                  >
                    {isJustInjected ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 animate-bounce" />
                        <span>已成功注入参数并前往仿真计算!</span>
                      </>
                    ) : (
                      <>
                        <span>带入此病害参数并前往仿真计算</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal: View Schema Payload JSON */}
      {showJsonModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-sm font-bold text-white flex items-center">
                <FileJson className="w-4 h-4 mr-2 text-indigo-400" />
                {scenarioTitle} — 仿真物理参数注入 Schema (JSON)
              </h3>
              <button onClick={() => setShowJsonModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-900 border-b border-slate-800 flex space-x-2">
              {matrix.map((m, idx) => (
                <button
                  key={m.level}
                  onClick={() => setActiveJsonIndex(idx)}
                  className={`px-3 py-1 rounded text-xs font-bold transition-all border ${
                    activeJsonIndex === idx
                      ? 'bg-indigo-600 text-white border-indigo-500'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {m.level}级 Schema
                </button>
              ))}
            </div>

            <div className="p-5 flex-1 overflow-y-auto font-mono text-xs text-emerald-400 bg-slate-950">
              <pre className="whitespace-pre-wrap leading-relaxed">
{JSON.stringify({
  scenario_key: normKey,
  scenario_title: scenarioTitle,
  disease_level: matrix[activeJsonIndex]?.level,
  level_name: matrix[activeJsonIndex]?.levelName,
  visual_description: matrix[activeJsonIndex]?.description,
  physical_effects: matrix[activeJsonIndex]?.physicalEffects,
  injected_engine_parameters: matrix[activeJsonIndex]?.injectedParameters
}, null, 2)}
              </pre>
            </div>

            <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-between items-center">
              <span className="text-xs text-slate-400">
                该 Schema 可直接由底层的数值仿真计算引擎解析并重置物理边界条件。
              </span>
              <button
                onClick={() => setShowJsonModal(false)}
                className="px-4 py-1.5 bg-slate-800 text-slate-200 hover:bg-slate-700 rounded-lg text-xs font-bold"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
