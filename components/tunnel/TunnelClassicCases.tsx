import React, { useState, useRef } from 'react';
import { 
  BookOpen, UploadCloud, Cpu, CheckCircle2, FileText, 
  MapPin, AlertTriangle, Hammer, Clock, Edit3, Database, ChevronRight, HardHat
} from 'lucide-react';

interface TunnelClassicCase {
  id: string;
  projectName: string;
  rockCondition: string;
  depth: string;
  disasterType: string;
  crackFeatures: string;
  coreMeasures: string;
  lessonsLearned: string;
}

const STORAGE_KEY = 'roadbedguard_tunnel_classic_cases';

const TunnelClassicCases: React.FC = () => {
  const [cases, setCases] = useState<TunnelClassicCase[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [{
        id: 'TN-CASE-001', projectName: '某特长隧道 K15+200 断层破碎带坍方处治', rockCondition: 'V级软弱围岩，富水断层',
        depth: '深埋 320m', disasterType: '拱顶大面积坍方，初支钢架扭曲', crackFeatures: '二衬尚未施作，初期支护出现纵向贯通裂缝，最大宽度 5mm',
        coreMeasures: '大管棚超前支护 + 双层 I22b 钢拱架 + 背后高聚物注浆回填', lessonsLearned: '在富水断层带，必须坚持“管超前、严注浆、短进尺、强支护”原则，不能盲目依赖原设计参数。'
    }];
  });
  
  const [isExtracting, setIsExtracting] = useState(false);
  const [draftCase, setDraftCase] = useState<TunnelClassicCase | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setIsExtracting(true);
    
    // 模拟 LLM 结构化抽取过程
    setTimeout(() => {
      setDraftCase({
        id: `TN-CASE-${Date.now()}`,
        projectName: '新上传的隧道检测与处治报告',
        rockCondition: 'IV级围岩，中等风化', depth: '浅埋 15m',
        disasterType: '偏压导致侧墙开裂与拱顶剥落', crackFeatures: '左侧墙存在斜向裂缝，深 180mm；拱顶局部存在 0.5m³ 掉块。',
        coreMeasures: '清理掉块区 + 挂网喷射混凝土 150mm厚 + 背后增设径向注浆系统',
        lessonsLearned: '浅埋偏压段易产生非对称变形，应尽早施作二次衬砌并加强护拱。'
      });
      setIsExtracting(false);
    }, 2000);
  };

  const saveDraft = () => {
    if (draftCase) {
      const newCases = [draftCase, ...cases];
      setCases(newCases);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newCases));
      setDraftCase(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 p-6 overflow-hidden">
      <div className="bg-slate-900 text-white p-8 rounded-xl shadow-lg relative overflow-hidden flex-shrink-0">
        <Cpu className="absolute -bottom-8 -right-8 w-48 h-48 opacity-10 text-emerald-400" />
        <div className="relative z-10 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black flex items-center"><BookOpen className="w-6 h-6 mr-3 text-emerald-400" /> 经典案例大模型抽取 (RAG)</h2>
            <p className="text-slate-400 mt-2 text-sm max-w-2xl">
              上传隧道的《监控量测报告》或《病害处治专项方案》PDF。内置大语言模型将自动提取围岩地质、开裂特征、掉块空洞情况及最终抢险工艺，构建结构化的隧道病害处治语料库。
            </p>
          </div>
          <label className="cursor-pointer bg-emerald-600 hover:bg-emerald-500 px-6 py-3 rounded-lg font-bold shadow-lg transition-colors flex items-center">
            <UploadCloud className="w-5 h-5 mr-2" /> 上传隧道工程报告 (PDF)
            <input type="file" className="hidden" accept=".pdf" onChange={handleFileUpload} />
          </label>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto mt-6">
        {isExtracting && (
          <div className="flex flex-col items-center justify-center py-12 bg-white rounded-xl border border-emerald-100 shadow-sm mb-6 animate-pulse">
            <Cpu className="w-12 h-12 text-emerald-500 mb-4 animate-bounce" />
            <p className="text-emerald-800 font-bold">AI 正在解析隧道勘测与加固图纸...</p>
            <p className="text-xs text-gray-400 mt-2">正在抽取：裂隙特征、深浅埋判别、加固工艺...</p>
          </div>
        )}

        {draftCase && (
          <div className="bg-emerald-50 border-2 border-emerald-400 rounded-xl p-6 shadow-md mb-6 relative">
            <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg">人工校核 (Human-in-the-loop)</div>
            <h3 className="text-emerald-800 font-bold mb-4 flex items-center"><CheckCircle2 className="w-5 h-5 mr-2" /> 抽取成功，请核对入库信息</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
                <input className="col-span-2 border border-emerald-200 p-2 rounded font-bold" value={draftCase.projectName} onChange={e => setDraftCase({...draftCase, projectName: e.target.value})} />
                <input className="border border-emerald-200 p-2 rounded" value={draftCase.rockCondition} onChange={e => setDraftCase({...draftCase, rockCondition: e.target.value})} />
                <input className="border border-emerald-200 p-2 rounded" value={draftCase.depth} onChange={e => setDraftCase({...draftCase, depth: e.target.value})} />
                <textarea className="border border-emerald-200 p-2 rounded" rows={2} value={draftCase.crackFeatures} onChange={e => setDraftCase({...draftCase, crackFeatures: e.target.value})} />
                <textarea className="border border-emerald-200 p-2 rounded" rows={2} value={draftCase.coreMeasures} onChange={e => setDraftCase({...draftCase, coreMeasures: e.target.value})} />
            </div>
            <button onClick={saveDraft} className="mt-4 px-6 py-2 bg-emerald-600 text-white rounded font-bold shadow-md hover:bg-emerald-700">确认无误，保存入库</button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cases.map(c => (
            <div key={c.id} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
              <h4 className="font-black text-slate-800 mb-2 flex items-start">
                <FileText className="w-5 h-5 mr-2 text-emerald-600 flex-shrink-0" /> {c.projectName}
              </h4>
              <div className="flex space-x-2 mb-4">
                  <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded">{c.rockCondition}</span>
                  <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded">{c.depth}</span>
              </div>
              <div className="space-y-3 text-sm">
                  <div>
                      <span className="text-gray-400 text-xs font-bold uppercase">病害与裂隙</span>
                      <p className="text-gray-700 mt-1">{c.crackFeatures}</p>
                  </div>
                  <div>
                      <span className="text-emerald-600 text-xs font-bold uppercase flex items-center"><HardHat className="w-3 h-3 mr-1"/> 核心加固工艺</span>
                      <p className="font-mono text-gray-800 bg-gray-50 p-2 rounded mt-1">{c.coreMeasures}</p>
                  </div>
                  <div className="pt-3 border-t border-gray-100">
                      <span className="text-orange-500 text-xs font-bold uppercase flex items-center"><AlertTriangle className="w-3 h-3 mr-1"/> 经验与教训</span>
                      <p className="text-gray-600 italic mt-1">{c.lessonsLearned}</p>
                  </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
export default TunnelClassicCases;