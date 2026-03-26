
import React, { useState } from 'react';
import { 
  Layout, Database, FileText, Activity, MessageSquare, 
  Layers, Settings, BarChart2, BookOpen, PenTool
} from 'lucide-react';
import SmartDecisionModel from './components/SmartDecisionModel';
import HistoryLibrary from './components/HistoryLibrary';
import CaseGenerator from './components/CaseGenerator';
import ReinforcementLibrary from './components/ReinforcementLibrary';
import DiseaseAtlas from './components/DiseaseAtlas';
import CaseLibrary from './components/CaseLibrary';
import Chatbot from './components/Chatbot';
import IndicatorLibrary from './components/IndicatorLibrary';
import { Tab } from './types';

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

  const renderContent = () => {
    switch (activeTab) {
      case Tab.DecisionModel:
        return <SmartDecisionModel />;
      case Tab.HistoryLibrary:
        return <HistoryLibrary />;
      case Tab.CaseGenerator:
        return <CaseGenerator />;
      case Tab.Indicators:
        return <IndicatorLibrary />;
      case Tab.Diseases:
        return <DiseaseAtlas />;
      case Tab.MeasureLibrary:
        return <ReinforcementLibrary />;
      case Tab.CaseLibrary:
        return <CaseLibrary />;
      case Tab.Chatbot:
        return <Chatbot />;
      default:
        return <SmartDecisionModel />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans text-gray-900 overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-white flex flex-col shadow-xl z-20">
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
            智能决策模型
          </button>

          <div className="text-xs font-bold text-slate-500 uppercase px-3 mb-2 mt-6">Knowledge Base</div>

          <button 
            onClick={() => setActiveTab(Tab.HistoryLibrary)}
            className={`w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === Tab.HistoryLibrary ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Database className="w-4 h-4 mr-3" />
            历史训练库
          </button>
          
          <button 
            onClick={() => setActiveTab(Tab.CaseGenerator)}
            className={`w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === Tab.CaseGenerator ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <FileText className="w-4 h-4 mr-3" />
            案例生成库
          </button>

          <button 
            onClick={() => setActiveTab(Tab.Indicators)}
            className={`w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === Tab.Indicators ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <BarChart2 className="w-4 h-4 mr-3" />
            强度指标库
          </button>

          <button 
            onClick={() => setActiveTab(Tab.Diseases)}
            className={`w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === Tab.Diseases ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Layers className="w-4 h-4 mr-3" />
            病害图谱
          </button>

          <button 
            onClick={() => setActiveTab(Tab.MeasureLibrary)}
            className={`w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === Tab.MeasureLibrary ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <PenTool className="w-4 h-4 mr-3" />
            加固措施库
          </button>

          <button 
            onClick={() => setActiveTab(Tab.CaseLibrary)}
            className={`w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === Tab.CaseLibrary ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <BookOpen className="w-4 h-4 mr-3" />
            经典案例库
          </button>

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

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
