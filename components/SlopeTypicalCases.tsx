import React, { useState, useEffect, useRef } from 'react';
import { 
  Database, FileSpreadsheet, Play, Save, CheckCircle2, XCircle, AlertTriangle, ShieldCheck, Download, HelpCircle, Layers, Droplets, Activity
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
  const [cases, setCases] = useState<TypicalCase[]>([]);
  const [isComputing, setIsComputing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 初始化加载
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { setCases(JSON.parse(saved)); } catch (e) {}
    } else {
      setCases([
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
      ]);
    }
  }, []);

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
    setIsComputing(true);
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
      setIsComputing(false);
    }, 800);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 p-6 space-y-6">
      {/* 头部标题与置信度核心看板 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        {/* 左侧：说明与常驻公式 */}
        <div className="xl:col-span-2 flex flex-col justify-center">
          <h2 className="text-2xl font-black text-gray-800 flex items-center">
            <Database className="w-7 h-7 mr-3 text-blue-600" />
            典型案例库与模型置信度验证 (V&V)
          </h2>
          <p className="text-sm text-gray-500 mt-2">
            导入文献与工程实际案例，批量调用极限平衡仿真模型，自动评估底层计算引擎的精度置信度。
          </p>
          <div className="mt-4 bg-blue-50/50 border border-blue-100 rounded-lg p-4 text-xs text-gray-700 leading-relaxed">
            <span className="font-bold text-blue-800 flex items-center mb-1"><ShieldCheck className="w-4 h-4 mr-1"/> 核心指标计算依据：</span>
            系统将表内案例输入底层极限平衡算法进行验算。对比 [仿真计算FS] 与 [文献/实际FS]，若相对误差 ≤ 10%，则记为“合格”。
            <br/>
            <span className="font-bold text-gray-800 mt-1 inline-block bg-white px-2 py-0.5 rounded border border-gray-200">置信度 = (合格算例数 / 总算例数) × 100%</span>
            <span className="ml-3">系统规定 <span className="font-bold text-red-600 border-b border-red-300">阈值为 90%</span>，达标后底层求解器方可准入真实工程辅助设计。</span>
          </div>
        </div>

        {/* 右侧：超大高亮仪表盘 */}
        <div className={`xl:col-span-1 flex flex-col justify-center items-center p-6 rounded-xl border-2 ${computedCases.length > 0 ? (isQualified ? 'bg-green-50 border-green-400 shadow-md shadow-green-100' : 'bg-red-50 border-red-400 shadow-md shadow-red-100') : 'bg-gray-50 border-gray-200'} transition-all`}>
          <div className="text-xs font-black text-gray-500 uppercase tracking-wider mb-2">系统求解器当前置信度</div>
          <div className="flex items-center justify-center">
            {computedCases.length === 0 ? <ShieldCheck className="w-8 h-8 text-gray-300 mr-3" /> :
             (isQualified ? <ShieldCheck className="w-12 h-12 text-green-500 mr-3" /> : <AlertTriangle className="w-12 h-12 text-red-500 mr-3" />)}
            <span className={`text-6xl font-black tracking-tighter ${computedCases.length === 0 ? 'text-gray-300' : (isQualified ? 'text-green-600' : 'text-red-600')}`}>
              {computedCases.length === 0 ? '--' : `${confidenceScore.toFixed(1)}%`}
            </span>
          </div>
          <div className="text-sm font-bold text-gray-600 mt-4 bg-white/80 px-4 py-1.5 rounded-full shadow-sm border border-gray-200">
            {qualifiedCases.length} / {computedCases.length} 个算例合格
          </div>
        </div>
      </div>

      {/* 操作工具栏 */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-wrap gap-3 items-center">
        <button onClick={addRow} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">
          + 手动录入算例
        </button>
        
        <input type="file" accept=".csv" ref={fileInputRef} onChange={handleImport} className="hidden" />
        <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 border border-blue-200 bg-blue-50 text-blue-700 rounded-lg text-sm font-bold flex items-center hover:bg-blue-100 transition-colors">
          <FileSpreadsheet className="w-4 h-4 mr-2" /> 导入文献数据集
        </button>

        <button onClick={downloadTemplate} className="px-3 py-2 text-blue-500 hover:text-blue-700 text-xs font-bold flex items-center transition-colors underline">
          <Download className="w-3 h-3 mr-1" /> 下载Excel导入模板与说明
        </button>

        <div className="flex-1"></div>

        <button onClick={handleSave} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-bold text-gray-700 flex items-center hover:bg-gray-50 transition-colors">
          <Save className="w-4 h-4 mr-2" /> 保存案例库
        </button>

        <button 
          onClick={runBatchValidation} 
          disabled={isComputing || cases.length === 0}
          className="px-6 py-2 bg-primary hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-md flex items-center transition-all disabled:opacity-50"
        >
          {isComputing ? <span className="animate-pulse">正在全矩阵计算...</span> : <><Play className="w-4 h-4 mr-2" /> 运行批量仿真验证</>}
        </button>
      </div>

      {/* 数据表格区 */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        <div className="overflow-auto flex-1">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#4C72B0] text-white text-xs uppercase whitespace-nowrap sticky top-0 z-10">
              <tr>
                <th className="p-3 text-center">#</th>
                <th className="p-3 min-w-[150px]">算例名称 / 来源</th>
                <th className="p-3">几何(H/β)</th>
                <th className="p-3 min-w-[280px]">
                    <div className="flex items-center"><Layers className="w-3 h-3 mr-1"/> 岩土地层参数 (厚度/γ/c/φ)</div>
                </th>
                <th className="p-3 min-w-[120px]">环境与荷载</th>
                <th className="p-3 bg-[#3a5a8f] font-bold text-center">文献/实际 FS</th>
                <th className="p-3 bg-secondary text-center border-l border-[#3a5a8f]">仿真计算 FS</th>
                <th className="p-3 bg-secondary text-center">误差分析</th>
                <th className="p-3 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cases.length === 0 ? (
                <tr><td colSpan={9} className="p-8 text-center text-gray-400">暂无数据，请添加或导入案例</td></tr>
              ) : (
                cases.map((c, index) => (
                  <tr key={c.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="p-3 text-center text-gray-400 font-mono align-top pt-4">{index + 1}</td>
                    <td className="p-3 align-top pt-3">
                      <input type="text" value={c.name} onChange={e => updateCell(c.id, 'name', e.target.value)} className="w-full bg-transparent border-0 border-b border-transparent focus:border-blue-500 focus:ring-0 p-1 text-sm font-bold text-gray-800 mb-1" placeholder="算例名称" />
                      <input type="text" value={c.source} onChange={e => updateCell(c.id, 'source', e.target.value)} className="w-full bg-transparent border-0 border-b border-transparent focus:border-blue-500 focus:ring-0 p-1 text-xs text-gray-500" placeholder="数据来源" />
                    </td>
                    <td className="p-3 align-top pt-4 whitespace-nowrap">
                      <input type="number" value={c.height} onChange={e => updateCell(c.id, 'height', parseFloat(e.target.value))} className="w-12 text-center border-gray-200 rounded p-1 text-xs" title="坡高(m)" /> m <br/>
                      <input type="number" value={c.angle} onChange={e => updateCell(c.id, 'angle', parseFloat(e.target.value))} className="w-12 text-center border-gray-200 rounded p-1 text-xs mt-2" title="坡角(°)" /> °
                    </td>
                    
                    {/* 多层土联级表单区域 */}
                    <td className="p-3">
                        <div className="space-y-2">
                            {c.soilLayers.map((layer, lIdx) => (
                                <div key={lIdx} className="flex items-center gap-1 bg-gray-50 p-1.5 rounded border border-gray-100 group/layer">
                                    <span className="text-[10px] text-gray-400 font-bold w-4">L{lIdx+1}</span>
                                    <input type="number" value={layer.thickness} onChange={e => updateSoilLayer(c.id, lIdx, 'thickness', parseFloat(e.target.value))} className="w-10 text-center border-gray-200 rounded p-1 text-xs" title="层厚(m)" placeholder="厚" />
                                    <input type="number" value={layer.gamma} onChange={e => updateSoilLayer(c.id, lIdx, 'gamma', parseFloat(e.target.value))} className="w-12 text-center border-gray-200 rounded p-1 text-xs" title="重度 γ (kN/m³)" placeholder="γ" />
                                    <input type="number" value={layer.c} onChange={e => updateSoilLayer(c.id, lIdx, 'c', parseFloat(e.target.value))} className="w-10 text-center border-gray-200 rounded p-1 text-xs" title="粘聚力 c (kPa)" placeholder="c" />
                                    <input type="number" value={layer.phi} onChange={e => updateSoilLayer(c.id, lIdx, 'phi', parseFloat(e.target.value))} className="w-10 text-center border-gray-200 rounded p-1 text-xs" title="摩擦角 φ (°)" placeholder="φ" />
                                    {c.soilLayers.length > 1 && (
                                        <button onClick={() => removeSoilLayer(c.id, lIdx)} className="text-red-400 hover:text-red-600 px-1 opacity-0 group-hover/layer:opacity-100 transition-opacity">×</button>
                                    )}
                                </div>
                            ))}
                            <button onClick={() => addSoilLayer(c.id)} className="text-[10px] text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100 hover:bg-blue-100 font-bold">+ 添加土层</button>
                        </div>
                    </td>

                    {/* 防呆设计的环境工况区 */}
                    <td className="p-3 align-top pt-4">
                        <div className="flex flex-col space-y-3">
                            <div className="flex items-center text-xs">
                                <Droplets className="w-3 h-3 text-blue-500 mr-1" title="地下水位"/>
                                <input type="number" value={c.y_gwt} onChange={e => updateCell(c.id, 'y_gwt', parseFloat(e.target.value))} className="w-14 text-center border-gray-200 rounded p-1" /> m
                            </div>
                            <div className="flex items-center text-xs">
                                <Activity className="w-3 h-3 text-red-500 mr-1" title="地震系数(Kh)"/>
                                <input type="number" step="0.01" value={c.k_h} onChange={e => updateCell(c.id, 'k_h', parseFloat(e.target.value))} className="w-14 text-center border-gray-200 rounded p-1" /> Kh
                            </div>
                        </div>
                    </td>

                    <td className="p-3 text-center align-middle bg-blue-50/30">
                      <input type="number" step="0.01" value={c.actualFS} onChange={e => updateCell(c.id, 'actualFS', parseFloat(e.target.value))} className="w-16 text-center font-bold text-blue-700 bg-white border-blue-200 rounded p-1.5 text-sm shadow-inner" />
                    </td>
                    <td className="p-3 text-center align-middle bg-gray-50 border-l border-gray-100 font-mono font-bold text-gray-700 text-lg">
                      {c.simFS !== undefined ? c.simFS.toFixed(3) : '-'}
                    </td>
                    <td className="p-3 text-center align-middle bg-gray-50">
                      {c.errorPct !== undefined ? (
                        <div className={`flex items-center justify-center space-x-1 p-1.5 rounded ${c.errorPct <= 10 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {c.errorPct <= 10 ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                          <span className="font-bold text-sm">{c.errorPct.toFixed(1)}%</span>
                        </div>
                      ) : '-'}
                    </td>
                    <td className="p-3 text-center align-middle">
                      <button onClick={() => deleteRow(c.id)} className="text-gray-400 hover:text-red-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                        删除
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