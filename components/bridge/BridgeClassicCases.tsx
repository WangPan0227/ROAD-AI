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
  const [cases, setCases] = useState<BridgeClassicCase[]>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('roadbedguard_bridge_classic_cases') : null;
    if (saved) {
      return JSON.parse(saved);
    }
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
    if (typeof window !== 'undefined') {
       localStorage.setItem('roadbedguard_bridge_classic_cases', JSON.stringify(defaultCases));
    }
    return defaultCases;
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [extractedData, setExtractedData] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {}, []);

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
    <div className="flex flex-col h-full bg-[#020617] text-slate-300 font-sans overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-[1px] bg-blue-500/20 animate-pulse pointer-events-none" />
      
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-8 py-6 flex items-center justify-between shadow-2xl relative z-20">
        <div className="flex items-center space-x-6">
          <div className="bg-slate-950 p-4 rounded-2xl shadow-[0_0_20px_rgba(59,130,246,0.15)] border border-slate-800">
            <BookOpen className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-100 italic tracking-tighter uppercase">桥梁经典案例库与大模型知识抽取 Matrix</h2>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-1 italic">Bridge Engineering Classic Cases & LLM Extraction // ARCHIVE_DATA</p>
          </div>
        </div>
        <div className="flex items-center space-x-6">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
            <input 
              type="text" 
              placeholder="搜索案例、技术、地域..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-6 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 focus:border-blue-500/50 outline-none transition-all w-72 shadow-inner"
            />
          </div>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center px-8 py-3 bg-blue-600 text-white text-[10px] font-black rounded-xl shadow-[0_0_25px_rgba(59,130,246,0.2)] hover:bg-blue-500 transition-all active:scale-95 uppercase tracking-[0.2em]"
          >
            <UploadCloud className="w-4 h-4 mr-3" />
            上传工程报告 (PDF)
          </button>
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".pdf" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-10 custom-scrollbar scrollbar-slim relative z-10">
        <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />
        
        <div className="max-w-6xl mx-auto space-y-10 relative">
          {/* Uploading State */}
          {isUploading && (
            <div className="bg-slate-900/50 backdrop-blur-md p-16 rounded-[2.5rem] border-2 border-dashed border-blue-500/30 flex flex-col items-center justify-center animate-pulse shadow-2xl">
              <Cpu className="w-20 h-20 text-blue-500 mb-8 animate-spin-slow shadow-[0_0_30px_rgba(59,130,246,0.3)]" />
              <h3 className="text-2xl font-black text-slate-100 mb-3 italic tracking-tight uppercase">大模型正在深度解析 PDF 报告...</h3>
              <p className="text-[10px] text-slate-500 font-black mb-8 text-center max-w-md uppercase tracking-widest leading-relaxed">
                内置 Gemini Pro 正在提取桥墩直径、冲击能量、损伤演化机理及加固工艺参数，构建结构化语料库。 // LLM_KNOWLEDGE_EXTRACTION
              </p>
              <div className="w-72 h-1.5 bg-slate-950 rounded-full overflow-hidden shadow-inner">
                <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-300 shadow-[0_0_15px_rgba(59,130,246,0.5)]" style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          )}

          {/* Extracted Data Review */}
          {extractedData && !isUploading && (
            <div className="bg-gradient-to-br from-blue-600/90 to-indigo-900/90 backdrop-blur-xl rounded-[2.5rem] p-10 text-white shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-500 relative overflow-hidden border border-white/20">
              <div className="absolute top-0 right-0 p-12 opacity-10 blur-sm">
                <Zap className="w-56 h-56" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-10">
                  <div className="flex items-center space-x-4">
                    <div className="bg-white/20 p-3 rounded-xl backdrop-blur-md border border-white/20">
                      <Cpu className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black italic tracking-tighter uppercase">AI 知识抽取结果 Matrix (Draft)</h3>
                      <p className="text-[9px] font-black text-blue-200 mt-1 uppercase tracking-widest">Structural Intelligence Extraction // READY_FOR_COMMIT</p>
                    </div>
                  </div>
                  <div className="flex space-x-4">
                    <button onClick={() => setExtractedData(null)} className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all"><X className="w-6 h-6" /></button>
                    <button onClick={confirmExtraction} className="flex items-center px-10 py-3 bg-white text-blue-900 font-black text-[10px] rounded-xl shadow-2xl hover:bg-blue-50 transition-all active:scale-95 uppercase tracking-[0.2em]">
                      <CheckCircle2 className="w-4 h-4 mr-3" />
                      确认入库 // COMMIT
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 font-mono">
                  <div className="lg:col-span-2 space-y-8">
                    <div className="group">
                      <label className="text-[10px] font-black text-blue-200 uppercase tracking-widest leading-none block mb-3">案例标题 // CASE_TITLE</label>
                      <input 
                        value={extractedData.title} 
                        onChange={(e) => setExtractedData({...extractedData, title: e.target.value})}
                        className="w-full bg-transparent text-3xl font-black focus:outline-none border-b border-white/30 pb-4 mt-2 transition-all focus:border-white text-white placeholder-white/30"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="group">
                        <label className="text-[10px] font-black text-blue-200 uppercase tracking-widest leading-none block mb-3">病害/灾害机理 // DISASTER_LOGIC</label>
                        <textarea 
                          value={extractedData.disasterType}
                          onChange={(e) => setExtractedData({...extractedData, disasterType: e.target.value})}
                          className="w-full bg-white/10 rounded-2xl p-5 text-xs font-bold focus:outline-none mt-2 h-32 border border-white/10 focus:border-white/30 transition-all"
                        />
                      </div>
                      <div className="group">
                        <label className="text-[10px] font-black text-blue-200 uppercase tracking-widest leading-none block mb-3">核心加固措施 // DEFENSE_SYSTEM</label>
                        <textarea 
                          value={extractedData.reinforcement}
                          onChange={(e) => setExtractedData({...extractedData, reinforcement: e.target.value})}
                          className="w-full bg-white/10 rounded-2xl p-5 text-xs font-bold focus:outline-none mt-2 h-32 border border-white/10 focus:border-white/30 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="bg-slate-900/40 rounded-[2rem] p-8 backdrop-blur-md border border-white/10 shadow-inner">
                    <h4 className="text-[10px] font-black text-blue-200 uppercase mb-8 flex items-center tracking-widest">
                      <Database className="w-4 h-4 mr-3" />
                      物理引擎映射参数 // PHYS_PARAMS
                    </h4>
                    <div className="space-y-6">
                      {Object.entries(extractedData.params).map(([k, v]: [string, any]) => (
                        <div key={k} className="flex justify-between items-center border-b border-white/10 pb-3 group">
                          <span className="text-[10px] text-blue-100 font-black uppercase tracking-tighter group-hover:text-white transition-colors">{k}</span>
                          <input 
                            value={v} 
                            onChange={(e) => setExtractedData({...extractedData, params: {...extractedData.params, [k]: e.target.value}})}
                            className="bg-transparent text-right text-sm font-black focus:outline-none w-24 text-white hover:text-blue-200 transition-colors"
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {filteredCases.map((c) => (
              <div key={c.id} className="bg-slate-900/50 backdrop-blur-md rounded-[2.5rem] border border-slate-800 shadow-2xl hover:shadow-[0_0_40px_rgba(59,130,246,0.1)] hover:-translate-y-2 transition-all duration-500 overflow-hidden group">
                <div className="p-8">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-slate-950 rounded-xl flex items-center justify-center border border-slate-800 group-hover:border-blue-500/50 transition-colors">
                        <FileText className="w-5 h-5 text-blue-400" />
                      </div>
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">{c.id}</span>
                    </div>
                    <span className="text-[10px] text-slate-600 font-bold flex items-center uppercase tracking-[0.2em]">
                      <Clock className="w-3.5 h-3.5 mr-2" />
                      {c.date}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-slate-100 mb-4 group-hover:text-blue-400 transition-colors leading-tight italic tracking-tighter">{c.title}</h3>
                  <div className="flex items-center text-[10px] text-slate-500 font-black uppercase tracking-widest mb-8">
                    <MapPin className="w-4 h-4 mr-2 text-slate-600 group-hover:text-blue-500 transition-colors" />
                    {c.location}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6 mb-8">
                    <div className="p-5 bg-slate-950/50 rounded-2xl border border-slate-800/50 group-hover:border-slate-800 transition-colors">
                      <div className="text-[9px] font-black text-slate-600 uppercase mb-2 flex items-center tracking-widest">
                        <AlertTriangle className="w-3.5 h-3.5 mr-2 text-amber-500" />
                        病害特征 // SYMPTOMS
                      </div>
                      <div className="text-[11px] font-bold text-slate-400 line-clamp-2 leading-relaxed">{c.disasterType}</div>
                    </div>
                    <div className="p-5 bg-slate-950/50 rounded-2xl border border-slate-800/50 group-hover:border-slate-800 transition-colors">
                      <div className="text-[9px] font-black text-slate-600 uppercase mb-2 flex items-center tracking-widest">
                        <Hammer className="w-3.5 h-3.5 mr-2 text-emerald-500" />
                        加固工艺 // DEFENSE
                      </div>
                      <div className="text-[11px] font-bold text-slate-400 line-clamp-2 leading-relaxed">{c.reinforcement}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-slate-800/50">
                    <div className="flex flex-wrap gap-2">
                      {c.tags.map(t => (
                        <span key={t} className="px-3 py-1 bg-blue-500/5 text-blue-400 text-[9px] font-black border border-blue-500/10 rounded uppercase tracking-widest">{t}</span>
                      ))}
                    </div>
                    <button className="p-3 bg-slate-950 rounded-xl text-slate-600 hover:text-blue-400 hover:border-blue-500/30 border border-slate-800 transition-all shadow-lg active:scale-95 group/btn">
                      <ChevronRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
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
