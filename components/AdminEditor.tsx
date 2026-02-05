import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, MoveRight, Image as ImageIcon, Wand2, ArrowLeft, Settings, Eye, Globe, Share2, ExternalLink, Copy, Upload } from 'lucide-react';
import { Scenario, Page, Choice } from '../types';
import { generatePageContent } from '../services/geminiService';

interface AdminEditorProps {
  scenario: Scenario;
  onSave: (scenario: Scenario) => void;
  onBack: () => void;
  onPreview: (scenario: Scenario) => void;
}

export const AdminEditor: React.FC<AdminEditorProps> = ({ scenario: initialScenario, onSave, onBack, onPreview }) => {
  const [scenario, setScenario] = useState<Scenario>(initialScenario);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(initialScenario.startPageId);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // If no pages exist, create one
  useEffect(() => {
    if (scenario.pages.length === 0) {
      const newPage: Page = {
        id: crypto.randomUUID(),
        title: '起始页',
        content: '欢迎来到冒险世界。点击下方按钮开始。',
        choices: [],
      };
      setScenario(prev => ({ ...prev, pages: [newPage], startPageId: newPage.id }));
      setSelectedPageId(newPage.id);
    }
  }, [scenario.pages.length]);

  const handleAddPage = () => {
    const newPage: Page = {
      id: crypto.randomUUID(),
      title: `第 ${scenario.pages.length + 1} 页`,
      content: '',
      choices: [],
    };
    setScenario(prev => ({ ...prev, pages: [...prev.pages, newPage] }));
    setSelectedPageId(newPage.id);
  };

  const handleDeletePage = (pageId: string) => {
    if (scenario.pages.length <= 1) {
      alert("至少需要保留一个页面。");
      return;
    }
    const newPages = scenario.pages.filter(p => p.id !== pageId);
    let newStartId = scenario.startPageId;
    if (pageId === scenario.startPageId) {
      newStartId = newPages[0].id;
    }
    setScenario(prev => ({ ...prev, pages: newPages, startPageId: newStartId }));
    if (selectedPageId === pageId) {
      setSelectedPageId(newPages[0].id);
    }
  };

  const updatePage = (id: string, updates: Partial<Page>) => {
    setScenario(prev => ({
      ...prev,
      pages: prev.pages.map(p => p.id === id ? { ...p, ...updates } : p)
    }));
  };

  const addChoice = (pageId: string) => {
    const newChoice: Choice = {
      id: crypto.randomUUID(),
      label: '下一个选项',
      targetPageId: null,
    };
    const page = scenario.pages.find(p => p.id === pageId);
    if (page) {
      updatePage(pageId, { choices: [...page.choices, newChoice] });
    }
  };

  const updateChoice = (pageId: string, choiceId: string, updates: Partial<Choice>) => {
    const page = scenario.pages.find(p => p.id === pageId);
    if (!page) return;
    const newChoices = page.choices.map(c => c.id === choiceId ? { ...c, ...updates } : c);
    updatePage(pageId, { choices: newChoices });
  };

  const deleteChoice = (pageId: string, choiceId: string) => {
    const page = scenario.pages.find(p => p.id === pageId);
    if (!page) return;
    updatePage(pageId, { choices: page.choices.filter(c => c.id !== choiceId) });
  };

  const handleChoiceTargetChange = (choiceId: string, value: string) => {
    if (!selectedPageId) return;

    if (value === 'create_new') {
        const newPageId = crypto.randomUUID();
        const newPage: Page = {
            id: newPageId,
            title: `第 ${scenario.pages.length + 1} 页`,
            content: '',
            choices: [],
        };
        
        setScenario(prev => {
            // Update current page choice to point to new page
            const updatedPages = prev.pages.map(p => {
                if (p.id === selectedPageId) {
                    return {
                        ...p,
                        choices: p.choices.map(c => c.id === choiceId ? { ...c, targetPageId: newPageId } : c)
                    };
                }
                return p;
            });
            
            // Return state with updated pages plus the new page
            return {
                ...prev,
                pages: [...updatedPages, newPage]
            };
        });
    } else {
        updateChoice(selectedPageId, choiceId, { targetPageId: value });
    }
  };

  const handleMagicGenerate = async (page: Page) => {
    if (!page.title) {
        alert("请先给页面起个标题。");
        return;
    }
    setIsGenerating(true);
    try {
        const result = await generatePageContent(page.title, scenario.description);
        if (result) {
            updatePage(page.id, { 
                content: result.content,
                imageUrl: `https://picsum.photos/seed/${encodeURIComponent(page.title)}/800/400`
            });
        }
    } catch (e) {
        alert("生成内容失败，请检查 API Key。");
    } finally {
        setIsGenerating(false);
    }
  };

  const handleImageUpload = (file: File) => {
    if (!file || !selectedPageId) return;
    
    if (!file.type.startsWith('image/')) {
        alert('请上传图片文件');
        return;
    }

    if (file.size > 2 * 1024 * 1024) {
        alert('图片大小不能超过 2MB');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const result = e.target?.result as string;
        updatePage(selectedPageId, { imageUrl: result });
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          handleImageUpload(e.dataTransfer.files[0]);
      }
  };
  
  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
  };

  const handlePublish = () => {
    const updated = { ...scenario, isPublished: true };
    setScenario(updated);
    onSave(updated);
    setShowShareModal(true);
  };

  const handlePreviewClick = () => {
    onSave(scenario);
    onPreview(scenario);
  };

  const getShareLink = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('play', scenario.id);
    return url.toString();
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(getShareLink());
    alert("链接已复制到剪贴板！");
  };

  const selectedPage = scenario.pages.find(p => p.id === selectedPageId);

  return (
    <div className="flex flex-col h-full bg-slate-100 relative">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
            <ArrowLeft size={20} />
          </button>
          <div>
            <input 
               value={scenario.name}
               onChange={(e) => setScenario(prev => ({...prev, name: e.target.value}))}
               className="text-xl font-bold text-slate-800 bg-transparent outline-none focus:ring-2 focus:ring-blue-100 rounded px-1 -ml-1"
               placeholder="剧本名称"
            />
            <p className="text-xs text-slate-500 flex items-center gap-2">
                {scenario.pages.length} 页
                {scenario.isPublished && <span className="text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full font-medium">已发布</span>}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={handlePreviewClick}
                className="flex items-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg font-medium transition-colors"
                title="预览用户看到的界面"
            >
                <Eye size={18} />
                预览
            </button>
            <button 
                onClick={handlePublish}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors text-white ${scenario.isPublished ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-900 hover:bg-slate-800'}`}
            >
                {scenario.isPublished ? <Share2 size={18} /> : <Globe size={18} />}
                {scenario.isPublished ? '分享' : '发布'}
            </button>
            <button 
                onClick={() => onSave(scenario)}
                className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"
                title="保存草稿"
            >
                <Save size={20} />
            </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-72 bg-white border-r border-slate-200 flex flex-col">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
             <button 
                onClick={handleAddPage}
                className="w-full flex items-center justify-center gap-2 py-2 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:border-blue-500 hover:text-blue-600 transition-all font-medium"
             >
                <Plus size={16} /> 新建页面
             </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {scenario.pages.map(page => (
                <button
                    key={page.id}
                    onClick={() => setSelectedPageId(page.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg flex items-center justify-between group transition-all ${
                        selectedPageId === page.id 
                        ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm ring-1 ring-blue-200' 
                        : 'hover:bg-slate-50 text-slate-600'
                    }`}
                >
                    <span className="truncate font-medium text-sm">{page.title}</span>
                    {scenario.startPageId === page.id && (
                        <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded uppercase font-bold tracking-wide">起点</span>
                    )}
                </button>
            ))}
          </div>
        </div>

        {/* Editor Canvas */}
        <div className="flex-1 overflow-y-auto bg-slate-50/50 p-8">
            {selectedPage ? (
                <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
                    
                    {/* Page Settings */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                <Settings size={18} className="text-slate-400"/>
                                页面配置
                            </h2>
                            <div className="flex items-center gap-2">
                                {scenario.startPageId !== selectedPage.id && (
                                    <button 
                                        onClick={() => setScenario(prev => ({...prev, startPageId: selectedPage.id}))}
                                        className="text-xs font-medium text-slate-500 hover:text-blue-600 px-3 py-1.5 rounded-md hover:bg-blue-50 transition-colors"
                                    >
                                        设为起始页
                                    </button>
                                )}
                                <button 
                                    onClick={() => handleDeletePage(selectedPage.id)}
                                    className="text-red-500 hover:bg-red-50 p-2 rounded-md transition-colors"
                                    title="删除页面"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">页面标题</label>
                            <input 
                                type="text" 
                                value={selectedPage.title}
                                onChange={(e) => updatePage(selectedPage.id, { title: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
                                placeholder="例如：黑暗洞穴"
                            />
                        </div>
                    </div>

                    {/* Content */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4 relative overflow-hidden">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                <ImageIcon size={18} className="text-slate-400"/>
                                内容
                            </h2>
                            <button 
                                onClick={() => handleMagicGenerate(selectedPage)}
                                disabled={isGenerating}
                                className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full font-medium transition-all ${
                                    isGenerating 
                                    ? 'bg-slate-100 text-slate-400 cursor-wait'
                                    : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                                }`}
                            >
                                <Wand2 size={14} className={isGenerating ? "animate-spin" : ""} />
                                {isGenerating ? '生成中...' : 'AI 生成'}
                            </button>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">图片</label>
                            
                            {!selectedPage.imageUrl ? (
                                <div 
                                    className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-all cursor-pointer ${
                                        isDragging 
                                        ? 'border-blue-500 bg-blue-50' 
                                        : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
                                    }`}
                                    onDrop={handleDrop}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onClick={() => document.getElementById('image-upload')?.click()}
                                >
                                    <input 
                                        type="file" 
                                        id="image-upload" 
                                        className="hidden" 
                                        accept="image/*"
                                        onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                                    />
                                    <div className={`p-4 rounded-full mb-3 ${isDragging ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                                        <Upload size={24} />
                                    </div>
                                    <p className="text-sm font-medium text-slate-700">点击或拖拽上传图片</p>
                                    <p className="text-xs text-slate-400 mt-1 mb-4">支持 JPG, PNG (最大 2MB)</p>
                                    
                                    <div className="w-full max-w-xs flex items-center gap-3">
                                        <div className="h-px bg-slate-200 flex-1"></div>
                                        <span className="text-xs text-slate-400">或</span>
                                        <div className="h-px bg-slate-200 flex-1"></div>
                                    </div>

                                    <input 
                                        type="text" 
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={(e) => updatePage(selectedPage.id, { imageUrl: e.target.value })}
                                        className="mt-4 w-full max-w-sm px-3 py-2 text-sm rounded-lg border border-slate-200 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300"
                                        placeholder="粘贴图片链接..."
                                    />
                                </div>
                            ) : (
                                <div className="relative rounded-xl overflow-hidden border border-slate-200 group bg-slate-50">
                                    <img src={selectedPage.imageUrl} alt="预览" className="w-full h-64 object-contain" />
                                    
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-3 backdrop-blur-sm">
                                         <button 
                                            onClick={() => updatePage(selectedPage.id, { imageUrl: '' })}
                                            className="bg-white text-red-600 px-4 py-2 rounded-lg font-medium hover:bg-red-50 transition-colors shadow-lg flex items-center gap-2"
                                        >
                                            <Trash2 size={18} /> 移除图片
                                        </button>
                                    </div>
                                    
                                    {!selectedPage.imageUrl.startsWith('data:') && (
                                        <div className="absolute bottom-0 inset-x-0 bg-white/90 p-2 border-t border-slate-200 text-xs text-slate-500 truncate px-4">
                                            🔗 {selectedPage.imageUrl}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">故事文本</label>
                            <textarea 
                                value={selectedPage.content}
                                onChange={(e) => updatePage(selectedPage.id, { content: e.target.value })}
                                className="w-full h-32 px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                placeholder="描述场景..."
                            />
                        </div>
                    </div>

                    {/* Choices */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                <MoveRight size={18} className="text-slate-400"/>
                                用户选项
                            </h2>
                            <button 
                                onClick={() => addChoice(selectedPage.id)}
                                className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:bg-blue-50 px-3 py-1.5 rounded-md transition-colors"
                            >
                                <Plus size={16} /> 添加选项
                            </button>
                        </div>

                        <div className="space-y-3">
                            {selectedPage.choices.length === 0 && (
                                <div className="text-center py-6 text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                                    未定义选项。这将是结局页面。
                                </div>
                            )}
                            {selectedPage.choices.map((choice, idx) => (
                                <div key={choice.id} className="flex gap-3 items-start bg-slate-50 p-3 rounded-lg border border-slate-200 group">
                                    <div className="pt-3 text-slate-400 text-xs font-mono">{idx + 1}</div>
                                    <div className="flex-1 space-y-2">
                                        <input 
                                            type="text" 
                                            value={choice.label}
                                            onChange={(e) => updateChoice(selectedPage.id, choice.id, { label: e.target.value })}
                                            className="w-full px-3 py-1.5 text-sm rounded border border-slate-300 focus:border-blue-500 outline-none"
                                            placeholder="按钮文字"
                                        />
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-slate-500 whitespace-nowrap">跳转至：</span>
                                            <select 
                                                value={choice.targetPageId || ''}
                                                onChange={(e) => handleChoiceTargetChange(choice.id, e.target.value)}
                                                className="w-full px-3 py-1.5 text-sm rounded border border-slate-300 bg-white focus:border-blue-500 outline-none"
                                            >
                                                <option value="">-- 选择页面 --</option>
                                                <option value="create_new" className="text-blue-600 font-bold bg-blue-50">+ 创建新页面</option>
                                                {scenario.pages.map(p => (
                                                    <option key={p.id} value={p.id}>{p.title} {p.id === selectedPage.id ? '(当前)' : ''}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => deleteChoice(selectedPage.id, choice.id)}
                                        className="text-slate-400 hover:text-red-500 p-1 rounded hover:bg-red-50 mt-1"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                    <Settings size={48} className="mb-4 opacity-20" />
                    <p>从侧边栏选择一个页面进行编辑。</p>
                </div>
            )}
        </div>

        {/* Share Modal */}
        {showShareModal && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in zoom-in-50 duration-200">
                    <h3 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
                        <Globe className="text-green-600" />
                        剧本已发布！
                    </h3>
                    <p className="text-slate-600 mb-4">你的剧本已准备好分享。拥有此链接的任何人都可以游玩。</p>
                    
                    <div className="bg-slate-100 p-3 rounded-lg border border-slate-200 flex items-center gap-2 mb-4">
                        <div className="flex-1 truncate text-sm text-slate-600 font-mono">
                            {getShareLink()}
                        </div>
                        <button onClick={copyToClipboard} className="text-blue-600 hover:text-blue-700">
                            <Copy size={18} />
                        </button>
                    </div>

                    <div className="bg-yellow-50 text-yellow-800 text-xs p-3 rounded-lg mb-6">
                        <strong>注意：</strong> 由于这是演示版本，此链接仅在存储数据的当前设备/浏览器上有效。
                    </div>

                    <div className="flex justify-end gap-2">
                        <button 
                            onClick={() => setShowShareModal(false)}
                            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                        >
                            关闭
                        </button>
                        <a 
                            href={getShareLink()} 
                            target="_blank" 
                            rel="noreferrer"
                            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
                        >
                            <ExternalLink size={16} /> 打开链接
                        </a>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};