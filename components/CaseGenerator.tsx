import React, { useState } from 'react';
import { HistoricalCase } from '../types';

const CaseGenerator: React.FC = () => {
  const [generateCount, setGenerateCount] = useState<number>(10);
  const [generatedCases, setGeneratedCases] = useState<HistoricalCase[]>([]);

  const generateData = () => {
    const newCases: HistoricalCase[] = [];
    // Mock realistic measures list
    const measuresPool = ['换填改良', '抗滑桩', '土钉支护', '高聚物注浆', '气泡轻质土', '微型桩群', '无'];

    for (let i = 0; i < generateCount; i++) {
        const hasVisual = Math.random() > 0.4; // 60% chance of visual damage
        
        // Physics-based generation logic
        const rainfall = Math.floor(Math.random() * 250);
        const subgradeType = ['fill', 'cut', 'half'][Math.floor(Math.random() * 3)];
        
        // Repair time correlates with rainfall and damage
        let baseTime = 4 + rainfall * 0.05; 
        if (hasVisual) baseTime += 10;
        
        // Pick random measure for mock
        const measures = hasVisual 
            ? [measuresPool[Math.floor(Math.random() * (measuresPool.length - 1))]] 
            : ['无'];

        newCases.push({
            id: `gen-${Date.now()}-${i}`,
            subgradeType: subgradeType,
            compaction: 85 + Math.floor(Math.random() * 15),
            width: 20 + Math.floor(Math.random() * 20),
            height: 2 + Math.floor(Math.random() * 20),
            rainfall: rainfall,
            groundWater: Number((Math.random() * 10).toFixed(1)),
            temperature: -10 + Math.floor(Math.random() * 45),
            load: 1 + Math.floor(Math.random() * 10),
            rockType: ['granite', 'clay', 'soft_rock', 'sand'][Math.floor(Math.random() * 4)],
            
            hasVisualFeatures: hasVisual,
            // Conditional Logic
            disasterArea: hasVisual ? 10 + Math.floor(Math.random() * 500) : null,
            collapseRatio: hasVisual ? Math.floor(Math.random() * 50) : null,
            settlementLevel: hasVisual ? ['light', 'medium', 'heavy'][Math.floor(Math.random() * 3)] : null,
            crackDensity: hasVisual ? Number((Math.random() * 2).toFixed(1)) : null,
            disasterType: hasVisual ? ['路基沉降', '边坡滑坡', '冻胀翻浆'][Math.floor(Math.random() * 3)] : null,
            
            actualMeasures: measures,
            repairTime: Number(baseTime.toFixed(1)),
            successRate: 0.95
        });
    }
    setGeneratedCases(newCases);
  };

  const downloadCSV = () => {
    if (generatedCases.length === 0) return;

    // Updated Header Order
    const headers = [
        "路基类型", "压实度", "路基宽度", "路基高度", 
        "降雨量", "地下水位", "环境温度", "累计荷载", "岩土类型",
        "可视化病害特征(是/否)", 
        "灾损面积", "垮塌占比", "沉降等级", "灾损类型", "加固措施", "裂缝密度",
        "抢修时间"
    ];

    const rows = generatedCases.map(c => [
        c.subgradeType,
        c.compaction,
        c.width,
        c.height,
        c.rainfall,
        c.groundWater,
        c.temperature,
        c.load,
        c.rockType,
        c.hasVisualFeatures ? "是" : "否",
        c.hasVisualFeatures ? c.disasterArea : "无",
        c.hasVisualFeatures ? c.collapseRatio : "无",
        c.hasVisualFeatures ? c.settlementLevel : "无",
        c.hasVisualFeatures ? c.disasterType : "无",
        c.actualMeasures.join('|'), // Measures after settlement
        c.hasVisualFeatures ? c.crackDensity : "无",
        c.repairTime
    ]);

    let csvContent = headers.join(",") + "\n";
    rows.forEach(row => {
        csvContent += row.join(",") + "\n";
    });

    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `roadbed_cases_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col gap-6">
       <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">案例生成库 (Case Generator)</h2>
          <p className="text-sm text-gray-500 mt-1">
             系统一键生成各种案例信息并导出为Excel格式，用于补充训练样本。
          </p>
          
          <div className="mt-6 flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
             <div className="flex items-center space-x-2">
                <label className="text-sm font-bold text-gray-700">生成数量:</label>
                <input 
                  type="number" min="1" max="1000"
                  value={generateCount}
                  onChange={(e) => setGenerateCount(Number(e.target.value))}
                  className="border rounded px-2 py-1 w-24 text-center"
                />
             </div>
             <button 
                onClick={generateData}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md transition-all"
             >
                生成案例数据
             </button>
             {generatedCases.length > 0 && (
                 <button 
                    onClick={downloadCSV}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md transition-all flex items-center"
                 >
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                    导出Excel (CSV)
                 </button>
             )}
          </div>
       </div>

       <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
             <h3 className="font-bold text-gray-700 text-sm">生成预览 ({generatedCases.length})</h3>
          </div>
          <div className="flex-1 overflow-auto">
             {generatedCases.length === 0 ? (
                 <div className="h-full flex flex-col items-center justify-center text-gray-400">
                     <svg className="w-16 h-16 mb-4 opacity-20" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11a1 1 0 11-2 0 1 1 0 012 0zm-1-3a1 1 0 00-1-1V5a1 1 0 112 0v4a1 1 0 00-1 1z" clipRule="evenodd"/></svg>
                     <p>暂无数据，请点击上方“生成案例数据”</p>
                 </div>
             ) : (
                <table className="w-full text-sm text-left whitespace-nowrap">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0">
                        <tr>
                            <th className="px-4 py-2">路基类型</th>
                            <th className="px-4 py-2">压实度</th>
                            <th className="px-4 py-2">宽度</th>
                            <th className="px-4 py-2">高度</th>
                            <th className="px-4 py-2">降雨</th>
                            <th className="px-4 py-2">岩土</th>
                            <th className="px-4 py-2">环境温度</th>
                            <th className="px-4 py-2">累计荷载</th>
                            <th className="px-4 py-2 bg-yellow-100">可视特征</th>
                            <th className="px-4 py-2 bg-yellow-50">灾损面积</th>
                            <th className="px-4 py-2 bg-yellow-50">沉降</th>
                            <th className="px-4 py-2 bg-yellow-50">灾损类型</th>
                            <th className="px-4 py-2 bg-green-50">加固措施</th>
                            <th className="px-4 py-2">抢修时间(h)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {generatedCases.map((c, idx) => (
                            <tr key={idx} className="border-b hover:bg-gray-50">
                                <td className="px-4 py-2">{c.subgradeType}</td>
                                <td className="px-4 py-2">{c.compaction}</td>
                                <td className="px-4 py-2">{c.width}</td>
                                <td className="px-4 py-2">{c.height}</td>
                                <td className="px-4 py-2">{c.rainfall}</td>
                                <td className="px-4 py-2">{c.rockType}</td>
                                <td className="px-4 py-2">{c.temperature}</td>
                                <td className="px-4 py-2">{c.load}</td>
                                <td className="px-4 py-2 font-bold">{c.hasVisualFeatures ? '是' : '否'}</td>
                                <td className="px-4 py-2 text-gray-500">{c.hasVisualFeatures ? c.disasterArea : '无'}</td>
                                <td className="px-4 py-2 text-gray-500">{c.hasVisualFeatures ? c.settlementLevel : '无'}</td>
                                <td className="px-4 py-2 text-gray-500">{c.hasVisualFeatures ? c.disasterType : '无'}</td>
                                <td className="px-4 py-2 text-blue-600">{c.actualMeasures.join(',')}</td>
                                <td className="px-4 py-2">{c.repairTime}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             )}
          </div>
       </div>
    </div>
  );
};

export default CaseGenerator;