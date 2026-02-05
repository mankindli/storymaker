import React, { useState, useEffect } from 'react';
import { Scenario, JourneyStep } from '../types';
import { RefreshCw, Play, ArrowRight, User, Flag, MapPin, Eye } from 'lucide-react';

interface ScenarioPlayerProps {
  scenario: Scenario;
  onExit: () => void;
  isPreview?: boolean;
}

export const ScenarioPlayer: React.FC<ScenarioPlayerProps> = ({ scenario, onExit, isPreview = false }) => {
  const [started, setStarted] = useState(false);
  const [userName, setUserName] = useState('');
  const [currentPageId, setCurrentPageId] = useState<string | null>(null);
  const [journey, setJourney] = useState<JourneyStep[]>([]);
  
  // Initialize
  useEffect(() => {
    if (scenario.startPageId) {
      setCurrentPageId(scenario.startPageId);
    }
  }, [scenario]);

  const handleStart = () => {
    if (!userName.trim()) {
        alert("请输入你的名字，冒险者！");
        return;
    }
    setStarted(true);
    
    // Add start page to journey
    const startPage = scenario.pages.find(p => p.id === scenario.startPageId);
    if (startPage) {
        setJourney([{ pageTitle: startPage.title }]);
    }
  };

  const handleChoice = (targetId: string | null, choiceLabel: string) => {
    // 1. Update current step with the choice made
    setJourney(prev => {
        const newJourney = [...prev];
        if (newJourney.length > 0) {
            newJourney[newJourney.length - 1].choiceLabel = choiceLabel;
        }
        return newJourney;
    });

    if (targetId) {
      // 2. Move to next page
      setCurrentPageId(targetId);
      
      const nextPage = scenario.pages.find(p => p.id === targetId);
      if (nextPage) {
         setJourney(prev => [...prev, { pageTitle: nextPage.title }]);
      }
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        // End of the line (handled by rendering logic below)
        setCurrentPageId(null); 
    }
  };

  const handleRestart = () => {
    setStarted(false);
    setJourney([]);
    setCurrentPageId(scenario.startPageId);
    setUserName('');
  };

  const currentPage = scenario.pages.find(p => p.id === currentPageId);

  // Welcome Screen
  if (!started) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center bg-slate-50 p-6 relative">
        {isPreview && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-yellow-100 text-yellow-800 px-4 py-1 rounded-full text-sm font-medium flex items-center gap-2 border border-yellow-200">
                <Eye size={16} /> 预览模式
            </div>
        )}
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-slate-100">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-600">
            <Play size={32} fill="currentColor" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{scenario.name}</h1>
          <p className="text-slate-500 mb-8">{scenario.description || '一个神秘的旅程等待着你...'}</p>
          
          <div className="space-y-4">
            <div className="text-left">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">冒险者姓名</label>
                <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        placeholder="输入你的名字"
                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        onKeyDown={(e) => e.key === 'Enter' && handleStart()}
                    />
                </div>
            </div>
            
            <button 
                onClick={handleStart}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3.5 rounded-lg shadow-md hover:shadow-lg transition-all transform active:scale-95"
            >
                开始冒险
            </button>
            <button 
                onClick={onExit}
                className="text-sm text-slate-400 hover:text-slate-600 underline"
            >
                {isPreview ? '返回编辑器' : '退出'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Final Summary Screen (When no current page is found or explicitly ended)
  if (!currentPage) {
    return (
      <div className="min-h-full bg-slate-50 py-12 px-6">
          <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white p-8 text-center">
                <div className="inline-flex p-3 bg-white/10 rounded-full mb-4">
                    <Flag size={32} />
                </div>
                <h2 className="text-3xl font-bold mb-2">冒险结束！</h2>
                <p className="text-slate-300">{userName}，这是你走过的旅程。</p>
            </div>
            
            <div className="p-8">
                <div className="relative space-y-8 pl-8 before:content-[''] before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                    {journey.map((step, idx) => (
                        <div key={idx} className="relative animate-in slide-in-from-bottom-2 duration-500" style={{animationDelay: `${idx * 100}ms`}}>
                            <div className="absolute -left-[39px] w-5 h-5 rounded-full bg-white border-4 border-indigo-500 z-10"></div>
                            <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                                <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                                    <MapPin size={16} className="text-indigo-500"/> 
                                    {step.pageTitle}
                                </h4>
                                {step.choiceLabel && (
                                    <div className="mt-2 text-sm text-slate-500 bg-white inline-block px-3 py-1 rounded border border-slate-200">
                                        选择了：<span className="font-medium text-slate-700">{step.choiceLabel}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {/* End Node */}
                     <div className="relative">
                        <div className="absolute -left-[39px] w-5 h-5 rounded-full bg-slate-900 border-4 border-slate-200 z-10"></div>
                        <div className="text-sm text-slate-400 font-medium pt-1 italic">剧终</div>
                    </div>
                </div>

                <div className="mt-10 flex gap-3">
                    <button 
                        onClick={handleRestart}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-medium transition-colors"
                    >
                        再玩一次
                    </button>
                    <button 
                        onClick={onExit}
                        className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-600 py-3 rounded-lg font-medium transition-colors"
                    >
                        {isPreview ? '返回编辑器' : '返回主菜单'}
                    </button>
                </div>
            </div>
          </div>
      </div>
    );
  }

  // Gameplay Screen
  const personalizedContent = currentPage.content.replace(/\{name\}/gi, userName);

  return (
    <div className="min-h-full bg-slate-50 overflow-y-auto">
        {/* Sticky Header */}
        <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-3 flex justify-between items-center shadow-sm">
             <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700 text-sm">{scenario.name}</span>
                {isPreview && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded border border-yellow-200">预览</span>}
             </div>
             <button onClick={onExit} className="text-xs font-medium text-slate-500 hover:text-red-500 border border-slate-200 px-3 py-1 rounded-full hover:bg-red-50 transition-colors">
                {isPreview ? '关闭预览' : '退出'}
             </button>
        </div>

        <div className="max-w-2xl mx-auto p-6 pb-24 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            {/* Visual */}
            {currentPage.imageUrl && (
                <div className="rounded-2xl overflow-hidden shadow-lg border border-slate-200 bg-white">
                    <img src={currentPage.imageUrl} alt={currentPage.title} className="w-full h-auto max-h-[400px] object-cover" />
                </div>
            )}

            {/* Narrative */}
            <div className="prose prose-slate prose-lg max-w-none">
                <h2 className="text-3xl font-bold text-slate-900 mb-4">{currentPage.title}</h2>
                <div className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {personalizedContent || (
                        <span className="italic text-slate-400">作者留空了此页...</span>
                    )}
                </div>
            </div>

            {/* Choices Area */}
            <div className="pt-8 space-y-3">
                {currentPage.choices && currentPage.choices.length > 0 ? (
                    currentPage.choices.map((choice) => (
                        <button
                            key={choice.id}
                            onClick={() => handleChoice(choice.targetPageId, choice.label)}
                            className="w-full group relative bg-white hover:bg-indigo-50 border-2 border-slate-200 hover:border-indigo-500 rounded-xl p-4 text-left transition-all shadow-sm hover:shadow-md"
                        >
                            <div className="flex items-center justify-between">
                                <span className="font-semibold text-slate-800 group-hover:text-indigo-700 text-lg">
                                    {choice.label}
                                </span>
                                <ArrowRight className="text-slate-300 group-hover:text-indigo-500 transform group-hover:translate-x-1 transition-all" size={20} />
                            </div>
                        </button>
                    ))
                ) : (
                    <div className="text-center py-12 bg-white rounded-xl border border-slate-200 shadow-sm">
                        <div className="inline-flex p-3 bg-green-100 text-green-600 rounded-full mb-4">
                            <RefreshCw size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">终点已至</h3>
                        <p className="text-slate-500 mb-6">点击继续查看你的旅程总结。</p>
                        <button 
                            onClick={() => handleChoice(null, '已完成')}
                            className="bg-slate-900 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-slate-800 transition-colors"
                        >
                            完成旅程
                        </button>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};