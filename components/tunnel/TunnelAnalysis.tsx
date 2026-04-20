import React, { useState, useEffect } from 'react';
import { Activity, ShieldAlert, Zap, Layers, Settings, Rocket, Trophy, Target, FileSearch, Save, History } from 'lucide-react';
import { calculate_tunnel_pressure, optimize_tunnel_reinforcement, TunnelEngineParams } from '../../lib/tunnelCalculations';

const TunnelAnalysis: React.FC = () => {
  const [isCalculating, setIsCalculating] = useState(false);
  const [activeMeasure, setActiveMeasure] = useState<string>('none');
  const [optResults, setOptResults] = useState<any[] | null>(null);
  const [results, setResults] = useState<any>(null);

  const [params, setParams] = useState<TunnelEngineParams>({
    B: 10.0, Ht: 7.0, H: 25.0, rockClass: 4, // 默认 IV 类围岩
    gamma: 22.0, mu: 0.3, dLining: 400, dCrack: 120, hasDebris: false
  });

  const updateParam = (key: keyof TunnelEngineParams, value: any) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const runStatusAnalysis = () => {
    setIsCalculating(true);
    setOptResults(null); 
    
    setTimeout(() => {
      let applied_params = { ...params };
      
      // 核心拦截器：What-If 加固工艺物理映射
      if (activeMeasure === 'S1') { // 高聚物注浆
          applied_params.hasDebris = false;
          applied_params.dCrack = 0;
      } else if (activeMeasure === 'S2') { // 钢架
          applied_params.hasDebris = false;
      } else if (activeMeasure === 'S3') { // 喷射混凝土
          applied_params.hasDebris = false;
          applied_params.dCrack *= 0.2;
          applied_params.dLining += 100;
      }

      const res = calculate_tunnel_pressure(applied_params);
      
      // 对于钢架支护，前端展示时做健康度补偿
      if (activeMeasure === 'S2') {
          res.health_score = Math.min(100, res.health_score + 40);
      }

      setResults(res);
      setIsCalculating(false);
    }, 600);
  };

  const runOptimization = () => {
    setIsCalculating(true);
    setTimeout(() => {
      const ecoConfigStr = localStorage.getItem('roadbedguard_tunnel_economics');
      const ecoConfig = ecoConfigStr ? JSON.parse(ecoConfigStr) : {};
      const rankedSchemes = optimize_tunnel_reinforcement(params, ecoConfig);
      setOptResults(rankedSchemes);
      setIsCalculating(false);
    }, 800);
  };

  useEffect(() => { runStatusAnalysis(); }, []);

  // 读档逻辑：监听从历史库传来的参数
  useEffect(() => {
    const pendingLoad = localStorage.getItem('roadbedguard_pending_tunnel_load');
    if (pendingLoad) {
      try {
        const loadedParams = JSON.parse(pendingLoad);
        setParams(loadedParams);
        localStorage.removeItem('roadbedguard_pending_tunnel_load');
        setTimeout(() => runStatusAnalysis(), 100);
      } catch(e) {
        console.error("隧道历史数据载入失败", e);
      }
    }
  }, []);

  // 存档逻辑
  const saveToHistory = () => {
    if (!results) {
      alert('请先执行仿真计算，获取评估结果后再进行归档。');
      return;
    }
    const historyRecord = {
      id: `TN-HIST-${Date.now()}`,
      date: new Date().toISOString(),
      params: { ...params },
      results: {
        tunnel_type: results.tunnel_type,
        q_kPa: results.q_kPa,
        deep_rate: results.deep_rate,
        damage_level: results.damage_level,
        health_score: results.health_score
      }
    };
    const existingHistory = JSON.parse(localStorage.getItem('roadbedguard_tunnel_history') || '[]');
    localStorage.setItem('roadbedguard_tunnel_history', JSON.stringify([historyRecord, ...existingHistory]));
    alert('当前隧道推演案例已成功归档至【历史训练库】！');
  };

  const getDamageStatus = (level: number) => {
      switch(level) {
          case 4: return { text: "Ⅳ级：灾难性破坏 (掉块/大变形)", color: "red", bg: "bg-red-50", border: "border-red-200" };
          case 3: return { text: "Ⅲ级：严重损伤 (深层贯通裂缝)", color: "orange", bg: "bg-orange-50", border: "border-orange-200" };
          case 2: return { text: "Ⅱ级：中度损伤 (表层裂缝发育)", color: "yellow", bg: "bg-yellow-50", border: "border-yellow-200" };
          default: return { text: "Ⅰ级：弹性/轻微受损 (结构安全)", color: "green", bg: "bg-green-50", border: "border-green-200" };
      }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full p-6 bg-gray-100 overflow-hidden">
      {/* 左侧：参数输入区 */}
      <div className="lg:col-span-3 flex flex-col space-y-4 h-full overflow-hidden">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex-1 overflow-y-auto">
          <div className="p-3 bg-slate-800 border-b border-slate-700 flex justify-between items-center sticky top-0 z-10">
            <h3 className="font-bold text-white text-sm">洞身围岩与衬砌仿真配置</h3>
            <Settings className="w-4 h-4 text-slate-400" />
          </div>
          
          <div className="p-4 space-y-6 text-sm">
            <div className="space-y-3">
              <h4 className="font-bold text-slate-700 text-xs flex items-center">
                <Target className="w-3.5 h-3.5 mr-2 text-slate-500" /> 几何与地质参数
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-[10px] text-gray-400 uppercase mb-1">围岩级别 (I-VI)</label>
                  <select className="w-full border rounded p-1.5 text-xs font-bold" value={params.rockClass} onChange={e => updateParam('rockClass', parseInt(e.target.value))}>
                    <option value={1}>I 级围岩 (坚硬岩)</option><option value={2}>II 级围岩</option>
                    <option value={3}>III 级围岩</option><option value={4}>IV 级围岩 (软弱岩)</option>
                    <option value={5}>V 级围岩</option><option value={6}>VI 级围岩 (极破碎)</option>
                  </select>
                </div>
                <div><label className="block text-[10px] text-gray-400 uppercase mb-1">跨度 B (m)</label><input type="number" step="0.1" className="w-full border rounded p-1.5 text-xs" value={params.B} onChange={e => updateParam('B', parseFloat(e.target.value))} /></div>
                <div><label className="block text-[10px] text-gray-400 uppercase mb-1">埋深 H (m)</label><input type="number" step="0.1" className="w-full border rounded p-1.5 text-xs font-bold text-blue-700" value={params.H} onChange={e => updateParam('H', parseFloat(e.target.value))} /></div>
                <div><label className="block text-[10px] text-gray-400 uppercase mb-1">重度 (kN/m³)</label><input type="number" className="w-full border rounded p-1.5 text-xs" value={params.gamma} onChange={e => updateParam('gamma', parseFloat(e.target.value))} /></div>
                <div><label className="block text-[10px] text-gray-400 uppercase mb-1">泊松比 μ</label><input type="number" step="0.01" className="w-full border rounded p-1.5 text-xs" value={params.mu} onChange={e => updateParam('mu', parseFloat(e.target.value))} /></div>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-gray-100">
              <h4 className="font-bold text-red-600 text-xs flex items-center">
                <FileSearch className="w-3.5 h-3.5 mr-2 text-red-500" /> 二衬表观病害参数
              </h4>
              <div className="bg-red-50 p-3 rounded-lg border border-red-100 grid grid-cols-2 gap-3">
                <div><label className="block text-[10px] text-gray-500 uppercase mb-1">衬砌厚度 (mm)</label><input type="number" className="w-full border border-red-200 rounded p-1.5 text-xs" value={params.dLining} onChange={e => updateParam('dLining', parseFloat(e.target.value))} /></div>
                <div><label className="block text-[10px] text-gray-500 uppercase mb-1">裂缝深度 (mm)</label><input type="number" className="w-full border border-red-200 rounded p-1.5 text-xs font-black text-red-700" value={params.dCrack} onChange={e => updateParam('dCrack', parseFloat(e.target.value))} /></div>
                <div className="col-span-2 flex items-center mt-2">
                  <input type="checkbox" id="debris" checked={params.hasDebris} onChange={e => updateParam('hasDebris', e.target.checked)} className="mr-2" />
                  <label htmlFor="debris" className="text-xs font-bold text-red-800">拱顶存在掉块或背后空洞</label>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-gray-100">
              <h4 className="font-bold text-indigo-600 text-xs flex items-center">
                <ShieldAlert className="w-3.5 h-3.5 mr-2 text-indigo-500" /> 加固处治预演 (What-If)
              </h4>
              <div className={`p-3 rounded-lg border ${activeMeasure !== 'none' ? 'bg-indigo-50 border-indigo-200' : 'bg-gray-50 border-gray-200'}`}>
                <select className="w-full border rounded border-gray-300 p-1.5 text-xs bg-white text-gray-800 font-bold" value={activeMeasure} onChange={e => setActiveMeasure(e.target.value)}>
                  <option value="none">无加固 (仅评估现状)</option>
                  <option value="S1">方案一：高聚物无损注浆</option>
                  <option value="S2">方案二：钢拱架强力支护</option>
                  <option value="S3">方案三：挂网喷射混凝土</option>
                </select>
              </div>
            </div>
          </div>

          <div className="p-4 border-t bg-gray-50 sticky bottom-0 z-10">
            <button onClick={runStatusAnalysis} disabled={isCalculating} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-lg shadow transition-all flex justify-center items-center text-sm">
              {isCalculating && !optResults ? <Activity className="animate-spin -ml-1 mr-2 h-4 w-4" /> : '执行围岩压力与结构诊断'}
            </button>
          </div>
        </div>
      </div>

      {/* 右侧：结果看板 */}
      <div className="lg:col-span-9 flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-white p-4 border-b flex justify-between items-center shadow-sm z-10">
          <div>
            <h2 className="text-lg font-bold text-gray-800">隧道围岩压力与衬砌健康度评估系统</h2>
            <p className="text-xs text-gray-500">基于荷载等效高度法与裂隙深度比 (Deep-Rate) 的全生命周期推演</p>
          </div>
          <button 
            onClick={saveToHistory}
            className="flex items-center px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-bold transition-colors"
          >
            <Save className="w-3 h-3 mr-1.5" /> 归档案例
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
          {!results ? null : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                 {/* 数据卡片 */}
                 <div className="md:col-span-7 grid grid-cols-2 gap-4">
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 col-span-2 flex justify-between items-center">
                      <div>
                          <div className="text-xs font-bold text-gray-400 uppercase mb-1">自动判定工况类别</div>
                          <div className={`text-2xl font-black ${results.tunnel_type === '深埋隧道' ? 'text-indigo-700' : 'text-emerald-600'}`}>{results.tunnel_type}</div>
                      </div>
                      <div className="text-right">
                          <div className="text-[10px] text-gray-400 mb-1">等效计算高度 (hq)</div>
                          <div className="text-xl font-mono text-gray-600">{results.hq.toFixed(2)} m</div>
                      </div>
                    </div>
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                      <div className="text-xs font-bold text-gray-400 uppercase mb-1">垂直均布压力 (q)</div>
                      <div className="text-3xl font-black text-gray-800">{results.q_kPa.toFixed(1)} <span className="text-sm">kPa</span></div>
                    </div>
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                      <div className="text-xs font-bold text-gray-400 uppercase mb-1">侧向压力系数 (λ)</div>
                      <div className="text-3xl font-black text-slate-600">{results.lambda.toFixed(3)}</div>
                    </div>
                 </div>

                 {/* 核心损伤结论 */}
                 <div className={`md:col-span-5 p-6 rounded-2xl border-2 flex flex-col justify-center relative overflow-hidden ${getDamageStatus(results.damage_level).bg} ${getDamageStatus(results.damage_level).border}`}>
                    <ShieldAlert className={`absolute -bottom-4 -right-4 w-32 h-32 opacity-10 text-${getDamageStatus(results.damage_level).color}-600`} />
                    <div className="flex justify-between items-end mb-2 z-10">
                        <span className={`text-[10px] font-black uppercase tracking-wider text-${getDamageStatus(results.damage_level).color}-500`}>衬砌损伤判定</span>
                        <span className="font-mono text-xs font-bold text-gray-500">DeepRate: {results.deep_rate.toFixed(1)}%</span>
                    </div>
                    <h3 className={`text-xl font-black text-${getDamageStatus(results.damage_level).color}-700 leading-tight z-10 mb-4`}>
                        {getDamageStatus(results.damage_level).text}
                    </h3>
                    <div className="z-10 bg-white/60 p-3 rounded-lg border border-white/40">
                        <div className="flex justify-between text-[10px] font-bold text-gray-500 mb-1"><span>结构剩余健康度</span><span>{results.health_score.toFixed(1)} / 100</span></div>
                        <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                            <div className={`h-full ${results.health_score > 85 ? 'bg-green-500' : results.health_score > 60 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${results.health_score}%` }}></div>
                        </div>
                    </div>
                 </div>
              </div>

              {/* 智能寻优触发器 */}
              {results.health_score < 85 && !optResults && activeMeasure === 'none' && (
                <div className="bg-slate-800 rounded-xl p-6 shadow-lg flex flex-col md:flex-row items-center justify-between text-white animate-fade-in">
                  <div>
                    <h3 className="text-lg font-bold flex items-center mb-1"><Rocket className="w-5 h-5 mr-2" /> 隧道结构加固智能推演</h3>
                    <p className="text-sm opacity-80">当前衬砌健康度不足，系统可自动遍历注浆与支护措施库，输出高性价比决策矩阵。</p>
                  </div>
                  <button onClick={runOptimization} className="mt-4 md:mt-0 px-6 py-2.5 bg-indigo-500 text-white rounded-lg font-black hover:bg-indigo-400 shadow-md whitespace-nowrap">
                    启动加固组合正交寻优
                  </button>
                </div>
              )}

              {/* 优化结果看板 */}
              {optResults && (
                <div className="space-y-6 animate-fade-in border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-black text-gray-800 flex items-center"><Trophy className="w-6 h-6 mr-2 text-yellow-500" /> Rank 1 最优处治方案</h3>
                  <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-8 shadow-xl text-white">
                      <div className="flex items-center space-x-2 mb-4">
                        <span className="px-3 py-1 bg-emerald-400 text-slate-900 text-[10px] font-black rounded-full">健康度达标推荐</span>
                      </div>
                      <h4 className="text-3xl font-black mb-6">{optResults[0].name}</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div><p className="text-xs opacity-70 mb-1">预估造价</p><p className="text-2xl font-mono">¥{Math.round(optResults[0].cost).toLocaleString()}</p></div>
                        <div><p className="text-xs opacity-70 mb-1">预计工期</p><p className="text-2xl font-mono">{optResults[0].time.toFixed(1)} <span className="text-sm">天</span></p></div>
                        <div><p className="text-xs opacity-70 mb-1">干预手段</p><p className="text-sm font-bold text-indigo-300 mt-2">{optResults[0].measures.join(' + ')}</p></div>
                        <div><p className="text-xs opacity-70 mb-1">加固后健康度</p><p className="text-2xl font-mono text-emerald-400">{optResults[0].finalHealth.toFixed(1)}</p></div>
                      </div>
                      <p className="mt-6 text-sm text-slate-300 border-t border-white/10 pt-4">“{optResults[0].desc}”</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TunnelAnalysis;