import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area
} from 'recharts';
import { 
  Activity, Database, ShieldCheck, AlertTriangle, Settings, 
  ArrowRight, Info, Droplets, CloudRain, Truck, Layers, Hammer,
  Save, History, ClipboardList, Rocket, Trophy, DollarSign, Clock, CheckCircle2
} from 'lucide-react';
import { calculate_roadbed_settlement, RoadbedEngineParams, optimize_roadbed_reinforcement } from '../../lib/roadbedCalculations';

const RoadbedAnalysis: React.FC = () => {
  const [isCalculating, setIsCalculating] = useState(false);
  const [diseaseLevel, setDiseaseLevel] = useState<number>(0);
  const [activeMeasure, setActiveMeasure] = useState<string>('none');
  const [activeTab, setActiveTab] = useState<'status' | 'dashboard'>('status');
  const [results, setResults] = useState<any>(null);
  const [optResults, setOptResults] = useState<any[] | null>(null);
  const [DISEASE_MAP, setDiseaseMap] = useState<Record<number, any>>({
    0: { runoff_coeff: 0.80, compaction_loss: 1.0, desc: "0级: 完好状态" }
  });

  // Parameters State
  const [subgradeParams, setSubgradeParams] = useState({
    geometry: {
      H: 6.0,
      dz: 0.2,
      E_req: 40.0, // MPa
    },
    soil: {
      gamma: 19.0,
      cbr: 5.0,
      compaction: 0.94,
    },
    environment: {
      rainfall: 120.0,
      rainDays: 3,
    },
    load: {
      q_load: 20.0, // kPa
    }
  });

  const updateParam = (group: string, key: string, value: any) => {
    setSubgradeParams(prev => ({
      ...prev,
      [group]: {
        ...(prev as any)[group],
        [key]: value
      }
    }));
  };

  // 新增：加载病害图谱配置
  useEffect(() => {
    const savedMatrix = localStorage.getItem('roadbedguard_roadbed_disease_matrix');
    if (savedMatrix) {
      try {
        const matrix = JSON.parse(savedMatrix);
        const map: Record<number, any> = {};
        matrix.forEach((item: any) => {
          map[item.level] = {
            runoff_coeff: item.schema.runoff_coeff,
            compaction_loss: item.schema.compaction_loss,
            desc: item.name
          };
        });
        setDiseaseMap(prev => ({ ...prev, ...map }));
      } catch (e) {
        console.error("加载病害图谱失败", e);
      }
    }
  }, []);

  // 新增：监听跨组件的历史案例载入请求
  useEffect(() => {
    const pendingLoad = localStorage.getItem('roadbedguard_pending_roadbed_load');
    if (pendingLoad) {
      try {
        const loadedParams = JSON.parse(pendingLoad);
        // 1. 还原参数
        setSubgradeParams({
          geometry: loadedParams.geometry,
          soil: loadedParams.soil,
          environment: loadedParams.environment,
          load: loadedParams.load
        });
        setDiseaseLevel(loadedParams.diseaseLevel || 0);
        
        // 2. 清除缓存，避免重复载入
        localStorage.removeItem('roadbedguard_pending_roadbed_load');
        
        // 3. 自动触发一次计算以展示结果
        setTimeout(() => {
          runStatusAnalysis();
        }, 100);
      } catch(e) {
        console.error("路基历史数据载入失败", e);
      }
    }
  }, []);

  const saveToHistory = () => {
    if (!results) {
      alert('请先运行仿真分析，获取计算结果后再进行归档。');
      return;
    }

    const historyRecord = {
      id: `rb-hist-${Date.now()}`,
      name: `路基分析案例 ${new Date().toLocaleDateString()}`,
      date: new Date().toLocaleString(),
      notes: '暂无备注。',
      params: {
        ...subgradeParams,
        diseaseLevel
      },
      results: {
        finalSettlement: results.finalSettlement,
        finalCapacity: results.finalCapacity,
        wettingFront: results.timeSeries[results.timeSeries.length - 1].day * 0.1 // 简化模拟
      }
    };

    const existingHistory = JSON.parse(localStorage.getItem('roadbedguard_roadbed_history') || '[]');
    localStorage.setItem('roadbedguard_roadbed_history', JSON.stringify([historyRecord, ...existingHistory]));
    alert('当前分析案例及结果已成功归档至【路基历史训练库】！');
  };

  const runStatusAnalysis = () => {
    setIsCalculating(true);
    
    setTimeout(() => {
      // 1. 获取现状参数
      let applied_runoff = DISEASE_MAP[diseaseLevel]?.runoff_coeff || 0.8;
      let applied_compaction_loss = DISEASE_MAP[diseaseLevel]?.compaction_loss || 1.0;
      let applied_cbr = subgradeParams.soil.cbr;
      let applied_compaction = subgradeParams.soil.compaction;

      // 2. 核心衔接：物理边界干预拦截器
      if (activeMeasure !== 'none') {
          applied_runoff = 0.80; // 加固重做表面封闭，切断雨水入渗
          applied_compaction_loss = 1.0; // 压实度损伤修复
          
          if (activeMeasure === 'S1') {
              applied_compaction = Math.max(applied_compaction, 0.93);
          } else if (activeMeasure === 'S2') {
              applied_compaction = Math.max(applied_compaction, 0.96);
              applied_cbr = applied_cbr * 1.2;
          } else if (activeMeasure === 'S3') {
              applied_compaction = 0.96;
              applied_cbr = applied_cbr * 1.3;
          } else if (activeMeasure === 'S4') {
              applied_compaction = 0.98;
              applied_cbr = applied_cbr * 2.0;
          }
      }

      // 3. 组装最终引擎参数
      const engineParams: RoadbedEngineParams = {
        H: subgradeParams.geometry.H, dz: subgradeParams.geometry.dz, E_req: subgradeParams.geometry.E_req,
        cbr: applied_cbr, compaction: applied_compaction,
        rainfall: subgradeParams.environment.rainfall, rainDays: subgradeParams.environment.rainDays,
        runoff_coeff: applied_runoff, compaction_loss: applied_compaction_loss,
        q_load: subgradeParams.load.q_load, gamma: subgradeParams.soil.gamma
      };

      const engineResults = calculate_roadbed_settlement(engineParams);

      const timeSeriesData = engineResults.times.map((day, index) => ({
        day: day, settlement: Number(engineResults.settlement_series[index].toFixed(2)), capacity: Number(engineResults.capacity_series[index].toFixed(1))
      }));

      setResults({
        timeSeries: timeSeriesData, finalSettlement: engineResults.final_settlement, finalCapacity: engineResults.final_capacity, E_base: engineResults.E_base
      });

      setIsCalculating(false);
    }, 600); 
  };

  const runOptimization = () => {
    setIsCalculating(true);
    setTimeout(() => {
      // 从 localStorage 读取加固措施库同步的单价
      const ecoConfigStr = localStorage.getItem('roadbedguard_roadbed_economics');
      const ecoConfig = ecoConfigStr ? JSON.parse(ecoConfigStr) : {};

      // 组装当前基础参数
      const engineParams = {
        H: subgradeParams.geometry.H, 
        dz: subgradeParams.geometry.dz, 
        E_req: subgradeParams.geometry.E_req,
        cbr: subgradeParams.soil.cbr, 
        compaction: subgradeParams.soil.compaction,
        rainfall: subgradeParams.environment.rainfall, 
        rainDays: subgradeParams.environment.rainDays,
        runoff_coeff: DISEASE_MAP[diseaseLevel]?.runoff_coeff || 0.8,
        compaction_loss: DISEASE_MAP[diseaseLevel]?.compaction_loss || 1.0,
        q_load: subgradeParams.load.q_load, 
        gamma: subgradeParams.soil.gamma
      };

      const rankedSchemes = optimize_roadbed_reinforcement(engineParams, ecoConfig);
      setOptResults(rankedSchemes);
      setIsCalculating(false);
    }, 800);
  };

  // Initial calculation
  useEffect(() => {
    runStatusAnalysis();
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full p-6 overflow-hidden bg-gray-100">
      {/* LEFT: Parameter Sidebar */}
      <div className="lg:col-span-3 flex flex-col space-y-4 h-full overflow-hidden">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex-1 overflow-y-auto">
          <div className="p-3 bg-blue-50 border-b border-blue-100 flex justify-between items-center">
            <h3 className="font-bold text-primary text-sm">路基参数配置</h3>
            <Settings className="w-4 h-4 text-blue-400" />
          </div>
          
          <div className="p-4 space-y-6 text-sm">
            {/* Geometry */}
            <div className="space-y-3">
              <h4 className="font-bold text-gray-700 text-xs flex items-center">
                <Layers className="w-3.5 h-3.5 mr-2 text-gray-400" />
                几何与设计要求
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] text-gray-400 uppercase mb-1">路基高度 H (m)</label>
                  <input 
                    type="number" 
                    className="w-full border rounded p-1.5 text-xs" 
                    value={subgradeParams.geometry.H} 
                    onChange={e => updateParam('geometry', 'H', parseFloat(e.target.value))} 
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-gray-400 uppercase mb-1">分层厚度 dz (m)</label>
                    <input 
                      type="number" 
                      step="0.1"
                      className="w-full border rounded p-1.5 text-xs" 
                      value={subgradeParams.geometry.dz} 
                      onChange={e => updateParam('geometry', 'dz', parseFloat(e.target.value))} 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 uppercase mb-1">设计模量 (MPa)</label>
                    <input 
                      type="number" 
                      className="w-full border rounded p-1.5 text-xs" 
                      value={subgradeParams.geometry.E_req} 
                      onChange={e => updateParam('geometry', 'E_req', parseFloat(e.target.value))} 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Soil */}
            <div className="space-y-3 pt-4 border-t border-gray-100">
              <h4 className="font-bold text-gray-700 text-xs flex items-center">
                <Database className="w-3.5 h-3.5 mr-2 text-gray-400" />
                填料物理力学参数
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] text-gray-400 uppercase mb-1">土体重度 γ (kN/m³)</label>
                  <input 
                    type="number" 
                    className="w-full border rounded p-1.5 text-xs" 
                    value={subgradeParams.soil.gamma} 
                    onChange={e => updateParam('soil', 'gamma', parseFloat(e.target.value))} 
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-gray-400 uppercase mb-1">基础 CBR 值</label>
                    <input 
                      type="number" 
                      className="w-full border rounded p-1.5 text-xs" 
                      value={subgradeParams.soil.cbr} 
                      onChange={e => updateParam('soil', 'cbr', parseFloat(e.target.value))} 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 uppercase mb-1">压实度 (0~1)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      className="w-full border rounded p-1.5 text-xs" 
                      value={subgradeParams.soil.compaction} 
                      onChange={e => updateParam('soil', 'compaction', parseFloat(e.target.value))} 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Environment */}
            <div className="space-y-3 pt-4 border-t border-gray-100">
              <h4 className="font-bold text-gray-700 text-xs flex items-center">
                <CloudRain className="w-3.5 h-3.5 mr-2 text-gray-400" />
                环境与降雨工况
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-gray-400 uppercase mb-1">降雨强度 (mm/d)</label>
                  <input 
                    type="number" 
                    className="w-full border rounded p-1.5 text-xs" 
                    value={subgradeParams.environment.rainfall} 
                    onChange={e => updateParam('environment', 'rainfall', parseFloat(e.target.value))} 
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 uppercase mb-1">降雨历时 (d)</label>
                  <input 
                    type="number" 
                    className="w-full border rounded p-1.5 text-xs" 
                    value={subgradeParams.environment.rainDays} 
                    onChange={e => updateParam('environment', 'rainDays', parseFloat(e.target.value))} 
                  />
                </div>
              </div>
            </div>

            {/* Load */}
            <div className="space-y-3 pt-4 border-t border-gray-100">
              <h4 className="font-bold text-gray-700 text-xs flex items-center">
                <Truck className="w-3.5 h-3.5 mr-2 text-gray-400" />
                交通附加荷载
              </h4>
              <div>
                <label className="block text-[10px] text-gray-400 uppercase mb-1">路面附加压应力 q (kPa)</label>
                <input 
                  type="number" 
                  className="w-full border rounded p-1.5 text-xs" 
                  value={subgradeParams.load.q_load} 
                  onChange={e => updateParam('load', 'q_load', parseFloat(e.target.value))} 
                />
              </div>
            </div>

            {/* Disease */}
            <div className="space-y-3 pt-4 border-t border-gray-100">
              <h4 className="font-bold text-red-500 text-xs flex items-center">
                <AlertTriangle className="w-3.5 h-3.5 mr-2 text-red-400" />
                路面病害与入渗边界
              </h4>
              <div className={`p-3 rounded-lg border ${diseaseLevel > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                <label className="block text-[10px] text-gray-500 uppercase font-bold mb-1">病害严重程度</label>
                <select 
                  className="w-full border rounded border-gray-300 p-1.5 text-xs bg-white text-gray-800 font-bold"
                  value={diseaseLevel}
                  onChange={e => setDiseaseLevel(Number(e.target.value))}
                >
                  <option value={0}>0级：完好 (径流系数 0.8)</option>
                  <option value={1}>1级：轻微裂缝 (径流系数 0.5)</option>
                  <option value={2}>2级：严重网裂 (径流系数 0.2)</option>
                  <option value={3}>3级：积水翻浆 (径流系数 0.05)</option>
                </select>
                <p className="mt-2 text-[10px] text-gray-500 leading-tight">
                  注：病害等级越高，路面径流越小，入渗量越大，对路基模量的削弱越显著。
                </p>
              </div>
            </div>

            {/* Reinforcement */}
            <div className="space-y-3 pt-4 border-t border-gray-100">
              <h4 className="font-bold text-emerald-600 text-xs flex items-center">
                <Hammer className="w-3.5 h-3.5 mr-2 text-emerald-500" />
                加固与处治方案 (What-If 测试)
              </h4>
              <div className={`p-3 rounded-lg border ${activeMeasure !== 'none' ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200'}`}>
                <label className="block text-[10px] text-gray-500 uppercase font-bold mb-1">手动应用处治工艺</label>
                <select 
                  className="w-full border rounded border-gray-300 p-1.5 text-xs bg-white text-gray-800 font-bold"
                  value={activeMeasure}
                  onChange={e => setActiveMeasure(e.target.value)}
                >
                  <option value="none">无加固 (仅现状评估)</option>
                  <option value="S1">方案一：原槽换填与表面封闭</option>
                  <option value="S2">方案二：高聚物无损注浆</option>
                  <option value="S3">方案三：注浆联合深层排水</option>
                  <option value="S4">方案四：微型桩树根网联合加固</option>
                </select>
              </div>
            </div>
          </div>

          <div className="p-4 border-t bg-gray-50 sticky bottom-0">
            <button 
              onClick={runStatusAnalysis}
              disabled={isCalculating}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg shadow-lg transition-all transform active:scale-95 disabled:opacity-70 flex justify-center items-center text-sm"
            >
              {isCalculating ? (
                <>
                  <Activity className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  物理引擎计算中...
                </>
              ) : '执行路基稳定性仿真'}
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT: Main Content Area */}
      <div className="lg:col-span-9 flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-white p-4 border-b flex justify-between items-center shadow-sm z-10">
          <div>
            <h2 className="text-lg font-bold text-gray-800">路基服役状态仿真分析系统</h2>
            <p className="text-xs text-gray-500">基于分层压缩积分与水分入渗耦合模型</p>
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={saveToHistory}
              className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-bold transition-colors"
            >
              <Save className="w-4 h-4 mr-2" /> 归档案例
            </button>
            <button className="flex items-center px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-sm font-bold transition-colors">
              <History className="w-4 h-4 mr-2" /> 历史对比
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
          {!results ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <Activity className="w-16 h-16 mb-4 opacity-10" />
              <p>等待计算指令...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                  <div className="text-xs font-bold text-gray-400 uppercase mb-1">最终累计沉降量</div>
                  <div className="flex items-baseline">
                    <span className={`text-3xl font-black ${results.finalSettlement > 50 ? 'text-red-600' : 'text-blue-600'}`}>
                      {results.finalSettlement.toFixed(2)}
                    </span>
                    <span className="ml-1 text-sm text-gray-500 font-bold">mm</span>
                  </div>
                  <div className="mt-2 text-[10px] text-gray-400">
                    {results.finalSettlement > 50 ? '⚠️ 超过预警阈值' : '✅ 处于安全范围内'}
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                  <div className="text-xs font-bold text-gray-400 uppercase mb-1">路基承载力水平 (Capacity)</div>
                  <div className="flex items-baseline">
                    <span className={`text-3xl font-black ${results.finalCapacity < 80 ? 'text-orange-600' : 'text-green-600'}`}>
                      {results.finalCapacity.toFixed(1)}
                    </span>
                    <span className="ml-1 text-sm text-gray-500 font-bold">%</span>
                  </div>
                  <div className="mt-2 text-[10px] text-gray-400">
                    相对于设计要求模量 {subgradeParams.geometry.E_req} MPa
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                  <div className="text-xs font-bold text-gray-400 uppercase mb-1">天然状态基础模量 (E_base)</div>
                  <div className="flex items-baseline">
                    <span className="text-3xl font-black text-gray-800">
                      {results.E_base.toFixed(1)}
                    </span>
                    <span className="ml-1 text-sm text-gray-500 font-bold">MPa</span>
                  </div>
                  <div className="mt-2 text-[10px] text-gray-400">
                    由 CBR={subgradeParams.soil.cbr} 映射并经压实度修正
                  </div>
                </div>
              </div>

              {/* Optimization Trigger */}
              {results.finalCapacity < 90 && !optResults && (
                <div className="bg-blue-600 rounded-xl p-6 shadow-lg flex flex-col md:flex-row items-center justify-between text-white animate-pulse">
                  <div className="mb-4 md:mb-0">
                    <h3 className="text-lg font-bold flex items-center">
                      <Rocket className="w-5 h-5 mr-2" /> 承载力预警：当前路基状态未达标 (低于 90%)
                    </h3>
                    <p className="text-sm opacity-80">建议启动智能加固方案推演，系统将根据造价与工效自动匹配最优处治方案。</p>
                  </div>
                  <button 
                    onClick={runOptimization}
                    className="px-6 py-2 bg-white text-blue-600 rounded-lg font-black hover:bg-blue-50 transition-colors shadow-md whitespace-nowrap"
                  >
                    🚀 启动加固措施模拟优化
                  </button>
                </div>
              )}

              {/* Optimization Dashboard */}
              {optResults && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                    <h3 className="text-lg font-black text-gray-800 flex items-center">
                      <Trophy className="w-6 h-6 mr-2 text-yellow-500" /> 综合对比决策看板 (Reinforcement Dashboard)
                    </h3>
                    <button onClick={() => setOptResults(null)} className="text-xs text-gray-400 hover:text-gray-600">重置推演</button>
                  </div>

                  {/* Rank 1 Champion */}
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 shadow-xl text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <Trophy className="w-32 h-32" />
                    </div>
                    <div className="relative z-10">
                      <div className="flex items-center space-x-2 mb-4">
                        <span className="px-3 py-1 bg-yellow-400 text-blue-900 text-[10px] font-black rounded-full uppercase tracking-widest">Rank 1 推荐方案</span>
                        <span className="px-3 py-1 bg-white/20 text-white text-[10px] font-bold rounded-full">性价比之王</span>
                      </div>
                      <h4 className="text-3xl font-black mb-6">{optResults[0].name}</h4>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        <div>
                          <p className="text-xs opacity-70 mb-1 flex items-center"><DollarSign className="w-3 h-3 mr-1"/> 预估造价</p>
                          <p className="text-2xl font-mono font-black">¥{Math.round(optResults[0].cost).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs opacity-70 mb-1 flex items-center"><Clock className="w-3 h-3 mr-1"/> 预计工期</p>
                          <p className="text-2xl font-mono font-black">{optResults[0].time.toFixed(1)} <span className="text-sm">天</span></p>
                        </div>
                        <div>
                          <p className="text-xs opacity-70 mb-1 flex items-center"><ShieldCheck className="w-3 h-3 mr-1"/> 加固后承载力</p>
                          <p className="text-2xl font-mono font-black text-green-300">{optResults[0].finalCapacity.toFixed(1)}%</p>
                        </div>
                        <div>
                          <p className="text-xs opacity-70 mb-1">核心措施</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {optResults[0].measures.map((m: string, i: number) => (
                              <span key={i} className="px-2 py-0.5 bg-white/10 rounded text-[10px] font-bold">{m}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <p className="mt-6 text-sm text-blue-100 border-t border-white/10 pt-4 italic">
                        “{optResults[0].desc}”
                      </p>
                    </div>
                  </div>

                  {/* All Schemes Table */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex justify-between items-center">
                      <h4 className="text-sm font-bold text-gray-700">全加固方案矩阵表 (All Valid Schemes)</h4>
                      <span className="text-[10px] text-gray-400">按造价从低到高排序</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="text-[10px] text-gray-400 uppercase bg-gray-50/50">
                          <tr>
                            <th className="px-6 py-3">方案名称</th>
                            <th className="px-6 py-3">预估造价 (¥)</th>
                            <th className="px-6 py-3">预计工期 (天)</th>
                            <th className="px-6 py-3">承载力 (%)</th>
                            <th className="px-6 py-3">最终沉降 (mm)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {optResults.map((s, i) => (
                            <tr key={s.id} className={`hover:bg-gray-50 transition-colors ${i === 0 ? 'bg-blue-50/30' : ''}`}>
                              <td className="px-6 py-4 font-bold text-gray-800">
                                {i === 0 && <Trophy className="w-3 h-3 inline mr-1 text-yellow-500" />}
                                {s.name}
                              </td>
                              <td className="px-6 py-4 font-mono text-emerald-600 font-bold">¥{Math.round(s.cost).toLocaleString()}</td>
                              <td className="px-6 py-4 font-mono">{s.time.toFixed(1)}</td>
                              <td className={`px-6 py-4 font-bold ${s.finalCapacity >= 95 ? 'text-green-600' : 'text-blue-600'}`}>{s.finalCapacity.toFixed(1)}%</td>
                              <td className="px-6 py-4 font-mono text-gray-500">{s.finalSettlement.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Charts */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Settlement Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-gray-800 flex items-center">
                      <Activity className="w-4 h-4 mr-2 text-blue-500" />
                      路基时程沉降演化曲线
                    </h3>
                    <div className="text-[10px] text-gray-400 bg-gray-50 px-2 py-1 rounded">单位: mm / 天</div>
                  </div>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={results.timeSeries}>
                        <defs>
                          <linearGradient id="colorSettlement" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="day" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#fff', border: 'none', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          labelFormatter={(value) => `第 ${value} 天`}
                        />
                        <Area type="monotone" dataKey="settlement" name="累计沉降" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorSettlement)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Capacity Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-gray-800 flex items-center">
                      <ShieldCheck className="w-4 h-4 mr-2 text-green-500" />
                      承载力衰减与恢复预测
                    </h3>
                    <div className="text-[10px] text-gray-400 bg-gray-50 px-2 py-1 rounded">单位: % / 天</div>
                  </div>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={results.timeSeries}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="day" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} domain={[0, 120]} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#fff', border: 'none', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          labelFormatter={(value) => `第 ${value} 天`}
                        />
                        <Line type="monotone" dataKey="capacity" name="承载力水平" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Analysis Notes */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
                <h4 className="font-bold text-blue-800 text-sm flex items-center mb-3">
                  <Info className="w-4 h-4 mr-2" />
                  仿真分析结论与建议
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-blue-700 leading-relaxed">
                  <div className="space-y-2">
                    <p className="flex items-start">
                      <span className="font-bold mr-2">1. 沉降风险：</span>
                      当前工况下，路基在第 {subgradeParams.environment.rainDays} 天（降雨结束）达到沉降峰值的 80% 以上。
                      {results.finalSettlement > 30 ? ' 沉降量较大，需警惕不均匀沉降引发的路面开裂。' : ' 沉降量在可控范围内。'}
                    </p>
                    <p className="flex items-start">
                      <span className="font-bold mr-2">2. 模量折减：</span>
                      受水分入渗影响，路基等效模量从初始的 {results.E_base.toFixed(1)} MPa 衰减至最终的 {(results.E_base * results.finalCapacity / 100).toFixed(1)} MPa。
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="flex items-start">
                      <span className="font-bold mr-2">3. 建议措施：</span>
                      {diseaseLevel >= 2 ? '路面病害严重导致入渗量激增，建议优先进行路面灌缝或罩面处理，切断入渗源。' : '建议加强路基边沟排水，防止雨水长时间滞留。'}
                    </p>
                    <p className="flex items-start">
                      <span className="font-bold mr-2">4. 结构加固：</span>
                      {results.finalCapacity < 70 ? '承载力严重不足，建议考虑注浆加固或增加路基换填深度。' : '当前结构承载力尚可，建议以预防性养护为主。'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoadbedAnalysis;
