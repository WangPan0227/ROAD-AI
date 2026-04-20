
import React, { useState, useEffect } from 'react';
import { 
  Layout, Database, FileText, Activity, MessageSquare, 
  Layers, Settings, BarChart2, BookOpen, PenTool,
  ChevronRight, Map, Construction, Mountain, ClipboardList,
  History, ShieldCheck, Microscope
} from 'lucide-react';
import SmartDecisionModel from './components/SmartDecisionModel';
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
import BridgeTypicalCases from './components/bridge/BridgeTypicalCases';
import BridgeHistoryLibrary from './components/bridge/BridgeHistoryLibrary';
import BridgeMeasureLibrary from './components/bridge/BridgeMeasureLibrary';
import BridgeDiseaseAtlas from './components/bridge/BridgeDiseaseAtlas';
import BridgeClassicCases from './components/bridge/BridgeClassicCases';
import TunnelAnalysis from './components/tunnel/TunnelAnalysis';
import TunnelTypicalCases from './components/tunnel/TunnelTypicalCases';
import TunnelHistoryLibrary from './components/tunnel/TunnelHistoryLibrary';
import TunnelMeasureLibrary from './components/tunnel/TunnelMeasureLibrary';
import TunnelDiseaseAtlas from './components/tunnel/TunnelDiseaseAtlas';
import TunnelClassicCases from './components/tunnel/TunnelClassicCases';
import { Tab, InfrastructureState, InfrastructureCategory, InfrastructureSubCategory } from './types';

