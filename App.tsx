
import React, { useState } from 'react';
import { 
  Layers, Settings, BookOpen,
  Map, Mountain, ClipboardList,
  History, ShieldCheck, Microscope, Activity, MessageSquare,
  Construction
} from 'lucide-react';
import SlopeAnalysis from './components/SlopeAnalysis';
import HistoryLibrary from './components/HistoryLibrary';
import CaseGenerator from './components/CaseGenerator';
import ReinforcementLibrary from './components/ReinforcementLibrary';
import DiseaseAtlas from './components/DiseaseAtlas';
import CaseLibrary from './components/CaseLibrary';
import Chatbot from './components/Chatbot';
import IndicatorLibrary from './components/IndicatorLibrary';
import SlopeTypicalCases from './components/SlopeTypicalCases';
import SlopeHistoryLibrary from './components/SlopeHistoryLibrary';
import SlopeMeasureLibrary from './components/SlopeMeasureLibrary';
import SlopeDiseaseAtlas from './components/SlopeDiseaseAtlas';
import SlopeClassicCases from './components/SlopeClassicCases';
import RoadbedAnalysis from './components/roadbed/RoadbedAnalysis';
import RoadbedTypicalCases from './components/roadbed/RoadbedTypicalCases';
import RoadbedHistoryLibrary from './components/roadbed/RoadbedHistoryLibrary';
import RoadbedMeasureLibrary from './components/roadbed/RoadbedMeasureLibrary';
import RoadbedDiseaseAtlas from './components/roadbed/RoadbedDiseaseAtlas';
import RoadbedClassicCases from './components/roadbed/RoadbedClassicCases';
import BridgeAnalysis from './components/bridge/BridgeAnalysis';
import BridgeGirderAnalysis from './components/bridge/BridgeGirderAnalysis';
import BridgeComponentAnalysis from './components/bridge/BridgeComponentAnalysis';
import BridgeTypicalCases from './components/bridge/BridgeTypicalCases';
import BridgeHistoryLibrary from './components/bridge/BridgeHistoryLibrary';
import BridgeMeasureLibrary from './components/bridge/BridgeMeasureLibrary';
import BridgeDiseaseAtlas from './components/bridge/BridgeDiseaseAtlas';
import BridgeClassicCases from './components/bridge/BridgeClassicCases';
import TunnelAnalysis from './components/tunnel/TunnelAnalysis';
import TunnelVoidAnalysis from './components/tunnel/TunnelVoidAnalysis';
import TunnelCollapseAnalysis from './components/tunnel/TunnelCollapseAnalysis';
import TunnelTypicalCases from './components/tunnel/TunnelTypicalCases';
import TunnelHistoryLibrary from './components/tunnel/TunnelHistoryLibrary';
import TunnelMeasureLibrary from './components/tunnel/TunnelMeasureLibrary';
import TunnelDiseaseAtlas from './components/tunnel/TunnelDiseaseAtlas';
import TunnelClassicCases from './components/tunnel/TunnelClassicCases';
import RetainingAnalysis from './components/retaining/RetainingAnalysis';
import RetainingTypicalCases from './components/retaining/RetainingTypicalCases';
import RetainingHistoryLibrary from './components/retaining/RetainingHistoryLibrary';
import RetainingMeasureLibrary from './components/retaining/RetainingMeasureLibrary';
import RetainingDiseaseAtlas from './components/retaining/RetainingDiseaseAtlas';
import RetainingClassicCases from './components/retaining/RetainingClassicCases';
import { Tab, InfrastructureState, InfrastructureCategory, InfrastructureSubCategory } from './types';

// Placeholder components for those not fully implemented in this turn
const Placeholder: React.FC<{title: string}> = ({title}) => (
    <div className="flex items-center justify-center h-full text-slate-400 flex-col bg-slate-50 font-sans border border-slate-200 m-8 rounded-xl shadow-sm">
        <div className="relative">
          <Settings className="w-12 h-12 mb-4 opacity-10 animate-spin-slow text-blue-600" />
        </div>
        <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-600">{title}</h3>
        <p className="text-[10px] mt-2 font-mono uppercase tracking-widest opacity-50">Module Initialization Required // DEV_READY</p>
    </div>
);

