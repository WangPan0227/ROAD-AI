import React, { useState, useEffect } from 'react';
import { REINFORCEMENT_MEASURES } from '../constants';
import { SegmentInput, SegmentResult, ProjectResult, MeasureUsage, ReinforcementMeasure } from '../types';
import { JTG_DISEASES, SUB_INDICES_CONFIG, SCICalculationResult, DiseaseCategory } from '../types/jtg';
import { INDICATORS } from '../constants';
import Roadbed3DModel from './Roadbed3DModel';
import DisasterSimulation from './DisasterSimulation';
import SlopeAnalysis from './SlopeAnalysis';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

// TOPSIS Weights (Technical, Time, Cost, Durability, Eco)
const TOPSIS_WEIGHTS = {
  tech: 0.35,
  time: 0.25,
  cost: 0.20,
  dura: 0.15,
  eco: 0.05
};

const SmartDecisionModel: React.FC = () => {
  // --- State ---
  const [infraType, setInfraType] = useState<'road' | 'bridge' | 'tunnel'>('road');
  const [roadSubType, setRoadSubType] = useState<'subgrade' | 'slope'>('subgrade');

  const [segments, setSegments] = useState<SegmentInput[]>([
    {
      id: 'seg-1',
      name: 'K100+200 左侧路堤',
      roadLevel: 'highway',
      subgradeType: 'fill',
      rockType: 'granite',
      compaction: 92,
      width: 26,
      height: 6,
      rainfall: 50,
      groundWater: 1.5,
      temperature: 25,
      load: 5,
      disasterArea: 200, 
      crackDensity: 0.1,
      crackWidth: 5, 
      collapseRatio: 10,
      settlementLevel: 'medium',
      selectedDiseases: ['shoulder_defect', 'embankment_settlement']
    }
  ]);
  const [activeSegmentId, setActiveSegmentId] = useState<string>('seg-1');
  const [hasVisualInfo, setHasVisualInfo] = useState(true);
  
  // Resource Planning State
  const [personnelCount, setPersonnelCount] = useState<number>(20); // Default personnel
  
  const [projectResult, setProjectResult] = useState<ProjectResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [activeResultTab, setActiveResultTab] = useState<'summary' | string>('summary'); 

  const activeSegment = segments.find(s => s.id === activeSegmentId) || segments[0];

  // --- Segment Management ---
  const addSegment = () => {
    const newId = `seg-${segments.length + 1}`;
    setSegments([...segments, {
      ...segments[0],
      id: newId,
      name: `新建路段 ${segments.length + 1}`,
      disasterArea: 50
    }]);
    setActiveSegmentId(newId);
  };

  const removeSegment = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (segments.length > 1) {
      const newSegments = segments.filter(s => s.id !== id);
      setSegments(newSegments);
      if (activeSegmentId === id) setActiveSegmentId(newSegments[0].id);
    }
  };

  const updateSegment = (field: keyof SegmentInput, value: any) => {
    setSegments(segments.map(s => s.id === activeSegmentId ? { ...s, [field]: value } : s));
  };

  // --- Logic Engine ---

  // Helper: Weighted TOPSIS Ranking
  const calculateTOPSIS = (candidates: ReinforcementMeasure[], damageLevel: string): (ReinforcementMeasure & { topsisScore: number })[] => {
     if (candidates.length === 0) return [];

     const matrix = candidates.map(c => ({
       id: c.id,
       c1: c.technicalReliability, 
       c2: c.timeIndex, 
       c3: c.costIndex, 
       c4: c.durability, 
       c5: c.ecoFriendliness 
     }));

     const denoms = { c1:0, c2:0, c3:0, c4:0, c5:0 };
     ['c1','c2','c3','c4','c5'].forEach(k => {
        // @ts-ignore
        denoms[k] = Math.sqrt(matrix.reduce((sum, row) => sum + Math.pow(row[k], 2), 0));
     });

     const weighted = matrix.map(row => ({
       id: row.id,
       c1: (row.c1 / denoms.c1) * TOPSIS_WEIGHTS.tech,
       c2: (row.c2 / denoms.c2) * TOPSIS_WEIGHTS.time,
       c3: (row.c3 / denoms.c3) * TOPSIS_WEIGHTS.cost,
       c4: (row.c4 / denoms.c4) * TOPSIS_WEIGHTS.dura,
       c5: (row.c5 / denoms.c5) * TOPSIS_WEIGHTS.eco,
     }));

     const ideal = {
       c1: Math.max(...weighted.map(r => r.c1)),
       c2: Math.min(...weighted.map(r => r.c2)),
       c3: Math.min(...weighted.map(r => r.c3)),
       c4: Math.max(...weighted.map(r => r.c4)),
       c5: Math.max(...weighted.map(r => r.c5)),
     };
     const negIdeal = {
       c1: Math.min(...weighted.map(r => r.c1)),
       c2: Math.max(...weighted.map(r => r.c2)),
       c3: Math.max(...weighted.map(r => r.c3)),
       c4: Math.min(...weighted.map(r => r.c4)),
       c5: Math.min(...weighted.map(r => r.c5)),
     };

     return candidates.map(c => {
       const w = weighted.find(w => w.id === c.id)!;
       const distPos = Math.sqrt(
         Math.pow(w.c1 - ideal.c1, 2) + Math.pow(w.c2 - ideal.c2, 2) + 
         Math.pow(w.c3 - ideal.c3, 2) + Math.pow(w.c4 - ideal.c4, 2) + 
         Math.pow(w.c5 - ideal.c5, 2)
       );
       const distNeg = Math.sqrt(
         Math.pow(w.c1 - negIdeal.c1, 2) + Math.pow(w.c2 - negIdeal.c2, 2) + 
         Math.pow(w.c3 - negIdeal.c3, 2) + Math.pow(w.c4 - negIdeal.c4, 2) + 
         Math.pow(w.c5 - negIdeal.c5, 2)
       );
       const score = distNeg / (distPos + distNeg);
       return { ...c, topsisScore: score };
     }).sort((a, b) => b.topsisScore - a.topsisScore);
  };

  // Helper: Improved Cost and Time Estimation
  const calculateOptimizedMetrics = (measure: ReinforcementMeasure, area: number, personnel: number) => {
      // 1. Cost Calculation
      // Base Cost + Difficulty Multiplier + Scale effect (large area slightly cheaper per unit)
      const scaleFactor = Math.max(0.8, 1 - (area / 5000) * 0.1); 
      const difficultyFactor = 1 + (measure.difficultyIndex / 20);
      const estimatedCost = area * measure.unitCostCNY * scaleFactor * difficultyFactor;

      // 2. Time Calculation
      // Formula: (Workload / Effective Manpower) + Fixed Curing Time
      // Workload = Area * Difficulty * Coeff
      const workloadManHours = area * (measure.difficultyIndex * 0.4 + 1);
      
      // Effective Personnel (Diminishing returns for overcrowding)
      // Assuming 1 person per 10m2 is optimal, beyond that efficiency drops
      const optimalPersonnel = Math.max(5, area / 10);
      const efficiency = personnel <= optimalPersonnel 
          ? 1.0 
          : Math.max(0.5, 1.0 - ((personnel - optimalPersonnel) * 0.01));
      
      const effectiveManpower = personnel * efficiency;
      const constructionHours = workloadManHours / effectiveManpower;

      // Fixed Curing/Prep Time (Simulated based on TimeIndex)
      // High TimeIndex means longer curing/wait (e.g., concrete vs rolling)
      const fixedTime = measure.timeIndex * 2; 

      const estimatedTime = constructionHours + fixedTime;
      const baseManHours = workloadManHours;

      return { estimatedCost, estimatedTime, baseManHours };
  };

  // Helper: SCI Calculation
  const calculateSCI = (diseaseIds: string[]): SCICalculationResult => {
    const subIndices = SUB_INDICES_CONFIG.map(config => {
      const relevantDiseases = JTG_DISEASES.filter(d => d.category === config.category && diseaseIds.includes(d.id));
      const totalDeduction = relevantDiseases.reduce((sum, d) => sum + d.deduction, 0);
      const score = Math.max(0, 100 - totalDeduction);
      return { ...config, score };
    });

    const sci = subIndices.reduce((sum, sub) => sum + (sub.score * sub.weight), 0);
    return { SCI: sci, subIndices };
  };

  // Helper: Calculate Strength Indicators
  const calculateIndicators = (input: SegmentInput, diseaseIds: string[], isAfter: boolean): Record<string, number> => {
    const results: Record<string, number> = {};
    
    // Base values (simulated based on input)
    const baseK = input.compaction;
    const baseCBR = input.subgradeType === 'fill' ? 5 : 10;
    const baseRc = 0.5; // MPa
    const baseGamma = 18; // kN/m3 (Soil)
    const baseFlow = 0; // Not applicable for soil
    const baseSettlement = isAfter ? 2 : 15; // cm
    const baseIRI = isAfter ? 1.5 : 4.0; // m/km
    const baseFs = isAfter ? 1.4 : 1.05;

    // Adjust based on diseases if "before"
    let k = baseK;
    let cbr = baseCBR;
    let rc = baseRc;
    let gamma = baseGamma;
    let flow = baseFlow;
    let settlement = baseSettlement;
    let iri = baseIRI;
    let fs = baseFs;

    if (!isAfter) {
        if (diseaseIds.includes('embankment_settlement')) {
            settlement += 10;
            iri += 2;
            k -= 5;
        }
        if (diseaseIds.includes('embankment_frost')) {
            cbr -= 2;
            iri += 3;
        }
        if (diseaseIds.includes('slope_landslide') || diseaseIds.includes('slope_local_collapse')) {
            fs -= 0.3;
        }
        if (diseaseIds.includes('embankment_debris')) {
             k -= 2;
        }
    } else {
        // "After" improvements (Simulated)
        k = Math.min(100, k + 5);
        cbr += 3;
        rc = 1.0; // Improved material
        gamma = 12; // Lighter if foam soil used (simulated average)
        flow = 160; // Flowability of new material
    }

    // Map to Indicator Symbols
    results['K'] = k;
    results['CBR'] = cbr;
    results['Rc'] = rc;
    results['γ'] = gamma;
    results['F'] = flow;
    results['S'] = settlement;
    results['IRI'] = iri;
    results['Fs'] = fs;

    return results;
  };

  const analyzeSegment = (input: SegmentInput): SegmentResult => {
    // 0. SCI Calculation
    const sciBefore = calculateSCI(input.selectedDiseases || []);
    // Assume reinforcement fixes everything (or most things)
    // For simulation, let's say it removes all diseases
    const sciAfter = calculateSCI([]); 
    const sciImprovement = ((sciAfter.SCI - sciBefore.SCI) / sciBefore.SCI) * 100;

    // 0.1 Indicator Calculation
    const indicatorsBefore = calculateIndicators(input, input.selectedDiseases || [], false);
    const indicatorsAfter = calculateIndicators(input, [], true);

    // 1. Interaction Risk Scoring
    let visualScore = input.collapseRatio * 2.5 + input.crackWidth * 8;
    visualScore = Math.min(100, visualScore);
    let envScore = Math.max(input.rainfall/1.5, input.groundWater < 2 ? (2-input.groundWater)*50 : 0);
    let geoScore = 30;
    if (input.rockType === 'clay') geoScore = 60;
    if (input.rockType === 'soft_rock') geoScore = 50;
    if (input.rockType === 'granite') geoScore = 40;
    let interactionFactor = 1.0;
    if (input.rainfall > 50 && (input.rockType === 'clay' || input.rockType === 'granite')) {
        interactionFactor = 1.5; 
    }
    const riskScore = ((visualScore * 0.35) + (envScore * 0.25) + (geoScore * 0.20 * interactionFactor) + (input.load * 2));

    // 2. Damage Level
    let damageLevel: 'A' | 'B' | 'C' | 'D' = 'A';
    let disasterType = '轻微变形';
    if (input.collapseRatio > 35 || riskScore > 85) { damageLevel = 'D'; disasterType = '路基损毁/塌方'; }
    else if (riskScore > 65) { damageLevel = 'C'; disasterType = '严重破坏/滑移'; }
    else if (riskScore > 40) { damageLevel = 'B'; disasterType = '中度沉降/开裂'; }
    else { damageLevel = 'A'; disasterType = '轻微病害'; }

    // 3. Measure Filtering & Ranking
    let candidates = REINFORCEMENT_MEASURES.filter(m => {
       if (damageLevel === 'A') return ['m1', 'nm1', 'nm4'].includes(m.id); 
       if (damageLevel === 'B') return ['m1', 'nm1', 'm5', 'nm5'].includes(m.id);
       if (damageLevel === 'C') return ['nm2', 'nm5', 'nm3', 'm3', 'm5'].includes(m.id);
       if (damageLevel === 'D') return ['nm2', 'm3', 'nm6', 'nm3', 'm5'].includes(m.id);
       return true;
    });
    const rankedMeasures = calculateTOPSIS(candidates, damageLevel);

    let finalMeasures = [];
    let estimatedCost = 0;
    let baseManHours = 0;
    let totalTime = 0;

    const primary = rankedMeasures[0];

    if (primary) {
        const metrics = calculateOptimizedMetrics(primary, input.disasterArea, personnelCount);
        
        finalMeasures.push({
             ...primary, 
             score: primary.topsisScore * 100,
             reason: `TOPSIS: ${(primary.topsisScore).toFixed(2)}`
        });
        estimatedCost += metrics.estimatedCost;
        baseManHours += metrics.baseManHours;
        totalTime = Math.max(totalTime, metrics.estimatedTime);

        // Combo Logic
        if ((damageLevel === 'C' || damageLevel === 'D') && rankedMeasures.length > 1) {
            const secondary = rankedMeasures.find(m => m.id !== primary.id && ['m3', 'm5', 'nm5'].includes(m.id));
            if (secondary) {
                 // Assume secondary measure runs partially in parallel or overlaps
                 const secMetrics = calculateOptimizedMetrics(secondary, input.disasterArea, personnelCount * 0.5); // Split resources
                 
                 finalMeasures.push({
                     ...secondary,
                     score: secondary.topsisScore * 100,
                     reason: '组合增强',
                     isCombo: true,
                     comboDetails: '辅助加固'
                 });
                 estimatedCost += secMetrics.estimatedCost * 0.8; // Efficiency gain in combined contract
                 baseManHours += secMetrics.baseManHours;
                 // Parallelism factor: adds 30% of secondary time to total
                 totalTime += secMetrics.estimatedTime * 0.3; 
            }
        }
    }

    // --- Optimization Logic (> 6h) ---
    let optimization = undefined;
    if (totalTime > 6) {
        const targetTime = 5.5;
        // Approximation for suggestion
        const ratio = totalTime / targetTime;
        const neededPersonnel = Math.ceil(personnelCount * ratio * 1.1); // Add 10% buffer
        
        // Machinery Suggestion
        const machineryList = finalMeasures.flatMap(m => m.requiredMachinery);
        const uniqueMachinery = [...new Set(machineryList)];
        const suggestedMachines = uniqueMachinery.map(name => ({
             name, 
             count: Math.ceil(input.disasterArea / 150) + 1 
        }));

        optimization = {
            suggestedPersonnel: neededPersonnel,
            suggestedMachinery: suggestedMachines,
            optimizedTime: targetTime,
            note: '采用多机群并行作业与增加施工人员'
        };
    }

    const riskLevelMap: Record<string, 'Low'|'Medium'|'High'|'Critical'> = {
        'A': 'Low', 'B': 'Medium', 'C': 'High', 'D': 'Critical'
    };

    return {
      segmentId: input.id,
      segmentName: input.name,
      disasterType,
      riskLevel: riskLevelMap[damageLevel],
      damageLevel,
      recommendedMeasures: finalMeasures,
      estimatedCost,
      baseManHours,
      estimatedTime: parseFloat(totalTime.toFixed(1)),
      personnelCount,
      confidence: riskScore > 80 ? 0.95 : 0.85,
      factors: [
        { name: '降雨', value: input.rainfall },
        { name: '荷载', value: input.load * 10 },
        { name: '交互风险', value: geoScore * interactionFactor }, 
        { name: '塌方比', value: input.collapseRatio },
      ],
      measureDetails: finalMeasures.map(m => ({
          measureId: m.id,
          measureName: m.name,
          area: input.disasterArea,
          cost: input.disasterArea * m.unitCostCNY, // Simplified breakdown
          time: totalTime // Simplified
      })),
      timeBreakdown: [
         { step: '现场勘察', time: totalTime * 0.1 },
         { step: '物资调配', time: totalTime * 0.15 },
         { step: '主体施工', time: totalTime * 0.65 },
         { step: '养护监测', time: totalTime * 0.1 },
      ],
      optimization, // Return optimization object
      sciResult: {
        before: sciBefore,
        after: sciAfter,
        improvement: sciImprovement
      },
      indicatorResult: {
        before: indicatorsBefore,
        after: indicatorsAfter
      }
    };
  };

  // Re-run analysis when personnel count changes
  useEffect(() => {
    if (projectResult) {
        runSimulation();
    }
  }, [personnelCount]);

  const runSimulation = () => {
    setIsCalculating(true);
    setTimeout(() => {
      const results = segments.map(analyzeSegment);
      
      const totalCost = results.reduce((acc, r) => acc + r.estimatedCost, 0);
      const totalTime = Math.max(...results.map(r => r.estimatedTime));
      
      const summaryMap = new Map<string, MeasureUsage>();
      results.forEach(res => {
        res.measureDetails.forEach(det => {
          const existing = summaryMap.get(det.measureId);
          if (existing) {
            existing.area += det.area;
            existing.cost += det.cost;
            existing.time += det.time;
          } else {
            summaryMap.set(det.measureId, { ...det });
          }
        });
      });
      const projectMeasureSummary = Array.from(summaryMap.values());

      setProjectResult({
        totalTime,
        totalCost,
        criticalSegmentsCount: results.filter(r => r.riskLevel === 'High' || r.riskLevel === 'Critical').length,
        segmentResults: results,
        projectMeasureSummary
      });
      setIsCalculating(false);
      if (!projectResult) setActiveResultTab('summary');
    }, 500); 
  };

  return (
    <div className="flex flex-col h-full">
      {/* Infrastructure Type Selection Window */}
      <div className="bg-white p-4 border-b border-gray-200 flex items-center space-x-6 shadow-sm z-10">
        <div className="flex items-center space-x-2">
          <span className="font-bold text-gray-700 text-sm">基础设施类型:</span>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button 
              onClick={() => setInfraType('road')}
              className={`px-4 py-1.5 text-sm rounded-md transition-all ${infraType === 'road' ? 'bg-white shadow-sm text-primary font-bold' : 'text-gray-500 hover:text-gray-700'}`}
            >
              道路
            </button>
            <button 
              onClick={() => setInfraType('bridge')}
              className={`px-4 py-1.5 text-sm rounded-md transition-all ${infraType === 'bridge' ? 'bg-white shadow-sm text-primary font-bold' : 'text-gray-500 hover:text-gray-700'}`}
            >
              桥梁
            </button>
            <button 
              onClick={() => setInfraType('tunnel')}
              className={`px-4 py-1.5 text-sm rounded-md transition-all ${infraType === 'tunnel' ? 'bg-white shadow-sm text-primary font-bold' : 'text-gray-500 hover:text-gray-700'}`}
            >
              隧道
            </button>
          </div>
        </div>

        {infraType === 'road' && (
          <div className="flex items-center space-x-2 animate-fade-in">
            <span className="font-bold text-gray-700 text-sm">道路子类型:</span>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button 
                onClick={() => setRoadSubType('subgrade')}
                className={`px-4 py-1.5 text-sm rounded-md transition-all ${roadSubType === 'subgrade' ? 'bg-white shadow-sm text-secondary font-bold' : 'text-gray-500 hover:text-gray-700'}`}
              >
                路基
              </button>
              <button 
                onClick={() => setRoadSubType('slope')}
                className={`px-4 py-1.5 text-sm rounded-md transition-all ${roadSubType === 'slope' ? 'bg-white shadow-sm text-secondary font-bold' : 'text-gray-500 hover:text-gray-700'}`}
              >
                边坡
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        {infraType === 'road' && roadSubType === 'slope' ? (
          <SlopeAnalysis />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full p-6 overflow-hidden">
            {/* LEFT: Segment List & Inputs */}
            <div className="lg:col-span-3 flex flex-col space-y-4 h-full overflow-hidden">
              {/* Segment Manager */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col max-h-[30%]">
          <div className="p-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-bold text-gray-700 text-sm">路段管理 (Segments)</h3>
            <button onClick={addSegment} className="text-primary hover:text-blue-700 text-xs font-bold flex items-center">
              <span className="text-lg mr-1">+</span> Add
            </button>
          </div>
          <div className="overflow-y-auto p-2 space-y-2">
            {segments.map(seg => (
              <div 
                key={seg.id}
                onClick={() => setActiveSegmentId(seg.id)}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  activeSegmentId === seg.id 
                  ? 'bg-blue-50 border-primary shadow-sm' 
                  : 'bg-white border-gray-100 hover:border-gray-300'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-sm text-gray-800">{seg.name}</div>
                    <div className="text-xs text-gray-500 mt-1">Area: {seg.disasterArea}m²</div>
                  </div>
                  <button 
                    onClick={(e) => removeSegment(seg.id, e)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Segment Input Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex-1 overflow-y-auto">
          <div className="p-3 bg-blue-50 border-b border-blue-100">
            <h3 className="font-bold text-primary text-sm">参数配置: {activeSegment.name}</h3>
          </div>
          <div className="p-4 space-y-5 text-sm">
             {/* General Name */}
             <div>
               <label className="block text-xs font-bold text-gray-500 uppercase mb-1">路段名称</label>
               <input type="text" className="w-full border rounded p-1.5 focus:ring-1 focus:ring-primary outline-none" value={activeSegment.name} onChange={e => updateSegment('name', e.target.value)} />
             </div>

             {/* Group 1: Basic Attributes */}
             <div className="space-y-3 pt-2 border-t border-gray-100">
               <h4 className="font-bold text-gray-700 text-xs flex items-center">
                  <span className="w-1 h-3 bg-gray-400 mr-2 rounded"></span>
                  基础属性 (Basic)
               </h4>
               <div className="grid grid-cols-2 gap-3">
                 <div>
                   <label className="block text-[10px] text-gray-400 uppercase mb-1">路基类型</label>
                   <select 
                     className="w-full border rounded p-1.5 text-xs bg-gray-50"
                     value={activeSegment.subgradeType}
                     onChange={e => updateSegment('subgradeType', e.target.value)}
                   >
                     <option value="fill">填方</option>
                     <option value="cut">挖方</option>
                     <option value="half">半填半挖</option>
                   </select>
                 </div>
                 <div>
                    <label className="block text-[10px] text-gray-400 uppercase mb-1">压实度 (%)</label>
                    <input type="number" className="w-full border rounded p-1.5 text-xs" value={activeSegment.compaction} onChange={e => updateSegment('compaction', parseFloat(e.target.value))} />
                 </div>
               </div>
               <div className="grid grid-cols-2 gap-3">
                 <div>
                    <label className="block text-[10px] text-gray-400 uppercase mb-1">路基宽度 (m)</label>
                    <input type="number" className="w-full border rounded p-1.5 text-xs" value={activeSegment.width} onChange={e => updateSegment('width', parseFloat(e.target.value))} />
                 </div>
                 <div>
                    <label className="block text-[10px] text-gray-400 uppercase mb-1">路基高度 (m)</label>
                    <input type="number" className="w-full border rounded p-1.5 text-xs" value={activeSegment.height} onChange={e => updateSegment('height', parseFloat(e.target.value))} />
                 </div>
               </div>
             </div>

             {/* Group 3: Environment & Geology */}
             <div className="space-y-3 pt-2 border-t border-gray-100">
               <h4 className="font-bold text-secondary text-xs flex items-center">
                  <span className="w-1 h-3 bg-secondary mr-2 rounded"></span>
                  环境与地质工况 (Env & Geology)
               </h4>
               <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-[10px] text-gray-400 uppercase mb-1">近3日降雨 (mm)</label>
                        <input type="number" className="w-full border rounded p-1.5 text-xs" value={activeSegment.rainfall} onChange={e => updateSegment('rainfall', parseFloat(e.target.value))} />
                    </div>
                    <div>
                        <label className="block text-[10px] text-gray-400 uppercase mb-1">地下水位 (m)</label>
                        <input type="number" className="w-full border rounded p-1.5 text-xs" value={activeSegment.groundWater} onChange={e => updateSegment('groundWater', parseFloat(e.target.value))} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                     <div>
                        <label className="block text-[10px] text-gray-400 uppercase mb-1">环境温度 (°C)</label>
                        <input type="number" className="w-full border rounded p-1.5 text-xs" value={activeSegment.temperature} onChange={e => updateSegment('temperature', parseFloat(e.target.value))} />
                     </div>
                     <div>
                        <label className="block text-[10px] text-gray-400 uppercase mb-1" title="单位: 万次 (100kN BZZ-100)">累积荷载 (万次)</label>
                        <input type="number" className="w-full border rounded p-1.5 text-xs" value={activeSegment.load} onChange={e => updateSegment('load', parseFloat(e.target.value))} />
                     </div>
                  </div>
                  <div>
                   <label className="block text-[10px] text-gray-400 uppercase mb-1">岩土类型 (Soil Type)</label>
                   <select 
                     className="w-full border rounded p-1.5 text-xs bg-gray-50"
                     value={activeSegment.rockType}
                     onChange={e => updateSegment('rockType', e.target.value)}
                   >
                     <option value="granite">花岗岩残积土 (Granite Soil)</option>
                     <option value="clay">黏性土 (Clay)</option>
                     <option value="soft_rock">红层软岩 (Soft Rock)</option>
                     <option value="sand">砂土 (Sand)</option>
                   </select>
                   <p className="text-[9px] text-gray-400 mt-0.5">* 影响水稳性与抗剪强度</p>
                 </div>
               </div>
             </div>

             {/* Group 5: Visual Factors (Enhanced with Toggle) */}
             <div className="space-y-3 pt-2 border-t border-gray-100">
                <div className="flex justify-between items-center">
                    <h4 className="font-bold text-accent text-xs flex items-center">
                        <span className="w-1 h-3 bg-accent mr-2 rounded"></span>
                        可视化病害特征 (Visual)
                    </h4>
                    <button 
                        onClick={() => setHasVisualInfo(!hasVisualInfo)}
                        className={`text-[10px] px-2 py-0.5 rounded border ${hasVisualInfo ? 'bg-accent text-white border-accent' : 'bg-gray-100 text-gray-400'}`}
                    >
                        {hasVisualInfo ? '已启用' : '未启用'}
                    </button>
                </div>
                
                {hasVisualInfo && (
                    <div className="space-y-2 animate-fade-in">
                        <div>
                            <label className="block text-[10px] text-gray-400 uppercase mb-1">灾毁面积 (m²)</label>
                            <input type="number" className="w-full border rounded p-1.5 text-xs font-bold text-gray-700" value={activeSegment.disasterArea} onChange={e => updateSegment('disasterArea', parseFloat(e.target.value))} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[10px] text-gray-400 uppercase mb-1">裂缝宽度 (cm)</label>
                                <input type="number" step="0.1" className="w-full border rounded p-1.5 text-xs" value={activeSegment.crackWidth} onChange={e => updateSegment('crackWidth', parseFloat(e.target.value))} />
                            </div>
                            <div>
                                <label className="block text-[10px] text-gray-400 uppercase mb-1">裂缝密度 (m/m²)</label>
                                <input type="number" step="0.1" className="w-full border rounded p-1.5 text-xs" value={activeSegment.crackDensity} onChange={e => updateSegment('crackDensity', parseFloat(e.target.value))} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[10px] text-gray-400 uppercase mb-1">垮塌占比 (%)</label>
                                <input type="number" step="1" className="w-full border rounded p-1.5 text-xs" value={activeSegment.collapseRatio} onChange={e => updateSegment('collapseRatio', parseFloat(e.target.value))} />
                            </div>
                            <div>
                                <label className="block text-[10px] text-gray-400 uppercase mb-1">沉降等级</label>
                                <select 
                                    className="w-full border rounded p-1.5 text-xs bg-white"
                                    value={activeSegment.settlementLevel}
                                    onChange={e => updateSegment('settlementLevel', e.target.value)}
                                >
                                    <option value="light">轻微</option>
                                    <option value="medium">中等</option>
                                    <option value="heavy">严重</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}
             </div>

          </div>
          <div className="p-4 border-t bg-gray-50 sticky bottom-0">
             <button 
              onClick={runSimulation}
              disabled={isCalculating}
              className="w-full bg-primary hover:bg-blue-700 text-white font-bold py-2 rounded-lg shadow-lg transition-all transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center text-sm"
            >
              {isCalculating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  智能运算中...
                </>
              ) : '运行高精度分析 (Precision Analysis)'}
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT: Visualization & Results */}
      <div className="lg:col-span-9 flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Results Header Tabs */}
        <div className="flex bg-gray-50 border-b border-gray-200 overflow-x-auto">
           <button 
             onClick={() => setActiveResultTab('summary')}
             className={`px-6 py-3 text-sm font-bold border-r whitespace-nowrap ${activeResultTab === 'summary' ? 'bg-white text-primary border-t-2 border-t-primary' : 'text-gray-500 hover:bg-gray-100'}`}
           >
             项目总览 (Summary)
           </button>
           {projectResult?.segmentResults.map(res => (
             <button
               key={res.segmentId}
               onClick={() => setActiveResultTab(res.segmentId)}
               className={`px-4 py-3 text-sm font-medium border-r flex items-center space-x-2 whitespace-nowrap ${activeResultTab === res.segmentId ? 'bg-white text-blue-600 border-t-2 border-t-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
             >
               <span>{res.segmentName}</span>
               {res.riskLevel === 'Critical' ? <span className="w-2 h-2 rounded-full bg-red-600"></span> : 
                res.riskLevel === 'High' ? <span className="w-2 h-2 rounded-full bg-red-400"></span> : null}
             </button>
           ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
          {!projectResult ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <div className="text-4xl mb-4">📊</div>
              <p>请在左侧配置路段参数并点击运行分析</p>
              <p className="text-xs mt-2 text-gray-300">系统已升级至最新灾毁评估标准 (2025版)</p>
            </div>
          ) : (
            <>
              {activeResultTab === 'summary' ? (
                <div className="space-y-6 animate-fade-in">
                  {/* Dashboard Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                      <div className="text-sm text-gray-500 mb-1">总抢修预估成本</div>
                      <div className="text-3xl font-bold text-gray-800">¥{(projectResult.totalCost / 10000).toFixed(2)} <span className="text-sm font-normal">万</span></div>
                      <div className="text-xs text-green-600 mt-2 flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                        含新材料应用成本
                      </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                      <div className="text-sm text-gray-500 mb-1">预计项目工期 (并行)</div>
                      <div className="text-3xl font-bold text-blue-600">{projectResult.totalTime} <span className="text-sm font-normal">小时</span></div>
                      <div className="text-xs text-gray-400 mt-2">基于 {personnelCount} 人抢修团队</div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                      <div className="text-sm text-gray-500 mb-1">高危/损毁路段</div>
                      <div className="text-3xl font-bold text-red-500">{projectResult.criticalSegmentsCount} <span className="text-sm font-normal">/ {segments.length}</span></div>
                      <div className="text-xs text-red-400 mt-2">等级 C-D</div>
                    </div>
                  </div>

                  {/* Resource Adjuster */}
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
                      <div className="flex-shrink-0">
                          <span className="font-bold text-gray-700">当前抢修人力配置:</span>
                      </div>
                      <div className="flex-1">
                          <input 
                             type="range" min="5" max="100" step="5"
                             value={personnelCount}
                             onChange={(e) => setPersonnelCount(parseInt(e.target.value))}
                             className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          />
                      </div>
                      <div className="w-16 font-mono text-blue-600 font-bold">{personnelCount} 人</div>
                      <div className="text-xs text-gray-400">
                          (影响工期预测)
                      </div>
                  </div>

                  {/* Project Breakdown */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Measure Cost Breakdown */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 min-h-[300px]">
                      <h4 className="font-bold text-gray-700 mb-4 border-b pb-2">加固措施明细 (Measures Breakdown)</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-gray-50 text-left text-gray-500">
                              <th className="p-2 rounded-l">措施名称</th>
                              <th className="p-2">覆盖面积</th>
                              <th className="p-2 text-right">预估工时</th>
                              <th className="p-2 text-right rounded-r">预估成本</th>
                            </tr>
                          </thead>
                          <tbody>
                            {projectResult.projectMeasureSummary.map((m, i) => (
                              <tr key={i} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                                <td className="p-2 font-medium text-gray-700">{m.measureName}</td>
                                <td className="p-2 text-gray-500">{m.area.toFixed(0)} m²</td>
                                <td className="p-2 text-right font-mono text-blue-600">{m.time.toFixed(1)} h</td>
                                <td className="p-2 text-right font-mono text-primary">¥{m.cost.toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Segment Chart */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 min-h-[300px]">
                      <h4 className="font-bold text-gray-700 mb-4 border-b pb-2">路段工期对比 (Time by Segment)</h4>
                       <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={projectResult.segmentResults} layout="vertical" margin={{top: 5, right: 30, left: 40, bottom: 5}}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                          <XAxis type="number" hide />
                          <YAxis dataKey="segmentName" type="category" width={100} tick={{fontSize: 10}} />
                          <Tooltip formatter={(value) => [`${value} h`, 'Estimated Time']} />
                          <Bar dataKey="estimatedTime" fill="#82ca9d" radius={[0, 4, 4, 0]} barSize={20} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              ) : (
                // Detailed Segment View
                (() => {
                  const res = projectResult.segmentResults.find(r => r.segmentId === activeResultTab);
                  if (!res) return null;
                  return (
                    <div className="space-y-6 animate-fade-in">
                      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                         <div className="flex justify-between items-start mb-4">
                            <h4 className="font-bold text-lg flex items-center">
                                <span className="w-2 h-6 bg-accent rounded-full mr-3"></span>
                                {res.disasterType} 
                                <span className={`ml-3 text-xs px-2 py-1 rounded text-white ${['High','Critical'].includes(res.riskLevel) ? 'bg-red-500' : 'bg-yellow-500'}`}>Level {res.damageLevel}</span>
                            </h4>
                            <div className="text-right text-xs text-gray-400">
                                置信度: {(res.confidence * 100).toFixed(0)}%
                            </div>
                         </div>
                         
                         {/* Time Optimization Alert (>6h) */}
                         {res.optimization && (
                            <div className="mb-6 bg-orange-50 border border-orange-200 rounded-lg p-4 animate-pulse-slow">
                                <div className="flex items-start">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-orange-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3 w-full">
                                        <h3 className="text-sm font-medium text-orange-800">
                                            ⚠️ 抢修时间预警 (&gt;6h)
                                        </h3>
                                        <div className="mt-2 text-sm text-orange-700">
                                            <p className="mb-2">当前预测工期为 <span className="font-bold">{res.estimatedTime}小时</span>，超过6小时警戒值。建议采取以下优化措施：</p>
                                            <div className="bg-white/50 rounded p-2 grid grid-cols-2 gap-4">
                                                <div>
                                                    <span className="block text-xs font-bold text-gray-500">建议增派人力至</span>
                                                    <span className="text-lg font-bold text-blue-600">{res.optimization.suggestedPersonnel} 人</span>
                                                </div>
                                                <div>
                                                    <span className="block text-xs font-bold text-gray-500">建议增加机械</span>
                                                    <div className="text-sm font-medium">
                                                        {res.optimization.suggestedMachinery.map((m,i) => (
                                                            <span key={i} className="mr-2">{m.name} x{m.count}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="mt-2 text-xs italic">预期优化后工期: {res.optimization.optimizedTime} 小时</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                         )}

                         {/* SCI Evaluation & 3D Model */}
                         {res.sciResult && (
                             <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                                 {/* 3D Model */}
                                 <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                     <div className="p-3 bg-gray-50 border-b border-gray-200">
                                         <h5 className="font-bold text-gray-700 text-sm">路基病害3D演示 (3D Visualization)</h5>
                                     </div>
                                     <div className="p-2">
                                         <Roadbed3DModel 
                                            diseaseState="before" 
                                            activeDisease={segments.find(s => s.id === res.segmentId)?.selectedDiseases?.[0] || null} 
                                         />
                                     </div>
                                 </div>

                                 {/* SCI Table */}
                                 <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                     <div className="p-3 bg-gray-50 border-b border-gray-200">
                                         <h5 className="font-bold text-gray-700 text-sm">技术状况指数评定 (SCI Evaluation)</h5>
                                     </div>
                                     <div className="p-4">
                                         <div className="flex items-center justify-between mb-4">
                                             <div>
                                                 <div className="text-xs text-gray-500">加固前 SCI</div>
                                                 <div className="text-2xl font-bold text-red-500">{res.sciResult.before.SCI.toFixed(1)}</div>
                                             </div>
                                             <div className="text-center">
                                                 <div className="text-xs text-gray-400">提升</div>
                                                 <div className="text-lg font-bold text-green-500">+{res.sciResult.improvement.toFixed(1)}%</div>
                                             </div>
                                             <div className="text-right">
                                                 <div className="text-xs text-gray-500">加固后 SCI</div>
                                                 <div className="text-2xl font-bold text-green-600">{res.sciResult.after.SCI.toFixed(1)}</div>
                                             </div>
                                         </div>
                                         
                                         <table className="w-full text-xs">
                                             <thead>
                                                 <tr className="bg-gray-50 text-gray-500">
                                                     <th className="p-2 text-left">指标 (Index)</th>
                                                     <th className="p-2 text-right">前 (Before)</th>
                                                     <th className="p-2 text-right">后 (After)</th>
                                                     <th className="p-2 text-right">变化</th>
                                                 </tr>
                                             </thead>
                                             <tbody>
                                                 {res.sciResult.before.subIndices.map((sub: any, idx: number) => (
                                                     <tr key={sub.code} className="border-b border-gray-100 last:border-0">
                                                         <td className="p-2 font-medium text-gray-700" title={sub.name}>{sub.code}</td>
                                                         <td className="p-2 text-right text-red-500 font-mono">{sub.score.toFixed(1)}</td>
                                                         <td className="p-2 text-right text-green-600 font-mono">{res.sciResult.after.subIndices[idx].score.toFixed(1)}</td>
                                                         <td className="p-2 text-right text-green-500">
                                                             +{(res.sciResult.after.subIndices[idx].score - sub.score).toFixed(1)}
                                                         </td>
                                                     </tr>
                                                 ))}
                                             </tbody>
                                         </table>
                                     </div>
                                 </div>
                             </div>
                         )}

                         {/* Strength Indicators Table */}
                         {res.indicatorResult && (
                             <div className="mb-6 bg-white rounded-xl border border-gray-200 overflow-hidden">
                                 <div className="p-3 bg-gray-50 border-b border-gray-200">
                                     <h5 className="font-bold text-gray-700 text-sm">强度与技术指标对比 (Strength & Technical Indicators)</h5>
                                 </div>
                                 <div className="p-4 overflow-x-auto">
                                     <table className="w-full text-xs">
                                         <thead>
                                             <tr className="bg-gray-50 text-gray-500">
                                                 <th className="p-2 text-left">指标名称 (Name)</th>
                                                 <th className="p-2 text-center">符号 (Symbol)</th>
                                                 <th className="p-2 text-right">加固前 (Before)</th>
                                                 <th className="p-2 text-right">加固后 (After)</th>
                                                 <th className="p-2 text-right">变化 (Change)</th>
                                                 <th className="p-2 text-left text-gray-400">参考标准</th>
                                             </tr>
                                         </thead>
                                         <tbody>
                                             {INDICATORS.filter(ind => ind.symbol !== 'SCI').map((ind) => {
                                                 const valBefore = res.indicatorResult?.before[ind.symbol || ''] || 0;
                                                 const valAfter = res.indicatorResult?.after[ind.symbol || ''] || 0;
                                                 const change = valAfter - valBefore;
                                                 const percent = valBefore !== 0 ? (change / valBefore) * 100 : 0;
                                                 
                                                 // Determine if increase is good or bad based on indicator
                                                 // Good increase: K, CBR, Rc, Fs
                                                 // Bad increase (Good decrease): S, IRI
                                                 const isHigherBetter = ['K', 'CBR', 'Rc', 'Fs', 'F'].includes(ind.symbol || '');
                                                 const isGood = isHigherBetter ? change >= 0 : change <= 0;
                                                 
                                                 return (
                                                     <tr key={ind.name} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                                                         <td className="p-2 font-medium text-gray-700">{ind.name}</td>
                                                         <td className="p-2 text-center font-mono bg-gray-100 rounded text-gray-600">{ind.symbol}</td>
                                                         <td className="p-2 text-right font-mono">{valBefore.toFixed(2)}</td>
                                                         <td className="p-2 text-right font-mono font-bold">{valAfter.toFixed(2)}</td>
                                                         <td className={`p-2 text-right font-mono ${isGood ? 'text-green-600' : 'text-red-500'}`}>
                                                             {change > 0 ? '+' : ''}{change.toFixed(2)} 
                                                             <span className="text-[10px] ml-1 opacity-75">({percent > 0 ? '+' : ''}{percent.toFixed(1)}%)</span>
                                                         </td>
                                                         <td className="p-2 text-left text-gray-400 text-[10px] truncate max-w-[150px]" title={ind.standard}>{ind.standard}</td>
                                                     </tr>
                                                 );
                                             })}
                                         </tbody>
                                     </table>
                                 </div>
                             </div>
                         )}

                         {/* 3D Simulation Grid (Legacy) */}
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            {/* Window 1: Disaster Context */}
                            <div className="h-[400px]">
                              <h5 className="font-bold text-xs text-gray-500 uppercase mb-2">灾损演化模拟 (Disaster Context)</h5>
                              <DisasterSimulation 
                                  width={segments.find(s => s.id === res.segmentId)?.width || 20}
                                  height={segments.find(s => s.id === res.segmentId)?.height || 6}
                                  disasterType={res.disasterType}
                                  subgradeType={segments.find(s => s.id === res.segmentId)?.subgradeType || 'fill'}
                                  severity={res.confidence}
                                  measures={[]} 
                                  initialMode="disaster"
                               />
                            </div>

                            {/* Windows for Repairs */}
                            {res.recommendedMeasures.map((measure, idx) => (
                              <div key={idx} className="h-[400px]">
                                <h5 className="font-bold text-xs text-gray-500 uppercase mb-2">加固措施模拟: {measure.name}</h5>
                                <DisasterSimulation 
                                    width={segments.find(s => s.id === res.segmentId)?.width || 20}
                                    height={segments.find(s => s.id === res.segmentId)?.height || 6}
                                    disasterType={res.disasterType}
                                    subgradeType={segments.find(s => s.id === res.segmentId)?.subgradeType || 'fill'}
                                    severity={res.confidence}
                                    measures={[measure]} 
                                    initialMode="repair"
                                 />
                              </div>
                            ))}
                         </div>

                         <div className="border-t pt-4">
                           <h5 className="font-bold text-gray-700 mb-3">加固方案详情 (Optimization by TOPSIS)</h5>
                           <div className="space-y-3">
                             {res.recommendedMeasures.map((m, idx) => (
                               <div key={idx} className={`flex justify-between items-center p-3 rounded-lg border ${m.isCombo ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                                 <div>
                                   <div className="font-bold text-gray-800 flex items-center">
                                     {m.name}
                                     <span className="ml-2 text-[10px] bg-purple-100 text-purple-800 px-1.5 rounded">
                                        TOPSIS: {(m.topsisScore * 100).toFixed(1)}
                                     </span>
                                     {m.isCombo && <span className="ml-2 text-[10px] bg-green-200 text-green-800 px-1.5 rounded">组合策略</span>}
                                   </div>
                                   <div className="text-xs text-gray-500 mt-0.5">{m.reason} {m.comboDetails && `- ${m.comboDetails}`}</div>
                                 </div>
                                 <div className="text-right">
                                   <div className="font-mono font-bold text-gray-700">¥{m.unitCostCNY}/m²</div>
                                 </div>
                               </div>
                             ))}
                           </div>
                           <div className="mt-4 flex justify-between items-center bg-gray-100 p-3 rounded-lg">
                             <span className="text-sm font-bold text-gray-600">本路段预估总造价:</span>
                             <span className="text-xl font-bold text-primary">¥{res.estimatedCost.toLocaleString()}</span>
                           </div>
                         </div>
                      </div>
                    </div>
                  );
                })()
              )}
            </>
          )}
        </div>
      </div>
      </div>
        )}
      </div>
    </div>
  );
};

export default SmartDecisionModel;