import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { 
  Activity, ShieldAlert, Zap, Layers, Settings, Rocket, Trophy, 
  DollarSign, Clock, ShieldCheck, Info, ArrowRight 
} from 'lucide-react';
import { calculate_bridge_impact, optimize_bridge_reinforcement, BridgeEngineParams } from '../../lib/bridgeCalculations';

const BridgeAnalysis: React.FC = () => {
  const [isCalculating, setIsCalculating] = useState(false);
  const [activeMeasure, setActiveMeasure] = useState<string>('none');
  const [activeTab, setActiveTab] = useState<'status' | 'dashboard'>('status');
  const [optResults, setOptResults] = useState<any[] | null>(null);
  const [results, setResults] = useState<any>(null);
  const [diseaseMatrix, setDiseaseMatrix] = useState<any[]>([]);

  useEffect(() => {
    const savedMatrix = localStorage.getItem('roadbedguard_bridge_disease_matrix');
    if (savedMatrix) {
      setDiseaseMatrix(JSON.parse(savedMatrix));
    }
  }, []);

  const [params, setParams] = useState({
    D: 1.0, Ae: 6360, Ag: 5088, Ast: 1.13, Nmin: 3650,
    fc: 19.1, fyt: 360, miu_d: 6.0, s: 10, D_prime: 87.6, Ek: 1200
  });

  const updateParam = (key: string, value: number) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const runStatusAnalysis = () => {
    setIsCalculating(true);
    setOptResults(null); 
    
    setTimeout(() => {
      let applied_params = { ...params };
      
      // 核心拦截器：What-If 加固工艺物理映射
      if (activeMeasure === 'S1') { 
          applied_params.Ast *= 3.0;
          applied_params.miu_d = Math.max(applied_params.miu_d, 8.0);
      } else if (activeMeasure === 'S2') { 
          applied_params.D += 0.4;
          applied_params.Ae *= 1.5;
          applied_params.Ag *= 1.5;
          applied_params.fc *= 1.2;
      } else if (activeMeasure === 'S3') { 
          applied_params.Ek *= 0.4; 
      }

      const res = calculate_bridge_impact(applied_params as BridgeEngineParams);
      
      // 生成图表数据 (能量-力-位移 响应曲线)
      const chartData = [];
      const maxEk = Math.max(res.Vn * 10, params.Ek * 1.5);
      for (let i = 0; i <= 20; i++) {
        const testEk = (maxEk / 20) * i;
        const testRes = calculate_bridge_impact({ ...applied_params, Ek: testEk } as BridgeEngineParams);
        chartData.push({
          energy: Math.round(testEk),
          force: Math.round(testRes.Fs),
          disp: parseFloat(testRes.delta_s_cm.toFixed(2)),
          damage: parseFloat(testRes.alpha_D.toFixed(4))
        });
      }

      setResults({ ...res, chartData });
      setIsCalculating(false);
      setActiveTab('status');
    }, 600);
  };

  const runOptimization = () => {
    setIsCalculating(true);
    setTimeout(() => {
      const ecoConfigStr = localStorage.getItem('roadbedguard_bridge_economics');
      const ecoConfig = ecoConfigStr ? JSON.parse(ecoConfigStr) : {};
      
      const rankedSchemes = optimize_bridge_reinforcement(params as BridgeEngineParams, ecoConfig);
      setOptResults(rankedSchemes);
      setIsCalculating(false);
      setActiveTab('dashboard');
    }, 800);
  };

  useEffect(() => { runStatusAnalysis(); }, []);

  const getDamageStatus = (alpha: number) => {
      // 降序排序，从最危险的阈值开始匹配
      const sortedMatrix = [...diseaseMatrix].sort((a, b) => b.schema.min_alpha - a.schema.min_alpha);
      
      for (const item of sortedMatrix) {
          if (alpha >= item.schema.min_alpha) {
              const baseTheme = item.color === 'emerald' ? 'green' : item.color;
              return { 
                  text: item.name, 
                  color: baseTheme, 
                  bg: `bg-${baseTheme}-50`, 
                  border: `border-${baseTheme}-200` 
              };
          }
      }
      // 兜底返回弹性状态
      return { text: "弹性/轻微损伤 (结构安全)", color: "green", bg: "bg-green-50", border: "border-green-200" };
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full p-6 bg-gray-100 overflow-hidden">
      {/* 左侧：参数输入区 */}
      <div className="lg:col-span-3 flex flex-col space-y-4 h-full overflow-hidden">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex-1 overflow-y-auto">
          <div className="p-3 bg-indigo-50 border-b border-indigo-100 flex justify-between items-center sticky top-0 z-10">
            <h3 className="font-bold text-indigo-800 text-sm">双柱墩冲击仿真配置</h3>
            <Settings className="w-4 h-4 text-indigo-400" />
          </div>
          
          <div className="p-4 space-y-6 text-sm">
            <div className="space-y-3">
              <h4 className="font-bold text-red-600 text-xs flex items-center">
                <Zap className="w-3.5 h-3.5 mr-2 text-red-500" /> 外部致灾荷载
              </h4>
              <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                <label className="block text-[10px] text-gray-500 uppercase font-bold mb-1">冲击动能 Ek (kJ)</label>
                <input type="number" className="w-full border border-red-200 rounded p-1.5 text-sm font-black text-red-700" value={params.Ek} onChange={e => updateParam('Ek', parseFloat(e.target.value))} />
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-gray-100">
              <h4 className="font-bold text-gray-700 text-xs flex items-center"><Layers className="w-3.5 h-3.5 mr-2 text-gray-400" /> 截面与配筋参数</h4>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-[10px] text-gray-400 uppercase mb-1">墩径 D (m)</label><input type="number" step="0.1" className="w-full border rounded p-1.5 text-xs" value={params.D} onChange={e => updateParam('D', parseFloat(e.target.value))} /></div>
                <div><label className="block text-[10px] text-gray-400 uppercase mb-1">最小轴力 (kN)</label><input type="number" className="w-full border rounded p-1.5 text-xs" value={params.Nmin} onChange={e => updateParam('Nmin', parseFloat(e.target.value))} /></div>
                <div><label className="block text-[10px] text-gray-400 uppercase mb-1">混凝土强度 fc</label><input type="number" className="w-full border rounded p-1.5 text-xs" value={params.fc} onChange={e => updateParam('fc', parseFloat(e.target.value))} /></div>
                <div><label className="block text-[10px] text-gray-400 uppercase mb-1">箍筋强度 fyt</label><input type="number" className="w-full border rounded p-1.5 text-xs" value={params.fyt} onChange={e => updateParam('fyt', parseFloat(e.target.value))} /></div>
                <div><label className="block text-[10px] text-gray-400 uppercase mb-1">箍筋面积 (cm²)</label><input type="number" step="0.1" className="w-full border rounded p-1.5 text-xs" value={params.Ast} onChange={e => updateParam('Ast', parseFloat(e.target.value))} /></div>
                <div><label className="block text-[10px] text-gray-400 uppercase mb-1">延性系数 μd</label><input type="number" step="0.1" className="w-full border rounded p-1.5 text-xs" value={params.miu_d} onChange={e => updateParam('miu_d', parseFloat(e.target.value))} /></div>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-gray-100">
              <h4 className="font-bold text-indigo-600 text-xs flex items-center">
                <ShieldCheck className="w-3.5 h-3.5 mr-2 text-indigo-500" /> 加固处治预演 (What-If)
              </h4>
              <div className={`p-3 rounded-lg border ${activeMeasure !== 'none' ? 'bg-indigo-50 border-indigo-200' : 'bg-gray-50 border-gray-200'}`}>
                <select 
                  className="w-full border rounded border-gray-300 p-1.5 text-xs bg-white text-gray-800 font-bold"
                  value={activeMeasure} onChange={e => setActiveMeasure(e.target.value)}
                >
                  <option value="none">无加固 (仅现状评估)</option>
                  <option value="S1">方案一：碳纤维 (CFRP) 环向包裹</option>
                  <option value="S2">方案二：外包钢管混凝土套裙</option>
                  <option value="S3">方案三：增设柔性防撞套箱</option>
                </select>
              </div>
            </div>
          </div>

          <div className="p-4 border-t bg-gray-50 sticky bottom-0 z-10">
            <button 
              onClick={runStatusAnalysis} disabled={isCalculating}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-lg shadow transition-all transform active:scale-95 disabled:opacity-70 flex justify-center items-center text-sm"
            >
              {isCalculating && !optResults ? <Activity className="animate-spin -ml-1 mr-2 h-4 w-4" /> : '执行抗冲击动态仿真'}
            </button>
          </div>
        </div>
      </div>

      {/* 右侧：结果与推演看板 */}
      <div className="lg:col-span-9 flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-white p-4 border-b flex justify-between items-center shadow-sm z-10">
          <div>
            <h2 className="text-lg font-bold text-gray-800">桥梁双柱墩受冲击损伤评估系统</h2>
            <p className="text-xs text-gray-500">基于双折线能量-位移等效静力分析模型</p>
          </div>
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button 
              onClick={() => setActiveTab('status')}
              className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'status' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              物理仿真结果
            </button>
            <button 
              onClick={runOptimization}
              className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'dashboard' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              智能决策看板
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
          {!results ? null : (
            activeTab === 'status' ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                   <div className="md:col-span-7 grid grid-cols-2 gap-4">
                      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                        <div className="text-xs font-bold text-gray-400 uppercase mb-1">名义抗剪承载力 (Vn)</div>
                        <div className="text-3xl font-black text-gray-800">{(results.Vn || 0).toFixed(1)} <span className="text-sm">kN</span></div>
                      </div>
                      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                        <div className="text-xs font-bold text-gray-400 uppercase mb-1">等效静力 (Fs)</div>
                        <div className="text-3xl font-black text-indigo-600">{(results.Fs || 0).toFixed(1)} <span className="text-sm">kN</span></div>
                      </div>
                      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 col-span-2 flex justify-between items-center">
                        <div>
                            <div className="text-xs font-bold text-gray-400 uppercase mb-1">预估最大水平位移 (δs)</div>
                            <div className="text-4xl font-black text-blue-600">{(results.delta_s_cm || 0).toFixed(2)} <span className="text-lg">cm</span></div>
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] text-gray-400 mb-1">与墩径 D 的比值</div>
                            <div className="text-xl font-mono text-gray-600 border-b border-gray-300">δs / D = {(results.alpha_D || 0).toFixed(3)}</div>
                        </div>
                      </div>
                   </div>

                   <div className={`md:col-span-5 p-6 rounded-2xl border-2 flex flex-col justify-center relative overflow-hidden ${getDamageStatus(results.alpha_D).bg} ${getDamageStatus(results.alpha_D).border}`}>
                      <ShieldAlert className={`absolute -bottom-4 -right-4 w-32 h-32 opacity-10 text-${getDamageStatus(results.alpha_D).color}-600`} />
                      <span className={`text-[10px] font-black uppercase tracking-wider text-${getDamageStatus(results.alpha_D).color}-500 mb-2`}>损伤程度研判</span>
                      <h3 className={`text-2xl font-black text-${getDamageStatus(results.alpha_D).color}-700 leading-tight z-10`}>
                          {getDamageStatus(results.alpha_D).text}
                      </h3>
                   </div>
                </div>

                {/* 响应曲线图表 */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <h5 className="text-sm font-bold text-gray-700 mb-6 flex items-center">
                    <Activity className="w-4 h-4 mr-2 text-indigo-500" />
                    能量 - 冲击力 - 位移 响应曲线 (Energy-Force-Disp Response)
                  </h5>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={results.chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                        <XAxis 
                          dataKey="energy" 
                          label={{ value: '冲击动能 (kJ)', position: 'insideBottomRight', offset: -5, fontSize: 10 }}
                          tick={{ fontSize: 10 }}
                        />
                        <YAxis 
                          yAxisId="left"
                          label={{ value: '冲击力 (kN)', angle: -90, position: 'insideLeft', fontSize: 10 }}
                          tick={{ fontSize: 10 }}
                        />
                        <YAxis 
                          yAxisId="right" 
                          orientation="right"
                          label={{ value: '位移 (cm)', angle: 90, position: 'insideRight', fontSize: 10 }}
                          tick={{ fontSize: 10 }}
                        />
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '20px' }} />
                        <Line yAxisId="left" type="monotone" dataKey="force" name="冲击力 (kN)" stroke="#4f46e5" strokeWidth={3} dot={false} />
                        <Line yAxisId="right" type="monotone" dataKey="disp" name="水平位移 (cm)" stroke="#f59e0b" strokeWidth={3} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 专家建议 */}
                <div className="bg-indigo-50 p-5 rounded-xl border border-indigo-100">
                  <h5 className="text-xs font-bold text-indigo-700 uppercase mb-3 flex items-center">
                    <Info className="w-3.5 h-3.5 mr-2" />
                    专家诊断建议
                  </h5>
                  <div className="space-y-2">
                    <p className="text-sm text-indigo-800 leading-relaxed">
                      当前冲击动能下，桥墩损伤度为 <span className="font-bold">{((results.alpha_D || 0) * 100).toFixed(2)}%</span>。
                      {results.alpha_D < 0.02 
                        ? '结构处于弹性工作阶段，抗剪承载力储备充足，建议进行常规外观巡检。' 
                        : '结构已进入弹塑性阶段，截面出现明显的非线性响应。建议立即启动加固方案推演，重点考虑提升箍筋约束效率或增设外部防撞设施。'}
                    </p>
                  </div>
                </div>

                {diseaseMatrix.length > 0 && results.alpha_D >= (diseaseMatrix.find(m => m.id === 'LEVEL_II')?.schema.min_alpha || 0.02) && !optResults && activeMeasure === 'none' && (
                  <div className="bg-indigo-600 rounded-xl p-6 shadow-lg flex flex-col md:flex-row items-center justify-between text-white animate-fade-in">
                    <div>
                      <h3 className="text-lg font-bold flex items-center mb-1"><Rocket className="w-5 h-5 mr-2" /> 桥墩防撞与加固智能推演</h3>
                      <p className="text-sm opacity-80">当前墩柱已进入塑性损伤状态，系统可自动遍历防护与加固措施库，输出高性价比决策矩阵。</p>
                    </div>
                    <button 
                      onClick={runOptimization}
                      className="mt-4 md:mt-0 px-6 py-2.5 bg-white text-indigo-700 rounded-lg font-black hover:bg-indigo-50 shadow-md whitespace-nowrap"
                    >
                      启动加固组合正交寻优
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* 智能决策看板 */
              optResults && optResults.length > 0 ? (
                <div className="space-y-6 animate-fade-in">
                  <h3 className="text-lg font-black text-gray-800 flex items-center">
                    <Trophy className="w-6 h-6 mr-2 text-yellow-500" /> Rank 1 最优防撞/加固方案
                  </h3>
                  
                  <div className="bg-gradient-to-r from-slate-800 to-indigo-900 rounded-2xl p-8 shadow-xl text-white">
                      <div className="flex items-center space-x-2 mb-4">
                        <span className="px-3 py-1 bg-yellow-400 text-slate-900 text-[10px] font-black rounded-full">综合性价比之王</span>
                      </div>
                      <h4 className="text-3xl font-black mb-6">{optResults[0].name}</h4>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div><p className="text-xs opacity-70 mb-1">预估造价</p><p className="text-2xl font-mono">¥{Math.round(optResults[0].cost).toLocaleString()}</p></div>
                        <div><p className="text-xs opacity-70 mb-1">预计工期</p><p className="text-2xl font-mono">{(optResults[0].time || 0).toFixed(1)} <span className="text-sm">天</span></p></div>
                        <div><p className="text-xs opacity-70 mb-1">加固后位移</p><p className="text-2xl font-mono text-emerald-400">{(optResults[0].finalDisp || 0).toFixed(2)} cm</p></div>
                        <div><p className="text-xs opacity-70 mb-1">加固后损伤指标</p><p className="text-2xl font-mono text-emerald-400">{(optResults[0].finalAlphaD || 0).toFixed(3)}</p></div>
                      </div>
                  </div>

                  {/* 方案对比明细 */}
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                      <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">全方案正交对比矩阵</h4>
                    </div>
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                          <th className="px-6 py-4">方案名称</th>
                          <th className="px-6 py-4">损伤度 αD</th>
                          <th className="px-6 py-4">预估成本</th>
                          <th className="px-6 py-4">工期</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        {optResults.map((scheme, idx) => (
                          <tr key={scheme.id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${idx === 0 ? 'bg-indigo-50/30' : ''}`}>
                            <td className="px-6 py-4 font-bold text-gray-800">{scheme.name}</td>
                            <td className={`px-6 py-4 font-mono font-bold ${(scheme.finalAlphaD || 0) < 0.02 ? 'text-emerald-600' : 'text-orange-600'}`}>
                              {((scheme.finalAlphaD || 0) * 100).toFixed(2)}%
                            </td>
                            <td className="px-6 py-4 font-bold text-indigo-600">¥ {Math.round(scheme.cost || 0).toLocaleString()}</td>
                            <td className="px-6 py-4 text-gray-600">{(scheme.time || 0).toFixed(1)} d</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-gray-300">
                  <Rocket className="w-12 h-12 mb-4 opacity-20" />
                  <p className="text-sm font-medium">点击“智能决策看板”或重新运行推演以查看方案对比</p>
                </div>
              )
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default BridgeAnalysis;