const App: React.FC = () => {
  const [activeInfrastructure, setActiveInfrastructure] = useState<InfrastructureState>({
    category: 'road',
    subCategory: 'roadbed'
  });
  
  // Maintain independent active tabs for each sub-category
  const [activeTabs, setActiveTabs] = useState<Record<string, Tab>>({
    roadbed: Tab.RoadbedAnalysis,
    slope: Tab.DecisionModel,
    retaining: Tab.RetainingAnalysis,
    pier_deviation: Tab.BridgeAnalysis,
    girder_collapse: Tab.BridgeGirderAnalysis,
    component_damage: Tab.BridgeComponentAnalysis,
    lining_damage: Tab.TunnelAnalysis,
    void_behind: Tab.TunnelVoidAnalysis,
    collapse_block: Tab.TunnelCollapseAnalysis,
  });

  const currentTab = activeTabs[activeInfrastructure.subCategory] || Tab.DecisionModel;

  const handleTabChange = (tab: Tab) => {
    setActiveTabs(prev => ({
      ...prev,
      [activeInfrastructure.subCategory]: tab
    }));
  };

  const renderContent = () => {
    const commonProps = { activeInfrastructure };

    switch (currentTab) {
      case Tab.DecisionModel:
        if (activeInfrastructure.category === 'road') {
          return activeInfrastructure.subCategory === 'roadbed' 
            ? <RoadbedAnalysis /> 
            : <SlopeAnalysis {...commonProps} />;
        }
        return <Placeholder title={`${activeInfrastructure.category} - ${activeInfrastructure.subCategory}`} />;
      
      // Roadbed Specific Modules
      case Tab.RoadbedAnalysis:
        return <RoadbedAnalysis />;
      case Tab.RoadbedTypicalCases:
        return <RoadbedTypicalCases />;
      case Tab.RoadbedHistory:
        return <RoadbedHistoryLibrary />;
      case Tab.RoadbedMeasures:
        return <RoadbedMeasureLibrary />;
      case Tab.RoadbedDiseaseAtlas:
        return <RoadbedDiseaseAtlas />;
      case Tab.RoadbedClassicCases:
        return <RoadbedClassicCases />;
      // Retaining Specific Modules
      case Tab.RetainingAnalysis:
        return <RetainingAnalysis />;
      case Tab.RetainingTypicalCases:
        return <RetainingTypicalCases />;
      case Tab.RetainingHistory:
        return <RetainingHistoryLibrary />;
      case Tab.RetainingMeasures:
        return <RetainingMeasureLibrary />;
      case Tab.RetainingDiseaseAtlas:
        return <RetainingDiseaseAtlas />;
      case Tab.RetainingClassicCases:
        return <RetainingClassicCases />;

      // Bridge Specific Modules
      case Tab.BridgeAnalysis:
        return <BridgeAnalysis />;
      case Tab.BridgeGirderAnalysis:
        return <BridgeGirderAnalysis />;
      case Tab.BridgeComponentAnalysis:
        return <BridgeComponentAnalysis />;
      case Tab.BridgeTypicalCases:
        return <BridgeTypicalCases />;
      case Tab.BridgeHistory:
        return <BridgeHistoryLibrary />;
      case Tab.BridgeMeasures:
        return <BridgeMeasureLibrary />;
      case Tab.BridgeDiseaseAtlas:
        return <BridgeDiseaseAtlas />;
      case Tab.BridgeClassicCases:
        return <BridgeClassicCases />;

      // Tunnel Specific Modules
      case Tab.TunnelAnalysis:
        return <TunnelAnalysis />;
      case Tab.TunnelVoidAnalysis:
        return <TunnelVoidAnalysis />;
      case Tab.TunnelCollapseAnalysis:
        return <TunnelCollapseAnalysis />;
      case Tab.TunnelTypicalCases:
        return <TunnelTypicalCases />;
      case Tab.TunnelHistory:
        return <TunnelHistoryLibrary />;
      case Tab.TunnelMeasures:
        return <TunnelMeasureLibrary />;
      case Tab.TunnelDiseaseAtlas:
        return <TunnelDiseaseAtlas />;
      case Tab.TunnelClassicCases:
        return <TunnelClassicCases />;

      case Tab.HistoryLibrary:
        return <HistoryLibrary {...commonProps} />;
      case Tab.CaseGenerator:
        return <CaseGenerator {...commonProps} />;
      case Tab.Indicators:
        return <IndicatorLibrary {...commonProps} />;
      case Tab.Diseases:
        return <DiseaseAtlas {...commonProps} />;
      case Tab.MeasureLibrary:
        return <ReinforcementLibrary {...commonProps} />;
      case Tab.CaseLibrary:
        return <CaseLibrary {...commonProps} />;
      case Tab.Chatbot:
        return <Chatbot {...commonProps} />;
      
      // Slope Specific Modules (Placeholders)
      case Tab.SlopeTypicalCases:
        return <SlopeTypicalCases {...commonProps} />;
      case Tab.SlopeHistory:
        return <SlopeHistoryLibrary {...commonProps} />;
      case Tab.SlopeMeasures:
        return <SlopeMeasureLibrary />;
      case Tab.SlopeDiseaseAtlas:
        return <SlopeDiseaseAtlas />;
      case Tab.SlopeClassicCases:
        return <SlopeClassicCases />;
        
      default:
        return activeInfrastructure.subCategory === 'roadbed' ? <RoadbedAnalysis /> : <SlopeAnalysis {...commonProps} />;
    }
  };

  const getScenarioMenu = (subCategory: InfrastructureSubCategory) => {
    switch (subCategory) {
      case 'roadbed':
        return [
          { id: Tab.RoadbedTypicalCases, label: '典型案例库', icon: ClipboardList },
          { id: Tab.RoadbedHistory, label: '历史训练库', icon: History },
          { id: Tab.RoadbedMeasures, label: '加固措施库', icon: ShieldCheck },
          { id: Tab.RoadbedDiseaseAtlas, label: '病害等级图谱', icon: Microscope },
          { id: Tab.RoadbedClassicCases, label: '经典案例库', icon: BookOpen },
        ];
      case 'slope':
        return [
          { id: Tab.SlopeTypicalCases, label: '典型案例库', icon: ClipboardList },
          { id: Tab.SlopeHistory, label: '历史训练库', icon: History },
          { id: Tab.SlopeMeasures, label: '加固措施库', icon: ShieldCheck },
          { id: Tab.SlopeDiseaseAtlas, label: '病害等级图谱', icon: Microscope },
          { id: Tab.SlopeClassicCases, label: '经典案例库', icon: BookOpen },
        ];
      case 'retaining':
        return [
          { id: Tab.RetainingTypicalCases, label: '典型案例库', icon: ClipboardList },
          { id: Tab.RetainingHistory, label: '历史训练库', icon: History },
          { id: Tab.RetainingMeasures, label: '加固措施库', icon: ShieldCheck },
          { id: Tab.RetainingDiseaseAtlas, label: '病害等级图谱', icon: Microscope },
          { id: Tab.RetainingClassicCases, label: '经典案例库', icon: BookOpen },
        ];
      case 'pier_deviation':
      case 'girder_collapse':
      case 'component_damage':
        return [
          { id: Tab.BridgeTypicalCases, label: '典型案例库', icon: ClipboardList },
          { id: Tab.BridgeHistory, label: '历史训练库', icon: History },
          { id: Tab.BridgeMeasures, label: '加固措施库', icon: ShieldCheck },
          { id: Tab.BridgeDiseaseAtlas, label: '病害等级图谱', icon: Microscope },
          { id: Tab.BridgeClassicCases, label: '经典案例库', icon: BookOpen },
        ];
      case 'lining_damage':
      case 'void_behind':
      case 'collapse_block':
        return [
          { id: Tab.TunnelTypicalCases, label: '典型案例库', icon: ClipboardList },
          { id: Tab.TunnelHistory, label: '历史训练库', icon: History },
          { id: Tab.TunnelMeasures, label: '加固措施库', icon: ShieldCheck },
          { id: Tab.TunnelDiseaseAtlas, label: '病害等级图谱', icon: Microscope },
          { id: Tab.TunnelClassicCases, label: '经典案例库', icon: BookOpen },
        ];
      default:
        return [];
    }
  };

  const activeMenu = getScenarioMenu(activeInfrastructure.subCategory);

  const categories: { id: InfrastructureCategory; name: string; icon: any }[] = [
    { id: 'road', name: '道路工程', icon: Map },
    { id: 'bridge', name: '桥梁工程', icon: Construction },
    { id: 'tunnel', name: '隧道工程', icon: Layers },
  ];

  const subCategories: Record<InfrastructureCategory, { id: InfrastructureSubCategory; name: string; icon: any }[]> = {
    road: [
      { id: 'roadbed', name: '路基模块', icon: Activity },
      { id: 'slope', name: '边坡模块', icon: Mountain },
      { id: 'retaining', name: '支挡模块', icon: Layers },
    ],
    bridge: [
      { id: 'pier_deviation', name: '桥墩偏位', icon: Layers },
      { id: 'girder_collapse', name: '梁体垮塌', icon: Layers },
      { id: 'component_damage', name: '构件损伤', icon: Layers },
    ],
    tunnel: [
      { id: 'lining_damage', name: '衬砌破损', icon: Layers },
      { id: 'void_behind', name: '壁后脱空', icon: Layers },
      { id: 'collapse_block', name: '坍塌封堵', icon: Layers },
    ],
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden relative selection:bg-blue-100">
      {/* Sidebar - Property Inspector Style */}
      <div className="w-64 bg-white border-r border-slate-200 flex flex-col z-30 relative overflow-hidden">
        <div className="flex flex-col items-start justify-center h-16 px-6 border-b border-slate-200 bg-white relative z-10">
          <div className="flex items-center space-x-2.5">
            <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-1.5 rounded-lg shadow-sm">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg font-black text-slate-900 tracking-tight leading-none">
                InfraGuard <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">AI</span>
              </h1>
              <span className="text-[10px] text-slate-500 tracking-widest mt-1 font-medium whitespace-nowrap">结构灾毁智能仿真与加固模拟平台</span>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4 space-y-1 custom-scrollbar">
          <div className="px-6 py-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Analysis Explorer</span>
          </div>
          
          <button 
            onClick={() => {
              if (activeInfrastructure.subCategory === 'roadbed') handleTabChange(Tab.RoadbedAnalysis);
              else if (activeInfrastructure.subCategory === 'retaining') handleTabChange(Tab.RetainingAnalysis);
              else if (activeInfrastructure.subCategory === 'pier_deviation') handleTabChange(Tab.BridgeAnalysis);
              else if (activeInfrastructure.subCategory === 'girder_collapse') handleTabChange(Tab.BridgeGirderAnalysis);
              else if (activeInfrastructure.subCategory === 'component_damage') handleTabChange(Tab.BridgeComponentAnalysis);
              else if (activeInfrastructure.subCategory === 'lining_damage') handleTabChange(Tab.TunnelAnalysis);
              else if (activeInfrastructure.subCategory === 'void_behind') handleTabChange(Tab.TunnelVoidAnalysis);
              else if (activeInfrastructure.subCategory === 'collapse_block') handleTabChange(Tab.TunnelCollapseAnalysis);
              else handleTabChange(Tab.DecisionModel);
            }}
            className={`w-full flex items-center px-6 py-2.5 text-xs font-semibold transition-all border-r-4 ${
              (currentTab === Tab.DecisionModel || currentTab === Tab.RoadbedAnalysis || currentTab === Tab.BridgeAnalysis || currentTab === Tab.BridgeGirderAnalysis || currentTab === Tab.BridgeComponentAnalysis || currentTab === Tab.TunnelAnalysis || currentTab === Tab.TunnelVoidAnalysis || currentTab === Tab.TunnelCollapseAnalysis) 
              ? 'bg-blue-50/50 text-blue-700 border-blue-600 shadow-[inset_0_0_10px_rgba(59,130,246,0.05)]' 
              : 'text-slate-500 hover:bg-slate-50 border-transparent hover:text-slate-700'
            }`}
          >
            <Activity className="w-4 h-4 mr-3" />
            <span>Simulation Engine</span>
          </button>

          <div className="px-6 py-2 mt-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Knowledge Matrix</span>
          </div>

          <div className="space-y-1">
            {activeMenu.map((item) => (
              <button 
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`w-full flex items-center px-6 py-2 text-[11px] font-medium transition-all border-r-4 ${
                  currentTab === item.id 
                  ? 'bg-blue-50/50 text-blue-700 border-blue-600' 
                  : 'text-slate-500 hover:bg-slate-50 border-transparent'
                }`}
              >
                <item.icon className={`w-3.5 h-3.5 mr-3 ${currentTab === item.id ? 'opacity-100' : 'opacity-40'}`} />
                {item.label}
              </button>
            ))}
          </div>

          <div className="mt-8 px-4">
             <button 
                onClick={() => handleTabChange(Tab.Chatbot)}
                className={`w-full flex items-center px-6 py-3 text-xs font-bold uppercase transition-all rounded-xl border shadow-sm ${
                  currentTab === Tab.Chatbot 
                  ? 'bg-slate-900 text-white border-slate-800 shadow-slate-900/20' 
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <MessageSquare className="w-4 h-4 mr-3" />
                Expert AI Console
              </button>
          </div>
        </nav>
        
        {/* Environment Status */}
        <div className="p-4 bg-slate-50/50 border-t border-slate-100 mt-auto">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">System Status: Nominal</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top Header - Ribbon Style */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center px-8 z-20">
          <div className="flex items-center space-x-8">
            {/* Category Selector */}
            <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 shadow-inner">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveInfrastructure({ 
                    category: cat.id, 
                    subCategory: subCategories[cat.id][0].id 
                  })}
                  className={`flex items-center px-5 py-2 text-xs font-bold transition-all rounded-lg ${
                    activeInfrastructure.category === cat.id
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <cat.icon className="w-4 h-4 mr-2.5" />
                  {cat.name}
                </button>
              ))}
            </div>

            {/* SubCategory Selector */}
            <div className="flex items-center space-x-6">
              {subCategories[activeInfrastructure.category].map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => setActiveInfrastructure({ ...activeInfrastructure, subCategory: sub.id })}
                  className={`relative py-1 text-xs font-bold transition-all ${
                    activeInfrastructure.subCategory === sub.id
                      ? 'text-blue-600'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <div className="flex items-center">
                    <sub.icon className="w-3.5 h-3.5 mr-2" />
                    {sub.name}
                  </div>
                  {activeInfrastructure.subCategory === sub.id && (
                    <div className="absolute -bottom-5 left-0 right-0 h-1 bg-blue-600 rounded-t-full shadow-[0_-2px_6px_rgba(37,99,235,0.4)]" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="ml-auto flex items-center space-x-6">
            <div className="flex items-center px-4 py-1.5 bg-slate-50 rounded-lg border border-slate-200 shadow-inner">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Engine: V5.0.0-ENT</span>
            </div>

            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all border border-transparent hover:border-slate-200">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-hidden relative bg-slate-50">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;
