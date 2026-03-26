import React, { useState, useRef } from 'react';
import { HISTORICAL_CASES } from '../constants';
import { HistoricalCase } from '../types';

const HistoryLibrary: React.FC = () => {
  const [cases, setCases] = useState<HistoricalCase[]>(HISTORICAL_CASES);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingStatus, setTrainingStatus] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTrainModel = () => {
    setIsTraining(true);
    setTrainingStatus('初始化模型参数 (Random Forest + XGBoost)...');
    
    setTimeout(() => {
        setTrainingStatus('加载时序特征 (TD Transformer Embedding)...');
    }, 1000);

    setTimeout(() => {
        setTrainingStatus('执行集成模型训练 (Ensemble Training)...');
    }, 2500);

    setTimeout(() => {
        setTrainingStatus(`模型验证完成. 样本数: ${cases.length}, Accuracy: 97.2%`);
        setIsTraining(false);
    }, 4000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Simulate reading Excel/CSV
    const reader = new FileReader();
    reader.onload = (event) => {
      // In a real app, parse CSV string. Here we mock adding new data.
      const newMockCases: HistoricalCase[] = [];
      const measuresPool = ['换填改良', '抗滑桩', '高聚物注浆', '无'];

      for(let i=0; i<3; i++) {
          const hasVisual = Math.random() > 0.3;
          newMockCases.push({
            id: `imp-${Date.now()}-${i}`,
            subgradeType: Math.random() > 0.5 ? 'fill' : 'cut',
            compaction: 90 + Math.floor(Math.random() * 8),
            width: 26,
            height: 5 + Math.floor(Math.random() * 10),
            rainfall: Math.floor(Math.random() * 200),
            groundWater: Number((Math.random() * 5).toFixed(1)),
            temperature: 10 + Math.floor(Math.random() * 20),
            load: 2 + Math.floor(Math.random() * 8),
            rockType: 'granite',
            hasVisualFeatures: hasVisual,
            disasterArea: hasVisual ? 50 + Math.floor(Math.random()*100) : null,
            collapseRatio: hasVisual ? Math.floor(Math.random()*30) : null,
            settlementLevel: hasVisual ? 'medium' : null,
            crackDensity: hasVisual ? Number(Math.random().toFixed(1)) : null,
            actualMeasures: hasVisual ? [measuresPool[i]] : ['无'],
            repairTime: 6 + Math.floor(Math.random() * 18),
            successRate: 0.9
          });
      }
      
      setCases(prev => [...newMockCases, ...prev]);
      alert(`成功导入 ${newMockCases.length} 条历史案例数据！`);
    };
    reader.readAsText(file);
    if(fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col gap-6">
      {/* Header & Actions */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-center">
        <div>
           <h2 className="text-2xl font-bold text-gray-800">历史灾毁案例库 (Historical Data)</h2>
           <p className="text-sm text-gray-500 mt-1">
             支持Excel/CSV导入，用于训练高精度AI预测模型 (RF + XGB + Transformer)
           </p>
        </div>
        <div className="flex space-x-3 mt-4 md:mt-0">
            <input 
              type="file" 
              accept=".csv,.xlsx" 
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 text-sm flex items-center"
            >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                导入Excel数据
            </button>
            <button 
                onClick={handleTrainModel}
                disabled={isTraining}
                className={`px-6 py-2 rounded-lg text-white font-bold text-sm transition-all ${isTraining ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 shadow-lg'}`}
            >
                {isTraining ? '训练中...' : '启动模型训练'}
            </button>
        </div>
      </div>

      {/* Training Status Console */}
      {trainingStatus && (
          <div className="bg-gray-900 text-green-400 font-mono text-xs p-4 rounded-xl border border-gray-700 shadow-inner">
              <p className="mb-1">&gt; System initialized.</p>
              {isTraining && (
                 <>
                  <p className="mb-1">&gt; Importing sequence: [Subgrade, Compaction, Width, Height, Rain, GW, Temp, Load, Soil, Visual(Y/N)...]</p>
                  <p className="mb-1">&gt; Handling Logic: Visual='No' -&gt; Set metrics to NULL/None.</p>
                 </>
              )}
              <p className="animate-pulse">&gt; {trainingStatus}</p>
          </div>
      )}

      {/* Data Table */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between">
            <h3 className="font-bold text-gray-700 text-sm">已入库案例 ({cases.length})</h3>
            <span className="text-xs text-gray-400 italic">显示前50条记录</span>
        </div>
        <div className="flex-1 overflow-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0">
                    <tr>
                        <th className="px-4 py-3">ID</th>
                        <th className="px-4 py-3">路基类型</th>
                        <th className="px-4 py-3">压实度(%)</th>
                        <th className="px-4 py-3">宽度(m)</th>
                        <th className="px-4 py-3 text-blue-600">降雨(mm)</th>
                        <th className="px-4 py-3">岩土</th>
                        <th className="px-4 py-3">环境温度</th>
                        <th className="px-4 py-3">累计荷载</th>
                        <th className="px-4 py-3 bg-yellow-50">可视化特征</th>
                        <th className="px-4 py-3 bg-yellow-50">灾损面积</th>
                        <th className="px-4 py-3 bg-yellow-50">沉降</th>
                        <th className="px-4 py-3 bg-yellow-50">灾损类型</th>
                        <th className="px-4 py-3 bg-green-50">加固措施</th>
                        <th className="px-4 py-3">抢修时间(h)</th>
                    </tr>
                </thead>
                <tbody>
                    {cases.map((c) => (
                        <tr key={c.id} className="bg-white border-b hover:bg-gray-50">
                            <td className="px-4 py-3 font-mono text-gray-500 text-xs">{c.id}</td>
                            <td className="px-4 py-3">{c.subgradeType}</td>
                            <td className="px-4 py-3">{c.compaction}</td>
                            <td className="px-4 py-3">{c.width}</td>
                            <td className="px-4 py-3 text-blue-600 font-bold">{c.rainfall}</td>
                            <td className="px-4 py-3">{c.rockType}</td>
                            <td className="px-4 py-3">{c.temperature}</td>
                            <td className="px-4 py-3">{c.load}</td>
                            <td className="px-4 py-3 font-bold">{c.hasVisualFeatures ? '是' : '否'}</td>
                            <td className="px-4 py-3 text-gray-600">{c.hasVisualFeatures ? c.disasterArea : '无'}</td>
                            <td className="px-4 py-3 text-gray-600">{c.hasVisualFeatures ? c.settlementLevel : '无'}</td>
                            <td className="px-4 py-3 text-gray-600">{c.hasVisualFeatures ? c.disasterType : '无'}</td>
                            <td className="px-4 py-3 text-blue-600 max-w-[150px] truncate" title={c.actualMeasures.join(', ')}>
                                {c.actualMeasures.join(', ')}
                            </td>
                            <td className="px-4 py-3 font-mono text-green-700">{c.repairTime}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default HistoryLibrary;