import React, { useState, useEffect } from 'react';
import { Plus, Edit, Play, Trash2, Layout, BookOpen, Globe } from 'lucide-react';
import { Scenario } from './types';
import { AdminEditor } from './components/AdminEditor';
import { ScenarioPlayer } from './components/ScenarioPlayer';

function App() {
  const [mode, setMode] = useState<'dashboard' | 'editor' | 'player'>('dashboard');
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('storyflow_scenarios');
    if (saved) {
      try {
        setScenarios(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse scenarios", e);
      }
    }
  }, []);

  // Check URL params for shared links
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const playId = params.get('play');
    if (playId && scenarios.length > 0) {
        const target = scenarios.find(s => s.id === playId);
        if (target) {
            setActiveScenarioId(playId);
            setMode('player');
        } else {
            console.warn("未找到链接中的剧本（本地存储限制）");
        }
    }
  }, [scenarios]);

  // Save to local storage whenever scenarios change
  useEffect(() => {
    localStorage.setItem('storyflow_scenarios', JSON.stringify(scenarios));
  }, [scenarios]);

  const handleCreateScenario = () => {
    const newScenario: Scenario = {
      id: crypto.randomUUID(),
      name: '新的冒险',
      description: '一个等待书写的惊险故事。',
      pages: [],
      startPageId: null,
      createdAt: Date.now(),
    };
    setScenarios([newScenario, ...scenarios]);
    setActiveScenarioId(newScenario.id);
    setIsPreviewMode(false);
    setMode('editor');
  };

  const handleSaveScenario = (updated: Scenario) => {
    setScenarios(prev => prev.map(s => s.id === updated.id ? updated : s));
  };

  const handleDeleteScenario = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('确定要删除这个故事吗？此操作无法撤销。')) {
      setScenarios(scenarios.filter(s => s.id !== id));
    }
  };

  const handlePreview = (scenario: Scenario) => {
    // Save first to ensure consistency
    handleSaveScenario(scenario);
    setActiveScenarioId(scenario.id);
    setIsPreviewMode(true);
    setMode('player');
  };

  const activeScenario = scenarios.find(s => s.id === activeScenarioId);

  // --- RENDER MODES ---

  if (mode === 'editor' && activeScenario) {
    return (
      <AdminEditor 
        scenario={activeScenario} 
        onSave={handleSaveScenario} 
        onBack={() => setMode('dashboard')}
        onPreview={handlePreview}
      />
    );
  }

  if (mode === 'player' && activeScenario) {
    return (
      <ScenarioPlayer 
        scenario={activeScenario} 
        onExit={() => {
            if (isPreviewMode) {
                setMode('editor');
                setIsPreviewMode(false);
            } else {
                setMode('dashboard');
                // Clear URL param if it exists
                const url = new URL(window.location.href);
                if (url.searchParams.has('play')) {
                    url.searchParams.delete('play');
                    window.history.pushState({}, '', url);
                }
            }
        }} 
        isPreview={isPreviewMode}
      />
    );
  }

  // --- DASHBOARD MODE ---
  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-600">
            <Layout size={28} strokeWidth={2.5} />
            <span className="text-xl font-bold tracking-tight text-slate-900">故事流</span>
          </div>
          <button 
            onClick={handleCreateScenario}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-full font-medium transition-all shadow-sm hover:shadow-md active:scale-95"
          >
            <Plus size={18} />
            创建故事
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">你的故事库</h1>
          <p className="text-slate-500">管理你的互动模板或游玩现有故事。</p>
        </div>

        {scenarios.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200">
            <div className="inline-flex p-4 bg-slate-50 rounded-full mb-4 text-slate-400">
                <BookOpen size={48} />
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">暂无故事</h3>
            <p className="text-slate-500 mb-6 max-w-sm mx-auto">开始创建你的第一个互动情景模板吧。这很简单！</p>
            <button 
                onClick={handleCreateScenario}
                className="text-indigo-600 font-medium hover:underline"
            >
                立即创建一个新故事 &rarr;
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {scenarios.map(scenario => (
              <div 
                key={scenario.id} 
                className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-lg transition-all overflow-hidden group flex flex-col"
              >
                <div className="p-6 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                        <BookOpen size={20} />
                    </div>
                    <div className="flex gap-2">
                        {scenario.isPublished && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium flex items-center gap-1">
                                <Globe size={12} /> 已发布
                            </span>
                        )}
                        <button 
                            onClick={(e) => handleDeleteScenario(e, scenario.id)}
                            className="text-slate-300 hover:text-red-500 transition-colors p-1"
                            title="删除故事"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold text-slate-900 mb-2 line-clamp-1">{scenario.name}</h3>
                  <p className="text-slate-500 text-sm line-clamp-2 mb-4 h-10">{scenario.description}</p>
                  
                  <div className="flex items-center gap-4 text-xs text-slate-400 font-medium">
                    <span>{scenario.pages.length} 页</span>
                    <span>•</span>
                    <span>{new Date(scenario.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="border-t border-slate-100 p-4 bg-slate-50/50 flex gap-3">
                    <button 
                        onClick={() => {
                            setActiveScenarioId(scenario.id);
                            setIsPreviewMode(false);
                            setMode('editor');
                        }}
                        className="flex-1 flex items-center justify-center gap-2 bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 text-slate-700 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm"
                    >
                        <Edit size={16} /> 编辑
                    </button>
                    <button 
                        onClick={() => {
                            if (!scenario.startPageId) {
                                alert("这个故事没有起始页。请先编辑！");
                                return;
                            }
                            setActiveScenarioId(scenario.id);
                            setIsPreviewMode(false);
                            setMode('player');
                        }}
                        className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-semibold transition-all shadow-sm"
                    >
                        <Play size={16} /> 游玩
                    </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;