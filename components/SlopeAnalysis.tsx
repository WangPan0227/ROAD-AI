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

import { Tab, InfrastructureState } from '../types';

const SlopeAnalysis: React.FC<{ activeInfrastructure?: InfrastructureState }> = ({ activeInfrastructure }) => {
  const [isCalculating, setIsCalculating] = useState(false);
  const [damageLevel, setDamageLevel] = useState<number>(0);
  const [crackDistance, setCrackDistance] = useState<number>(1.5); // 默认裂缝距边缘1.5m
  const [DAMAGE_MAP, setDamageMap] = useState<Record<number, any>>({
    0: { c_factor: 1.0, phi_factor: 1.0, crack_depth: 0, add_water_pressure: false, desc: "无损伤(设计态)" }
  });
  const [isOptimizing, setIsOptimizing] = useState(false);

  useEffect(() => {
    const savedAtlas = localStorage.getItem('roadbedguard_slope_disease_matrix');
    if (savedAtlas) {
      try {
        const parsed = JSON.parse(savedAtlas);
        const newMap: Record<number, any> = {
          0: { c_factor: 1.0, phi_factor: 1.0, crack_depth: 0, add_water_pressure: false, desc: "无损伤(设计态)" }
        };
        parsed.forEach((p: any) => {
          newMap[p.level] = {
            c_factor: p.schema.c_factor,
            phi_factor: p.schema.phi_factor,
            crack_depth: p.schema.crack_depth,
            add_water_pressure: p.schema.add_water_pressure,
            desc: p.name
          };
        });
        setDamageMap(newMap);
      } catch(e) {
        console.error("加载病害图谱数据失败", e);
      }
    }
  }, []);
  const [hasOptimized, setHasOptimized] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'status' | 'dashboard' | 'schemes'>('status');

  // Parameters State
  const [slopeParams, setSlopeParams] = useState({
    height: 10.0,
    angle: 45.0,
    soilLayers: [
      { thickness: 5.0, gamma: 18.0, c: 10.0, phi: 15.0 },
      { thickness: 5.0, gamma: 20.0, c: 25.0, phi: 22.0 },
      { thickness: 10.0, gamma: 22.0, c: 50.0, phi: 30.0 }
    ],
    rainfall: 50.0,
    groundwater: 4.0,
    seismicKh: 0.0
  });

  const [segments, setSegments] = useState([
    { 
      id: 'slope-1', 
      name: 'K105+300 右侧边坡',
      params: {
        height: 10.0,
        angle: 45.0,
        soilLayers: [
          { thickness: 5.0, gamma: 18.0, c: 10.0, phi: 15.0 },
          { thickness: 5.0, gamma: 20.0, c: 25.0, phi: 22.0 },
          { thickness: 10.0, gamma: 22.0, c: 50.0, phi: 30.0 }
        ],
        rainfall: 50.0,
        groundwater: 4.0,
        seismicKh: 0.0
      }
    }
  ]);
  const [activeSegmentId, setActiveSegmentId] = useState('slope-1');

  const [editingSegmentId, setEditingSegmentId] = useState<string | null>(null);
  const [editSegmentName, setEditSegmentName] = useState('');

  const updateParam = (key: string, value: any) => {
    setSlopeParams(prev => ({ ...prev, [key]: value }));
  };

  // 替换 SlopeAnalysis.tsx 中的这两个函数
  const addSegment = () => {
    const newId = `slope-${segments.length + 1}`;
    const newSegment = {
      id: newId,
      name: `新边坡分段 ${segments.length + 1}`,
      // 使用序列化进行深拷贝，彻底阻断不同边坡之间的状态污染
      params: JSON.parse(JSON.stringify(slopeParams)) 
    };
    setSegments(prev => [...prev, newSegment]);
    setActiveSegmentId(newId);
  };

  const deleteSegment = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (segments.length === 1) {
      alert('工作区至少需要保留一个边坡分段！');
      return;
    }
    const newSegments = segments.filter(seg => seg.id !== id);
    setSegments(newSegments);
    if (activeSegmentId === id) {
      setActiveSegmentId(newSegments[0].id);
    }
  };

  const saveSegmentName = (id: string) => {
    if (editSegmentName.trim()) {
      setSegments(prev => prev.map(seg => seg.id === id ? { ...seg, name: editSegmentName } : seg));
    }
    setEditingSegmentId(null);
  };

  // 1. 替换 SlopeAnalysis.tsx 中的 saveCurrentParams 函数
  const saveCurrentParams = () => {
    // 保存到左侧的分段状态中
    setSegments(prev => prev.map(seg => 
      seg.id === activeSegmentId ? { ...seg, params: JSON.parse(JSON.stringify(slopeParams)) } : seg
    ));

    // 打包分析结果，归档至“历史训练库”
    const activeSeg = segments.find(s => s.id === activeSegmentId);
    const historyRecord = {
      id: `hist-${Date.now()}`,
      name: activeSeg ? activeSeg.name : '未命名边坡案例',
      date: new Date().toLocaleString(),
      notes: '暂无备注说明。',
      params: JSON.parse(JSON.stringify(slopeParams)),
      // 提取核心计算结果（如果已经计算过的话）
      results: results ? {
          FS0: results.FS0,
          gap: results.gap,
          circ0: results.circ0,
          // 如果做过正交推演，提取 Rank 1 的方案
          bestScheme: results.all_results?.length > 0 ? results.all_results[0] : null
      } : null
    };

    const existingHistory = JSON.parse(localStorage.getItem('roadbedguard_slope_history') || '[]');
    localStorage.setItem('roadbedguard_slope_history', JSON.stringify([historyRecord, ...existingHistory]));

    alert('案例及分析结果已成功归档至【边坡历史训练库】！');
  };

  // Load params when switching segments
  useEffect(() => {
    const activeSeg = segments.find(s => s.id === activeSegmentId);
    if (activeSeg) {
      setSlopeParams(activeSeg.params);
    }
  }, [activeSegmentId]);

  // 新增：监听跨组件的历史案例载入请求
  useEffect(() => {
    const pendingLoad = localStorage.getItem('roadbedguard_pending_slope_load');
    if (pendingLoad) {
      try {
        const loadedParams = JSON.parse(pendingLoad);
        const newId = `slope-loaded-${Date.now()}`;
        const newSegment = {
          id: newId,
          name: `[历史载入] ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}`,
          params: loadedParams
        };
        // 1. 创建新草稿段落
        setSegments(prev => [...prev, newSegment]);
        // 2. 激活新段落
        setActiveSegmentId(newId);
        // 3. 覆盖当前表单参数
        setSlopeParams(loadedParams);
        // 4. 清除缓存，避免重复载入
        localStorage.removeItem('roadbedguard_pending_slope_load');
        // 5. 自动切回状态页并清除旧结果
        setResults(null); 
        setActiveTab('status');
      } catch(e) {
        console.error("历史数据载入失败", e);
      }
    }
  }, []); // 空依赖数组，仅在组件挂载(切换Tab)时触发一次

  const runStatusAnalysis = () => {
    setIsCalculating(true);
    setHasOptimized(false);
    setActiveTab('status');
    
    setTimeout(() => {
      const cfg = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
      
      cfg.Geometry.H = slopeParams.height;
      cfg.Geometry.beta = slopeParams.angle;
      cfg.Seismic.k_h = slopeParams.seismicKh;
      cfg.Water.has_water = slopeParams.groundwater < slopeParams.height;
      cfg.Water.y_gwt = slopeParams.groundwater;

      let currentElev = slopeParams.height;
      cfg.Geotech.soil_layers = slopeParams.soilLayers.map((layer, idx) => {
        const top_elev = currentElev;
        currentElev -= layer.thickness;
        return {
          top_elev,
          gamma: layer.gamma,
          c: layer.c,
          phi: layer.phi,
          desc: `土层 ${idx + 1}`
        };
      });

      const geom = cfg.Geometry;
      const beta_rad = geom.beta * Math.PI / 180.0;
      const orig_geom = (x: number) => get_original_elevation(x, geom.H, beta_rad);
      
      // 注入从图谱获取的折减系数，以及用户自定义的裂缝水平位置
      cfg.Damage = { ...DAMAGE_MAP[damageLevel], crack_distance: crackDistance };
      const { min_FS: FS0, best_T: T0, best_R: R0, best_slip_depth: slip0, best_circle: circ0 } = compute_stability(orig_geom, geom.H, beta_rad, cfg);
      
      const gap = Math.max(0, cfg.Target.FS_target * T0 - R0);

      setResults({ 
        FS0, 
        T0, 
        R0, 
        gap,
        circ0, 
        slip0,
        all_results: [], 
        cfg 
      });
      setIsCalculating(false);
    }, 500);
  };

  const runOptimization = () => {
    if (!results) return;
    setIsOptimizing(true);
    
    setTimeout(() => {
      const { cfg, T0, R0, slip0, circ0 } = results;
      const geom = cfg.Geometry;
      
      // [新增联动] 动态读取加固措施库中用户自定义的经济工期指标
      const customEco = localStorage.getItem('roadbedguard_slope_economics');
      if (customEco) {
          try {
              cfg.Economics = { ...cfg.Economics, ...JSON.parse(customEco) };
          } catch(e) {
              console.error("读取经济参数失败", e);
          }
      }
      
      const all_results = eval_all_combinations_matrix(geom, cfg, cfg.Target.FS_target, T0, R0, slip0, circ0);

      setResults(prev => ({ ...prev, all_results }));
      setHasOptimized(true);
      setActiveTab('dashboard');
      setIsOptimizing(false);
    }, 800);
  };

  // 替换 SlopeAnalysis.tsx 中的 renderSlope2D 函数
  const renderSlope2D = (p_data: any, circle: [number, number, number], title: string, isOriginal = false, providedFS?: number) => {
    const cfg = results?.cfg || DEFAULT_CONFIG;
    const geom = cfg.Geometry;
    const beta_rad = geom.beta * Math.PI / 180.0;
    const L_slope = geom.H / Math.tan(beta_rad);
    
    // 扩大画布分辨率，提升清晰度
    const width = 600;
    const height = 350;
    const padding = 35; 
    
    const xMin = -5;
    const xMax = L_slope + 10;
    const yMin = -geom.H * 0.6; 
    const yMax = geom.H + 5;
    
    const scaleX = (width - 2 * padding) / (xMax - xMin);
    const scaleY = (height - 2 * padding) / (yMax - yMin);
    const scale = Math.min(scaleX, scaleY);
    
    const cx = (x: number) => padding + (x - xMin) * scale;
    const cy = (y: number) => height - padding - (y - yMin) * scale;

    const x_plot = Array.from({ length: 150 }, (_, i) => xMin + i * (xMax - xMin) / 149);
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
    const clipPolygon = `${cx(xMin)},${cy(yMin)} ${cx(xMin)},${cy(curr_surf(xMin))} ${currPoints} ${cx(xMax)},${cy(curr_surf(xMax))} ${cx(xMax)},${cy(yMin)}`;

    const [Xc, Yc, R] = circle;
    const theta = Array.from({ length: 150 }, (_, i) => Math.PI + i * Math.PI / 149);
    // 提取底层传来的截断坐标 x_end (如果没有则默认一直画到坡顶最右侧)
    const x_end_limit = circle.length > 3 ? circle[3] : xMax;
    const circCoords = theta.map(t => ({ x: Xc + R * Math.cos(t), y: Yc + R * Math.sin(t) }))
                            .filter(p => p.y <= curr_surf(p.x) && p.x >= xMin && p.x <= x_end_limit);
    const circPoints = circCoords.map(p => `${cx(p.x)},${cy(p.y)}`).join(' ');

    const layerColors = ['#e6ccb2', '#ddb892', '#b08968', '#7f5539', '#9c6644'];
    
    // 尝试从多种途径获取正确的 FS 值进行显示
    let displayFS = providedFS;
    if (!displayFS && p_data?.FS) displayFS = p_data.FS;
    if (!displayFS && isOriginal) displayFS = results.FS0;

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col items-center w-full overflow-hidden">
        <div className="w-full bg-gray-50 border-b border-gray-100 py-2 px-4 flex justify-between items-center">
            <h4 className="font-bold text-gray-700 text-sm truncate pr-4" title={title}>{title}</h4>
            {displayFS && (
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${displayFS < cfg.Target.FS_target ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    FS = {displayFS.toFixed(3)}
                </span>
            )}
        </div>
        
        <div className="p-4 w-full flex justify-center">
            <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="bg-slate-50 border border-slate-200 shadow-inner rounded" style={{maxHeight: '350px'}}>
            <defs>
                {/* 工程网格背景 */}
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e2e8f0" strokeWidth="0.5"/>
                </pattern>
                {/* 箭头定义 */}
                <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" />
                </marker>
                
                <clipPath id={`slope-clip-${title.replace(/[^a-zA-Z0-9]/g, '')}`}>
                <polygon points={clipPolygon} />
                </clipPath>
                {circCoords.length > 0 && (
                <clipPath id={`slip-clip-${title.replace(/[^a-zA-Z0-9]/g, '')}`}>
                    <polygon points={`${circPoints} ${cx(circCoords[circCoords.length-1].x)},${cy(yMax)} ${cx(circCoords[0].x)},${cy(yMax)}`} />
                </clipPath>
                )}
            </defs>

            {/* 画网格 */}
            <rect width={width} height={height} fill="url(#grid)" />

            {/* 1. 渲染多层土 & 注记 */}
            <g clipPath={`url(#slope-clip-${title.replace(/[^a-zA-Z0-9]/g, '')})`}>
                {cfg.Geotech.soil_layers.map((layer: any, idx: number) => {
                const bottomY = idx === cfg.Geotech.soil_layers.length - 1 ? yMin : cfg.Geotech.soil_layers[idx + 1].top_elev;
                const midY = (layer.top_elev + Math.max(bottomY, yMin)) / 2;
                return (
                    <g key={idx}>
                        <rect x={cx(xMin)} y={cy(layer.top_elev)} width={cx(xMax) - cx(xMin)} height={cy(bottomY) - cy(layer.top_elev)} fill={layerColors[idx % layerColors.length]} opacity="0.85" />
                        {/* 智能注记：只有当图层厚度在屏幕上足够高时才显示文字 */}
                        {(cy(bottomY) - cy(layer.top_elev)) > 20 && (
                            <text x={cx(xMax - 1)} y={cy(midY)} fontSize="11" fill="#fff" fontWeight="bold" opacity="0.6" textAnchor="end" dominantBaseline="middle">
                                {layer.desc} (γ={layer.gamma})
                            </text>
                        )}
                    </g>
                );
                })}
                
                {/* 2. 国标地下水位线 */}
                {cfg.Water.has_water && (
                <g>
                    <line x1={cx(xMin)} y1={cy(cfg.Water.y_gwt)} x2={cx(xMax)} y2={cy(cfg.Water.y_gwt)} stroke="#0ea5e9" strokeWidth="1.5" strokeDasharray="8,4" />
                    {/* 倒三角水位符号 */}
                    <g transform={`translate(${cx(xMax - 3)}, ${cy(cfg.Water.y_gwt)})`}>
                        <polygon points="-5,-6 5,-6 0,0" fill="none" stroke="#0ea5e9" strokeWidth="1.5"/>
                        <line x1="-7" y1="-6" x2="7" y2="-6" stroke="#0ea5e9" strokeWidth="1.5"/>
                        <line x1="-4" y1="-8" x2="4" y2="-8" stroke="#0ea5e9" strokeWidth="1"/>
                        <line x1="-2" y1="-10" x2="2" y2="-10" stroke="#0ea5e9" strokeWidth="1"/>
                    </g>
                </g>
                )}

                {/* 3. 滑动体高亮预警 */}
                {circCoords.length > 0 && (
                <polygon points={`${circPoints} ${currPoints.split(' ').reverse().join(' ')}`} fill="#ef4444" opacity="0.2" />
                )}
            </g>

            {/* 4. 原地形虚线 */}
            {!isOriginal && <polyline points={origPoints} fill="none" stroke="#94a3b8" strokeWidth="2" strokeDasharray="5,5" />}

            {/* 5. 现地形实线边界 */}
            <polyline points={currPoints} fill="none" stroke="#1e293b" strokeWidth="3" />

            {/* 张裂缝与积水渲染 (应急模式) */}
            {cfg.Damage && cfg.Damage.crack_depth > 0 && (
              <g>
                <line 
                  x1={cx(L_slope + (cfg.Damage.crack_distance || 0))} 
                  y1={cy(geom.H)} 
                  x2={cx(L_slope + (cfg.Damage.crack_distance || 0))} 
                  y2={cy(geom.H - cfg.Damage.crack_depth)} 
                  stroke="#1e293b" strokeWidth="3" strokeDasharray="4,2" 
                />
                {cfg.Damage.add_water_pressure && (
                  <line 
                    x1={cx(L_slope + (cfg.Damage.crack_distance || 0) - 0.3)} 
                    y1={cy(geom.H)} 
                    x2={cx(L_slope + (cfg.Damage.crack_distance || 0) - 0.3)} 
                    y2={cy(geom.H - cfg.Damage.crack_depth)} 
                    stroke="#3b82f6" strokeWidth="2.5" 
                  />
                )}
              </g>
            )}

            {/* 6. 结构加固渲染 (微型桩/锚索) */}
            {!isOriginal && p_data && (
                <>
                {(p_data.sub_type === 'pile' || p_data.sub_type === 'pile_anchor') && (
                    <line x1={cx(L_slope/2)} y1={cy(curr_surf(L_slope/2))} x2={cx(L_slope/2)} y2={cy(curr_surf(L_slope/2) - p_data.L)} stroke="#1e40af" strokeWidth="7" strokeLinecap="round" />
                )}
                {(p_data.sub_type === 'anchor' || p_data.sub_type === 'pile_anchor') && (
                    <g>
                    <line x1={cx(L_slope*0.4)} y1={cy(curr_surf(L_slope*0.4))} x2={cx(L_slope*0.4 + p_data.L_total * Math.cos(15*Math.PI/180))} y2={cy(curr_surf(L_slope*0.4) - p_data.L_total * Math.sin(15*Math.PI/180))} stroke="#d946ef" strokeWidth="3.5" />
                    <circle cx={cx(L_slope*0.4)} cy={cy(curr_surf(L_slope*0.4))} r="3.5" fill="#86198f" />
                    </g>
                )}
                </>
            )}

            {/* 7. 地震动荷载标示 (Kh) */}
            {cfg.Seismic.k_h > 0 && (
                <g transform={`translate(${cx(-2)}, ${cy(yMax - 1)})`}>
                    <line x1="0" y1="0" x2="35" y2="0" stroke="#ef4444" strokeWidth="2" markerEnd="url(#arrow)" />
                    <text x="17" y="-5" fill="#ef4444" fontSize="12" fontWeight="bold" textAnchor="middle">Kh={cfg.Seismic.k_h}</text>
                </g>
            )}

            {/* 8. 最危险滑面红线 */}
            <polyline points={circPoints} fill="none" stroke="#ef4444" strokeWidth="3" strokeDasharray="6,4" />
            
            </svg>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full p-6 overflow-hidden bg-gray-100">
      {/* LEFT: Parameter Sidebar */}
      <div className="lg:col-span-3 flex flex-col space-y-4 h-full overflow-hidden">
        {/* Slope Segment Management */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col max-h-[30%]">
          <div className="p-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-bold text-gray-700 text-sm">边坡段管理</h3>
            <button 
              onClick={addSegment}
              className="text-primary hover:text-blue-700 text-xs font-bold flex items-center"
            >
              <span className="text-lg mr-1">+</span> Add
            </button>
          </div>
          <div className="overflow-y-auto p-2 space-y-2 flex-1">
            {segments.map(seg => (
              <div 
                key={seg.id}
                onClick={() => {
                  if (editingSegmentId !== seg.id) setActiveSegmentId(seg.id);
                }}
                className={`p-3 rounded-lg border cursor-pointer transition-all group ${
                  activeSegmentId === seg.id 
                  ? 'bg-blue-50 border-primary shadow-sm' 
                  : 'bg-white border-gray-100 hover:border-gray-300'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 pr-2">
                    {editingSegmentId === seg.id ? (
                      <input
                        autoFocus
                        value={editSegmentName}
                        onChange={(e) => setEditSegmentName(e.target.value)}
                        onBlur={() => saveSegmentName(seg.id)}
                        onKeyDown={(e) => e.key === 'Enter' && saveSegmentName(seg.id)}
                        className="w-full text-sm font-bold text-gray-800 bg-transparent border-b border-primary focus:outline-none focus:ring-0 p-0"
                      />
                    ) : (
                      <div className="font-bold text-sm text-gray-800 flex items-center">
                        <span className="truncate max-w-[120px]">{seg.name}</span>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditSegmentName(seg.name);
                            setEditingSegmentId(seg.id);
                          }}
                          className="ml-2 text-gray-400 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                          title="重命名"
                        >
                          ✏️
                        </button>
                      </div>
                    )}
                    <div className="text-xs text-gray-500 mt-1">ID: {seg.id}</div>
                  </div>
                  <button 
                    onClick={(e) => deleteSegment(e, seg.id)}
                    className="text-gray-300 hover:text-red-500 font-bold px-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="移除该分段"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
{/* 2. 替换保存按钮的代码 */}
          <div className="p-2 border-t bg-gray-50">
            <button 
              onClick={saveCurrentParams}
              className="w-full py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow transition-colors flex justify-center items-center"
            >
              💾 归档当前案例至历史库
            </button>
          </div>
        </div>

        {/* Parameter Configuration Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex-1 overflow-y-auto">
          <div className="p-3 bg-blue-50 border-b border-blue-100">
            <h3 className="font-bold text-primary text-sm">参数配置</h3>
          </div>
          <div className="p-4 space-y-5 text-sm">
            {/* Group 1: Basic Geometry */}
            <div className="space-y-3">
              <h4 className="font-bold text-gray-700 text-xs flex items-center">
                <span className="w-1 h-3 bg-gray-400 mr-2 rounded"></span>
                基础几何属性
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-gray-400 uppercase mb-1">边坡高度 (m)</label>
                  <input 
                    type="number" 
                    className="w-full border rounded p-1.5 text-xs" 
                    value={slopeParams.height} 
                    onChange={e => updateParam('height', parseFloat(e.target.value))} 
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 uppercase mb-1">边坡坡角 (°)</label>
                  <input 
                    type="number" 
                    className="w-full border rounded p-1.5 text-xs" 
                    value={slopeParams.angle} 
                    onChange={e => updateParam('angle', parseFloat(e.target.value))} 
                  />
                </div>
              </div>
            </div>

            {/* Group 2: Soil Layers (Refactored) */}
            <div className="space-y-3 pt-2 border-t border-gray-100">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-secondary text-xs flex items-center">
                  <span className="w-1 h-3 bg-secondary mr-2 rounded"></span>
                  地层参数 (Soil Layers)
                </h4>
                <button 
                  onClick={() => {
                    const newLayers = [...slopeParams.soilLayers, { thickness: 2, gamma: 18, c: 10, phi: 15 }];
                    updateParam('soilLayers', newLayers);
                  }}
                  className="text-[10px] bg-secondary/10 text-secondary px-2 py-0.5 rounded hover:bg-secondary/20 font-bold"
                >
                  + Add Layer
                </button>
              </div>
              <div className="space-y-3">
                {slopeParams.soilLayers.map((layer, idx) => (
                  <div key={idx} className="p-2 bg-gray-50 rounded border border-gray-100 relative group">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-bold text-gray-500">层 {idx + 1}</span>
                      {slopeParams.soilLayers.length > 1 && (
                        <button 
                          onClick={() => {
                            const newLayers = slopeParams.soilLayers.filter((_, i) => i !== idx);
                            updateParam('soilLayers', newLayers);
                          }}
                          className="text-red-400 hover:text-red-600 text-[10px]"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] text-gray-400 uppercase">层厚(m)</label>
                        <input 
                          type="number" 
                          className="w-full border rounded p-1 text-[11px]" 
                          value={layer.thickness} 
                          onChange={e => {
                            const newLayers = [...slopeParams.soilLayers];
                            newLayers[idx].thickness = parseFloat(e.target.value);
                            updateParam('soilLayers', newLayers);
                          }} 
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] text-gray-400 uppercase">重度(kN/m³)</label>
                        <input 
                          type="number" 
                          className="w-full border rounded p-1 text-[11px]" 
                          value={layer.gamma} 
                          onChange={e => {
                            const newLayers = [...slopeParams.soilLayers];
                            newLayers[idx].gamma = parseFloat(e.target.value);
                            updateParam('soilLayers', newLayers);
                          }} 
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] text-gray-400 uppercase">粘聚力 c(kPa)</label>
                        <input 
                          type="number" 
                          className="w-full border rounded p-1 text-[11px]" 
                          value={layer.c} 
                          onChange={e => {
                            const newLayers = [...slopeParams.soilLayers];
                            newLayers[idx].c = parseFloat(e.target.value);
                            updateParam('soilLayers', newLayers);
                          }} 
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] text-gray-400 uppercase">内摩擦角 φ(°)</label>
                        <input 
                          type="number" 
                          className="w-full border rounded p-1 text-[11px]" 
                          value={layer.phi} 
                          onChange={e => {
                            const newLayers = [...slopeParams.soilLayers];
                            newLayers[idx].phi = parseFloat(e.target.value);
                            updateParam('soilLayers', newLayers);
                          }} 
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Group 3: Environmental Conditions */}
            <div className="space-y-3 pt-2 border-t border-gray-100">
              <h4 className="font-bold text-accent text-xs flex items-center">
                <span className="w-1 h-3 bg-accent mr-2 rounded"></span>
                环境工况
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-gray-400 uppercase mb-1">近3日降雨 (mm)</label>
                  <input 
                    type="number" 
                    className="w-full border rounded p-1.5 text-xs" 
                    value={slopeParams.rainfall} 
                    onChange={e => updateParam('rainfall', parseFloat(e.target.value))} 
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 uppercase mb-1">地下水位 (m)</label>
                  <input 
                    type="number" 
                    className="w-full border rounded p-1.5 text-xs" 
                    value={slopeParams.groundwater} 
                    onChange={e => updateParam('groundwater', parseFloat(e.target.value))} 
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 uppercase mb-1">地震水平加速度系数 (Kh)</label>
                <input 
                  type="number" 
                  step="0.01"
                  className="w-full border rounded p-1.5 text-xs" 
                  value={slopeParams.seismicKh} 
                  onChange={e => updateParam('seismicKh', parseFloat(e.target.value))} 
                />
              </div>
            </div>

            {/* Group 4: 灾损与病害参数 (应急评估) */}
            <div className="space-y-3 pt-3 border-t border-gray-100 mt-4">
              <h4 className="font-bold text-red-500 text-xs flex items-center">
                <span className="w-1 h-3 bg-red-500 mr-2 rounded"></span>
                灾损与病害参数 (应急评估)
              </h4>
              <div className={`p-3 rounded-lg border ${damageLevel > 0 ? 'bg-red-50 border-red-200 shadow-sm' : 'bg-gray-50 border-gray-200'}`}>
                <label className="block text-[10px] text-gray-500 uppercase font-bold mb-1">选择病害图谱等级</label>
                <select 
                  className="w-full border rounded border-gray-300 p-1.5 text-xs mb-3 bg-white text-gray-800 font-bold focus:ring-red-500 focus:border-red-500"
                  value={damageLevel}
                  onChange={e => setDamageLevel(Number(e.target.value))}
                >
                  <option value={0}>0级：完好状态 (无折减)</option>
                  <option value={1}>Ⅰ级：轻微变形 (微小折减)</option>
                  <option value={2}>Ⅱ级：中度损伤 (局部裂缝)</option>
                  <option value={3}>Ⅲ级：严重破坏 (贯通裂缝+渗水)</option>
                  <option value={4}>Ⅳ级：灾难失稳 (残余强度)</option>
                </select>

                {damageLevel > 0 && (
                  <div className="space-y-2 animate-fade-in">
                    <div className="bg-white p-2 rounded border border-red-100 text-xs">
                      {/* 展示图谱映射的核心指标 */}
                      <div className="grid grid-cols-2 gap-2 mb-2 pb-2 border-b border-gray-50">
                        <div><span className="text-gray-400 block text-[9px]">c 值保留比例</span><span className="font-bold text-red-600">{Math.round(DAMAGE_MAP[damageLevel].c_factor * 100)}%</span></div>
                        <div><span className="text-gray-400 block text-[9px]">φ 值保留比例</span><span className="font-bold text-red-600">{Math.round(DAMAGE_MAP[damageLevel].phi_factor * 100)}%</span></div>
                        <div><span className="text-gray-400 block text-[9px]">图谱裂缝深度</span><span className="font-bold text-gray-700">{DAMAGE_MAP[damageLevel].crack_depth} m</span></div>
                        <div><span className="text-gray-400 block text-[9px]">裂缝充水推力</span><span className="font-bold text-gray-700">{DAMAGE_MAP[damageLevel].add_water_pressure ? '计算考虑' : '无'}</span></div>
                      </div>
                      
                      {/* 用户自定义位置 */}
                      <label className="block text-[10px] text-gray-500 font-bold mb-1 mt-2">📍 裂缝距坡顶边缘距离 (m)</label>
                      <input 
                        type="number" 
                        step="0.5"
                        className="w-full border rounded border-gray-300 p-1 text-xs" 
                        value={crackDistance} 
                        onChange={e => setCrackDistance(parseFloat(e.target.value))} 
                        title="设置实际观测到的裂缝水平位置"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-4 border-t bg-gray-50 sticky bottom-0">
            <button 
              onClick={runStatusAnalysis}
              disabled={isCalculating || isOptimizing}
              className="w-full bg-primary hover:bg-blue-700 text-white font-bold py-2 rounded-lg shadow-lg transition-all transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center text-sm"
            >
              {isCalculating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  现状分析中...
                </>
              ) : '运行极限平衡分析'}
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT: Main Content Area */}
      <div className="lg:col-span-9 flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-white p-4 border-b flex justify-between items-center shadow-sm z-10">
          <div>
            <h2 className="text-lg font-bold text-gray-800">边坡综合加固设计系统 v11.0</h2>
            <p className="text-xs text-gray-500">分步式现状评估与加固措施正交推演工作流</p>
          </div>
          <div className="flex space-x-3">
            {results && !hasOptimized && (
              <button 
                onClick={runOptimization}
                disabled={isOptimizing}
                className="bg-secondary hover:bg-opacity-90 text-white px-6 py-2 rounded-lg font-bold shadow transition-all disabled:opacity-50 flex items-center text-sm animate-pulse"
              >
                {isOptimizing ? '推演中...' : '🚀 启动加固措施模拟优化'}
              </button>
            )}
            <button 
              onClick={runStatusAnalysis}
              disabled={isCalculating || isOptimizing}
              className="bg-primary hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold shadow transition-all disabled:opacity-50 flex items-center text-sm"
            >
              {isCalculating ? '分析中...' : '重新现状分析'}
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
          {!results ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <div className="text-4xl mb-4">⛰️</div>
              <p>请在左侧配置边坡参数并点击运行分析</p>
              <p className="text-xs mt-2 text-gray-300">系统已升级至最新边坡稳定性评估标准</p>
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in">
              {/* Tabs */}
              <div className="flex space-x-4 border-b">
                <button 
                  onClick={() => setActiveTab('status')}
                  className={`pb-2 px-2 font-bold text-sm ${activeTab === 'status' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
                >
                  现状评估结果 (Status)
                </button>
                {hasOptimized && (
                  <>
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
                  </>
                )}
              </div>

              {activeTab === 'status' && (
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-4 border-b pb-2">
                      <h3 className="font-bold text-gray-800">现状边坡稳定性力学评估报告</h3>
                      {!hasOptimized && (
                        <button 
                          onClick={runOptimization}
                          disabled={isOptimizing}
                          className="text-xs bg-secondary text-white px-3 py-1.5 rounded font-bold hover:bg-opacity-90 transition-all flex items-center"
                        >
                          {isOptimizing ? '推演中...' : '启动加固推演'}
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-12 gap-6 items-start">
                      <div className="lg:col-span-8 w-full">
                        {renderSlope2D(null, results.circ0, `现状最危险滑面 (FS=${results.FS0.toFixed(3)})`, true)}
                      </div>
                      <div className="lg:col-span-4 flex flex-col space-y-4 w-full">
                        {/* 第一部分：核心力学指标看板 (Dashboard) */}
                        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                          <div className="bg-blue-50/50 px-4 py-2 border-b border-gray-100">
                            <h4 className="font-bold text-blue-900 text-sm flex items-center">
                              <span className="mr-2 text-base">📊</span> 核心力学指标看板
                            </h4>
                          </div>
                          <div className="p-4 grid grid-cols-1 gap-4">
                            <div className="text-center">
                              <p className="text-[10px] text-gray-500 uppercase font-bold mb-1 tracking-wider">初始安全系数 (FS0)</p>
                              <p className={`text-3xl font-mono font-bold ${results.FS0 < results.cfg.Target.FS_target ? 'text-red-600' : 'text-green-600'}`}>
                                {results.FS0.toFixed(3)}
                              </p>
                            </div>
                            <div className="text-center border-y border-gray-100 py-3">
                              <p className="text-[10px] text-gray-500 uppercase font-bold mb-1 tracking-wider">目标安全系数</p>
                              <p className="text-3xl font-mono font-bold text-gray-800">
                                {results.cfg.Target.FS_target.toFixed(2)}
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-[10px] text-gray-500 uppercase font-bold mb-1 tracking-wider">剩余下滑力缺口</p>
                              <div className="flex items-baseline justify-center">
                                <p className={`text-3xl font-mono font-bold ${results.gap > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                  {results.gap.toFixed(2)}
                                </p>
                                <span className="text-xs text-gray-400 ml-1 font-normal">kN/m</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 第二部分：综合工况参数确认 (Data Grid) */}
                        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                          <div className="bg-gray-50 px-4 py-2 border-b border-gray-100">
                            <h4 className="font-bold text-gray-700 text-sm flex items-center">
                              <span className="mr-2 text-base">📐</span> 综合工况参数确认
                            </h4>
                          </div>
                          <div className="p-3 grid grid-cols-2 gap-3">
                            <div className="bg-gray-50/50 p-2 rounded-lg border border-gray-100">
                              <p className="text-[9px] text-gray-400 uppercase font-bold mb-0.5">边坡高度</p>
                              <p className="text-sm font-bold text-gray-800">{results.cfg.Geometry.H} <span className="text-[10px] font-normal text-gray-400">m</span></p>
                            </div>
                            <div className="bg-gray-50/50 p-2 rounded-lg border border-gray-100">
                              <p className="text-[9px] text-gray-400 uppercase font-bold mb-0.5">边坡坡角</p>
                              <p className="text-sm font-bold text-gray-800">{results.cfg.Geometry.beta} <span className="text-[10px] font-normal text-gray-400">°</span></p>
                            </div>
                            <div className="bg-gray-50/50 p-2 rounded-lg border border-gray-100">
                              <p className="text-[9px] text-gray-400 uppercase font-bold mb-0.5">地下水位</p>
                              <p className="text-sm font-bold text-gray-800">{results.cfg.Water.y_gwt} <span className="text-[10px] font-normal text-gray-400">m</span></p>
                            </div>
                            <div className="bg-gray-50/50 p-2 rounded-lg border border-gray-100">
                              <p className="text-[9px] text-gray-400 uppercase font-bold mb-0.5">地震系数 (Kh)</p>
                              <p className="text-sm font-bold text-gray-800">{results.cfg.Seismic.k_h.toFixed(2)}</p>
                            </div>
                          </div>
                        </div>

                        {/* 第三部分：稳定性评估结论 (Alert Style) */}
                        <div className={`border-l-4 p-4 rounded-r-xl shadow-sm ${results.FS0 < results.cfg.Target.FS_target ? 'bg-red-50 border-red-500' : 'bg-green-50 border-green-500'}`}>
                          <div className="flex items-start">
                            <div className="flex-shrink-0 mt-0.5">
                              {results.FS0 < results.cfg.Target.FS_target ? (
                                <span className="text-xl">⚠️</span>
                              ) : (
                                <span className="text-xl">✅</span>
                              )}
                            </div>
                            <div className="ml-3">
                              <h3 className={`text-sm font-bold ${results.FS0 < results.cfg.Target.FS_target ? 'text-red-800' : 'text-green-800'}`}>
                                稳定性评估结论
                              </h3>
                              <div className={`mt-1 text-xs leading-relaxed ${results.FS0 < results.cfg.Target.FS_target ? 'text-red-700' : 'text-green-700'}`}>
                                <p>
                                  当前 FS0 为 
                                  <span className="font-bold mx-1">{results.FS0.toFixed(3)}</span>，
                                  {results.FS0 < results.cfg.Target.FS_target 
                                    ? `低于目标值 ${results.cfg.Target.FS_target}，边坡欠稳定。`
                                    : `高于目标值 ${results.cfg.Target.FS_target}，边坡稳定。`}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {!hasOptimized && (
                    <div className="flex justify-center py-8">
                      <button 
                        onClick={runOptimization}
                        disabled={isOptimizing}
                        className="group relative bg-secondary hover:bg-opacity-90 text-white px-12 py-4 rounded-2xl font-bold shadow-2xl transition-all transform hover:-translate-y-1 active:scale-95 disabled:opacity-50 flex flex-col items-center"
                      >
                        <span className="text-2xl mb-1">🚀</span>
                        <span className="text-lg">启动加固措施模拟优化</span>
                        <span className="text-xs font-normal opacity-80 mt-1">基于全方案矩阵的正交推演计算</span>
                        {isOptimizing && (
                          <div className="absolute inset-0 bg-secondary rounded-2xl flex items-center justify-center">
                            <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          </div>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-12 gap-6">
                    {/* Pre-analysis */}
                    <div className="lg:col-span-6 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                      <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">图1：加固前边坡现状稳定性力学评估</h3>
                      <div className="flex flex-col gap-4">
                        {renderSlope2D(null, results.circ0, `最危险滑面 (FS=${results.FS0.toFixed(3)})`, true)}
                        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-sm">
                          <p className="font-bold mb-2">【边坡空间属性】</p>
                          <ul className="list-disc pl-5 mb-4 text-gray-700">
                            <li>坡高: {results.cfg.Geometry.H}m | 坡角: {results.cfg.Geometry.beta}°</li>
                            <li>全宽: {results.cfg.Geometry.W_slope}m</li>
                          </ul>
                          <p className="font-bold mb-2">【力学评估结论】</p>
                          <ul className="list-disc pl-5 text-gray-700">
                            <li>现状 FS0 = {results.FS0.toFixed(3)} (低于目标 {results.cfg.Target.FS_target})</li>
                            <li className={results.FS0 < results.cfg.Target.FS_target ? "text-red-600 font-bold" : "text-green-600 font-bold"}>
                              状态：{results.FS0 < results.cfg.Target.FS_target ? "失稳，需加固" : "稳定"}
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Best Scheme */}
                    {results.all_results.length > 0 && (
                      <div className="lg:col-span-6 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">全局最优 Rank 1 空间剖面图</h3>
                        <div className="flex flex-col gap-4">
                          {renderSlope2D(results.all_results[0].Plot_Data, results.all_results[0].Plot_Data.circle, results.all_results[0].Method, false, results.all_results[0].FS)}
                          <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg text-sm">
                            <p className="font-bold mb-2 text-primary">【最终加固决策输出报告】</p>
                            <p className="font-bold mt-2">1. 核心推荐方案：</p>
                            <p className="text-blue-600 font-bold ml-2">★ {results.all_results[0].Method.replace('\n', '')} ★</p>
                            <ul className="list-disc pl-6 mb-2 text-gray-700">
                              <li>详细参数：{results.all_results[0].Param.replace('\n', ' | ')}</li>
                              <li>验算结果：加固后 FS = {results.all_results[0].FS.toFixed(3)} (达标)</li>
                            </ul>
                            <p className="font-bold mt-2">2. 工程经济指标：</p>
                            <ul className="list-disc pl-6 mb-2 text-gray-700">
                              <li>估算造价：<span className="text-red-600 font-bold">{results.all_results[0].Cost_W.toFixed(2)} 万元</span> | 工期：<span className="text-purple-600 font-bold">{Math.ceil(results.all_results[0].Time_d)} 天</span></li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Charts */}
                  {results.all_results.length > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                    </div>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {results.all_results.map((row: any, idx: number) => (
                      <div key={idx} className="flex flex-col min-h-0">
                        {renderSlope2D(row.Plot_Data, row.Plot_Data.circle, `[Rank ${idx + 1}] ${row.Method.replace('\n', '')}`, false, row.FS)}
                      </div>
                    ))}
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

export default SlopeAnalysis;
