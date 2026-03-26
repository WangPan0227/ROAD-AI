
import React, { useState } from 'react';
import { BookOpen, Search, MapPin, Calendar, AlertTriangle, Info, Droplets, Mountain } from 'lucide-react';
import { CASE_STUDIES } from '../constants';

const CaseLibrary: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(CASE_STUDIES[0]?.id || null);

  const filteredCases = CASE_STUDIES.filter(c => 
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedCase = CASE_STUDIES.find(c => c.id === selectedCaseId);

  return (
    <div className="flex h-full bg-gray-50">
      {/* Left Sidebar - Case List */}
      <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col h-full">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-800 flex items-center mb-4">
            <BookOpen className="w-5 h-5 mr-2 text-blue-600" />
            经典案例库
          </h2>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="搜索案例名称或地点..." 
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {filteredCases.map(c => (
            <div 
              key={c.id}
              onClick={() => setSelectedCaseId(c.id)}
              className={`p-3 rounded-lg cursor-pointer transition-all border ${
                selectedCaseId === c.id 
                ? 'bg-blue-50 border-blue-300 shadow-sm' 
                : 'bg-white border-gray-100 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <h3 className="font-bold text-sm text-gray-800 mb-1">{c.title}</h3>
              <div className="flex items-center text-xs text-gray-500 space-x-3">
                <span className="flex items-center"><Calendar className="w-3 h-3 mr-1" /> {c.date.split(' ')[0]}</span>
                <span className="flex items-center truncate"><MapPin className="w-3 h-3 mr-1" /> {c.location}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Content - Case Details */}
      <div className="w-2/3 flex flex-col h-full overflow-y-auto bg-gray-50 p-6">
        {selectedCase ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {selectedCase.imageUrl && (
              <div className="h-48 bg-gray-200 relative">
                <img src={selectedCase.imageUrl} alt={selectedCase.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-4 left-6 text-white">
                  <h2 className="text-2xl font-bold">{selectedCase.title}</h2>
                  <div className="flex items-center text-sm mt-2 space-x-4 opacity-90">
                    <span className="flex items-center"><Calendar className="w-4 h-4 mr-1" /> {selectedCase.date}</span>
                    <span className="flex items-center"><MapPin className="w-4 h-4 mr-1" /> {selectedCase.location}</span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="p-6 space-y-6">
              {/* Description */}
              <div>
                <h3 className="text-sm font-bold text-gray-800 flex items-center mb-2">
                  <Info className="w-4 h-4 mr-2 text-blue-600" /> 灾害概述
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-lg">
                  {selectedCase.description}
                </p>
              </div>

              {/* Stats & Environment */}
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-gray-100 rounded-lg p-4 bg-white shadow-sm">
                  <h4 className="text-xs font-bold text-gray-500 uppercase mb-3 border-b pb-2">灾损统计</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-gray-400">长度:</span> {selectedCase.damageStats.length}m</div>
                    <div><span className="text-gray-400">宽度:</span> {selectedCase.damageStats.width}m</div>
                    <div><span className="text-gray-400">深度:</span> {selectedCase.damageStats.depth}m</div>
                    <div><span className="text-gray-400">面积:</span> {selectedCase.damageStats.area}m²</div>
                    {selectedCase.damageStats.volume && <div className="col-span-2"><span className="text-gray-400">体积:</span> ~{selectedCase.damageStats.volume}m³</div>}
                    {selectedCase.damageStats.casualties && <div className="col-span-2 text-red-600 font-medium"><span className="text-gray-400">伤亡:</span> {selectedCase.damageStats.casualties}</div>}
                  </div>
                </div>
                <div className="border border-gray-100 rounded-lg p-4 bg-white shadow-sm">
                  <h4 className="text-xs font-bold text-gray-500 uppercase mb-3 border-b pb-2">环境与地质</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start">
                      <Droplets className="w-4 h-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-gray-400 text-xs">降雨量</div>
                        <div>{selectedCase.environment.rainfall} mm</div>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <Mountain className="w-4 h-4 text-amber-600 mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-gray-400 text-xs">地质条件</div>
                        <div>{selectedCase.environment.geology}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cause & Mechanism */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-800 flex items-center mb-2">
                    <AlertTriangle className="w-4 h-4 mr-2 text-orange-500" /> 诱发原因
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {selectedCase.cause}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-800 flex items-center mb-2">
                    <AlertTriangle className="w-4 h-4 mr-2 text-red-500" /> 演化机理
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {selectedCase.mechanism}
                  </p>
                </div>
              </div>

              {/* Measures & Lessons */}
              <div className="grid grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                <div>
                  <h3 className="text-sm font-bold text-gray-800 mb-3">采取措施</h3>
                  <ul className="space-y-2">
                    {selectedCase.measuresUsed.map((m, i) => (
                      <li key={i} className="text-sm text-gray-600 flex items-start">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2 mt-1.5 flex-shrink-0"></span>
                        {m}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-800 mb-3">经验教训</h3>
                  <ul className="space-y-2">
                    {selectedCase.lessonsLearned.map((l, i) => (
                      <li key={i} className="text-sm text-gray-600 flex items-start">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2 mt-1.5 flex-shrink-0"></span>
                        {l}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <p>请在左侧选择一个案例查看详情</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CaseLibrary;
