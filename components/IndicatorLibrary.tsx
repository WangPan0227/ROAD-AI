import React, { useState } from 'react';
import { BarChart2, Search, Activity, Droplets, Shield, ArrowDownToLine } from 'lucide-react';
import { INDICATORS } from '../constants';

const IndicatorLibrary: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  const filteredIndicators = INDICATORS.filter(ind => {
    const matchesSearch = ind.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          ind.description.toLowerCase().includes(searchTerm);
    const matchesFilter = filterCategory === 'all' || ind.category === filterCategory;
    return matchesSearch && matchesFilter;
  });

  const categories = Array.from(new Set(INDICATORS.map(i => i.category)));

  const getCategoryIcon = (category: string) => {
    if (category.includes('综合')) return <Activity className="w-5 h-5 text-blue-500" />;
    if (category.includes('力学')) return <Shield className="w-5 h-5 text-emerald-500" />;
    if (category.includes('变形')) return <ArrowDownToLine className="w-5 h-5 text-orange-500" />;
    if (category.includes('水文')) return <Droplets className="w-5 h-5 text-cyan-500" />;
    return <BarChart2 className="w-5 h-5 text-gray-500" />;
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm">
        <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
                <BarChart2 className="w-6 h-6 mr-2 text-blue-600" />
                强度指标库 (Indicator Library)
            </h2>
            <p className="text-xs text-gray-500 mt-1">基于《公路路基养护技术规范》及典型灾害案例提取的关键指标</p>
        </div>
        <div className="flex space-x-3">
            <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="搜索指标名称..." 
                    className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <select 
                className="border border-gray-300 rounded-lg text-sm px-3 py-2 focus:ring-2 focus:ring-blue-500"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
            >
                <option value="all">全部类别</option>
                {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                ))}
            </select>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-8">
        {categories.filter(c => filterCategory === 'all' || c === filterCategory).map(category => {
          const categoryIndicators = filteredIndicators.filter(i => i.category === category);
          if (categoryIndicators.length === 0) return null;
          
          return (
            <div key={category}>
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center border-b-2 border-gray-200 pb-2">
                {getCategoryIcon(category)}
                <span className="ml-2">{category}</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoryIndicators.map((indicator, idx) => (
                  <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all hover:border-blue-300 group">
                      <div className="p-5 flex flex-col h-full">
                          <div className="flex justify-between items-start mb-3">
                              <div>
                                  <h3 className="text-lg font-bold text-gray-800 group-hover:text-blue-600 transition-colors flex items-center">
                                      {indicator.name}
                                      <span className="ml-2 px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded font-mono border border-blue-100">
                                          {indicator.symbol}
                                      </span>
                                  </h3>
                              </div>
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-4 flex-grow">
                              {indicator.description}
                          </p>

                          <div className="space-y-3 mt-auto">
                              <div className="bg-gray-50 p-3 rounded-lg">
                                  <h4 className="text-xs font-bold text-gray-700 mb-1">测试/计算方法</h4>
                                  <p className="text-xs text-gray-500">{indicator.method}</p>
                              </div>
                              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                                  <h4 className="text-xs font-bold text-blue-800 mb-1">规范标准/限值</h4>
                                  <p className="text-xs text-blue-600">{indicator.standard}</p>
                              </div>
                          </div>
                      </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {filteredIndicators.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <Search className="w-12 h-12 mb-4 opacity-20" />
            <p>未找到匹配的指标</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default IndicatorLibrary;
