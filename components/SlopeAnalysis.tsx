import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell
} from 'recharts';
import { 
  DEFAULT_CONFIG, 
  compute_stability, 
  eval_all_combinations_matrix, 
  get_original_elevation 
} from '../lib/slopeCalculations';

const SlopeAnalysis: React.FC = () => {
  const [isCalculating, setIsCalculating] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'schemes'>('dashboard');

  const runAnalysis = () => {
    setIsCalculating(true);
    // Use setTimeout to allow UI to update before heavy calculation
    setTimeout(() => {
      const cfg = DEFAULT_CONFIG;
      const geom = cfg.Geometry;
      const beta_rad = geom.beta * Math.PI / 180.0;
      const orig_geom = (x: number) => get_original_elevation(x, geom.H, beta_rad);
      
      const { min_FS: FS0, best_T: T0, best_R: R0, best_slip_depth: slip0, best_circle: circ0 } = compute_stability(orig_geom, geom.H, beta_rad, cfg);
      
      let all_results: any[] = [];
      if (FS0 < cfg.Target.FS_target) {
        all_results = eval_all_combinations_matrix(geom, cfg, cfg.Target.FS_target, T0, R0, slip0, circ0);
      }

      setResults({
        FS0,
        circ0,
        all_results,
        cfg
      });
      setIsCalculating(false);
    }, 100);
  };

  const renderSlope2D = (p_data: any, circle: [number, number, number], title: string, isOriginal = false) => {
    const cfg = DEFAULT_CONFIG;
    const geom = cfg.Geometry;
    const beta_rad = geom.beta * Math.PI / 180.0;
    const L_slope = geom.H / Math.tan(beta_rad);
    
    // SVG coordinates
    const width = 400;
    const height = 250;
    const padding = 20;
    
    const xMin = -3;
    const xMax = L_slope + 5;
    const yMin = -2;
    const yMax = geom.H + 5;
    
    const scaleX = (width - 2 * padding) / (xMax - xMin);
    const scaleY = (height - 2 * padding) / (yMax - yMin);
    const scale = Math.min(scaleX, scaleY);
    
    const cx = (x: number) => padding + (x - xMin) * scale;
    const cy = (y: number) => height - padding - (y - yMin) * scale;

    const x_plot = Array.from({ length: 100 }, (_, i) => xMin + i * (xMax - xMin) / 99);
    const orig_geom = (x: number) => get_original_elevation(x, geom.H, beta_rad);
    
    let curr_surf = orig_geom;
    if (p_data && p_data.type === 'cut') {
      const beta_new = Math.atan(1.0 / p_data.ratio);
      curr_surf = (x: number) => Math.min(orig_geom(x), get_original_elevation(x, geom.H, beta_new));
    } else if (p_data && p_data.type === 'berm') {
      curr_surf = (x: number) => Math.max(orig_geom(x), x <= p_data.B ? p_data.H : Math.max(0, p_data.H - (x - p_data.B) * Math.tan(beta_rad)));
    }

    const origPoints = x_plot.map(x => `${cx(x)},${cy(orig_geom(x))}`).join(' ');
    const currPoints = x_plot.map(x => `${cx(x)},${cy(curr_surf(x))}`).join(' ');

    // Circle
    const [Xc, Yc, R] = circle;
    const theta = Array.from({ length: 100 }, (_, i) => Math.PI + i * Math.PI / 99);
    const circPoints = theta.map(t => {
      const x = Xc + R * Math.cos(t);
      const y = Yc + R * Math.sin(t);
      return {x, y};
    }).filter(p => p.y <= curr_surf(p.x) && p.x >= xMin && p.x <= xMax)
      .map(p => `${cx(p.x)},${cy(p.y)}`).join(' ');

    return (
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center">
        <h4 className="font-bold text-sm text-gray-700 mb-2">{title}</h4>
        <svg width={width} height={height} className="border border-gray-200 rounded bg-gray-50">
          {/* Ground Water */}
          {cfg.Water.has_water && (
            <line x1={cx(xMin)} y1={cy(cfg.Water.y_gwt)} x2={cx(xMax)} y2={cy(cfg.Water.y_gwt)} stroke="blue" strokeDasharray="5,5" opacity="0.5" />
          )}
          
          {/* Soil Layers */}
          {cfg.Geotech.soil_layers.map((layer, i) => (
            layer.top_elev < geom.H && (
              <line key={i} x1={cx(xMin)} y1={cy(layer.top_elev)} x2={cx(xMax)} y2={cy(layer.top_elev)} stroke="gray" strokeDasharray="2,2" opacity="0.5" />
            )
          ))}

          {/* Original Profile */}
          <polyline points={`${cx(xMin)},${cy(yMin)} ${origPoints} ${cx(xMax)},${cy(yMin)}`} fill="#e2e8f0" opacity="0.5" />
          <polyline points={origPoints} fill="none" stroke="black" strokeWidth="2" opacity={isOriginal ? 1 : 0.3} />

          {/* Current Profile */}
          {!isOriginal && (
            <>
              {p_data?.type === 'cut' && (
                <polygon points={`${origPoints} ${currPoints.split(' ').reverse().join(' ')}`} fill="yellow" opacity="0.3" />
              )}
              {p_data?.type === 'berm' && (
                <polygon points={`${origPoints} ${currPoints.split(' ').reverse().join(' ')}`} fill="green" opacity="0.3" />
              )}
              <polyline points={currPoints} fill="none" stroke="green" strokeWidth="2" />
            </>
          )}

          {/* Structures */}
          {!isOriginal && p_data && (
            <>
              {(p_data.sub_type === 'pile' || p_data.sub_type === 'pile_anchor') && (
                <line x1={cx(L_slope/2)} y1={cy(curr_surf(L_slope/2))} x2={cx(L_slope/2)} y2={cy(curr_surf(L_slope/2) - p_data.L)} stroke="blue" strokeWidth="4" />
              )}
              {(p_data.sub_type === 'anchor' || p_data.sub_type === 'pile_anchor') && (
                <line x1={cx(L_slope*0.4)} y1={cy(curr_surf(L_slope*0.4))} x2={cx(L_slope*0.4 + p_data.L_total * Math.cos(15*Math.PI/180))} y2={cy(curr_surf(L_slope*0.4) - p_data.L_total * Math.sin(15*Math.PI/180))} stroke="magenta" strokeWidth="2" />
              )}
            </>
          )}

          {/* Slip Circle */}
          <polyline points={circPoints} fill="none" stroke="red" strokeWidth="2" strokeDasharray="4,4" />
        </svg>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-hidden">
      {/* Header / Controls */}
      <div className="bg-white p-4 border-b flex justify-between items-center shadow-sm z-10">
        <div>
          <h2 className="text-lg font-bold text-gray-800">边坡综合加固设计系统 v11.0</h2>
          <p className="text-xs text-gray-500">全方案矩阵穷举 + 全息联播展示版</p>
        </div>
        <button 
          onClick={runAnalysis}
          disabled={isCalculating}
          className="bg-primary hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold shadow transition-all disabled:opacity-50 flex items-center"
        >
          {isCalculating ? '推演中...' : '启动大模型正交推演'}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {!results ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <div className="text-4xl mb-4">⛰️</div>
            <p>点击右上角按钮启动边坡稳定性分析与加固推演</p>
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in">
            {/* Tabs */}
            <div className="flex space-x-4 border-b">
              <button 
                onClick={() => setActiveTab('dashboard')}
                className={`pb-2 px-2 font-bold text-sm ${activeTab === 'dashboard' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
              >
                综合对比决策看板 (Dashboard)
              </button>
              <button 
                onClick={() => setActiveTab('schemes')}
                className={`pb-2 px-2 font-bold text-sm ${activeTab === 'schemes' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
              >
                全加固方案矩阵 (All Schemes)
              </button>
            </div>

            {activeTab === 'dashboard' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pre-analysis */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">图1：加固前边坡现状稳定性力学评估</h3>
                  <div className="flex flex-col md:flex-row gap-4 items-center">
                    {renderSlope2D(null, results.circ0, `最危险滑面 (FS=${results.FS0.toFixed(3)})`, true)}
                    <div className="flex-1 bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-sm">
                      <p className="font-bold mb-2">【边坡空间属性】</p>
                      <ul className="list-disc pl-5 mb-4 text-gray-700">
                        <li>坡高: {results.cfg.Geometry.H}m</li>
                        <li>坡角: {results.cfg.Geometry.beta}°</li>
                        <li>全宽: {results.cfg.Geometry.W_slope}m</li>
                      </ul>
                      <p className="font-bold mb-2">【力学评估结论】</p>
                      <ul className="list-disc pl-5 text-gray-700">
                        <li>现状 FS0 = {results.FS0.toFixed(3)} (低于目标 {results.cfg.Target.FS_target})</li>
                        <li className="text-red-600 font-bold">状态：失稳，需加固</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Best Scheme */}
                {results.all_results.length > 0 && (
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">全局最优 Rank 1 空间剖面图</h3>
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                      {renderSlope2D(results.all_results[0].Plot_Data, results.all_results[0].Plot_Data.circle, results.all_results[0].Method)}
                      <div className="flex-1 bg-gray-50 border border-gray-200 p-4 rounded-lg text-sm">
                        <p className="font-bold mb-2 text-primary">【最终加固决策输出报告】</p>
                        <p className="font-bold mt-2">1. 核心推荐方案：</p>
                        <p className="text-blue-600 font-bold ml-2">★ {results.all_results[0].Method.replace('\n', '')} ★</p>
                        <ul className="list-disc pl-6 mb-2 text-gray-700">
                          <li>详细参数：{results.all_results[0].Param.replace('\n', ' | ')}</li>
                          <li>验算结果：加固后 FS = {results.all_results[0].FS.toFixed(3)} (达标)</li>
                        </ul>
                        <p className="font-bold mt-2">2. 工程经济指标：</p>
                        <ul className="list-disc pl-6 mb-2 text-gray-700">
                          <li>估算直接造价：<span className="text-red-600 font-bold">{results.all_results[0].Cost_W.toFixed(2)} 万元</span></li>
                          <li>预估核心工期：<span className="text-purple-600 font-bold">{Math.ceil(results.all_results[0].Time_d)} 天</span></li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Charts */}
                {results.all_results.length > 0 && (
                  <>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                      <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">安全系数 (FS) 对比</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={[{ Method: '原状边坡', FS: results.FS0 }, ...results.all_results.map((r:any) => ({ Method: r.Method.replace('\n', ''), FS: r.FS }))]}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="Method" tick={{fontSize: 10}} interval={0} angle={-45} textAnchor="end" height={80} />
                          <YAxis domain={[0, 'auto']} />
                          <Tooltip />
                          <Bar dataKey="FS">
                            {
                              [{ Method: '原状边坡', FS: results.FS0 }, ...results.all_results].map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index === 0 ? '#999999' : (index === 1 ? '#55A868' : '#4C72B0')} />
                              ))
                            }
                          </Bar>
                          {/* Target FS Line */}
                          <line x1="0" y1="0" x2="100%" y2="0" stroke="red" strokeWidth={2} strokeDasharray="5 5" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                      <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">造价与工期对比</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={results.all_results.map((r:any) => ({ Method: r.Method.replace('\n', ''), Cost: r.Cost_W, Time: Math.ceil(r.Time_d) }))}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="Method" tick={{fontSize: 10}} interval={0} angle={-45} textAnchor="end" height={80} />
                          <YAxis yAxisId="left" orientation="left" stroke="#C44E52" />
                          <YAxis yAxisId="right" orientation="right" stroke="#8172B3" />
                          <Tooltip />
                          <Legend verticalAlign="top" />
                          <Bar yAxisId="left" dataKey="Cost" name="估算造价 (万元)" fill="#C44E52" />
                          <Bar yAxisId="right" dataKey="Time" name="预估工期 (天)" fill="#8172B3" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === 'schemes' && (
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">全加固方案矩阵 - 经济与技术参数汇编总表</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-[#4C72B0] text-white">
                      <tr>
                        <th className="p-3 rounded-tl-lg">综合排名</th>
                        <th className="p-3">全组合方案类型</th>
                        <th className="p-3">安全系数 (FS)</th>
                        <th className="p-3">估算总造价(万元)</th>
                        <th className="p-3">预估工期(天)</th>
                        <th className="p-3 rounded-tr-lg">结构及土方参数明细</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.all_results.map((row: any, idx: number) => (
                        <tr key={idx} className="border-b hover:bg-gray-50">
                          <td className="p-3 font-bold text-gray-700">Rank {idx + 1}</td>
                          <td className="p-3">{row.Method.replace('\n', '')}</td>
                          <td className="p-3 font-mono text-blue-600">{row.FS.toFixed(3)}</td>
                          <td className="p-3 font-mono text-red-600">{row.Cost_W.toFixed(2)}</td>
                          <td className="p-3 font-mono text-purple-600">{Math.ceil(row.Time_d)}</td>
                          <td className="p-3 text-gray-600">{row.Param.replace('\n', ' | ')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <h3 className="font-bold text-gray-800 mt-8 mb-4 border-b pb-2">二维物理环境及滑面转移分析</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {results.all_results.map((row: any, idx: number) => (
                    <div key={idx} className="relative">
                      {renderSlope2D(row.Plot_Data, row.Plot_Data.circle, `[Rank ${idx + 1}] ${row.Method.replace('\n', '')}`)}
                      <div className="absolute top-12 right-6 bg-white/80 px-2 py-1 rounded text-[10px] font-bold shadow-sm">
                        FS: {row.FS.toFixed(3)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SlopeAnalysis;
