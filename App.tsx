import React, { useState } from 'react';
import { 
  Layers, Map, Construction, Activity, Mountain, ShieldAlert,
  Target, Maximize, Wrench, Disc, Circle, AlertOctagon,
  Cpu, AlertTriangle, ShieldCheck, BookOpen, MessageSquare,
  Sparkles, CheckCircle2, ArrowRight
} from 'lucide-react';

import SlopeAnalysis from './components/SlopeAnalysis';
import RoadbedAnalysis from './components/roadbed/RoadbedAnalysis';
import RetainingAnalysis from './components/retaining/RetainingAnalysis';

import BridgeAnalysis from './components/bridge/BridgeAnalysis';
import BridgeGirderAnalysis from './components/bridge/BridgeGirderAnalysis';
import BridgeComponentAnalysis from './components/bridge/BridgeComponentAnalysis';

import TunnelAnalysis from './components/tunnel/TunnelAnalysis';
import TunnelVoidAnalysis from './components/tunnel/TunnelVoidAnalysis';
import TunnelCollapseAnalysis from './components/tunnel/TunnelCollapseAnalysis';

import RoadbedDiseaseAtlas from './components/roadbed/RoadbedDiseaseAtlas';
import SlopeDiseaseAtlas from './components/SlopeDiseaseAtlas';
import RetainingDiseaseAtlas from './components/retaining/RetainingDiseaseAtlas';
import BridgeDiseaseAtlas from './components/bridge/BridgeDiseaseAtlas';
import TunnelDiseaseAtlas from './components/tunnel/TunnelDiseaseAtlas';

import RoadbedMeasureLibrary from './components/roadbed/RoadbedMeasureLibrary';
import SlopeMeasureLibrary from './components/SlopeMeasureLibrary';
import RetainingMeasureLibrary from './components/retaining/RetainingMeasureLibrary';
import BridgeMeasureLibrary from './components/bridge/BridgeMeasureLibrary';
import TunnelMeasureLibrary from './components/tunnel/TunnelMeasureLibrary';

import CaseKnowledgeLibrary from './components/common/CaseKnowledgeLibrary';
import Chatbot from './components/Chatbot';

import { EngineeringSector, SimulationScenario, FeatureModuleTab } from './types';

// Definition of 3 Major Engineering Sectors
const SECTORS: { id: EngineeringSector; name: string; icon: any; desc: string }[] = [
  { id: 'road', name: '道路工程', icon: Map, desc: '路基、边坡及支挡结构灾毁仿真' },
  { id: 'bridge', name: '桥梁工程', icon: Construction, desc: '桥墩偏位、梁体垮塌与构件损伤评估' },
  { id: 'tunnel', name: '隧道工程', icon: Layers, desc: '衬砌破坏、衬砌脱空与坍塌封堵计算' },
];

// Definition of Scenarios per Sector
const SCENARIOS: Record<EngineeringSector, { id: SimulationScenario; name: string; icon: any; desc: string }[]> = {
  road: [
    { id: 'subgrade_settlement', name: '路基垮塌', icon: Activity, desc: '水毁与软基不均匀沉降演化' },
    { id: 'slope_instability', name: '边坡失稳', icon: Mountain, desc: '圆弧/折线滑坡极限平衡分析' },
    { id: 'retaining_structure', name: '支挡失效', icon: ShieldAlert, desc: '挡土墙倾覆与滑动失稳演化' },
  ],
  bridge: [
    { id: 'pier_impact', name: '桥墩偏位', icon: Target, desc: '墩柱偏移倾斜与偏位受力分析' },
    { id: 'girder_unseating', name: '梁体垮塌', icon: Maximize, desc: '地震与偏位落梁垮塌临界状态评估' },
    { id: 'component_corrosion', name: '构件损伤', icon: Wrench, desc: '钢筋混凝土构件损伤与耐久性衰减' },
  ],
  tunnel: [
    { id: 'rock_pressure', name: '衬砌破坏', icon: Disc, desc: '偏心受力下衬砌裂缝宽度预测 (MC2010)' },
    { id: 'lining_void', name: '壁后脱空', icon: Circle, desc: '壁后空洞局域应力集中与弯矩重分布' },
    { id: 'crown_collapse', name: '坍塌封堵', icon: AlertOctagon, desc: '围岩弹塑性应变与坍塌回填封堵计算' },
  ],
};

