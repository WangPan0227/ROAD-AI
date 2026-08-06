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
import { KPICard } from './common/KPICard';

const SlopeAnalysis: React.FC<{ activeInfrastructure?: InfrastructureState }> = () => {
  const [isCalculating, setIsCalculating] = useState(false);
  const [damageLevel, setDamageLevel] = useState<number>(0);
  const [crackDistance, setCrackDistance] = useState<number>(1.5);
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
    
    cfg.Damage = { c_factor: 1.0, phi_factor: 1.0, crack_depth: 0, add_water_pressure: false, crack_distance: 1.5 };
    const { min_FS: FS0, best_T: T0, best_R: R0, best_slip_depth: slip0, best_circle: circ0 } = compute_stability(orig_geom, geom.H, beta_rad, cfg);
    const gap = Math.max(0, cfg.Target.FS_target * T0 - R0);

    if (typeof window !== 'undefined' && localStorage.getItem('roadbedguard_pending_slope_load')) {
       localStorage.removeItem('roadbedguard_pending_slope_load');
    }

    return { FS0, T0, R0, gap, circ0, slip0, all_results: [], cfg };
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const timer = setTimeout(() => {
      const pending = localStorage.getItem('pending_injected_disease_slope_instability');
      if (pending) {
        try {
          const parsed = JSON.parse(pending);
          if (parsed.level) {
            setDamageLevel(parsed.level);
            localStorage.removeItem('pending_injected_disease_slope_instability');
          }
        } catch (e) {
          console.error("Error reading pending slope disease", e);
        }
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const [activeTab, setActiveTab] = useState<'status' | 'dashboard' | 'schemes'>('status');

  const [editingSegmentId, setEditingSegmentId] = useState<string | null>(null);
  const [editSegmentName, setEditSegmentName] = useState('');

  const updateParam = (key: string, value: any) => {
    setSlopeParams(prev => ({ ...prev, [key]: value }));
  };

  const addSegment = () => {
    const newId = `slope-${segments.length + 1}`;
    const newSegment = {
      id: newId,
      name: `新边坡分段 ${segments.length + 1}`,
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

  const saveCurrentParams = () => {
    setSegments(prev => prev.map(seg => 
      seg.id === activeSegmentId ? { ...seg, params: JSON.parse(JSON.stringify(slopeParams)) } : seg
    ));

    const activeSeg = segments.find(s => s.id === activeSegmentId);
    const historyRecord = {
      id: `hist-${Date.now()}`,
      name: activeSeg ? activeSeg.name : '未命名边坡案例',
      date: new Date().toLocaleString(),
      notes: '暂无备注说明。',
      params: JSON.parse(JSON.stringify(slopeParams)),
      results: results ? {
          FS0: results.FS0,
          gap: results.gap,
          circ0: results.circ0,
          bestScheme: results.all_results?.length > 0 ? results.all_results[0] : null
      } : null
    };

    const existingHistory = JSON.parse(localStorage.getItem('roadbedguard_slope_history') || '[]');
    localStorage.setItem('roadbedguard_slope_history', JSON.stringify([historyRecord, ...existingHistory]));

    alert('案例及分析结果已成功归档至【边坡历史训练库】！');
  };

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

    const safeCircle = circle || [0, 0, 0];
    const [Xc, Yc, R] = safeCircle;
    const theta = Array.from({ length: 150 }, (_, i) => Math.PI + i * Math.PI / 149);
    const x_end_limit = safeCircle.length > 3 ? safeCircle[3] : xMax;
    const circCoords = theta.map(t => ({ x: Xc + R * Math.cos(t), y: Yc + R * Math.sin(t) }))
                            .filter(p => p.y <= curr_surf(p.x) && p.x >= xMin && p.x <= x_end_limit);
    const circPoints = circCoords.map(p => `${cx(p.x)},${cy(p.y)}`).join(' ');

    const layerColors = ['#1e293b', '#0f172a', '#1e293b', '#334155', '#475569']; 
    
    const displayFS = providedFS || (isOriginal ? results?.FS0 : p_data?.FS);

    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col items-center w-full overflow-hidden transition-all duration-300">
        <div className="w-full bg-slate-800/50 border-b border-slate-800 py-2.5 px-4 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${displayFS && displayFS < cfg.Target.FS_target ? 'bg-rose-500' : 'bg-emerald-500'}`} />
              <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider">{title}</h4>
            </div>
            {displayFS && (
                <div className="text-right">
                   <span className={`text-xs font-bold font-mono ${displayFS < (cfg?.Target?.FS_target ?? 1.15) ? 'text-rose-400' : 'text-emerald-400'}`}>
                      FS: {displayFS?.toFixed(3) ?? '0.000'}
                   </span>
                </div>
            )}
        </div>
        
        <div className="p-4 w-full flex justify-center relative bg-slate-950">
            <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible" style={{maxHeight: '300px'}}>
            <defs>
                <pattern id="grid-slope" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.5"/>
                </pattern>
                
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
                        <line x1={cx(xMin)} y1={cy(layer.top_elev)} x2={cx(xMax)} y2={cy(layer.top_elev)} stroke="#334155" strokeWidth="0.5" />
                    </g>
                );
                })}
                
                {cfg.Water.has_water && (
                <g>
                    <line x1={cx(xMin)} y1={cy(cfg.Water.y_gwt)} x2={cx(xMax)} y2={cy(cfg.Water.y_gwt)} stroke="#38bdf8" strokeWidth="1" strokeDasharray="5,3" />
                    <rect x={cx(xMin)} y={cy(cfg.Water.y_gwt)} width={cx(xMax)-cx(xMin)} height={cy(yMin)-cy(cfg.Water.y_gwt)} fill="#38bdf8" fillOpacity={0.08} />
                </g>
                )}

                {circCoords.length > 0 && (
                  <polygon points={`${circPoints} ${currPoints.split(' ').reverse().join(' ')}`} fill="#f43f5e" fillOpacity={0.15} />
                )}
            </g>

            {!isOriginal && <polyline points={origPoints} fill="none" stroke="#64748b" strokeWidth="1" strokeDasharray="5,5" opacity={0.4} />}
            <polyline points={currPoints} fill="none" stroke="#cbd5e1" strokeWidth="1.5" />

            {cfg.Damage && cfg.Damage.crack_depth > 0 && (
              <g>
                <line x1={cx(L_slope + (cfg.Damage.crack_distance || 0))} y1={cy(geom.H)} x2={cx(L_slope + (cfg.Damage.crack_distance || 0))} y2={cy(geom.H - cfg.Damage.crack_depth)} stroke="#f43f5e" strokeWidth="2" strokeDasharray="4,2" />
              </g>
            )}

            <polyline points={circPoints} fill="none" stroke="#f43f5e" strokeWidth="2.5" strokeDasharray="8,4" />
            </svg>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 font-sans overflow-hidden p-6">
      <div className="flex-1 flex overflow-hidden gap-6">
        {/* LEFT: Parameter Sidebar */}
        <div className="w-80 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md p-5 flex flex-col overflow-hidden relative flex-shrink-0">
          <div className="pb-3 border-b border-slate-800 flex justify-between items-center sticky top-0 z-10 bg-slate-900/90">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center">
              <Settings className="w-3.5 h-3.5 mr-2 text-sky-400" /> 测段列表与参数配置
            </h3>
            <button 
              onClick={addSegment}
              className="p-1 hover:bg-slate-800 text-sky-400 transition-all rounded-lg border border-slate-700"
              title="新增测段"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 pt-3 space-y-4 overflow-y-auto custom-scrollbar pr-1">
            {/* Segments List */}
            <div className="space-y-1.5">
              {segments.map(seg => (
                <div 
                  key={seg.id}
                  onClick={() => {
                    if (editingSegmentId !== seg.id) setActiveSegmentId(seg.id);
                  }}
                  className={`px-3 py-2 rounded-xl cursor-pointer transition-all flex items-center justify-between text-xs ${
                    activeSegmentId === seg.id 
                    ? 'bg-sky-600 text-white font-bold shadow-lg shadow-sky-600/20' 
                    : 'bg-slate-800/50 hover:bg-slate-800 text-slate-300 border border-slate-700/60'
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
                        className="w-full text-xs font-bold text-slate-100 bg-slate-800 border border-sky-500 rounded-lg px-2 py-0.5 outline-none"
                      />
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Layers className={`w-3.5 h-3.5 ${activeSegmentId === seg.id ? 'text-white' : 'text-slate-400'}`} />
                        <span className="truncate">{seg.name}</span>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditSegmentName(seg.name);
                            setEditingSegmentId(seg.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-slate-700 text-slate-400"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={(e) => deleteSegment(e, seg.id)}
                    className="p-1 text-slate-400 hover:text-rose-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Geometry */}
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-2">Geometry & Boundary 几何边界</div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center bg-slate-800/50 p-2 rounded-xl border border-slate-700/60">
                <label className="text-slate-300 font-medium">边坡高度 H (m)</label>
                <input type="number" className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-right text-sky-400 font-mono text-xs font-bold focus:outline-none" value={slopeParams.height} onChange={e => updateParam('height', parseFloat(e.target.value))} />
              </div>
              <div className="flex justify-between items-center bg-slate-800/50 p-2 rounded-xl border border-slate-700/60">
                <label className="text-slate-300 font-medium">坡倾角 Beta (°)</label>
                <input type="number" className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-right text-sky-400 font-mono text-xs font-bold focus:outline-none" value={slopeParams.angle} onChange={e => updateParam('angle', parseFloat(e.target.value))} />
              </div>
            </div>

            {/* Environment */}
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-2">Environment 环境与地震</div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center bg-slate-800/50 p-2 rounded-xl border border-slate-700/60">
                <label className="text-slate-300 font-medium">降雨量 (mm/24h)</label>
                <input type="number" className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-right text-sky-400 font-mono text-xs font-bold focus:outline-none" value={slopeParams.rainfall} onChange={e => updateParam('rainfall', parseFloat(e.target.value))} />
              </div>
              <div className="flex justify-between items-center bg-slate-800/50 p-2 rounded-xl border border-slate-700/60">
                <label className="text-slate-300 font-medium">地下水位 GWT (m)</label>
                <input type="number" className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-right text-sky-400 font-mono text-xs font-bold focus:outline-none" value={slopeParams.groundwater} onChange={e => updateParam('groundwater', parseFloat(e.target.value))} />
              </div>
              <div className="flex justify-between items-center bg-slate-800/50 p-2 rounded-xl border border-slate-700/60">
                <label className="text-slate-300 font-medium">地震系数 Kh (g)</label>
                <input type="number" step="0.01" className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-right text-rose-400 font-mono text-xs font-bold focus:outline-none" value={slopeParams.seismicKh} onChange={e => updateParam('seismicKh', parseFloat(e.target.value))} />
              </div>
            </div>

            {/* Disease Mapping */}
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-2">病害缺陷注入</div>
            <div className="space-y-2 text-xs">
              <div>
                <label className="text-slate-400 text-xs mb-1 block">结构损伤等级 Level</label>
                <select 
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-1.5 text-sm font-mono text-slate-200 focus:outline-none focus:border-sky-500"
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
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 space-y-2">
            <button 
              onClick={saveCurrentParams}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2 rounded-xl border border-slate-700 text-xs flex justify-center items-center"
            >
              <Save className="w-3.5 h-3.5 mr-2 text-slate-400" /> 归档案例到历史库
            </button>
            <button 
              onClick={runStatusAnalysis}
              disabled={isCalculating}
              className={`w-full bg-sky-600 hover:bg-sky-500 text-white font-medium px-4 py-2.5 rounded-xl shadow-lg shadow-sky-600/20 transition-all flex items-center justify-center space-x-2 ${
                isCalculating ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isCalculating ? <Activity className="animate-spin h-4 w-4" /> : <Zap className="h-4 w-4" />}
              <span>{isCalculating ? 'SOLVING...' : 'RUN SIMULATION / 执行分析'}</span>
            </button>
          </div>
        </div>

        {/* RIGHT: Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden space-y-5">
          {/* Header */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md p-5 flex justify-between items-center">
            <div className="flex items-center space-x-3">
               <div className="p-2.5 bg-sky-500/10 rounded-xl border border-sky-500/20">
                  <Activity className="w-5 h-5 text-sky-400" />
               </div>
               <div>
                  <h2 className="text-xs font-bold text-slate-100 tracking-wider uppercase">
                    场景 1.2：边坡失稳 | 边坡极限平衡 (LEM) 求解与加固推演
                  </h2>
                  <div className="flex items-center space-x-2.5 mt-0.5">
                    <span className="text-[10px] text-slate-400 font-mono">BISHOP / BJTU LEM ENGINE</span>
                  </div>
               </div>
            </div>
            <div className="flex items-center space-x-3">
              {results && !hasOptimized && (
                <button 
                  onClick={runOptimization}
                  disabled={isCalculating}
                  className="bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-xl font-bold transition-all flex items-center text-xs tracking-wider shadow-lg shadow-sky-600/20"
                >
                  <ArrowRight className="w-4 h-4 mr-1.5" />
                  {isCalculating ? '推演中...' : '启动寻优优化 / OPTIMIZE'}
                </button>
              )}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto space-y-5 custom-scrollbar pr-1 pb-10">
            {!results ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-500">
                 <Activity className="w-16 h-16 mb-4 animate-pulse" />
                 <p className="text-xs uppercase font-mono tracking-widest">Awaiting Parameter Injection...</p>
              </div>
            ) : (
              <div className="space-y-5 animate-in fade-in duration-700">
                {/* Tab Navigation */}
                <div className="flex p-1 bg-slate-900 border border-slate-800 rounded-xl w-fit">
                  <button 
                    onClick={() => setActiveTab('status')}
                    className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'status' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    稳定性分析图示
                  </button>
                  {hasOptimized && (
                    <>
                      <button 
                        onClick={() => setActiveTab('dashboard')}
                        className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'dashboard' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                      >
                        加固推演报告
                      </button>
                      <button 
                        onClick={() => setActiveTab('schemes')}
                        className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'schemes' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                      >
                        方案矩阵对比
                      </button>
                    </>
                  )}
                </div>

                {activeTab === 'status' && (
                  <div className="space-y-5">
                    <div className="grid grid-cols-3 gap-4">
                      <KPICard
                        title="安全系数 (FS)"
                        value={(results?.FS0 ?? 0).toFixed(3)}
                        subtitle={`控制目标 FS_target = ${(results?.cfg?.Target?.FS_target ?? 1.15).toFixed(2)}`}
                        status={(results?.FS0 ?? 0) < (results?.cfg?.Target?.FS_target ?? 1.15) ? 'critical' : 'safe'}
                      />
                      <KPICard
                        title="抗滑力矩缺口 (Gap)"
                        value={(results?.gap ?? 0).toFixed(1)}
                        unit="kN"
                        subtitle={(results?.gap ?? 0) > 0 ? "需施加额外支挡力" : "无抗滑力矩缺口"}
                        status={(results?.gap ?? 0) > 0 ? 'warning' : 'safe'}
                      />
                      <KPICard
                        title="最不利滑动面深度"
                        value={(results?.slip0 ?? 0).toFixed(2)}
                        unit="m"
                        subtitle="临界滑弧控制位置"
                        status="neutral"
                      />
                    </div>

                    <div className="grid grid-cols-12 gap-5">
                      <div className="col-span-12 lg:col-span-8 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-md">
                        {renderSlope2D(null, results.circ0, `Slip Surface Analysis - FS: ${(results?.FS0 ?? 0).toFixed(3)}`, true)}
                      </div>
                      <div className="col-span-12 lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-md flex flex-col justify-between">
                         <div>
                           <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block border-b border-slate-800 pb-2">Diagnostic Intelligence</span>
                           <div className={`rounded-xl border p-4 flex items-start space-x-3 ${ (results?.FS0 ?? 0) < (results?.cfg?.Target?.FS_target ?? 1.15) ? 'bg-rose-500/10 border-rose-500/30' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
                              <div className="p-1.5 rounded-lg">
                                { (results?.FS0 ?? 0) < (results?.cfg?.Target?.FS_target ?? 1.15) ? <AlertTriangle className="w-5 h-5 text-rose-400" /> : <ShieldCheck className="w-5 h-5 text-emerald-400" /> }
                              </div>
                              <div>
                                <p className={`text-xs font-bold uppercase ${ (results?.FS0 ?? 0) < (results?.cfg?.Target?.FS_target ?? 1.15) ? 'text-rose-400' : 'text-emerald-400'}`}>
                                   {(results?.FS0 ?? 0) < (results?.cfg?.Target?.FS_target ?? 1.15) ? 'Structural Instability Detected' : 'Safety Buffers Maintained'}
                                </p>
                                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
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
                             className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl py-3 mt-4 flex justify-center items-center transition-all uppercase text-xs tracking-wider shadow-lg shadow-sky-600/20"
                           >
                             <Zap className="w-4 h-4 mr-2" />
                             <span>{isCalculating ? 'SOLVING_CORE...' : 'Initiate Global Optimization'}</span>
                           </button>
                         )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'dashboard' && (
                  <div className="space-y-5 animate-in fade-in duration-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-md">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">
                          Phase 1: Baseline Analysis / 现状评估
                        </div>
                        {renderSlope2D(null, results?.circ0 || null, `FS_BASE: ${(results?.FS0 ?? 0).toFixed(3)}`, true)}
                      </div>
                      {results.all_results.length > 0 && (
                        <div className="bg-slate-900/90 border border-sky-500/50 rounded-2xl p-5 shadow-xl backdrop-blur-md relative overflow-hidden">
                          <div className="absolute top-0 right-0 py-1 px-3 bg-sky-600 text-white text-[10px] font-bold uppercase rounded-bl-xl">Rank #1 Best Solution</div>
                          <div className="text-xs font-bold text-sky-400 uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">
                            Phase 2: Optimized Solution / 最优推演
                          </div>
                          {renderSlope2D(results.all_results[0].Plot_Data, results.all_results[0].Plot_Data.circle, `FS_OPT: ${(results.all_results[0].FS ?? 0).toFixed(3)}`, false, results.all_results[0].FS)}
                        </div>
                      )}
                    </div>

                    {results.all_results.length > 0 && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-md h-[380px]">
                          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6 border-b border-slate-800 pb-2">Safety Factor Stability Curve</h3>
                          <ResponsiveContainer width="100%" height="80%">
                            <BarChart data={[{ Method: 'BASE', FS: results.FS0 }, ...results.all_results.map((r:any) => ({ Method: r.Method.split('+')[0], FS: r.FS }))]}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                              <XAxis dataKey="Method" tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 700}} interval={0} height={50} angle={-25} textAnchor="end" />
                              <YAxis tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 700}} />
                              <Tooltip cursor={{fill: '#1e293b'}} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#f8fafc' }} />
                              <Bar dataKey="FS" radius={[6, 6, 0, 0]} barSize={36}>
                                {[{ Method: 'BASE', FS: results.FS0 }, ...results.all_results].map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={index === 0 ? '#64748b' : (index === 1 ? '#38bdf8' : '#818cf8')} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>

                        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-md h-[380px]">
                          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6 border-b border-slate-800 pb-2">Economic Efficiency & Lifecycle</h3>
                          <ResponsiveContainer width="100%" height="80%">
                            <BarChart data={results.all_results.slice(0, 5).map((r:any) => ({ Method: r.Method.split('+')[0], Cost: r.Cost_W, Time: Math.ceil(r.Time_d) }))}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                              <XAxis dataKey="Method" tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 700}} interval={0} height={50} angle={-25} textAnchor="end" />
                              <YAxis yAxisId="left" orientation="left" stroke="#f43f5e" tick={{fontSize: 10, fontWeight: 700}} />
                              <YAxis yAxisId="right" orientation="right" stroke="#818cf8" tick={{fontSize: 10, fontWeight: 700}} />
                              <Tooltip cursor={{fill: '#1e293b'}} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#f8fafc' }} />
                              <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8' }} />
                              <Bar yAxisId="left" dataKey="Cost" name="Cost(W)" fill="#f43f5e" radius={[6, 6, 0, 0]} barSize={28} />
                              <Bar yAxisId="right" dataKey="Time" name="Time(D)" fill="#818cf8" radius={[6, 6, 0, 0]} barSize={28} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'schemes' && (
                  <div className="space-y-5 animate-in fade-in duration-700">
                    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md overflow-hidden">
                      <div className="px-5 py-3.5 bg-slate-800/50 border-b border-slate-800 flex justify-between items-center">
                        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center">
                          <div className="w-2 h-2 bg-sky-400 rounded-full mr-2" />
                          Design Decision Matrix / 加固方案全局推演矩阵
                        </h3>
                        <span className="text-xs font-mono text-slate-400 font-bold bg-slate-800 px-2.5 py-0.5 rounded-lg border border-slate-700">RECORDS: {results.all_results.length}</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                          <thead>
                            <tr className="bg-slate-800/80 text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-800">
                              <th className="px-5 py-3">Rank</th>
                              <th className="px-5 py-3">Protection Method</th>
                              <th className="px-5 py-3 text-center">Stability (FS)</th>
                              <th className="px-5 py-3 text-right">Capex (¥)</th>
                              <th className="px-5 py-3 text-right">Schedule</th>
                              <th className="px-5 py-3">Vector Config</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800">
                            {results.all_results.map((row: any, idx: number) => (
                              <tr key={idx} className="hover:bg-slate-800/50 transition-colors">
                                <td className="px-5 py-3 font-bold text-slate-400">#{idx + 1}</td>
                                <td className="px-5 py-3 font-bold text-slate-100">{row.Method.replace('\n', '')}</td>
                                <td className="px-5 py-3 text-center">
                                  <span className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${(row.FS ?? 0) < (results?.cfg?.Target?.FS_target ?? 1.15) ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'}`}>
                                    {(row.FS ?? 0).toFixed(3)}
                                  </span>
                                </td>
                                <td className="px-5 py-3 text-right font-mono font-bold text-slate-200">¥{(row.Cost_W ?? 0).toFixed(1)}W</td>
                                <td className="px-5 py-3 text-right font-mono font-bold text-slate-400">{Math.ceil(row.Time_d)}D</td>
                                <td className="px-5 py-3 text-slate-400 font-mono text-[10px] truncate max-w-sm">{row.Param.replace('\n', ' | ')}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SlopeAnalysis;
