import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, UploadCloud, Cpu, CheckCircle2, FileText, 
  MapPin, AlertTriangle, Hammer, Clock, Edit3, 
  Save, X, Database, Search, ChevronRight, Zap
} from 'lucide-react';

interface BridgeClassicCase {
  id: string;
  title: string;
  location: string;
  disasterType: string;
  reinforcement: string;
  params: {
    D: string;
    fc: string;
    Ek: string;
  };
  tags: string[];
  date: string;
}

const BridgeClassicCases: React.FC = () => {
  const [cases, setCases] = useState<BridgeClassicCase[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [extractedData, setExtractedData] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('roadbedguard_bridge_classic_cases');
    if (saved) {
      setCases(JSON.parse(saved));
    } else {
      const defaultCases: BridgeClassicCase[] = [
        {
          id: 'BR-CASE-001',
          title: '某跨海大桥航道墩受万吨级货轮侧向撞击处治',
          location: '广东珠海',
          disasterType: '船舶撞击导致塑性铰区域严重开裂',
          reinforcement: '复合材料柔性防撞套箱 + 局部碳纤维补强',
          params: { D: '2.2m', fc: 'C40', Ek: '4500kJ' },
          tags: ['跨海大桥', '船撞', '柔性防撞'],
          date: '2025-06-12'
        },
        {
          id: 'BR-CASE-002',
          title: '内河航道双柱墩重载撞击后的截面增大加固',
          location: '江苏苏州',
          disasterType: '重载砂石船撞击导致墩柱剪切破坏',
          reinforcement: '外包钢管混凝土套裙 (增大截面)',
          params: { D: '1.5m', fc: 'C30', Ek: '1800kJ' },
          tags: ['内河航道', '剪切破坏', '增大截面'],
          date: '2024-11-05'
        }
      ];
      setCases(defaultCases);
      localStorage.setItem('roadbedguard_bridge_classic_cases', JSON.stringify(defaultCases));
    }
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setExtractedData({
              title: file.name.replace('.pdf', ''),
              disasterType: '重载车辆/船舶冲击导致的墩柱脆性剪切破坏',
              reinforcement: '外包钢管混凝土套裙与基础加固',
              params: { D: '1.8m', fc: 'C35', Ek: '2200kJ' },
              tags: ['冲击破坏', '抗剪增强', '大模型提取'],
              location: '待核实'
            });
            setIsUploading(false);
          }, 800);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const confirmExtraction = () => {
    const newCase: BridgeClassicCase = {
      id: `BR-CASE-${Date.now()}`,
      ...extractedData,
      date: new Date().toISOString().split('T')[0]
    };
    const updated = [newCase, ...cases];
    setCases(updated);
    localStorage.setItem('roadbedguard_bridge_classic_cases', JSON.stringify(updated));
    setExtractedData(null);
  };

  const filteredCases = cases.filter(c => 
    c.title.includes(searchTerm) || c.tags.some(t => t.includes(searchTerm))
  );

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center space-x-5">
          <div className="bg-slate-900 p-3 rounded-2xl shadow-xl shadow-slate-200">
            <BookOpen className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-800 tracking-tight">桥梁经典案例库与大模型知识抽取</h2>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Bridge Engineering Classic Cases & LLM Extraction</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="搜索案例、技术、地域..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-gray-100 border-transparent rounded-xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all w-64"
            />
          </div>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center px-6 py-2.5 bg-blue-600 text-white text-sm font-black rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
          >
            <UploadCloud className="w-4 h-4 mr-2" />
            上传工程报告 (PDF)
          </button>
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".pdf" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Uploading State */}
          {isUploading && (
            <div className="bg-white p-12 rounded-3xl border-2 border-dashed border-blue-200 flex flex-col items-center justify-center animate-pulse">
              <Cpu className="w-16 h-16 text-blue-500 mb-6 animate-spin-slow" />
              <h3 className="text-xl font-black text-gray-800 mb-2">大模型正在深度解析 PDF 报告...</h3>
              <p className="text-sm text-gray-400 font-medium mb-6 text-center max-w-md">
                内置 Gemini Pro 正在提取桥墩直径、冲击能量、损伤演化机理及加固工艺参数，构建结构化语料库。
              </p>
              <div className="w-64 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          )}

          {/* Extracted Data Review */}
          {extractedData && !isUploading && (
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-2xl animate-in zoom-in-95 duration-500 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Zap className="w-48 h-48" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="bg-white/20 p-2 rounded-lg backdrop-blur-md">
                      <Cpu className="w-5 h-5 text-blue-200" />
                    </div>
                    <h3 className="text-xl font-black tracking-tight">AI 知识抽取结果 (草稿)</h3>
                  </div>
                  <div className="flex space-x-2">
                    <button onClick={() => setExtractedData(null)} className="p-2 hover:bg-white/10 rounded-lg transition-all"><X className="w-5 h-5" /></button>
                    <button onClick={confirmExtraction} className="flex items-center px-6 py-2 bg-white text-blue-600 font-black text-sm rounded-lg shadow-xl hover:bg-blue-50 transition-all active:scale-95">
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      确认入库
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-8">
                  <div className="col-span-2 space-y-6">
                    <div>
                      <label className="text-[10px] font-black text-blue-200 uppercase tracking-widest">案例标题</label>
                      <input 
                        value={extractedData.title} 
                        onChange={(e) => setExtractedData({...extractedData, title: e.target.value})}
                        className="w-full bg-transparent text-2xl font-black focus:outline-none border-b border-white/20 pb-2 mt-1"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="text-[10px] font-black text-blue-200 uppercase tracking-widest">病害/灾害机理</label>
                        <textarea 
                          value={extractedData.disasterType}
                          onChange={(e) => setExtractedData({...extractedData, disasterType: e.target.value})}
                          className="w-full bg-white/10 rounded-xl p-3 text-sm font-medium focus:outline-none mt-1 h-24"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-blue-200 uppercase tracking-widest">核心加固措施</label>
                        <textarea 
                          value={extractedData.reinforcement}
                          onChange={(e) => setExtractedData({...extractedData, reinforcement: e.target.value})}
                          className="w-full bg-white/10 rounded-xl p-3 text-sm font-medium focus:outline-none mt-1 h-24"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-md border border-white/10">
                    <h4 className="text-xs font-black text-blue-200 uppercase mb-4 flex items-center">
                      <Database className="w-3.5 h-3.5 mr-2" />
                      物理引擎映射参数
                    </h4>
                    <div className="space-y-4">
                      {Object.entries(extractedData.params).map(([k, v]: [string, any]) => (
                        <div key={k} className="flex justify-between items-center border-b border-white/10 pb-2">
                          <span className="text-xs text-blue-100 font-bold">{k}</span>
                          <input 
                            value={v} 
                            onChange={(e) => setExtractedData({...extractedData, params: {...extractedData.params, [k]: e.target.value}})}
                            className="bg-transparent text-right text-sm font-black focus:outline-none w-20"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Case List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredCases.map((c) => (
              <div key={c.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden group">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                        <FileText className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">{c.id}</span>
                    </div>
                    <span className="text-[10px] text-gray-400 font-bold flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {c.date}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-gray-800 mb-3 group-hover:text-blue-600 transition-colors leading-tight">{c.title}</h3>
                  <div className="flex items-center text-xs text-gray-500 mb-6">
                    <MapPin className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                    {c.location}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="text-[9px] font-black text-gray-400 uppercase mb-1 flex items-center">
                        <AlertTriangle className="w-3 h-3 mr-1.5 text-orange-500" />
                        病害特征
                      </div>
                      <div className="text-[11px] font-bold text-gray-700 line-clamp-2">{c.disasterType}</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="text-[9px] font-black text-gray-400 uppercase mb-1 flex items-center">
                        <Hammer className="w-3 h-3 mr-1.5 text-emerald-500" />
                        加固工艺
                      </div>
                      <div className="text-[11px] font-bold text-gray-700 line-clamp-2">{c.reinforcement}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                    <div className="flex flex-wrap gap-1.5">
                      {c.tags.map(t => (
                        <span key={t} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-black rounded uppercase">{t}</span>
                      ))}
                    </div>
                    <button className="p-2 text-gray-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BridgeClassicCases;
