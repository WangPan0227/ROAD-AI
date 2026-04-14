import React, { useState, useRef } from 'react';
import { 
  BookOpen, UploadCloud, Cpu, CheckCircle2, FileText, 
  MapPin, AlertTriangle, Hammer, Clock, Edit3, Save, X, Database
} from 'lucide-react';

interface ClassicCase {
  id: string;
  projectName: string;
  location: string;
  disasterType: string;
  geology: string;
  triggerFactor: string;
  damageLevel: string;
  coreMeasures: string[];
  keyParameters: string;
  costAndTime: string;
  lessonsLearned: string;
}

const STORAGE_KEY = 'roadbedguard_roadbed_classic_cases';

const RoadbedClassicCases: React.FC = () => {
  const [cases, setCases] = useState<ClassicCase[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  
  const [isExtracting, setIsExtracting] = useState(false);
  const [draftCase, setDraftCase] = useState<ClassicCase | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 模拟 AI 从 PDF 中提取信息的过程
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExtracting(true);
    
    // 模拟大模型处理延迟 (2.5秒模拟 LLM 解析)
    setTimeout(() => {
      const aiExtractedDraft: ClassicCase = {
        id: `rb-case-${Date.now()}`,
        projectName: file.name.replace('.pdf', ''),
        location: '华南某高速 K215+400 段高填方路基',
        disasterType: '长时降雨诱发的高填方路基深层脱空与翻浆冒泥',
        geology: '路基填料为强风化页岩，下卧层为软弱黏性土，地下水位较高。',
        triggerFactor: '连续 15 日强降雨导致地表水通过路面裂缝大量入渗，形成动水压力。',
        damageLevel: 'Ⅱ级中度破坏 (路面沉陷 12cm，伴随唧泥现象，弯沉值超标 30%)。',
        coreMeasures: ['高聚物无损注浆', '仰斜式排水管', '路面铣刨重铺'],
        keyParameters: '采用双组份高聚物材料，梅花型布孔，孔距1.5m，单孔注浆量约45kg，注浆终压控制在 0.6MPa。',
        costAndTime: '总造价约 120 万元，应急处治工期 12 天。',
        lessonsLearned: '高填方路基需严格控制层间排水，高聚物注浆在不破坏路面的前提下能有效填充脱空区，提升整体模量。'
      };
      setDraftCase(aiExtractedDraft);
      setIsExtracting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }, 2500);
  };

  const handleSaveDraft = () => {
    if (!draftCase) return;
    const newCases = [draftCase, ...cases];
    setCases(newCases);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newCases));
    setDraftCase(null);
    alert('AI 提取的路基案例已成功校对并归档至经典案例库！');
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-hidden">
      {/* 头部 */}
      <div className="bg-white border-b border-gray-200 px-8 py-6 flex-shrink-0 z-10 shadow-sm">
        <div className="flex items-center space-x-3 mb-2">
            <span className="px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-black tracking-wider rounded border border-blue-100 uppercase">
                路基 AI 知识库引擎
            </span>
        </div>
        <h2 className="text-2xl font-black text-gray-800 flex items-center">
            <BookOpen className="w-7 h-7 mr-3 text-blue-600" />
            经典案例库与大模型知识抽取
        </h2>
        <p className="text-sm text-gray-500 mt-2 max-w-4xl">
            上传路基工程的《弯沉检测报告》、《水毁抢险设计》或《交工总结》PDF。内置大模型将自动抽取出软基特征、沉降指标及注浆/换填工艺，
            构建结构化的路基病害处治语料库，为后续智能决策提供 RAG 真实工程语料支撑。
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-6xl mx-auto space-y-8">
            
            {/* 上传与 AI 抽取区 */}
            {!draftCase && (
                <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-8 text-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    
                    <input type="file" accept=".pdf" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                    
                    {isExtracting ? (
                        <div className="flex flex-col items-center justify-center py-8">
                            <Cpu className="w-16 h-16 text-blue-500 animate-pulse mb-4" />
                            <h3 className="text-xl font-bold text-gray-800 mb-2">大模型正在深度阅读并解析路基文档...</h3>
                            <p className="text-sm text-gray-500 max-w-md">正在提取软基特征、沉降指标及注浆/换填工艺参数，请稍候...</p>
                            <div className="w-64 h-1.5 bg-gray-100 rounded-full mt-6 overflow-hidden">
                                <div className="h-full bg-blue-500 w-1/2 animate-bounce origin-left"></div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-8">
                            <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner">
                                <UploadCloud className="w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">拖拽或点击上传路基工程文档 (PDF)</h3>
                            <p className="text-sm text-gray-500 mb-6 max-w-md">支持弯沉报告、抢险设计、竣工总结。大模型将自动过滤无关文字，提取路基核心参数化指标。</p>
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center"
                            >
                                <Cpu className="w-5 h-5 mr-2" /> 启动 AI 智能知识抽取
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* AI 抽取结果草稿（人工核对） */}
            {draftCase && (
                <div className="bg-blue-50 rounded-2xl border-2 border-blue-200 shadow-md p-1 animate-fade-in">
                    <div className="bg-white rounded-xl p-6">
                        <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                            <h3 className="text-lg font-black text-blue-800 flex items-center">
                                <CheckCircle2 className="w-6 h-6 mr-2 text-green-500" /> AI 信息抽取完成，请核对路基参数 (Human-in-the-loop)
                            </h3>
                            <div className="flex space-x-3">
                                <button onClick={() => setDraftCase(null)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg text-sm font-bold flex items-center">
                                    <X className="w-4 h-4 mr-1" /> 取消
                                </button>
                                <button onClick={handleSaveDraft} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow flex items-center">
                                    <Save className="w-4 h-4 mr-2" /> 确认无误，保存入库
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                            <div className="space-y-4">
                                <div><label className="text-[10px] font-bold text-gray-400 uppercase">工程名称</label><input type="text" className="w-full mt-1 p-2 bg-gray-50 border border-gray-200 rounded font-bold text-gray-800" value={draftCase.projectName} onChange={e => setDraftCase({...draftCase, projectName: e.target.value})} /></div>
                                <div><label className="text-[10px] font-bold text-gray-400 uppercase">地理位置</label><input type="text" className="w-full mt-1 p-2 bg-gray-50 border border-gray-200 rounded text-gray-700" value={draftCase.location} onChange={e => setDraftCase({...draftCase, location: e.target.value})} /></div>
                                <div><label className="text-[10px] font-bold text-gray-400 uppercase">病害类型与诱因</label><textarea className="w-full mt-1 p-2 bg-gray-50 border border-gray-200 rounded text-gray-700 h-20" value={draftCase.disasterType + '\n诱因: ' + draftCase.triggerFactor} onChange={e => setDraftCase({...draftCase, triggerFactor: e.target.value})} /></div>
                            </div>
                            <div className="space-y-4">
                                <div><label className="text-[10px] font-bold text-gray-400 uppercase">核心加固体系 (AI 提取标签)</label>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {draftCase.coreMeasures.map((m, i) => <span key={i} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">{m}</span>)}
                                    </div>
                                </div>
                                <div><label className="text-[10px] font-bold text-gray-400 uppercase mt-2 block">关键工艺参数</label><textarea className="w-full mt-1 p-2 bg-gray-50 border border-gray-200 rounded text-gray-700 font-mono text-xs h-20" value={draftCase.keyParameters} onChange={e => setDraftCase({...draftCase, keyParameters: e.target.value})} /></div>
                                <div><label className="text-[10px] font-bold text-gray-400 uppercase">工程启示与教训</label><textarea className="w-full mt-1 p-2 bg-orange-50 border border-orange-200 rounded text-orange-800 h-16" value={draftCase.lessonsLearned} onChange={e => setDraftCase({...draftCase, lessonsLearned: e.target.value})} /></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 已入库案例列表 */}
            <div className="mt-8">
                <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center border-b pb-2">
                    <Database className="w-5 h-5 mr-2 text-gray-400" /> 已结构化入库的路基工程语料 ({cases.length})
                </h3>
                
                {cases.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">暂无入库语料。上传PDF进行知识抽取。</div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {cases.map((c) => (
                            <div key={c.id} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h4 className="text-lg font-bold text-gray-800 flex items-center">
                                            <FileText className="w-5 h-5 mr-2 text-blue-500" /> {c.projectName}
                                        </h4>
                                        <p className="text-xs text-gray-500 mt-1 flex items-center"><MapPin className="w-3 h-3 mr-1"/> {c.location}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        {c.coreMeasures.map((m, i) => <span key={i} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-[10px] font-bold">{m}</span>)}
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-sm bg-gray-50 p-4 rounded-lg">
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1 flex items-center"><AlertTriangle className="w-3 h-3 mr-1 text-red-400"/> 病害特征</p>
                                        <p className="text-gray-700 line-clamp-3">{c.damageLevel} {c.triggerFactor}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1 flex items-center"><Hammer className="w-3 h-3 mr-1 text-blue-400"/> 加固参数</p>
                                        <p className="text-gray-700 font-mono text-xs line-clamp-3">{c.keyParameters}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1 flex items-center"><Clock className="w-3 h-3 mr-1 text-emerald-400"/> 经济工期</p>
                                        <p className="text-gray-700 line-clamp-3">{c.costAndTime}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default RoadbedClassicCases;
