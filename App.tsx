
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
  const [activeTab, setActiveTab] = useState<Tab>(Tab.DecisionModel);
  const [activeInfrastructure, setActiveInfrastructure] = useState<InfrastructureState>({
    category: 'road',
    subCategory: 'roadbed'
  });

  // Reset activeTab when subCategory changes to prevent staying on a non-existent tab
  useEffect(() => {
    setActiveTab(Tab.DecisionModel);
  }, [activeInfrastructure.subCategory]);

  const renderContent = () => {
    const commonProps = { activeInfrastructure };

    switch (activeTab) {
      case Tab.DecisionModel:
        if (activeInfrastructure.category === 'road') {
          return activeInfrastructure.subCategory === 'roadbed' 
            ? <SmartDecisionModel {...commonProps} /> 
            : <SlopeAnalysis {...commonProps} />;
        }
        return <Placeholder title={`${activeInfrastructure.category} - ${activeInfrastructure.subCategory}`} />;
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
        return <SmartDecisionModel {...commonProps} />;
    }
  };

  // Menu Configurations
  const roadbedMenu = [
    { id: Tab.HistoryLibrary, label: '历史训练库', icon: Database },
    { id: Tab.CaseGenerator, label: '案例生成库', icon: FileText },
    { id: Tab.Indicators, label: '强度指标库', icon: BarChart2 },
    { id: Tab.Diseases, label: '病害图谱', icon: Layers },
    { id: Tab.MeasureLibrary, label: '加固措施库', icon: PenTool },
    { id: Tab.CaseLibrary, label: '经典案例库', icon: BookOpen },
  ];

  const slopeMenu = [
    { id: Tab.SlopeTypicalCases, label: '典型案例库', icon: ClipboardList },
    { id: Tab.SlopeHistory, label: '历史训练库', icon: History },
    { id: Tab.SlopeMeasures, label: '加固措施库', icon: ShieldCheck },
    { id: Tab.SlopeDiseaseAtlas, label: '病害等级图谱', icon: Microscope },
    { id: Tab.SlopeClassicCases, label: '经典案例库', icon: BookOpen },
  ];

  const activeMenu = activeInfrastructure.subCategory === 'roadbed' ? roadbedMenu : (activeInfrastructure.subCategory === 'slope' ? slopeMenu : []);

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
      { id: 'bridge_deck', name: '桥面系', icon: Layers },
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
        <div className="p-6 border-b border-slate-800 flex items-center">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3 shadow-lg shadow-blue-900/50">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">RoadbedGuard</h1>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">AI Decision System</div>
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
          <div className="text-xs font-bold text-slate-500 uppercase px-3 mb-2 mt-2">Core Modules</div>
          
          <button 
            onClick={() => setActiveTab(Tab.DecisionModel)}
            className={`w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === Tab.DecisionModel ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Activity className="w-4 h-4 mr-3" />
            仿真模拟分析
          </button>

          <div className="text-xs font-bold text-slate-500 uppercase px-3 mb-2 mt-6">Knowledge Base</div>

          {activeMenu.map((item) => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === item.id ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <item.icon className="w-4 h-4 mr-3" />
              {item.label}
            </button>
          ))}

          <div className="mt-auto pt-6 border-t border-slate-800">
             <button 
                onClick={() => setActiveTab(Tab.Chatbot)}
                className={`w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === Tab.Chatbot ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
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
