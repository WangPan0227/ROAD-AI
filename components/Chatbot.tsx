import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, AlertCircle } from 'lucide-react';
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import Markdown from 'react-markdown';
import { DISEASES, REINFORCEMENT_MEASURES, CASE_STUDIES, HISTORICAL_CASES, INDICATORS } from '../constants';

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
}

const Chatbot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: '1', 
      role: 'model', 
      content: '您好！我是 RoadbedGuard 智能问答助手。我已经学习了系统内的**路基病害图谱**、**加固措施库**、**经典案例库**等专业资料。请问有什么我可以帮您的？' 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const chatRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const appData = {
        diseases: DISEASES,
        measures: REINFORCEMENT_MEASURES,
        cases: CASE_STUDIES,
        historicalCases: HISTORICAL_CASES,
        indicators: INDICATORS
      };

      const systemInstruction = `你是一个名为"RoadbedGuard 智能问答助手"的AI专家。
你的任务是协助用户解答关于公路路基养护、病害诊断、加固措施和历史案例的问题。
请基于以下应用内置的专业数据进行回答：
${JSON.stringify(appData, null, 2)}

回答要求：
1. 如果用户问的问题超出了这些数据范围，你可以结合你的通用知识进行解答，但请优先参考内置数据。
2. 请用专业、简洁、友好的中文回答。
3. 请使用Markdown格式排版，例如使用加粗、列表等使内容更易读。
4. 如果用户询问具体的病害特征或加固措施，请直接引用内置数据中的信息。`;

      chatRef.current = ai.chats.create({
        model: "gemini-3.1-pro-preview",
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        }
      });
    } catch (err) {
      console.error("Failed to initialize Gemini AI:", err);
      setError("AI 初始化失败，请检查 API Key 配置。");
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading || !chatRef.current) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    const modelMessageId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: modelMessageId, role: 'model', content: '' }]);

    try {
      const responseStream = await chatRef.current.sendMessageStream({ message: userMessage.content });
      for await (const chunk of responseStream) {
        const c = chunk as GenerateContentResponse;
        if (c.text) {
          setMessages(prev => prev.map(msg => 
            msg.id === modelMessageId 
              ? { ...msg, content: msg.content + c.text }
              : msg
          ));
        }
      }
    } catch (err) {
      console.error('Chatbot error:', err);
      setMessages(prev => [...prev, { 
        id: (Date.now() + 2).toString(), 
        role: 'model', 
        content: '抱歉，系统遇到了一些问题，无法完成您的请求。请稍后再试。' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center shadow-sm">
        <Bot className="w-6 h-6 mr-3 text-blue-600" />
        <div>
          <h2 className="text-xl font-bold text-gray-800">智能问答助手 (AI Chatbot)</h2>
          <p className="text-xs text-gray-500 mt-1">基于 Gemini 3.1 Pro 模型，为您提供专业的路基养护解答</p>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 p-3 flex items-center text-red-600 text-sm">
          <AlertCircle className="w-4 h-4 mr-2" />
          {error}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-blue-600 ml-3' : 'bg-emerald-600 mr-3'}`}>
                {msg.role === 'user' ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-white" />}
              </div>
              <div className={`p-4 rounded-2xl shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'}`}>
                {msg.role === 'user' ? (
                  <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
                ) : (
                  <div className="markdown-body">
                    <Markdown>{msg.content}</Markdown>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex max-w-[80%] flex-row">
              <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-emerald-600 mr-3">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="p-4 rounded-2xl shadow-sm bg-white border border-gray-200 text-gray-800 rounded-tl-none flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                <span className="text-sm text-gray-500">AI 正在思考...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="max-w-4xl mx-auto relative flex items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="输入您的问题，例如：'路基开裂滑移有哪些特征？' 或 '推荐一种处理冻胀翻浆的加固措施'"
            className="w-full bg-gray-50 border border-gray-300 rounded-xl py-3 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none max-h-32 min-h-[48px] text-sm"
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading || !chatRef.current}
            className="absolute right-2 bottom-2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <div className="text-center mt-2 text-[10px] text-gray-400">
          AI 可能会产生不准确的信息，请结合实际工程情况进行判断。
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
