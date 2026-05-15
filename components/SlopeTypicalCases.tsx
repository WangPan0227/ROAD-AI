import React, { useState, useRef } from 'react';
import { 
  Database, FileSpreadsheet, Play, Save, ShieldCheck, Download, Layers, Droplets, Activity, Trash2
} from 'lucide-react';
import { compute_stability, DEFAULT_CONFIG, get_original_elevation } from '../lib/slopeCalculations';

interface SoilLayer {
  thickness: number;
  gamma: number;
  c: number;
  phi: number;
}

interface TypicalCase {
  id: string;
  name: string;
  source: string;
  height: number;
  angle: number;
  soilLayers: SoilLayer[]; // 升级为多层土数组
  y_gwt: number;
  k_h: number;
  actualFS: number;
  simFS?: number;
  errorPct?: number;
}

const STORAGE_KEY = 'roadbedguard_slope_typical_cases_v2';

const SlopeTypicalCases: React.FC = () => {
  const [cases, setCases] = useState<TypicalCase[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {
        console.error("Failed to parse saved typical cases", e);
      }
    }
    return [
      { 
          id: '1', name: '某高速K12二元结构滑坡', source: '工程实例', height: 12, angle: 45, 
          soilLayers: [
              { thickness: 4, gamma: 18.5, c: 15, phi: 20 },
              { thickness: 8, gamma: 22.0, c: 35, phi: 28 }
          ], 
          y_gwt: 5, k_h: 0, actualFS: 1.05 
      },
      { 
          id: '2', name: '均质土坡地震标准算例', source: '《岩土力学》', height: 10, angle: 30, 
          soilLayers: [{ thickness: 10, gamma: 20, c: 10, phi: 15 }], 
          y_gwt: 15, k_h: 0.1, actualFS: 0.98 
      },
    ];
  });
  const [isCalculating, setIsCalculating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const computedCases = cases.filter(c => c.simFS !== undefined);
  const qualifiedCases = computedCases.filter(c => c.errorPct !== undefined && c.errorPct <= 10);
  const confidenceScore = computedCases.length > 0 ? (qualifiedCases.length / computedCases.length) * 100 : 0;
  const isQualified = confidenceScore >= 90;

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cases));
    alert('案例库已成功保存至本地存储！');
  };

  const addRow = () => {
    const newCase: TypicalCase = {
      id: Date.now().toString(), name: '新案例', source: '自定义',
      height: 10, angle: 45, 
      soilLayers: [{ thickness: 10, gamma: 18, c: 10, phi: 15 }], 
      y_gwt: 10, k_h: 0, actualFS: 1.0
    };
    setCases([...cases, newCase]);
  };

  const deleteRow = (id: string) => setCases(prev => prev.filter(c => c.id !== id));

  // 基础字段更新
  const updateCell = (id: string, field: keyof TypicalCase, value: any) => {
    setCases(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  // 多层土专项更新
  const updateSoilLayer = (caseId: string, layerIdx: number, field: keyof SoilLayer, value: number) => {
    setCases(prev => prev.map(c => {
        if (c.id !== caseId) return c;
        const newLayers = [...c.soilLayers];
        newLayers[layerIdx] = { ...newLayers[layerIdx], [field]: value };
        return { ...c, soilLayers: newLayers };
    }));
  };

  const addSoilLayer = (caseId: string) => {
    setCases(prev => prev.map(c => {
        if (c.id !== caseId) return c;
        return { ...c, soilLayers: [...c.soilLayers, { thickness: 5, gamma: 18, c: 10, phi: 15 }] };
    }));
  };

  const removeSoilLayer = (caseId: string, layerIdx: number) => {
    setCases(prev => prev.map(c => {
        if (c.id !== caseId) return c;
        return { ...c, soilLayers: c.soilLayers.filter((_, i) => i !== layerIdx) };
    }));
  };

  const downloadTemplate = () => {
      const bom = '\uFEFF';
      const headers = "算例名称,数据来源,坡高(m),坡角(°),地下水位(m),地震系数(Kh),文献实际FS,层1厚度(m),层1重度,层1粘聚力,层1内摩擦角,层2厚度(m),层2重度,层2粘聚力,层2内摩擦角\n";
      const sample = "演示滑坡,规范测算,15,40,8,0.05,1.12,5,18.5,12,18,10,21.0,25,24\n";
      const notes = "# 说明：若无第二层土，层2及后续列留空即可。地下水位填入大于坡高的数值即代表无水。\n";
      const blob = new Blob([bom + notes + headers + sample], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "边坡仿真案例导入模板.csv";
      link.click();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 确保用户上传的是 CSV 文件
    if (!file.name.endsWith('.csv')) {
      alert('请上传 .csv 格式的数据集文件！');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        // 处理不同操作系统的换行符
        const lines = text.split(/\r\n|\n/).filter(l => l.trim() !== '');
        if (lines.length < 2) return alert("文件为空或格式不正确");

        const headers = lines[0].split(',');

        // 辅助函数：根据表头模糊匹配获取对应列的值
        const getCol = (vals: string[], colName: string) => {
          const idx = headers.findIndex(h => h.includes(colName));
          return idx !== -1 ? vals[idx] : '0';
        };

        const parsedCases: TypicalCase[] = [];
        for (let i = 1; i < lines.length; i++) {
          // 简易 CSV 分隔（不处理内部带逗号的字符串，满足基础工程数据需求）
          const vals = lines[i].split(',');
          if (vals.length < headers.length) continue;

          const H = parseFloat(getCol(vals, '坡高H'));
          if (isNaN(H) || H <= 0) continue;

          // 动态组装多层土
          const layers = [];
          for (let l = 1; l <= 3; l++) {
            const t = parseFloat(getCol(vals, `L${l}_厚度`));
            if (t > 0) {
              layers.push({
                thickness: t,
                gamma: parseFloat(getCol(vals, `L${l}_重度`)),
                c: parseFloat(getCol(vals, `L${l}_C`)),
                phi: parseFloat(getCol(vals, `L${l}_Phi`))
              });
            }
          }

          parsedCases.push({
            id: `vv-case-${Date.now()}-${i}`,
            name: getCol(vals, '案例名称') || `导入算例 ${i}`,
            source: getCol(vals, '来源') || '批量导入',
            height: H,
            angle: parseFloat(getCol(vals, '坡角')),
            soilLayers: layers,
            y_gwt: parseFloat(getCol(vals, '地下水位')) || 0,
            k_h: parseFloat(getCol(vals, '地震系数')) || 0,
            actualFS: parseFloat(getCol(vals, '文献参考FS')) || 1.0,
            simFS: undefined,
            errorPct: undefined
          });
        }

        setCases(prev => [...prev, ...parsedCases]); 
        
        alert(`成功解析并导入 ${parsedCases.length} 条 V&V 验证算例！请点击【运行批量仿真验证】。`);
        
        // 清空 input 值允许重复上传同名文件
        if (e.target) e.target.value = '';
        
      } catch (err) {
        console.error(err);
        alert('文件解析失败，请检查 CSV 格式是否匹配标准模板。');
      }
    };
    
    // 使用 UTF-8 编码读取防止中文乱码
    reader.readAsText(file, 'UTF-8');
  };

  const runBatchValidation = () => {
    setIsCalculating(true);
    setTimeout(() => {
      const updatedCases = cases.map(c => {
        const cfg = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
        cfg.Geometry.H = c.height;
        cfg.Geometry.beta = c.angle;
        cfg.Water.has_water = c.y_gwt < c.height;
        cfg.Water.y_gwt = c.y_gwt;
        cfg.Seismic.k_h = c.k_h;

        // 动态组装多层土计算模型
        let currentElev = c.height;
        cfg.Geotech.soil_layers = c.soilLayers.map((layer, idx) => {
          const top_elev = currentElev;
          currentElev -= layer.thickness;
          return { top_elev, gamma: layer.gamma, c: layer.c, phi: layer.phi, desc: `L${idx+1}` };
        });

        const beta_rad = c.angle * Math.PI / 180.0;
        const orig_geom = (x: number) => get_original_elevation(x, c.height, beta_rad);
        
        const { min_FS } = compute_stability(orig_geom, c.height, beta_rad, cfg);
        const errorPct = Math.abs(min_FS - c.actualFS) / c.actualFS * 100;

        return { ...c, simFS: min_FS, errorPct: errorPct };
      });
      setCases(updatedCases);
      setIsCalculating(false);
    }, 800);
  };

  return (
    <div className="flex flex-col h-full bg-gray-100 p-4 space-y-4 font-sans text-gray-800">
      {/* 头部标题与置信度核心看板 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 bg-white p-4 border border-gray-300 shadow-sm rounded-sm">
        {/* 左侧：说明与常驻公式 */}
        <div className="xl:col-span-2 flex flex-col justify-center">
          <h2 className="text-sm font-bold text-gray-900 flex items-center uppercase tracking-tight">
            <Database className="w-4 h-4 mr-2 text-blue-600" />
            Typical Case Matrix & Accuracy Verification (V&V)
          </h2>
          <p className="text-[11px] text-gray-500 mt-1">
            Batch simulation of literature and engineering cases to evaluate the accuracy of the underlying finite element engine.
          </p>
          <div className="mt-3 bg-gray-50 border border-gray-200 p-3 text-[10px] text-gray-600 leading-relaxed font-mono">
            <span className="font-bold text-blue-700 flex items-center mb-1"><ShieldCheck className="w-3 h-3 mr-1"/> VERIFICATION CRITERIA:</span>
            Acceptance if |Simulation FS - Reference FS| / Reference FS ≤ 10%.
            <br/>
            <span className="font-bold text-gray-800 mt-1 inline-block bg-white px-2 py-0.5 border border-gray-300">CONFIDENCE = (QUALIFIED / TOTAL) × 100%</span>
            <span className="ml-3">TARGET THRESHOLD: <span className="font-bold text-blue-700 underline">90.0%</span></span>
          </div>
        </div>

        {/* 右侧：超大高亮仪表盘 */}
        <div className={`xl:col-span-1 flex flex-col justify-center items-center p-4 border ${computedCases.length > 0 ? (isQualified ? 'bg-blue-50/30 border-blue-200' : 'bg-red-50/30 border-red-200') : 'bg-gray-50 border-gray-200'} transition-all rounded-sm`}>
          <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Solver Confidence Score</div>
          <div className="flex items-center justify-center">
            <span className={`text-4xl font-black tracking-tighter font-mono ${computedCases.length === 0 ? 'text-gray-300' : (isQualified ? 'text-blue-700' : 'text-red-700')}`}>
              {computedCases.length === 0 ? '00.0%' : `${(confidenceScore ?? 0).toFixed(1)}%`}
            </span>
          </div>
          <div className="text-[10px] font-bold text-gray-500 mt-2 bg-white px-3 py-1 border border-gray-200">
            PASSED: {qualifiedCases.length} / {computedCases.length}
          </div>
        </div>
      </div>

      {/* 操作工具栏 */}
      <div className="bg-white p-2 border border-gray-300 flex flex-wrap gap-2 items-center rounded-sm">
        <button onClick={addRow} className="px-3 py-1.5 border border-gray-300 text-[11px] font-bold text-gray-700 hover:bg-gray-50 transition-colors uppercase">
          + Add Manual Case
        </button>
        
        <input type="file" accept=".csv" ref={fileInputRef} onChange={handleImport} className="hidden" />
        <button onClick={() => fileInputRef.current?.click()} className="px-3 py-1.5 border border-blue-200 bg-blue-50 text-blue-700 text-[11px] font-bold flex items-center hover:bg-blue-100 transition-colors uppercase">
          <FileSpreadsheet className="w-3.5 h-3.5 mr-2" /> Import Dataset (.CSV)
        </button>

        <button onClick={downloadTemplate} className="px-2 py-1 text-blue-600 hover:underline text-[10px] font-bold flex items-center transition-colors">
          <Download className="w-3 h-3 mr-1" /> Template & Documentation
        </button>

        <div className="flex-1"></div>

        <button onClick={handleSave} className="px-3 py-1.5 border border-gray-300 text-[11px] font-bold text-gray-700 flex items-center hover:bg-gray-50 transition-colors uppercase">
          <Save className="w-3.5 h-3.5 mr-2" /> Save Library
        </button>

        <button 
          onClick={runBatchValidation} 
          disabled={isCalculating || cases.length === 0}
          className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white text-[11px] font-bold flex items-center transition-all disabled:opacity-50 uppercase tracking-wider"
        >
          {isCalculating ? <span className="animate-pulse">Computing Matrix...</span> : <><Play className="w-3.5 h-3.5 mr-2" /> Execute Batch Verification</>}
        </button>
      </div>

      {/* 数据表格区 */}
      <div className="flex-1 bg-white border border-gray-300 overflow-hidden flex flex-col rounded-sm shadow-sm">
        <div className="overflow-auto flex-1 custom-scrollbar">
          <table className="w-full text-[11px] text-left border-collapse">
            <thead className="bg-gray-100 text-gray-600 font-bold uppercase sticky top-0 z-10 border-b border-gray-300">
              <tr>
                <th className="p-2 text-center border-r border-gray-300 w-10">ID</th>
                <th className="p-2 border-r border-gray-300">Description / Source</th>
                <th className="p-2 border-r border-gray-300 w-24 text-center">Geometry (H/β)</th>
                <th className="p-2 border-r border-gray-300">
                    <div className="flex items-center"><Layers className="w-3 h-3 mr-1"/> Geotechnical Parameters</div>
                </th>
                <th className="p-2 border-r border-gray-300 w-32">Environmental</th>
                <th className="p-2 border-r border-gray-300 text-center bg-gray-50 w-24">Reference FS</th>
                <th className="p-2 border-r border-gray-300 text-center bg-blue-50/30 w-24">Computed FS</th>
                <th className="p-2 border-r border-gray-300 text-center w-24">Error %</th>
                <th className="p-2 text-center w-16">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {cases.length === 0 ? (
                <tr><td colSpan={9} className="p-8 text-center text-gray-400 font-mono italic">No validation data found. Please import or add records.</td></tr>
              ) : (
                cases.map((c, index) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="p-2 text-center text-gray-400 font-mono border-r border-gray-200">{index + 1}</td>
                    <td className="p-2 border-r border-gray-200">
                      <input type="text" value={c.name} onChange={e => updateCell(c.id, 'name', e.target.value)} className="w-full bg-transparent border-0 border-b border-transparent focus:border-blue-500 focus:ring-0 p-0 text-[11px] font-bold text-gray-800 mb-0.5" />
                      <input type="text" value={c.source} onChange={e => updateCell(c.id, 'source', e.target.value)} className="w-full bg-transparent border-0 border-b border-transparent focus:border-blue-500 focus:ring-0 p-0 text-[10px] text-gray-400 font-mono" />
                    </td>
                    <td className="p-2 text-center border-r border-gray-200">
                      <div className="flex flex-col items-center space-y-1">
                        <div className="flex items-center space-x-1">
                          <input type="number" value={c.height} onChange={e => updateCell(c.id, 'height', parseFloat(e.target.value))} className="w-10 text-center border-gray-300 rounded-sm p-0.5 text-[10px] focus:ring-1 focus:ring-blue-500" />
                          <span className="text-[9px] text-gray-400 font-bold uppercase">m</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <input type="number" value={c.angle} onChange={e => updateCell(c.id, 'angle', parseFloat(e.target.value))} className="w-10 text-center border-gray-300 rounded-sm p-0.5 text-[10px] focus:ring-1 focus:ring-blue-500" />
                          <span className="text-[9px] text-gray-400 font-bold uppercase">deg</span>
                        </div>
                      </div>
                    </td>
                    
                    <td className="p-2 border-r border-gray-200">
                        <div className="flex flex-wrap gap-1">
                            {c.soilLayers.map((layer, lIdx) => (
                                <div key={lIdx} className="flex items-center gap-1 bg-gray-50 p-1 border border-gray-200 group/layer rounded-sm">
                                    <span className="text-[9px] text-gray-400 font-bold w-3">L{lIdx+1}</span>
                                    <input type="number" value={layer.thickness} onChange={e => updateSoilLayer(c.id, lIdx, 'thickness', parseFloat(e.target.value))} className="w-8 bg-white border-gray-200 rounded-sm p-0 text-center text-[10px]" title="t (m)" />
                                    <input type="number" value={layer.gamma} onChange={e => updateSoilLayer(c.id, lIdx, 'gamma', parseFloat(e.target.value))} className="w-8 bg-white border-gray-200 rounded-sm p-0 text-center text-[10px]" title="γ (kN/m³)" />
                                    <input type="number" value={layer.c} onChange={e => updateSoilLayer(c.id, lIdx, 'c', parseFloat(e.target.value))} className="w-8 bg-white border-gray-200 rounded-sm p-0 text-center text-[10px]" title="c (kPa)" />
                                    <input type="number" value={layer.phi} onChange={e => updateSoilLayer(c.id, lIdx, 'phi', parseFloat(e.target.value))} className="w-8 bg-white border-gray-200 rounded-sm p-0 text-center text-[10px]" title="φ (°)" />
                                    {c.soilLayers.length > 1 && (
                                        <button onClick={() => removeSoilLayer(c.id, lIdx)} className="text-red-500 hover:text-red-700 px-0.5 text-[10px] leading-none">×</button>
                                    )}
                                </div>
                            ))}
                            <button onClick={() => addSoilLayer(c.id)} className="text-[9px] text-blue-600 bg-white border border-blue-200 px-1.5 rounded-sm hover:bg-blue-50 font-bold">+</button>
                        </div>
                    </td>

                    <td className="p-2 border-r border-gray-200">
                        <div className="grid grid-cols-2 gap-1 px-1">
                            <div className="flex items-center text-[10px] text-gray-600">
                                <Droplets className="w-2.5 h-2.5 text-blue-400 mr-1" />
                                <input type="number" value={c.y_gwt} onChange={e => updateCell(c.id, 'y_gwt', parseFloat(e.target.value))} className="w-8 text-center border-gray-300 rounded-sm p-0 bg-white" />
                            </div>
                            <div className="flex items-center text-[10px] text-gray-600">
                                <Activity className="w-2.5 h-2.5 text-red-400 mr-1" />
                                <input type="number" step="0.01" value={c.k_h} onChange={e => updateCell(c.id, 'k_h', parseFloat(e.target.value))} className="w-8 text-center border-gray-300 rounded-sm p-0 bg-white" />
                            </div>
                        </div>
                    </td>

                    <td className="p-2 text-center border-r border-gray-200 bg-gray-50">
                      <input type="number" step="0.01" value={c.actualFS} onChange={e => updateCell(c.id, 'actualFS', parseFloat(e.target.value))} className="w-14 text-center font-bold text-gray-700 bg-white border border-gray-300 p-0.5 text-[11px] rounded-sm" />
                    </td>
                    <td className="p-2 text-center border-r border-gray-200 bg-blue-50/20 font-mono font-bold text-blue-800 text-[12px]">
                      {c.simFS !== undefined ? (c.simFS ?? 0).toFixed(3) : '---'}
                    </td>
                    <td className="p-2 text-center border-r border-gray-200">
                      {c.errorPct !== undefined ? (
                        <div className={`inline-flex items-center px-1.5 py-0.5 rounded-sm font-mono font-bold text-[10px] ${c.errorPct <= 10 ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                          {(c.errorPct ?? 0).toFixed(1)}%
                        </div>
                      ) : <span className="text-gray-300 font-mono">---</span>}
                    </td>
                    <td className="p-2 text-center">
                      <button onClick={() => deleteRow(c.id)} className="text-gray-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SlopeTypicalCases;