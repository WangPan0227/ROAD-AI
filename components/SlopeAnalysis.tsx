import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell
} from 'recharts';
import { 
  Settings, Layers, AlertTriangle, Save, ShieldCheck, Activity, Trash2, Edit3, Plus, ArrowRight, Zap, Database
} from 'lucide-react';
import { 
  DEFAULT_CONFIG, 
  compute_stability, 
  eval_all_combinations_matrix, 
  get_original_elevation 
} from '../lib/slopeCalculations';

import { InfrastructureState } from '../types';

const SlopeAnalysis: React.FC<{ activeInfrastructure?: InfrastructureState }> = () => {
  const [isCalculating, setIsCalculating] = useState(false);
  const [damageLevel, setDamageLevel] = useState<number>(0);
  const [crackDistance, setCrackDistance] = useState<number>(1.5); // 默认裂缝距边缘1.5m
  const [DAMAGE_MAP] = useState<Record<number, any>>(() => {
    const initial: Record<number, any> = {
      0: { c_factor: 1.0, phi_factor: 1.0, crack_depth: 0, add_water_pressure: false, desc: "无损伤(设计态)" }
    };
    const savedAtlas = typeof window !== 'undefined' ? localStorage.getItem('roadbedguard_slope_disease_matrix') : null;
    if (savedAtlas) {
      try {
        const parsed = JSON.parse(savedAtlas);
        parsed.forEach((p: any) => {
          initial[p.level] = {
            c_factor: p.schema.c_factor,
            phi_factor: p.schema.phi_factor,
            crack_depth: p.schema.crack_depth,
            add_water_pressure: p.schema.add_water_pressure,
            desc: p.name
          };
        });
      } catch(e) {
        console.error("加载病害图谱数据失败", e);
      }
    }
    return initial;
  });
  const [hasOptimized, setHasOptimized] = useState(false);
  // Parameters State
  const [slopeParams, setSlopeParams] = useState(() => {
    const pendingLoad = typeof window !== 'undefined' ? localStorage.getItem('roadbedguard_pending_slope_load') : null;
    if (pendingLoad) {
      try {
        return JSON.parse(pendingLoad);
      } catch (e) {
        console.error("Failed to parse pending slope load", e);
      }
    }
    return {
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
    };
  });

  const [segments, setSegments] = useState(() => {
    const pendingLoad = typeof window !== 'undefined' ? localStorage.getItem('roadbedguard_pending_slope_load') : null;
    if (pendingLoad) {
      try {
        const loadedParams = JSON.parse(pendingLoad);
        const newId = `slope-loaded-${Date.now()}`;
        return [{
          id: newId,
          name: `载入案例 ${new Date().toLocaleTimeString()}`,
          params: loadedParams
        }];
      } catch (e) {
        console.error("Failed to load historical segments", e);
      }
    }
    return [
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
    ];
  });

  const [activeSegmentId, setActiveSegmentId] = useState(() => {
    return segments[0]?.id || 'slope-1';
  });

  const [results, setResults] = useState<any>(() => {
    const cfg = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    cfg.Geometry.H = slopeParams.height;
    cfg.Geometry.beta = slopeParams.angle;
    cfg.Seismic.k_h = slopeParams.seismicKh;
    cfg.Water.has_water = slopeParams.groundwater < slopeParams.height;
    cfg.Water.y_gwt = slopeParams.groundwater;

    cfg.Geotech.soil_layers = slopeParams.soilLayers.reduce((acc: any[], layer, idx) => {
      const top_elev = acc.length > 0 ? acc[acc.length - 1].top_elev - acc[acc.length - 1].thickness : slopeParams.height;
      acc.push({
        top_elev,
        thickness: layer.thickness,
        gamma: layer.gamma,
        c: layer.c,
        phi: layer.phi,
        desc: `土层 ${idx + 1}`
      });
      return acc;
    }, []);

    const geom = cfg.Geometry;
    const beta_rad = geom.beta * Math.PI / 180.0;
    const orig_geom = (x: number) => get_original_elevation(x, geom.H, beta_rad);
    
    // Note: DAMAGE_MAP is defined below, so we need to account for its absence here or move it up.
    // For the initializer, we just assume damage level 0.
    cfg.Damage = { c_factor: 1.0, phi_factor: 1.0, crack_depth: 0, add_water_pressure: false, crack_distance: 1.5 };
    const { min_FS: FS0, best_T: T0, best_R: R0, best_slip_depth: slip0, best_circle: circ0 } = compute_stability(orig_geom, geom.H, beta_rad, cfg);
    const gap = Math.max(0, cfg.Target.FS_target * T0 - R0);

    // Clean up localstorage if this was a pending load
    if (typeof window !== 'undefined' && localStorage.getItem('roadbedguard_pending_slope_load')) {
       localStorage.removeItem('roadbedguard_pending_slope_load');
    }

    return { FS0, T0, R0, gap, circ0, slip0, all_results: [], cfg };
  });

  const [activeTab, setActiveTab] = useState<'status' | 'dashboard' | 'schemes'>(() => {
    return typeof window !== 'undefined' && localStorage.getItem('roadbedguard_pending_slope_load') ? 'status' : 'status';
  });

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

  // Load state when segment changes - avoid double render by checking in render phase
  const [prevActiveSegId, setPrevActiveSegId] = useState(activeSegmentId);
  if (prevActiveSegId !== activeSegmentId) {
    setPrevActiveSegId(activeSegmentId);
    const activeSeg = segments.find(s => s.id === activeSegmentId);
    if (activeSeg) {
      setSlopeParams(activeSeg.params);
    }
  }

  const runStatusAnalysis = React.useCallback(() => {
    setIsCalculating(true);
    setHasOptimized(false);
    setActiveTab('status');
    
    const cfg = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    
    cfg.Geometry.H = slopeParams.height;
    cfg.Geometry.beta = slopeParams.angle;
    cfg.Seismic.k_h = slopeParams.seismicKh;
    cfg.Water.has_water = slopeParams.groundwater < slopeParams.height;
    cfg.Water.y_gwt = slopeParams.groundwater;

    cfg.Geotech.soil_layers = slopeParams.soilLayers.reduce((acc: any[], layer, idx) => {
      const top_elev = acc.length > 0 ? acc[acc.length - 1].top_elev - acc[acc.length - 1].thickness : slopeParams.height;
      acc.push({
        top_elev,
        thickness: layer.thickness,
        gamma: layer.gamma,
        c: layer.c,
        phi: layer.phi,
        desc: `土层 ${idx + 1}`
      });
      return acc;
    }, []);

    const geom = cfg.Geometry;
    const beta_rad = geom.beta * Math.PI / 180.0;
    const orig_geom = (x: number) => get_original_elevation(x, geom.H, beta_rad);
    
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
  }, [slopeParams, damageLevel, DAMAGE_MAP, crackDistance]);

  const runOptimization = () => {
    if (!results) return;
    setIsCalculating(true);
    
    // 深度拷贝 cfg 以避免直接修改状态
    const cfg = JSON.parse(JSON.stringify(results.cfg));
    const { T0, R0, slip0, circ0 } = results;
    const geom = cfg.Geometry;
    
    const customEco = typeof window !== 'undefined' ? localStorage.getItem('roadbedguard_slope_economics') : null;
    if (customEco) {
        try {
            cfg.Economics = { ...cfg.Economics, ...JSON.parse(customEco) };
        } catch(e) {
            console.error("读取经济参数失败", e);
        }
    }
    
    const all_results = eval_all_combinations_matrix(geom, cfg, cfg.Target.FS_target, T0, R0, slip0, circ0);

    setResults((prev: any) => ({ ...prev, all_results }));
    setHasOptimized(true);
    setActiveTab('dashboard');
    setIsCalculating(false);
  };

  useEffect(() => {
    // Initial analysis if not loaded from pending
    const pendingLoad = typeof window !== 'undefined' ? localStorage.getItem('roadbedguard_pending_slope_load') : null;
    if (!pendingLoad && !results) {
        setTimeout(() => {
            runStatusAnalysis();
        }, 0);
    }
  }, [results, runStatusAnalysis]); 

  const renderSlope2D = (p_data: any, circle: [number, number, number], title: string, isOriginal = false, providedFS?: number) => {
    const cfg = results?.cfg || DEFAULT_CONFIG;
    const geom = cfg.Geometry;
    const beta_rad = geom.beta * Math.PI / 180.0;
    const L_slope = geom.H / Math.tan(beta_rad);
    
    const width = 600;
    const height = 350;
    const padding = 35; 
    
    const xMin = -5;
    const xMax = L_slope + 10;
    const yMin = -geom.H * 0.6; 
    const yMax = geom.H + 5;
    
    const scale = Math.min((width - 2 * padding) / (xMax - xMin), (height - 2 * padding) / (yMax - yMin));
    
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
    const x_end_limit = circle.length > 3 ? circle[3] : xMax;
    const circCoords = theta.map(t => ({ x: Xc + R * Math.cos(t), y: Yc + R * Math.sin(t) }))
                            .filter(p => p.y <= curr_surf(p.x) && p.x >= xMin && p.x <= x_end_limit);
    const circPoints = circCoords.map(p => `${cx(p.x)},${cy(p.y)}`).join(' ');

    const layerColors = ['#f8fafc', '#f1f5f9', '#e2e8f0', '#cbd5e1', '#94a3b8']; 
    
    const displayFS = providedFS || (isOriginal ? results?.FS0 : p_data?.FS);

    return (
      <div className="bg-white rounded-lg border border-slate-200 flex flex-col items-center w-full overflow-hidden transition-all duration-300">
        <div className="w-full bg-slate-50 border-b border-slate-100 py-2 px-4 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className={`w-1.5 h-1.5 rounded-full ${displayFS && displayFS < cfg.Target.FS_target ? 'bg-red-500' : 'bg-emerald-500'}`} />
              <h4 className="font-bold text-slate-600 text-[10px] uppercase tracking-wider">{title}</h4>
            </div>
            {displayFS && (
                <div className="text-right">
                   <span className={`text-xs font-bold font-mono ${displayFS < (cfg?.Target?.FS_target ?? 1.15) ? 'text-red-500' : 'text-emerald-600'}`}>
                      FS: {displayFS?.toFixed(3) ?? '0.000'}
                   </span>
                </div>
            )}
        </div>
        
        <div className="p-4 w-full flex justify-center relative">
            <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible" style={{maxHeight: '300px'}}>
            <defs>
                <pattern id="grid-slope" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e2e8f0" strokeWidth="0.5"/>
                </pattern>
                
                <pattern id="soil-pattern" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="0.5" fill="#92400e" opacity="0.2" />
                </pattern>

                <filter id="concreteNoise" x="0" y="0" width="100%" height="100%">
                  <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="3" result="noise" />
                  <feDiffuseLighting in="noise" lightingColor="#f3f4f6" surfaceScale="1">
                    <feDistantLight azimuth="45" elevation="60" />
                  </feDiffuseLighting>
                </filter>

                <filter id="glow">
                  <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                
                <clipPath id={`slope-clip-${title.replace(/[^a-zA-Z0-9]/g, '')}`}>
                   <polygon points={clipPolygon} />
                </clipPath>
            </defs>

            <rect width={width} height={height} fill="url(#grid-slope)" />

            <g clipPath={`url(#slope-clip-${title.replace(/[^a-zA-Z0-9]/g, '')})`}>
                {cfg.Geotech.soil_layers.map((layer: any, idx: number) => {
                const bottomY = idx === cfg.Geotech.soil_layers.length - 1 ? yMin : cfg.Geotech.soil_layers[idx + 1].top_elev;
                return (
                    <g key={idx}>
                        <rect x={cx(xMin)} y={cy(layer.top_elev)} width={cx(xMax) - cx(xMin)} height={cy(bottomY) - cy(layer.top_elev)} fill={layerColors[idx % layerColors.length]} />
                        <rect x={cx(xMin)} y={cy(layer.top_elev)} width={cx(xMax) - cx(xMin)} height={cy(bottomY) - cy(layer.top_elev)} fill="url(#soil-pattern)" />
                        <line x1={cx(xMin)} y1={cy(layer.top_elev)} x2={cx(xMax)} y2={cy(layer.top_elev)} stroke="#cbd5e1" strokeWidth="0.5" />
                    </g>
                );
                })}
                
                {cfg.Water.has_water && (
                <g>
                    <line x1={cx(xMin)} y1={cy(cfg.Water.y_gwt)} x2={cx(xMax)} y2={cy(cfg.Water.y_gwt)} stroke="#6366f1" strokeWidth="1" strokeDasharray="5,3" fillOpacity={0.3} />
                    <rect x={cx(xMin)} y={cy(cfg.Water.y_gwt)} width={cx(xMax)-cx(xMin)} height={cy(yMin)-cy(cfg.Water.y_gwt)} fill="#6366f1" fillOpacity={0.03} />
                </g>
                )}

                {circCoords.length > 0 && (
                  <polygon points={`${circPoints} ${currPoints.split(' ').reverse().join(' ')}`} fill="#ef4444" fillOpacity={0.05} />
                )}
            </g>

            {!isOriginal && <polyline points={origPoints} fill="none" stroke="#94a3b8" strokeWidth="1" strokeDasharray="5,5" opacity={0.4} />}
            <polyline points={currPoints} fill="none" stroke="#1e293b" strokeWidth="1.5" />

            {cfg.Damage && cfg.Damage.crack_depth > 0 && (
              <g>
                <line x1={cx(L_slope + (cfg.Damage.crack_distance || 0))} y1={cy(geom.H)} x2={cx(L_slope + (cfg.Damage.crack_distance || 0))} y2={cy(geom.H - cfg.Damage.crack_depth)} stroke="#ef4444" strokeWidth="2" strokeDasharray="4,2" />
                <path 
                  d={`M ${cx(L_slope + (cfg.Damage.crack_distance || 0))} ${cy(geom.H)} L ${cx(L_slope + (cfg.Damage.crack_distance || 0) - 1)} ${cy(geom.H - cfg.Damage.crack_depth)} L ${cx(L_slope + (cfg.Damage.crack_distance || 0) + 1)} ${cy(geom.H - cfg.Damage.crack_depth)} Z`} 
                  fill="#ef4444" 
                  opacity="0.3"
                />
              </g>
            )}

            <polyline points={circPoints} fill="none" stroke="#ef4444" strokeWidth="2.5" strokeDasharray="8,4" filter="url(#glow)" />
            
            {/* Photorealistic Damage Details */}
            {damageLevel >= 3 && circCoords.length > 5 && (
              <g opacity="0.6">
                 <path 
                   d={`M ${cx(circCoords[Math.floor(circCoords.length*0.3)].x)} ${cy(circCoords[Math.floor(circCoords.length*0.3)].y)} 
                      L ${cx(circCoords[Math.floor(circCoords.length*0.3)].x + 2)} ${cy(circCoords[Math.floor(circCoords.length*0.3)].y - 3)}
                      L ${cx(circCoords[Math.floor(circCoords.length*0.3)].x - 1)} ${cy(circCoords[Math.floor(circCoords.length*0.3)].y - 5)} Z`}
                   fill="#4b5563"
                 />
                 <path 
                   d={`M ${cx(circCoords[Math.floor(circCoords.length*0.6)].x)} ${cy(circCoords[Math.floor(circCoords.length*0.6)].y)} 
                      L ${cx(circCoords[Math.floor(circCoords.length*0.6)].x - 3)} ${cy(circCoords[Math.floor(circCoords.length*0.6)].y - 2)}
                      L ${cx(circCoords[Math.floor(circCoords.length*0.6)].x + 1)} ${cy(circCoords[Math.floor(circCoords.length*0.6)].y - 6)} Z`}
                   fill="#374151"
                 />
              </g>
            )}
            </svg>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 h-full bg-gray-100 text-gray-800 overflow-hidden">
      {/* LEFT: Parameter Sidebar (Property Inspector Style) */}
      <div className="lg:col-span-3 flex flex-col h-full bg-white border-r border-slate-200 overflow-hidden shadow-sm z-20">
        {/* Slope Segment Management */}
        <div className="flex flex-col max-h-[35%] overflow-hidden border-b border-slate-200 bg-slate-50/30">
          <div className="px-4 py-3 border-b border-slate-200 flex justify-between items-center sticky top-0 z-10 bg-white/80 backdrop-blur-sm">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Project Tree / 测段列表</h3>
            <button 
              onClick={addSegment}
              className="p-1.5 hover:bg-slate-100 text-blue-600 transition-all rounded-md border border-transparent hover:border-slate-200 active:scale-95"
              title="新增测段"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="overflow-y-auto p-1.5 flex-1 custom-scrollbar space-y-1">
            {segments.map(seg => (
              <div 
                key={seg.id}
                onClick={() => {
                  if (editingSegmentId !== seg.id) setActiveSegmentId(seg.id);
                }}
                className={`group px-3 py-2.5 rounded-lg cursor-pointer transition-all flex items-center justify-between ${
                  activeSegmentId === seg.id 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                  : 'hover:bg-white hover:shadow-sm text-slate-600 border border-transparent hover:border-slate-100'
                }`}
              >
                <div className="flex-1 min-w-0">
                  {editingSegmentId === seg.id ? (
                    <input
                      autoFocus
                      value={editSegmentName}
                      onChange={(e) => setEditSegmentName(e.target.value)}
                      onBlur={() => saveSegmentName(seg.id)}
                      onKeyDown={(e) => e.key === 'Enter' && saveSegmentName(seg.id)}
                      className="w-full text-xs font-bold text-blue-700 bg-white border border-blue-400 rounded px-2 py-1 outline-none"
                    />
                  ) : (
                    <div className="flex items-center space-x-3">
                      <Layers className={`w-4 h-4 ${activeSegmentId === seg.id ? 'text-white' : 'text-slate-400'}`} />
                      <span className={`text-xs font-bold truncate ${activeSegmentId === seg.id ? 'text-white' : 'text-slate-700'}`}>{seg.name}</span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditSegmentName(seg.name);
                          setEditingSegmentId(seg.id);
                        }}
                        className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-white/20 ${activeSegmentId === seg.id ? 'text-white' : 'text-blue-600'}`}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
                <button 
                  onClick={(e) => deleteSegment(e, seg.id)}
                  className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-white/20 ${activeSegmentId === seg.id ? 'text-white' : 'text-slate-300 hover:text-rose-600'}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
          <div className="px-4 py-3 bg-white border-t border-slate-100 flex space-x-2">
            <button 
              onClick={saveCurrentParams}
              className="flex-1 py-1.5 text-[10px] font-bold text-slate-600 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-md shadow-sm transition-all flex justify-center items-center uppercase tracking-widest active:scale-95"
            >
              <Save className="w-3.5 h-3.5 mr-2 text-slate-400" /> Archives / 归档保存
            </button>
          </div>
        </div>

        {/* Parameter Configuration Grid */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/20">
          <div className="section-header">Geometry & Boundary 几何边界</div>
          <div className="space-y-0">
            <div className="input-row">
              <label className="prop-label">边坡高度 H (m)</label>
              <input type="number" className="modern-input" value={slopeParams.height} onChange={e => updateParam('height', parseFloat(e.target.value))} />
            </div>
            <div className="input-row">
              <label className="prop-label">坡夹角 Beta (°)</label>
              <input type="number" className="modern-input" value={slopeParams.angle} onChange={e => updateParam('angle', parseFloat(e.target.value))} />
            </div>
          </div>

          <div className="section-header">
            <span>Soil Stratification 土层设定</span>
            <button 
              onClick={() => {
                const newLayers = [...slopeParams.soilLayers, { thickness: 2, gamma: 18, c: 10, phi: 15 }];
                updateParam('soilLayers', newLayers);
              }}
              className="p-1 hover:bg-slate-200 rounded-md transition-all text-blue-600"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-0">
            {slopeParams.soilLayers.map((layer, idx) => (
              <div key={idx} className="border-b border-slate-100 bg-white">
                <div className="flex justify-between items-center bg-slate-50/50 px-4 py-2 border-b border-slate-100">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                    <Database className="w-3 h-3 mr-2" /> Layer_{idx + 1}
                  </span>
                  {slopeParams.soilLayers.length > 1 && (
                    <button onClick={() => {
                      const newLayers = slopeParams.soilLayers.filter((_, i) => i !== idx);
                      updateParam('soilLayers', newLayers);
                    }} className="text-slate-300 hover:text-rose-500 transition-colors p-1">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="px-4 pb-3 pt-1 space-y-1">
                   {[
                     { key: 'thickness', label: 'Thickness (m)' },
                     { key: 'gamma', label: 'Gamma (kN/m³)' },
                     { key: 'c', label: 'Cohesion (kPa)' },
                     { key: 'phi', label: 'Phi (°)' }
                   ].map((item) => (
                     <div key={item.key} className="flex justify-between items-center py-1">
                       <label className="text-[11px] text-slate-500 font-medium">{item.label}</label>
                       <input 
                          type="number" className="w-20 bg-white border border-slate-100 rounded shadow-inner text-right px-2 py-0.5 text-xs font-bold text-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-all font-mono" 
                          value={(layer as any)[item.key]} 
                          onChange={e => {
                            const newLayers = slopeParams.soilLayers.map((layer, i) => 
                              i === idx ? { ...layer, [item.key]: parseFloat(e.target.value) } : layer
                            );
                            updateParam('soilLayers', newLayers);
                          }} 
                       />
                     </div>
                   ))}
                </div>
              </div>
            ))}
          </div>

          <div className="section-header">Environment & Loading 环境</div>
          <div className="space-y-0">
            <div className="input-row">
              <label className="prop-label">Rainfall (mm/24h)</label>
              <input type="number" className="modern-input" value={slopeParams.rainfall} onChange={e => updateParam('rainfall', parseFloat(e.target.value))} />
            </div>
            <div className="input-row">
              <label className="prop-label">GWT Level (m)</label>
              <input type="number" className="modern-input" value={slopeParams.groundwater} onChange={e => updateParam('groundwater', parseFloat(e.target.value))} />
            </div>
            <div className="input-row bg-rose-50/30">
              <label className="text-sm text-rose-700 font-bold">Seismic Kh (g)</label>
              <input type="number" step="0.01" className="w-24 bg-white border border-rose-200 rounded-md shadow-inner text-right px-2 py-1 text-sm font-bold text-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-all" value={slopeParams.seismicKh} onChange={e => updateParam('seismicKh', parseFloat(e.target.value))} />
            </div>
          </div>

          <div className="section-header">Disease Mapping 病害注入</div>
          <div className="p-4 bg-white rounded-b-xl">
            <div className="mb-4">
              <label className="text-[10px] text-slate-400 font-bold uppercase mb-1.5 block">Structure Health Level</label>
              <select 
                className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer transition-all"
                value={damageLevel}
                onChange={e => setDamageLevel(Number(e.target.value))}
              >
                <option value={0}>DESIGN态 (Nominal)</option>
                <option value={1}>ALPHA1 局部变形</option>
                <option value={2}>BETA2 结构开裂</option>
                <option value={3}>GAMMA3 整体破坏</option>
                <option value={4}>CRIT 彻底失稳</option>
              </select>
            </div>

            {damageLevel > 0 && (
              <div className="space-y-3 p-3 bg-rose-50/50 rounded-xl border border-rose-100 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Strength Retention</span>
                  <span className="text-xs font-black text-rose-600 font-mono">{Math.round(DAMAGE_MAP[damageLevel].c_factor*100)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Crack Depth</span>
                  <span className="text-xs font-black text-rose-600 font-mono">{DAMAGE_MAP[damageLevel].crack_depth}m</span>
                </div>
                <div className="pt-1.5">
                  <label className="text-[9px] text-rose-800 font-black uppercase mb-1.5 block tracking-widest">Crack Offset Control</label>
                  <input 
                    type="range" min="5" max="35" step="0.5"
                    className="w-full h-1.5 bg-rose-200 rounded-lg appearance-none cursor-pointer accent-rose-600" 
                    value={crackDistance} 
                    onChange={e => setCrackDistance(parseFloat(e.target.value))} 
                  />
                  <div className="flex justify-between font-mono text-[9px] text-slate-400 pt-2">
                    <span>5.0m</span>
                    <span className="text-rose-600 font-black bg-white px-2 rounded shadow-sm border border-rose-100">{crackDistance}m</span>
                    <span>35.0m</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 sticky bottom-0 z-20">
          <button 
            onClick={runStatusAnalysis}
            disabled={isCalculating}
            className="action-btn-primary group overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
            <div className="relative flex justify-center items-center text-xs tracking-[0.1em]">
              {isCalculating ? (
                <Activity className="animate-spin mr-2.5 h-4 w-4" />
              ) : (
                <Zap className="mr-2.5 h-4 w-4 fill-current" />
              )}
              {isCalculating ? 'SIMULATING_CORE...' : 'RUN SIMULATION / 执行分析'}
            </div>
          </button>
        </div>
      </div>

      {/* RIGHT: Main Content Area */}
      <div className="lg:col-span-9 flex flex-col h-full overflow-hidden bg-slate-50">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-md px-8 py-4 border-b border-slate-200 flex justify-between items-center z-10">
          <div className="flex items-center space-x-4">
             <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 shadow-inner">
                <Activity className="w-5 h-5 text-blue-600" />
             </div>
             <div>
                <h2 className="text-sm font-black text-slate-900 tracking-tight flex items-center uppercase">
                  Stability Analysis Console <span className="mx-2 text-slate-300 font-light">/</span> <span className="text-slate-500 font-bold">边坡极限平衡分析</span>
                </h2>
                <div className="flex items-center space-x-2.5 mt-1">
                  <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-widest">S_LEM_V4</span>
                  <div className="w-1 h-1 bg-slate-300 rounded-full" />
                  <span className="text-[10px] text-emerald-600 font-black uppercase tracking-[0.2em] animate-pulse">Core Status: Synchronized</span>
                </div>
             </div>
          </div>
          <div className="flex items-center space-x-3">
            {results && !hasOptimized && (
              <button 
                onClick={runOptimization}
                disabled={isCalculating}
                className="bg-slate-900 hover:bg-black text-white px-6 py-2 rounded-xl font-bold transition-all flex items-center text-[10px] uppercase tracking-widest shadow-xl shadow-slate-900/10 active:scale-95 disabled:bg-slate-400"
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                {isCalculating ? '推演中...' : '启动寻优优化 / OPTIMIZE'}
              </button>
            )}
            <button 
              onClick={runStatusAnalysis}
              className="bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 px-6 py-2 rounded-xl font-bold transition-all text-[10px] uppercase tracking-widest shadow-sm active:scale-95"
            >
              RERUN / 刷新计算
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
          {!results ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-300 italic">
               <Activity className="w-16 h-16 mb-4 opacity-20 animate-pulse text-blue-500" />
               <p className="text-xs uppercase tracking-[0.3em] font-black font-sans">Awaiting Parameter Injection...</p>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in duration-700">
              {/* Tab Navigation - Modern Segmented Control */}
              <div className="flex p-1 bg-slate-200/50 rounded-2xl w-fit border border-slate-200">
                <button 
                  onClick={() => setActiveTab('status')}
                  className={`px-8 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'status' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Stability View
                </button>
                {hasOptimized && (
                  <>
                    <button 
                      onClick={() => setActiveTab('dashboard')}
                      className={`px-8 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Optimization Report
                    </button>
                    <button 
                      onClick={() => setActiveTab('schemes')}
                      className={`px-8 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'schemes' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Comparison Matrix
                    </button>
                  </>
                )}
              </div>

              {activeTab === 'status' && (
                <div className="grid grid-cols-12 gap-8">
                  <div className="col-span-12 lg:col-span-8 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm shadow-slate-200/50">
                    {renderSlope2D(null, results.circ0, `Slip Surface Analysis - FS: ${(results?.FS0 ?? 0).toFixed(3)}`, true)}
                  </div>
                  <div className="col-span-12 lg:col-span-4 space-y-8">
                    <div className="kpi-card group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500">
                       <div className={`absolute top-0 left-0 bottom-0 w-2 ${(results?.FS0 ?? 0) < (results?.cfg?.Target?.FS_target ?? 1.15) ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                       <div className="absolute top-0 right-0 p-4">
                          <Settings className="w-5 h-5 text-slate-100 group-hover:text-slate-200 transition-colors" />
                       </div>
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8 w-full block">Factor of Safety (FS)</span>
                       
                       <div className="relative flex items-center justify-center">
                          <div className={`text-6xl font-black tracking-tighter ${(results?.FS0 ?? 0) < (results?.cfg?.Target?.FS_target ?? 1.15) ? 'text-rose-600' : 'text-slate-900'}`}>
                             {(results?.FS0 ?? 0).toFixed(3)}
                          </div>
                          <div className={`absolute -top-4 -right-12 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter shadow-sm border ${ (results?.FS0 ?? 0) < (results?.cfg?.Target?.FS_target ?? 1.15) ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200'}`}>
                             {(results?.FS0 ?? 0) < (results?.cfg?.Target?.FS_target ?? 1.15) ? 'CRITICAL' : 'NOMINAL'}
                          </div>
                       </div>
                       
                       <div className="mt-8 w-full grid grid-cols-2 gap-4 border-t border-slate-50 pt-6">
                          <div className="text-center">
                             <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Target FS</div>
                             <div className="text-sm font-black text-slate-700 font-mono">{(results?.cfg?.Target?.FS_target ?? 1.15).toFixed(2)}</div>
                          </div>
                          <div className="text-center">
                             <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Stability Gap</div>
                             <div className={`text-sm font-black font-mono ${(results?.gap ?? 0) > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                {(results?.gap ?? 0).toFixed(1)} kN
                             </div>
                          </div>
                       </div>
                    </div>
                    
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm overflow-hidden relative">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 block border-b border-slate-50 pb-3">Diagnostic Intelligence</span>
                       <div className={`rounded-xl border p-5 flex items-start space-x-4 transition-all ${(results?.FS0 ?? 0) < (results?.cfg?.Target?.FS_target ?? 1.15) ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100'}`}>
                          <div className={`p-2 rounded-xl shadow-inner ${ (results?.FS0 ?? 0) < (results?.cfg?.Target?.FS_target ?? 1.15) ? 'bg-rose-100/50' : 'bg-emerald-100/50'}`}>
                            { (results?.FS0 ?? 0) < (results?.cfg?.Target?.FS_target ?? 1.15) ? <AlertTriangle className="w-6 h-6 text-rose-600" /> : <ShieldCheck className="w-6 h-6 text-emerald-600" /> }
                          </div>
                          <div>
                            <p className={`text-sm font-black uppercase tracking-tight ${(results?.FS0 ?? 0) < (results?.cfg?.Target?.FS_target ?? 1.15) ? 'text-rose-800' : 'text-emerald-800'}`}>
                               {(results?.FS0 ?? 0) < (results?.cfg?.Target?.FS_target ?? 1.15) ? 'Structural Instability Detected' : 'Safety Buffers Maintained'}
                            </p>
                            <p className={`text-[10px] mt-1 font-medium leading-relaxed ${(results?.FS0 ?? 0) < (results?.cfg?.Target?.FS_target ?? 1.15) ? 'text-rose-600/70' : 'text-emerald-600/70'}`}>
                              { (results?.FS0 ?? 0) < (results?.cfg?.Target?.FS_target ?? 1.15) 
                                ? '当前工况下边坡抗剪强度不足，存在贯通式滑动风险，建议立即执行模拟加固推演。' 
                                : '结构当前处于稳态，抗滑力矩大于下滑力矩，各项评估指标均优于设计规范红线。' }
                            </p>
                          </div>
                       </div>
                    </div>

                    {!hasOptimized && (
                      <button 
                        onClick={runOptimization}
                        disabled={isCalculating}
                        className="w-full bg-slate-900 hover:bg-black text-white font-bold rounded-2xl py-6 flex flex-col items-center transition-all uppercase tracking-[0.3em] relative group shadow-2xl shadow-slate-900/30 overflow-hidden active:scale-[0.98]"
                      >
                        <div className="absolute inset-0 bg-blue-600 translate-y-full group-hover:translate-y-0 transition-transform duration-500 opacity-20" />
                        <Zap className="w-6 h-6 mb-2 text-blue-400 fill-blue-400 group-hover:animate-pulse" />
                        <span className="text-xs font-black">{isCalculating ? 'SOLVING_CORE...' : 'Initiate Global Optimization'}</span>
                        <span className="text-[8px] text-slate-500 mt-2 font-mono tracking-normal">CPU_ACCELERATED_SOLVER_ACTIVE</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'dashboard' && (
                <div className="space-y-10 animate-in fade-in zoom-in-95 duration-700">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 border-b border-slate-50 pb-4 flex items-center">
                        <span className="w-2 h-2 bg-slate-300 rounded-full mr-3" />
                        Phase 1: Baseline Analysis / 现状评估
                      </div>
                      {renderSlope2D(null, results?.circ0 || null, `FS_BASE: ${(results?.FS0 ?? 0).toFixed(3)}`, true)}
                    </div>
                    {results.all_results.length > 0 && (
                      <div className="bg-white rounded-3xl border-2 border-blue-500 p-8 shadow-2xl shadow-blue-500/10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 py-1 px-4 bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest rounded-bl-xl">Rank #1 Best Solution</div>
                        <div className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-6 border-b border-blue-50 pb-4 flex items-center">
                          <span className="w-2 h-2 bg-blue-500 rounded-full mr-3 animate-pulse" />
                          Phase 2: Optimized Solution / 最优推演
                        </div>
                        {renderSlope2D(results.all_results[0].Plot_Data, results.all_results[0].Plot_Data.circle, `FS_OPT: ${(results.all_results[0].FS ?? 0).toFixed(3)}`, false, results.all_results[0].FS)}
                      </div>
                    )}
                  </div>

                  {results.all_results.length > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm h-[450px]">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8 border-b border-slate-50 pb-4">Safety Factor Stability Curve</h3>
                        <ResponsiveContainer width="100%" height="80%">
                          <BarChart data={[{ Method: 'BASE', FS: results.FS0 }, ...results.all_results.map((r:any) => ({ Method: r.Method.split('+')[0], FS: r.FS }))]}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="Method" tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 700}} interval={0} height={50} angle={-25} textAnchor="end" />
                            <YAxis tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 700}} />
                            <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '11px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                            <Bar dataKey="FS" radius={[6, 6, 0, 0]} barSize={40}>
                              {[{ Method: 'BASE', FS: results.FS0 }, ...results.all_results].map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index === 0 ? '#cbd5e1' : (index === 1 ? '#2563eb' : '#93c5fd')} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm h-[450px]">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8 border-b border-slate-50 pb-4">Economic Efficiency & Lifecycle</h3>
                        <ResponsiveContainer width="100%" height="80%">
                          <BarChart data={results.all_results.slice(0, 5).map((r:any) => ({ Method: r.Method.split('+')[0], Cost: r.Cost_W, Time: Math.ceil(r.Time_d) }))}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="Method" tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 700}} interval={0} height={50} angle={-25} textAnchor="end" />
                            <YAxis yAxisId="left" orientation="left" stroke="#f43f5e" tick={{fontSize: 10, fontWeight: 700}} />
                            <YAxis yAxisId="right" orientation="right" stroke="#6366f1" tick={{fontSize: 10, fontWeight: 700}} />
                            <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '11px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                            <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', paddingTop: '20px' }} />
                            <Bar yAxisId="left" dataKey="Cost" name="Cost(W)" fill="#f43f5e" radius={[6, 6, 0, 0]} barSize={30} />
                            <Bar yAxisId="right" dataKey="Time" name="Time(D)" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={30} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'schemes' && (
                <div className="space-y-10 animate-in fade-in duration-700">
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-8 py-5 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                      <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] flex items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-3" />
                        Design Decision Matrix / 加固方案全局推演矩阵
                      </h3>
                      <span className="text-[10px] font-mono text-slate-400 font-bold bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-inner">SOLVER_RECORDS: {results.all_results.length}</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="bg-slate-100/50 text-slate-500 uppercase tracking-widest text-[9px] font-black border-b border-slate-200">
                            <th className="px-6 py-4">Rank</th>
                            <th className="px-6 py-4">Protection Method</th>
                            <th className="px-6 py-4 text-center">Stability (FS)</th>
                            <th className="px-6 py-4 text-right">Capex (¥)</th>
                            <th className="px-6 py-4 text-right">Schedule</th>
                            <th className="px-6 py-4">Vector Config</th>
                          </tr>
                        </thead>
                        <tbody>
                          {results.all_results.map((row: any, idx: number) => (
                            <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors group cursor-default">
                              <td className="px-6 py-4 font-black text-slate-300 group-hover:text-blue-500">#{idx + 1}</td>
                              <td className="px-6 py-4 font-black text-slate-800">{row.Method.replace('\n', '')}</td>
                              <td className="px-6 py-4 text-center">
                                <span className={`font-mono font-black border px-2 py-0.5 rounded shadow-sm ${(row.FS ?? 0) < (results?.cfg?.Target?.FS_target ?? 1.15) ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                  {(row.FS ?? 0).toFixed(3)}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right font-mono font-black text-slate-700">¥{(row.Cost_W ?? 0).toFixed(1)}W</td>
                              <td className="px-6 py-4 text-right font-mono font-bold text-slate-500">{Math.ceil(row.Time_d)}D</td>
                              <td className="px-6 py-4 text-slate-400 font-mono text-[10px] italic truncate max-w-sm font-medium">{row.Param.replace('\n', ' | ')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="pt-10 border-t border-slate-200">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-10 text-center">Simulation Spatial Evolutions / 分散式演化对比</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                      {results.all_results.map((row: any, idx: number) => (
                        <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
                          <div className="mb-4 flex justify-between items-center border-b border-slate-50 pb-3">
                             <span className="text-[10px] font-black text-blue-600 uppercase bg-blue-50 px-3 py-1 rounded-lg">Scheme {idx + 1}</span>
                             <span className="text-xs font-mono text-slate-700 font-black">FS: {(row?.FS ?? 0).toFixed(3)}</span>
                          </div>
                          {renderSlope2D(row.Plot_Data, row.Plot_Data.circle, row.Method.replace('\n', ''), false, row.FS)}
                        </div>
                      ))}
                    </div>
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
