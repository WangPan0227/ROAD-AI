
import React, { useState } from 'react';
import { 
  Activity, AlertTriangle, Box, Search, Info 
} from 'lucide-react';
import { DISEASES } from '../constants';

const DiseaseAtlas: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  const filteredDiseases = DISEASES.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          d.description.toLowerCase().includes(searchTerm);
    const matchesFilter = filterCategory === 'all' || d.category === filterCategory;
    return matchesSearch && matchesFilter;
  });

  const categories = Array.from(new Set(DISEASES.map(d => d.category)));

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm">
        <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
                <Activity className="w-6 h-6 mr-2 text-primary" />
                路基病害图谱 (Disease Atlas)
            </h2>
            <p className="text-xs text-gray-500 mt-1">常见路基病害特征、成因及识别指标库</p>
        </div>
        <div className="flex space-x-3">
            <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="搜索病害名称..." 
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

      {/* Content Grid */}
      <div className="flex-1 overflow-auto p-6 space-y-8">
        {categories.filter(c => filterCategory === 'all' || c === filterCategory).map(category => {
          const categoryDiseases = filteredDiseases.filter(d => d.category === category);
          if (categoryDiseases.length === 0) return null;
          
          return (
            <div key={category}>
              <h3 className="text-xl font-bold text-gray-800 mb-4 border-b-2 border-gray-200 pb-2">
                {category}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoryDiseases.map((disease, idx) => (
                  <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all hover:border-red-300 group">
                      <div className="p-5">
                          <div className="flex justify-between items-start mb-3">
                              <div>
                                  <h3 className="text-lg font-bold text-gray-800 group-hover:text-red-600 transition-colors">
                                      {disease.name}
                                  </h3>
                                  <span className="inline-block bg-gray-100 text-gray-600 text-[10px] px-2 py-0.5 rounded-full font-bold mt-1">
                                      {disease.category}
                                  </span>
                              </div>
                              <div className="bg-red-50 p-2 rounded-lg">
                                  <AlertTriangle className="w-6 h-6 text-red-500" />
                              </div>
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-4 h-12 line-clamp-2">
                              {disease.description}
                          </p>

                          <div className="bg-gray-50 p-3 rounded-lg mb-4">
                              <h4 className="text-xs font-bold text-gray-700 mb-2 flex items-center">
                                  <Info className="w-3 h-3 mr-1" /> 典型特征
                              </h4>
                              <p className="text-xs text-gray-500 leading-relaxed">
                                  {disease.characteristics}
                              </p>
                          </div>

                          <div>
                              <h4 className="text-xs font-bold text-gray-700 mb-2">识别指标</h4>
                              <div className="flex flex-wrap gap-2">
                                  {disease.indicators.map((ind, i) => (
                                      <span key={i} className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded border border-red-100">
                                          {ind}
                                      </span>
                                  ))}
                              </div>
                          </div>
                      </div>
                      
                      <div className="bg-gray-50 px-5 py-3 border-t border-gray-100 flex justify-end items-center">
                          <button className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center">
                              查看3D演示 <Box className="w-3 h-3 ml-1" />
                          </button>
                      </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {filteredDiseases.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <Search className="w-12 h-12 mb-4 opacity-20" />
            <p>未找到匹配的病害</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiseaseAtlas;