// Definition of 4 Universal Feature Modules
const FEATURE_MODULES: { id: FeatureModuleTab; name: string; icon: any; badge: string; desc: string }[] = [
  { id: 'simulation', name: '仿真计算', icon: Cpu, badge: '1', desc: '基于力学引擎的实测/模拟分析' },
  { id: 'disease', name: '病害等级', icon: AlertTriangle, badge: '2', desc: '病害判定、损伤劣化及阈值图谱' },
  { id: 'reinforcement', name: '加固措施', icon: ShieldCheck, badge: '3', desc: '工程加固方案设计与效益比选' },
  { id: 'knowledge', name: '案例知识', icon: BookOpen, badge: '4', desc: '典型案例、历史训练及经典案例库' },
];

export interface ScenarioState {
  diseaseLevel: number;
  diseaseName: string;
  activeMeasure: string;
  measureName: string;
}

const DEFAULT_SCENARIO_STATES: Record<SimulationScenario, ScenarioState> = {
  subgrade_settlement: { diseaseLevel: 1, diseaseName: 'Ⅰ级病害 (微细裂缝)', activeMeasure: 'S1', measureName: '表层压实补强' },
  slope_instability: { diseaseLevel: 1, diseaseName: 'Ⅰ级病害 (微裂期)', activeMeasure: 'anchor', measureName: '预应力锚索' },
  retaining_structure: { diseaseLevel: 1, diseaseName: 'Ⅰ级病害 (泄水孔阻塞)', activeMeasure: 'none', measureName: '无加固 (原设计)' },
  pier_impact: { diseaseLevel: 1, diseaseName: 'Ⅰ级 (弹性轻微损伤)', activeMeasure: 'none', measureName: '无加固 (原设计)' },
  girder_unseating: { diseaseLevel: 1, diseaseName: 'Ⅰ级 (轻微位移)', activeMeasure: 'none', measureName: '无加固 (原设计)' },
  component_corrosion: { diseaseLevel: 1, diseaseName: 'Ⅰ级 (表面轻微蚀损)', activeMeasure: 'none', measureName: '无加固 (原设计)' },
  rock_pressure: { diseaseLevel: 1, diseaseName: 'Ⅰ级 (弹性受损)', activeMeasure: 'none', measureName: '无加固 (原设计)' },
  lining_void: { diseaseLevel: 1, diseaseName: 'Ⅰ级 (局部脱空)', activeMeasure: 'none', measureName: '无加固 (原设计)' },
  crown_collapse: { diseaseLevel: 1, diseaseName: 'Ⅰ级 (微小松动)', activeMeasure: 'none', measureName: '无加固 (原设计)' },
};

