
import React, { useState } from 'react';
import { 
  Hammer, Clock, DollarSign, BarChart, 
  CheckCircle, AlertTriangle, Box, Search 
} from 'lucide-react';
import { REINFORCEMENT_MEASURES } from '../constants';
import { cn } from '../utils'; // Assuming utils exists or I'll define cn locally

function classNames(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

const ReinforcementLibrary: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  const filteredMeasures = REINFORCEMENT_MEASURES.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          m.description.toLowerCase().includes(searchTerm);
    // Simple filter logic based on suitability tags
    const matchesFilter = filterType === 'all' || m.suitability.some(s => s.includes(filterType));
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm">
        <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
                <Hammer className="w-6 h-6 mr-2 text-primary" />
                加固措施图谱 (Reinforcement Measures)
            </h2>
            <p className="text-xs text-gray-500 mt-1">包含传统与新型路基加固技术的详细参数与适用场景</p>
        </div>
        <div className="flex space-x-3">
            <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="搜索技术名称..." 
                    className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <select 
                className="border border-gray-300 rounded-lg text-sm px-3 py-2 focus:ring-2 focus:ring-blue-500"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
            >
                <option value="all">全部类型</option>
                <option value="边坡">边坡加固</option>
                <option value="路基">路基处理</option>
                <option value="应急">应急抢修</option>
            </select>
        </div>
      </div>

      {/* Content Grid */}
      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMeasures.map((measure) => (
                <div key={measure.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all hover:border-blue-300 group">
                    <div className="p-5">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <h3 className="text-lg font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                                    {measure.name}
                                </h3>
                                {measure.isNewTech && (
                                    <span className="inline-block bg-purple-100 text-purple-700 text-[10px] px-2 py-0.5 rounded-full font-bold mt-1">
                                        NEW TECH
                                    </span>
                                )}
                            </div>
                            <div className="bg-gray-100 p-2 rounded-lg">
                                <Box className="w-6 h-6 text-gray-500" />
                            </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2 h-10">
                            {measure.description}
                        </p>

                        <div className="flex flex-wrap gap-2 mb-4">
                            {measure.suitability.map((tag, idx) => (
                                <span key={idx} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded border border-blue-100">
                                    {tag}
                                </span>
                            ))}
                        </div>

                        <div className="grid grid-cols-3 gap-2 mb-4 bg-gray-50 p-3 rounded-lg">
                            <div className="text-center">
                                <div className="text-[10px] text-gray-400 uppercase">成本</div>
                                <div className="font-bold text-gray-700 flex justify-center items-center">
                                    <DollarSign className="w-3 h-3 mr-0.5" />
                                    {measure.costIndex}/10
                                </div>
                            </div>
                            <div className="text-center border-l border-gray-200">
                                <div className="text-[10px] text-gray-400 uppercase">工期</div>
                                <div className="font-bold text-gray-700 flex justify-center items-center">
                                    <Clock className="w-3 h-3 mr-0.5" />
                                    {measure.timeIndex}/10
                                </div>
                            </div>
                            <div className="text-center border-l border-gray-200">
                                <div className="text-[10px] text-gray-400 uppercase">难度</div>
                                <div className="font-bold text-gray-700 flex justify-center items-center">
                                    <BarChart className="w-3 h-3 mr-0.5" />
                                    {measure.difficultyIndex}/10
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2 text-xs text-gray-500">
                            <div className="flex items-start">
                                <CheckCircle className="w-3 h-3 mr-2 text-green-500 mt-0.5" />
                                <span>最佳适用: {measure.bestFor.join(', ')}</span>
                            </div>
                            <div className="flex items-start">
                                <AlertTriangle className="w-3 h-3 mr-2 text-orange-500 mt-0.5" />
                                <span>所需机械: {measure.requiredMachinery.join(', ')}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-gray-50 px-5 py-3 border-t border-gray-100 flex justify-between items-center">
                        <div className="text-xs font-mono text-gray-400">ID: {measure.id}</div>
                        <button className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center">
                            查看3D演示 <Box className="w-3 h-3 ml-1" />
                        </button>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default ReinforcementLibrary;