// Placeholder components for those not fully implemented in this turn
const Placeholder: React.FC<{title: string}> = ({title}) => (
    <div className="flex items-center justify-center h-full text-gray-400 flex-col">
        <Settings className="w-12 h-12 mb-4 opacity-20" />
        <h3 className="text-xl font-bold">{title}</h3>
        <p className="text-sm mt-2">Component under maintenance</p>
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
    bridge_pier: Tab.BridgeAnalysis,
    tunnel_lining: Tab.TunnelAnalysis,
    tunnel_portal: Tab.TunnelAnalysis
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

      // Bridge Specific Modules
      case Tab.BridgeAnalysis:
        return <BridgeAnalysis />;
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

  // Menu Configurations
  const roadbedMenu = [
    { id: Tab.RoadbedTypicalCases, label: '典型案例库', icon: ClipboardList },
    { id: Tab.RoadbedHistory, label: '历史训练库', icon: History },
    { id: Tab.RoadbedMeasures, label: '加固措施库', icon: ShieldCheck },
    { id: Tab.RoadbedDiseaseAtlas, label: '病害等级图谱', icon: Microscope },
    { id: Tab.RoadbedClassicCases, label: '经典案例库', icon: BookOpen },
  ];

  const slopeMenu = [
    { id: Tab.SlopeTypicalCases, label: '典型案例库', icon: ClipboardList },
    { id: Tab.SlopeHistory, label: '历史训练库', icon: History },
    { id: Tab.SlopeMeasures, label: '加固措施库', icon: ShieldCheck },
    { id: Tab.SlopeDiseaseAtlas, label: '病害等级图谱', icon: Microscope },
    { id: Tab.SlopeClassicCases, label: '经典案例库', icon: BookOpen },
  ];

  const bridgeMenu = [
    { id: Tab.BridgeTypicalCases, label: '典型案例库', icon: ClipboardList },
    { id: Tab.BridgeHistory, label: '历史训练库', icon: History },
    { id: Tab.BridgeMeasures, label: '加固措施库', icon: ShieldCheck },
    { id: Tab.BridgeDiseaseAtlas, label: '病害等级图谱', icon: Microscope },
    { id: Tab.BridgeClassicCases, label: '经典案例库', icon: BookOpen },
  ];

  const tunnelMenu = [
    { id: Tab.TunnelTypicalCases, label: '典型案例库', icon: ClipboardList },
    { id: Tab.TunnelHistory, label: '历史训练库', icon: History },
    { id: Tab.TunnelMeasures, label: '加固措施库', icon: ShieldCheck },
    { id: Tab.TunnelDiseaseAtlas, label: '病害等级图谱', icon: Microscope },
    { id: Tab.TunnelClassicCases, label: '经典案例库', icon: BookOpen },
  ];

  const activeMenu = activeInfrastructure.subCategory === 'roadbed' 
    ? roadbedMenu 
    : (activeInfrastructure.subCategory === 'slope' 
        ? slopeMenu 
        : (activeInfrastructure.subCategory === 'bridge_pier' ? bridgeMenu : 
           (['tunnel_lining', 'tunnel_portal'].includes(activeInfrastructure.subCategory) ? tunnelMenu : [])));

  const categories: { id: InfrastructureCategory; name: string; icon: any }[] = [
    { id: 'road', name: '道路工程', icon: Map },
    { id: 'bridge', name: '桥梁工程', icon: Construction },
    { id: 'tunnel', name: '隧道工程', icon: Layers },
  ];

  const subCategories: Record<InfrastructureCategory, { id: InfrastructureSubCategory; name: string; icon: any }[]> = {
    road: [
      { id: 'roadbed', name: '路基模块', icon: Activity },
      { id: 'slope', name: '边坡模块', icon: Mountain },
    ],
    bridge: [
      { id: 'bridge_pier', name: '下部结构', icon: Layers },
    ],
    tunnel: [
      { id: 'tunnel_lining', name: '隧道衬砌', icon: Layers },
      { id: 'tunnel_portal', name: '隧道洞口', icon: Layers },
    ],
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans text-gray-900 overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-white flex flex-col shadow-xl z-30">
        <div className="flex items-center justify-center h-20 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-xl shadow-lg shadow-blue-900/20">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300 tracking-tight">
                InfraGuard <span className="text-blue-400">AI</span>
              </h1>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-0.5">
                结构智能仿真与加固模拟平台
              </span>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
          <div className="text-xs font-bold text-slate-500 uppercase px-3 mb-2 mt-2">Core Modules</div>
          
          <button 
            onClick={() => {
              if (activeInfrastructure.subCategory === 'roadbed') handleTabChange(Tab.RoadbedAnalysis);
              else if (activeInfrastructure.subCategory === 'bridge_pier') handleTabChange(Tab.BridgeAnalysis);
              else if (['tunnel_lining', 'tunnel_portal'].includes(activeInfrastructure.subCategory)) handleTabChange(Tab.TunnelAnalysis);
              else handleTabChange(Tab.DecisionModel);
            }}
            className={`w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              (currentTab === Tab.DecisionModel || currentTab === Tab.RoadbedAnalysis || currentTab === Tab.BridgeAnalysis || currentTab === Tab.TunnelAnalysis) 
              ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' 
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4 mr-3" />
            仿真模拟分析
          </button>

          <div className="text-xs font-bold text-slate-500 uppercase px-3 mb-2 mt-6">Knowledge Base</div>

          {activeMenu.map((item) => (
            <button 
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className={`w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${currentTab === item.id ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <item.icon className="w-4 h-4 mr-3" />
              {item.label}
            </button>
          ))}

          <div className="mt-auto pt-6 border-t border-slate-800">
             <button 
                onClick={() => handleTabChange(Tab.Chatbot)}
                className={`w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${currentTab === Tab.Chatbot ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
              >
                <MessageSquare className="w-4 h-4 mr-3" />
                智能问答助手
              </button>
          </div>
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6 shadow-sm z-20">
          <div className="flex items-center space-x-8">
            {/* Category Selector */}
            <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-lg">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveInfrastructure({ 
                    category: cat.id, 
                    subCategory: subCategories[cat.id][0].id 
                  })}
                  className={`flex items-center px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                    activeInfrastructure.category === cat.id
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <cat.icon className="w-3.5 h-3.5 mr-1.5" />
                  {cat.name}
                </button>
              ))}
            </div>

            <ChevronRight className="w-4 h-4 text-gray-300" />

            {/* SubCategory Selector */}
            <div className="flex items-center space-x-4">
              {subCategories[activeInfrastructure.category].map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => setActiveInfrastructure({ ...activeInfrastructure, subCategory: sub.id })}
                  className={`relative py-5 text-sm font-bold transition-all ${
                    activeInfrastructure.subCategory === sub.id
                      ? 'text-blue-600'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <div className="flex items-center">
                    <sub.icon className="w-4 h-4 mr-2" />
                    {sub.name}
                  </div>
                  {activeInfrastructure.subCategory === sub.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="ml-auto flex items-center space-x-4">
            <div className="flex items-center text-xs text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
              系统运行正常
            </div>
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-hidden relative">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;