const App: React.FC = () => {
  const [activeSector, setActiveSector] = useState<EngineeringSector>('road');
  const [activeScenario, setActiveScenario] = useState<SimulationScenario>('subgrade_settlement');
  const [activeModule, setActiveModule] = useState<FeatureModuleTab>('simulation');
  const [showChatbot, setShowChatbot] = useState(false);

  // Global scenario states store
  const [scenarioStates, setScenarioStates] = useState<Record<SimulationScenario, ScenarioState>>(DEFAULT_SCENARIO_STATES);
  const [toastMessage, setToastMessage] = useState<{ text: string; actionText?: string; targetModule?: FeatureModuleTab } | null>(null);

  // Handle disease injection and switch to simulation tab
  const handleInjectAndSimulate = (scKey: string, levelItem: any) => {
    let targetScenario: SimulationScenario = activeScenario;
    if (scKey === 'subgrade_settlement') targetScenario = 'subgrade_settlement';
    else if (scKey === 'slope_instability') targetScenario = 'slope_instability';
    else if (scKey === 'retaining_structure') targetScenario = 'retaining_structure';
    else if (scKey === 'pier_impact') targetScenario = 'pier_impact';
    else if (scKey === 'girder_unseating') targetScenario = 'girder_unseating';
    else if (scKey === 'component_damage' || scKey === 'component_corrosion') targetScenario = 'component_corrosion';
    else if (scKey === 'lining_failure' || scKey === 'rock_pressure') targetScenario = 'rock_pressure';
    else if (scKey === 'lining_void') targetScenario = 'lining_void';
    else if (scKey === 'rock_collapse_plugging' || scKey === 'crown_collapse') targetScenario = 'crown_collapse';

    setActiveScenario(targetScenario);
    setScenarioStates(prev => ({
      ...prev,
      [targetScenario]: {
        ...prev[targetScenario],
        diseaseLevel: levelItem.level,
        diseaseName: levelItem.levelName
      }
    }));

    setActiveModule('simulation');
    setToastMessage({
      text: `已将【${levelItem.levelName}】物理参数注入【${getScenarioName(targetScenario)}】仿真计算引擎！`,
      actionText: '前往查看仿真结果 →',
      targetModule: 'simulation'
    });
  };

  React.useEffect(() => {
    const handleCustomInject = (e: any) => {
      if (e.detail?.scenarioKey && e.detail?.level) {
        handleInjectAndSimulate(e.detail.scenarioKey, e.detail.level);
      }
    };
    window.addEventListener('disease-inject-simulate', handleCustomInject);
    return () => window.removeEventListener('disease-inject-simulate', handleCustomInject);
  }, [activeScenario]);

  // Update scenario active disease level
  const updateScenarioDisease = (level: number, name: string) => {
    setScenarioStates(prev => ({
      ...prev,
      [activeScenario]: {
        ...prev[activeScenario],
        diseaseLevel: level,
        diseaseName: name
      }
    }));
    setToastMessage({
      text: `已将【${getScenarioName(activeScenario)}】的病害等级更新为: ${name}！数据已实时写入仿真引擎。`,
      actionText: '一键前往【仿真计算】查看影响 →',
      targetModule: 'simulation'
    });
  };

  // Update scenario active measure
  const updateScenarioMeasure = (measureId: string, name: string) => {
    setScenarioStates(prev => ({
      ...prev,
      [activeScenario]: {
        ...prev[activeScenario],
        activeMeasure: measureId,
        measureName: name
      }
    }));
    setToastMessage({
      text: `已将【${getScenarioName(activeScenario)}】的加固方案更新为: ${name}！结构强化参数已实时注入仿真引擎。`,
      actionText: '一键前往【仿真计算】查看效果 →',
      targetModule: 'simulation'
    });
  };

  // Helper to switch sector and reset scenario
  const handleSectorChange = (sector: EngineeringSector) => {
    setActiveSector(sector);
    const firstScenario = SCENARIOS[sector][0].id;
    setActiveScenario(firstScenario);
  };

  const currentScenarioState = scenarioStates[activeScenario] || DEFAULT_SCENARIO_STATES.subgrade_settlement;

  // Render Simulation Analysis Component
  const renderSimulationComponent = () => {
    switch (activeScenario) {
      case 'subgrade_settlement':
        return <RoadbedAnalysis />;
      case 'slope_instability':
        return <SlopeAnalysis />;
      case 'retaining_structure':
        return <RetainingAnalysis />;
      case 'pier_impact':
        return <BridgeAnalysis />;
      case 'girder_unseating':
        return <BridgeGirderAnalysis />;
      case 'component_corrosion':
        return <BridgeComponentAnalysis />;
      case 'rock_pressure':
        return <TunnelAnalysis />;
      case 'lining_void':
        return <TunnelVoidAnalysis />;
      case 'crown_collapse':
        return <TunnelCollapseAnalysis />;
      default:
        return <RoadbedAnalysis />;
    }
  };

  // Render Disease Atlas Component with Interactive Sync Control
  const renderDiseaseAtlasComponent = () => {
    const levelOptions = [
      { level: 0, name: '0级: 完好态 (设计状态)' },
      { level: 1, name: 'Ⅰ级病害: 轻微损伤 (发展初期)' },
      { level: 2, name: 'Ⅱ级病害: 中度损伤 (性能退化)' },
      { level: 3, name: 'Ⅲ级病害: 严重破坏 (临界极限)' },
      { level: 4, name: 'Ⅳ级病害: 灾难性失稳 (结构破坏)' },
    ];

    let componentElement = <RoadbedDiseaseAtlas onInjectAndSimulate={handleInjectAndSimulate} />;
    if (activeSector === 'road') {
      if (activeScenario === 'slope_instability') {
        componentElement = <SlopeDiseaseAtlas onInjectAndSimulate={handleInjectAndSimulate} />;
      } else if (activeScenario === 'retaining_structure') {
        componentElement = <RetainingDiseaseAtlas onInjectAndSimulate={handleInjectAndSimulate} />;
      } else {
        componentElement = <RoadbedDiseaseAtlas onInjectAndSimulate={handleInjectAndSimulate} />;
      }
    } else if (activeSector === 'bridge') {
      componentElement = <BridgeDiseaseAtlas activeScenario={activeScenario} onInjectAndSimulate={handleInjectAndSimulate} />;
    } else if (activeSector === 'tunnel') {
      componentElement = <TunnelDiseaseAtlas activeScenario={activeScenario} onInjectAndSimulate={handleInjectAndSimulate} />;
    }

    return (
      <div className="flex flex-col h-full overflow-hidden">
        {/* Interactive Sync Bar */}
        <div className="bg-amber-50/90 border-b border-amber-200 px-6 py-3 flex flex-wrap items-center justify-between gap-4 flex-shrink-0 z-10 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="p-1.5 bg-amber-500 text-white rounded-lg shadow-sm">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-black text-amber-900 tracking-tight">
                病害与损伤状态同步控制台 [{getScenarioName(activeScenario)}]
              </span>
              <p className="text-[11px] text-amber-700">
                当前设定病害状态: <span className="font-bold underline">{currentScenarioState.diseaseName}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold text-amber-800">快捷切换等级:</span>
            {levelOptions.map(opt => (
              <button
                key={opt.level}
                onClick={() => updateScenarioDisease(opt.level, opt.name)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all border ${
                  currentScenarioState.diseaseLevel === opt.level
                    ? 'bg-amber-600 text-white border-amber-700 shadow-sm'
                    : 'bg-white text-amber-900 border-amber-200 hover:bg-amber-100'
                }`}
              >
                {opt.level === 0 ? '0级(无损)' : `${opt.level}级`}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-hidden relative">
          {componentElement}
        </div>
      </div>
    );
  };

  // Render Measure Library Component with Interactive Sync Control
  const renderMeasureLibraryComponent = () => {
    const measureOptions: Record<SimulationScenario, { id: string; name: string }[]> = {
      subgrade_settlement: [
        { id: 'none', name: '无加固 (原设计)' },
        { id: 'S1', name: '表层压实补强' },
        { id: 'S2', name: '换填透水性碎石层' },
        { id: 'S3', name: '水泥粉煤灰碎石桩 (CFG桩)' },
        { id: 'S4', name: '高压旋喷注浆加固' },
      ],
      slope_instability: [
        { id: 'none', name: '无加固 (原设计)' },
        { id: 'cut', name: '削方减载 (Cut & Unload)' },
        { id: 'berm', name: '坡角反压 (Toe Berm)' },
        { id: 'micropile', name: '微型群桩支护' },
        { id: 'anchor', name: '预应力锚索框架梁' },
      ],
      retaining_structure: [
        { id: 'none', name: '无加固 (原设计)' },
        { id: 'anchor_wall', name: '墙体拉压锚杆加固' },
        { id: 'toe_pile', name: '墙趾抗滑打桩补强' },
        { id: 'drainage', name: '墙后深层疏水导流' },
      ],
      pier_impact: [
        { id: 'none', name: '无加固 (原设计)' },
        { id: 'fender', name: '防撞托架与复合阻尼器' },
        { id: 'jacket', name: '墩柱钢套管补强' },
        { id: 'frp', name: '碳纤维(FRP)约束加固' },
      ],
      girder_unseating: [
        { id: 'none', name: '无加固 (原设计)' },
        { id: 'tie_bar', name: '防落梁拉津连系装置' },
        { id: 'damper', name: '粘滞流体阻尼支撑' },
        { id: 'block', name: '钢筋混凝土挡块加高' },
      ],
      component_corrosion: [
        { id: 'none', name: '无加固 (原设计)' },
        { id: 'patch', name: '聚合物砂浆修补防腐' },
        { id: 'cathodic', name: '牺牲阳极阴极保护' },
        { id: 'frp_wrap', name: '外包碳纤维布包裹' },
      ],
      rock_pressure: [
        { id: 'none', name: '无加固 (原设计)' },
        { id: 'grouting', name: '围岩高压固结注浆' },
        { id: 'bolt_mesh', name: '系统锚杆+喷射混凝土' },
        { id: 'steel_frame', name: '重型型钢拱架加固' },
      ],
      lining_void: [
        { id: 'none', name: '无加固 (原设计)' },
        { id: 'void_grout', name: '壁后空洞回填注浆' },
        { id: 'steel_plate', name: '内套钢板螺栓锚固' },
      ],
      crown_collapse: [
        { id: 'none', name: '无加固 (原设计)' },
        { id: 'pipe_roof', name: '超前长管棚防护' },
        { id: 'backfill', name: '塌穴缓冲回填与注浆' },
      ],
    };

    const currentMeasures = measureOptions[activeScenario] || [
      { id: 'none', name: '无加固 (原设计)' },
      { id: 'S1', name: '基础结构加固' }
    ];

    let Component = RoadbedMeasureLibrary;
    if (activeSector === 'road') {
      if (activeScenario === 'slope_instability') Component = SlopeMeasureLibrary;
      else if (activeScenario === 'retaining_structure') Component = RetainingMeasureLibrary;
      else Component = RoadbedMeasureLibrary;
    } else if (activeSector === 'bridge') {
      Component = BridgeMeasureLibrary;
    } else if (activeSector === 'tunnel') {
      Component = TunnelMeasureLibrary;
    }

    return (
      <div className="flex flex-col h-full overflow-hidden">
        {/* Interactive Sync Bar */}
        <div className="bg-emerald-50/90 border-b border-emerald-200 px-6 py-3 flex flex-wrap items-center justify-between gap-4 flex-shrink-0 z-10 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="p-1.5 bg-emerald-600 text-white rounded-lg shadow-sm">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-black text-emerald-950 tracking-tight">
                加固方案注入控制台 [{getScenarioName(activeScenario)}]
              </span>
              <p className="text-[11px] text-emerald-700">
                当前选择加固方案: <span className="font-bold underline">{currentScenarioState.measureName}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
            <span className="text-[11px] font-bold text-emerald-800">一键注入方案:</span>
            {currentMeasures.map(m => (
              <button
                key={m.id}
                onClick={() => updateScenarioMeasure(m.id, m.name)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all border ${
                  currentScenarioState.activeMeasure === m.id
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                    : 'bg-white text-emerald-900 border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                {m.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-hidden relative">
          <Component />
        </div>
      </div>
    );
  };

  // Main Content Router
  const renderModuleContent = () => {
    switch (activeModule) {
      case 'simulation':
        return renderSimulationComponent();
      case 'disease':
        return renderDiseaseAtlasComponent();
      case 'reinforcement':
        return renderMeasureLibraryComponent();
      case 'knowledge':
        return <CaseKnowledgeLibrary sector={activeSector} scenario={activeScenario} />;
      default:
        return renderSimulationComponent();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-100 font-sans text-slate-800 overflow-hidden selection:bg-blue-100">
      {/* ========================================================================= */}
      {/* TIER 1: Top Navigation Header (Engineering Sectors & Main Title) */}
      {/* ========================================================================= */}
      <header className="bg-slate-900 text-white h-16 border-b border-slate-800 flex items-center px-6 justify-between flex-shrink-0 z-30 shadow-md">
        {/* App Title & Logo */}
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-xl shadow-md shadow-blue-500/20">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight flex items-center space-x-2">
              <span>InfraGuard</span>
              <span className="bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">AI</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-medium tracking-wider whitespace-nowrap">
              结构灾毁智能仿真与加固模拟平台
            </p>
          </div>
        </div>

        {/* TIER 1 SECTOR SELECTOR */}
        <div className="flex items-center space-x-2 bg-slate-800/80 p-1 rounded-2xl border border-slate-700/60 shadow-inner">
          {SECTORS.map((s) => {
            const Icon = s.icon;
            const isActive = activeSector === s.id;
            return (
              <button
                key={s.id}
                onClick={() => handleSectorChange(s.id)}
                className={`flex items-center px-4 py-1.5 rounded-xl text-xs font-extrabold transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Icon className={`w-4 h-4 mr-2 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{s.name}</span>
              </button>
            );
          })}
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center space-x-3">
          <div className="hidden lg:flex items-center px-3 py-1 bg-slate-800/90 rounded-lg border border-slate-700 text-[10px] font-mono text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-2" />
            ENGINE_V5_READY
          </div>

          <button
            onClick={() => setShowChatbot(!showChatbot)}
            className={`flex items-center px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              showChatbot
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/30'
                : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4 mr-2 text-indigo-400" />
            <span>专家 AI 问答</span>
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* TIER 2: Secondary Navigation Bar (Scenario Selection) */}
      {/* ========================================================================= */}
      <div className="bg-white border-b border-slate-200 px-6 py-2.5 flex items-center justify-between flex-shrink-0 z-20 shadow-xs">
        <div className="flex items-center space-x-3">
          <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider font-mono">
            【{SECTORS.find(s => s.id === activeSector)?.name}】灾毁场景:
          </span>
          <div className="flex items-center space-x-2">
            {SCENARIOS[activeSector].map((sc) => {
              const ScIcon = sc.icon;
              const isSelected = activeScenario === sc.id;
              return (
                <button
                  key={sc.id}
                  onClick={() => setActiveScenario(sc.id)}
                  className={`flex items-center px-4 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  <ScIcon className={`w-3.5 h-3.5 mr-2 ${isSelected ? 'text-blue-400' : 'text-slate-400'}`} />
                  <span>【{sc.name}】</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Current Data Flow Overview Pill */}
        <div className="hidden md:flex items-center space-x-3 text-xs bg-slate-50 px-3.5 py-1 rounded-xl border border-slate-200">
          <div className="flex items-center space-x-1.5 text-slate-600 font-medium">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="font-bold text-slate-800">{getScenarioName(activeScenario)}</span>
          </div>
          <span className="text-slate-300">|</span>
          <div className="flex items-center space-x-1 text-amber-700">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span className="font-semibold">{currentScenarioState.diseaseName}</span>
          </div>
          <span className="text-slate-300">|</span>
          <div className="flex items-center space-x-1 text-emerald-700">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="font-semibold">{currentScenarioState.measureName}</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TIER 3: Universal Feature Modules Bar & Main Workspace */}
      {/* ========================================================================= */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Vertical Sidebar / Feature Tab Switcher */}
        <div className="w-56 bg-white border-r border-slate-200 flex flex-col justify-between flex-shrink-0 z-10">
          <div className="py-4 space-y-1 px-3">
            <div className="px-3 pb-2 border-b border-slate-100 mb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                统一功能模块 (4 Tab)
              </span>
            </div>

            {FEATURE_MODULES.map((mod) => {
              const ModIcon = mod.icon;
              const isModActive = activeModule === mod.id;
              return (
                <button
                  key={mod.id}
                  onClick={() => setActiveModule(mod.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all border ${
                    isModActive
                      ? 'bg-blue-50/80 text-blue-700 border-blue-200 shadow-sm'
                      : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-1.5 rounded-lg ${
                      isModActive ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      <ModIcon className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col items-start text-left">
                      <span className="text-xs font-black leading-tight">{mod.badge}. {mod.name}</span>
                      <span className="text-[10px] font-normal text-slate-400 mt-0.5 line-clamp-1">{mod.desc}</span>
                    </div>
                  </div>
                  {isModActive && <ArrowRight className="w-3.5 h-3.5 text-blue-600" />}
                </button>
              );
            })}
          </div>

          {/* Quick Scenario Info Box */}
          <div className="m-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
            <div className="flex items-center space-x-2 text-slate-700 font-extrabold">
              <Sparkles className="w-4 h-4 text-blue-500" />
              <span>数据贯通机制</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              病害等级与加固方案选定后，自动向【仿真计算】引擎注入折减与抗力参数，实现灾毁与加固联动可视化。
            </p>
          </div>
        </div>

        {/* Main Workspace Render Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 relative">
          {/* Notification Toast Bar */}
          {toastMessage && (
            <div className="bg-slate-900 text-white px-6 py-2.5 flex items-center justify-between border-b border-slate-800 animate-fadeIn z-20">
              <div className="flex items-center space-x-3 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span className="font-medium">{toastMessage.text}</span>
              </div>
              <div className="flex items-center space-x-3">
                {toastMessage.targetModule && (
                  <button
                    onClick={() => {
                      setActiveModule(toastMessage.targetModule!);
                      setToastMessage(null);
                    }}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-all shadow-sm"
                  >
                    {toastMessage.actionText}
                  </button>
                )}
                <button
                  onClick={() => setToastMessage(null)}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Content Area */}
          <main className="flex-1 overflow-hidden relative">
            {renderModuleContent()}
          </main>
        </div>
      </div>

      {/* Expert AI Console Drawer / Overlay */}
      {showChatbot && (
        <div className="fixed inset-y-0 right-0 w-96 bg-white border-l border-slate-200 z-50 shadow-2xl flex flex-col animate-slideIn">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              <span className="font-black text-sm">InfraGuard 专家 AI Console</span>
            </div>
            <button
              onClick={() => setShowChatbot(false)}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <Chatbot activeInfrastructure={{ category: activeSector, subCategory: activeScenario }} />
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to get scenario friendly name
function getScenarioName(scenario: SimulationScenario): string {
  switch (scenario) {
    case 'subgrade_settlement': return '路基垮塌';
    case 'slope_instability': return '边坡失稳';
    case 'retaining_structure': return '支挡失效';
    case 'pier_impact': return '桥墩偏位';
    case 'girder_unseating': return '梁体垮塌';
    case 'component_corrosion': return '构件损伤';
    case 'rock_pressure': return '衬砌破坏';
    case 'lining_void': return '壁后脱空';
    case 'crown_collapse': return '坍塌封堵';
    default: return '灾毁仿真';
  }
}

export default App;
