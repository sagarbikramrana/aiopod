import React, { useState, useRef, useEffect } from 'react';
import { generateDesignWithFallback } from '../services/aiService';
import { enhancePrompt } from '../services/gemini';
import { getStyles, CategorizedStyles, getSavedPrompts, addSavedPrompt, removeSavedPrompt } from '../services/storage';
import { GalleryItem, AIModel, SavedPrompt } from '../types';
import { Loader2, Sparkles, AlertCircle, Wand2, History, Upload, X, Palette, Grid, Plus, Trash2, ChevronDown, Cpu, Edit3, Repeat, CircleDot, Monitor, Smartphone, Square as SquareIcon, Bookmark, BookOpen, Clock } from 'lucide-react';

interface GeneratorProps {
  onImageGenerated: (url: string, mode: 'default' | 'pattern' | 'sticker', promptUsed: string) => void;
  gallery: GalleryItem[];
  onSelectFromGallery: (item: GalleryItem) => void;
}

const BG_PRESETS = [
  { name: 'Pure White', color: 'WHITE' },
  { name: 'Dark Ink', color: 'BLACK' },
  { name: 'Chroma Key', color: 'NEON GREEN' },
  { name: 'Sky Blue', color: 'BRIGHT BLUE' }
];

const Generator: React.FC<GeneratorProps> = ({ onImageGenerated, gallery, onSelectFromGallery }) => {
  const [prompt, setPrompt] = useState('');
  const [categorizedStyles, setCategorizedStyles] = useState<CategorizedStyles>({});
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [bgColor, setBgColor] = useState('WHITE');
  const [loading, setLoading] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<AIModel>('gemini');
  const [genMode, setGenMode] = useState<'default' | 'pattern' | 'sticker'>('default');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '3:4' | '4:3'>('1:1');
  const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>([]);
  const [showLibrary, setShowLibrary] = useState(false);
  const [refImage, setRefImage] = useState<string | null>(null);
  const [refImageBase64, setRefImageBase64] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCategorizedStyles(getStyles());
    setSavedPrompts(getSavedPrompts());
  }, []);

  const handleEnhance = async () => {
    if (!prompt.trim()) return;
    setEnhancing(true);
    setError(null);
    try {
      const betterPrompt = await enhancePrompt(prompt, selectedStyles, bgColor, aspectRatio);
      setPrompt(betterPrompt);
    } catch (e: any) { setError(e.message || "Enhancement failed"); }
    finally { setEnhancing(false); }
  };

  const handleSavePrompt = () => {
    if (!prompt.trim()) return;
    const updated = addSavedPrompt(prompt);
    setSavedPrompts(updated);
  };

  const handleGenerate = async () => {
    if (!prompt.trim() && !refImageBase64) return;
    setLoading(true);
    setError(null);
    try {
      const styleString = selectedStyles.length > 0 ? selectedStyles.join(', ') : "None";
      const result = await generateDesignWithFallback(prompt || "Design", styleString, bgColor, refImageBase64 || undefined, selectedModel, genMode, aspectRatio);
      onImageGenerated(result.url, genMode, prompt);
    } catch (err: any) { setError(err.message || "Generation failed"); }
    finally { setLoading(false); }
  };

  const toggleStyle = (s: string) => {
    if (s === 'None') { setSelectedStyles([]); return; }
    setSelectedStyles(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setRefImage(URL.createObjectURL(file));
      const reader = new FileReader();
      reader.onload = (ev) => { if (ev.target?.result) setRefImageBase64(ev.target.result as string); };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 min-h-full">
      {/* Sidebar Gallery */}
      <div className="flex lg:flex-col w-full lg:w-48 shrink-0 bg-zinc-900/30 backdrop-blur-md rounded-3xl border border-zinc-800/60 p-4 overflow-x-auto lg:overflow-y-auto no-scrollbar studio-glass shadow-2xl">
        <h3 className="hidden lg:flex text-[10px] font-black text-zinc-500 mb-6 items-center gap-2 uppercase tracking-widest pl-1"><History size={14} /> Recent Designs</h3>
        <div className="flex lg:flex-col gap-3">
          <button onClick={() => setShowLibrary(!showLibrary)} className={`shrink-0 w-16 h-16 lg:w-full lg:aspect-square rounded-2xl overflow-hidden border-2 flex flex-col items-center justify-center gap-2 transition-all active:scale-95 ${showLibrary ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-700'}`}>
            <BookOpen size={20} />
            <span className="text-[8px] font-black uppercase tracking-widest">Library</span>
          </button>
          {gallery.map((item, i) => (
            <button key={i} onClick={() => { setPrompt(item.prompt); onSelectFromGallery(item); }} className="shrink-0 w-16 h-16 lg:w-full lg:aspect-square rounded-2xl overflow-hidden border-2 border-zinc-800 hover:border-indigo-500 transition-all active:scale-95 group relative shadow-md">
              <img src={item.url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
              <div className="absolute inset-0 bg-indigo-950/80 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                <Edit3 size={16} className="text-white" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Studio Console */}
      <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full space-y-8 py-2">
        {showLibrary ? (
          <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[2rem] shadow-2xl animate-fade-in h-full flex flex-col studio-glass">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black flex items-center gap-3 text-indigo-400 uppercase tracking-tighter italic"><BookOpen size={24} /> Prompt Vault</h2>
              <button onClick={() => setShowLibrary(false)} className="p-3 bg-zinc-950 border border-zinc-800 hover:bg-zinc-800 rounded-2xl text-zinc-400 transition-all"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4 pr-3 no-scrollbar">
              {savedPrompts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-zinc-700 gap-4 grayscale opacity-50">
                  <Bookmark size={56} className="stroke-[1px]" />
                  <p className="text-xs font-black uppercase tracking-widest">Vault is empty</p>
                </div>
              ) : savedPrompts.map(sp => (
                <div key={sp.id} className="bg-zinc-950/50 p-5 rounded-2xl border border-zinc-800/80 group hover:border-indigo-500/40 transition-all relative glow-border">
                  <p className="text-xs text-zinc-300 leading-relaxed font-medium mb-4">{sp.text}</p>
                  <div className="flex items-center justify-between pt-4 border-t border-zinc-900">
                    <span className="text-[9px] text-zinc-600 font-black flex items-center gap-2 uppercase"><Clock size={12} /> {new Date(sp.timestamp).toLocaleDateString()}</span>
                    <div className="flex gap-2">
                      <button onClick={() => { setPrompt(sp.text); setShowLibrary(false); }} className="px-5 py-2 bg-indigo-600 text-white text-[9px] font-black rounded-xl hover:bg-indigo-500 transition-all uppercase tracking-widest shadow-lg">Restore</button>
                      <button onClick={() => setSavedPrompts(removeSavedPrompt(sp.id))} className="p-2 text-zinc-600 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="text-center space-y-3">
              <h2 className="text-4xl sm:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-br from-white to-zinc-500 tracking-tighter italic uppercase">ART ENGINE</h2>
              <div className="flex items-center justify-center gap-3">
                <div className="h-px w-8 bg-indigo-500/40" />
                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em]">Proprietary AI Synthesis</p>
                <div className="h-px w-8 bg-indigo-500/40" />
              </div>
            </div>

            <div className="bg-zinc-900/40 border border-zinc-800/60 p-6 sm:p-8 rounded-[2.5rem] shadow-2xl space-y-8 studio-glass">
              {/* Mode Selection */}
              <div className="grid grid-cols-3 gap-3 bg-zinc-950/80 p-1.5 rounded-2xl border border-zinc-800 shadow-inner">
                {[
                  { id: 'default', label: 'Graphic', icon: <Sparkles size={14} /> },
                  { id: 'pattern', label: 'Seamless', icon: <Repeat size={14} /> },
                  { id: 'sticker', label: 'Die-Cut', icon: <CircleDot size={14} /> }
                ].map(m => (
                  <button key={m.id} onClick={() => setGenMode(m.id as any)} className={`flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${genMode === m.id ? 'bg-indigo-600 text-white shadow-xl scale-[1.02]' : 'text-zinc-500 hover:text-zinc-300'}`}>
                    {m.icon} {m.label}
                  </button>
                ))}
              </div>

              {/* Aspect Ratio & Controls */}
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Canvas Orientation</label>
                  <div className="flex gap-2 w-full sm:w-auto">
                    {[
                      { id: '3:4', icon: <Smartphone size={14} />, label: 'Portrait' },
                      { id: '1:1', icon: <SquareIcon size={14} />, label: 'Square' },
                      { id: '4:3', icon: <Monitor size={14} />, label: 'Wide' }
                    ].map(opt => (
                      <button key={opt.id} onClick={() => setAspectRatio(opt.id as any)} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black border-2 transition-all active:scale-95 uppercase tracking-widest ${aspectRatio === opt.id ? 'bg-white text-black border-white shadow-xl' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-700'}`}>
                        {opt.icon} {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative group">
                  <div className="flex justify-between items-center mb-3 px-1">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Core Concept</label>
                    <div className="flex gap-4">
                      <button onClick={handleEnhance} disabled={enhancing || !prompt} className="text-[9px] font-black flex items-center gap-2 text-indigo-400 hover:text-indigo-300 disabled:opacity-30 uppercase tracking-widest transition-colors">
                        {enhancing ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />} Optimize
                      </button>
                      <button onClick={handleSavePrompt} disabled={!prompt.trim()} className="text-[9px] font-black flex items-center gap-2 text-zinc-500 hover:text-white disabled:opacity-30 uppercase tracking-widest transition-colors">
                        <Bookmark size={12} /> Vault
                      </button>
                    </div>
                  </div>

                  {refImage && (
                    <div className="relative w-full h-32 bg-zinc-950 border-2 border-dashed border-zinc-800 rounded-2xl overflow-hidden mb-4 group/img transition-all hover:border-indigo-500/50">
                      <img src={refImage} className="w-full h-full object-contain p-2" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 transition-all flex items-center justify-center gap-4">
                        <button onClick={() => onImageGenerated(refImageBase64!, 'default', 'Upload')} className="px-6 py-2.5 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest shadow-2xl hover:bg-zinc-200 active:scale-95 transition-all">Quick Edit</button>
                        <button onClick={() => { setRefImage(null); setRefImageBase64(null); }} className="p-2.5 bg-red-600/20 text-red-500 hover:bg-red-600 hover:text-white rounded-xl shadow-2xl transition-all"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  )}

                  <textarea
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-[1.5rem] p-5 text-sm text-white placeholder-zinc-700 focus:border-indigo-500 outline-none h-32 resize-none transition-all shadow-inner font-medium leading-relaxed"
                    placeholder={genMode === 'pattern' ? "Describe repeating motifs..." : "Enter technical creative prompt..."}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                  />

                  <div className="absolute right-4 bottom-4 flex items-center gap-3">
                    <button onClick={() => fileInputRef.current?.click()} className="p-3 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-xl text-zinc-400 hover:text-white transition-all shadow-xl active:scale-90">
                      <Upload size={16} />
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleUpload} />
                  </div>
                </div>
              </div>

              {/* Style Fusion Selector */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2"><Grid size={14} /> Style Fusion</label>
                  {selectedStyles.length > 0 && <button onClick={() => toggleStyle('None')} className="text-[9px] font-black text-red-500 hover:text-red-400 transition-colors uppercase tracking-widest">Reset Styles</button>}
                </div>
                <div className="flex flex-wrap gap-2 min-h-[42px] p-2 bg-zinc-950/50 rounded-2xl border border-zinc-800/60 shadow-inner">
                  {selectedStyles.length === 0 ? (
                    <span className="text-[10px] text-zinc-700 italic px-2 py-1">Apply curated artist styles...</span>
                  ) : selectedStyles.map(s => (
                    <div key={s} className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-[9px] font-black flex items-center gap-2 border border-indigo-400 shadow-md animate-fade-in uppercase tracking-wider">
                      {s} <button onClick={() => toggleStyle(s)} className="hover:text-red-300"><X size={12} /></button>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-1 no-scrollbar pt-1">
                  {Object.entries(categorizedStyles).map(([cat, styles]) => (
                    <div key={cat} className="space-y-1">
                      <div className="relative group/select">
                        <select
                          onChange={(e) => { if (e.target.value) toggleStyle(e.target.value); e.target.value = ''; }}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-[10px] font-bold text-zinc-400 outline-none hover:border-zinc-600 focus:border-indigo-500 transition-all appearance-none cursor-pointer uppercase tracking-widest"
                        >
                          <option value="">{cat}</option>
                          {(styles as string[]).map(s => <option key={s} value={s} disabled={selectedStyles.includes(s)} className="bg-zinc-900 text-zinc-200">{s}</option>)}
                        </select>
                        <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-600 group-hover/select:text-white transition-colors" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Config */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-zinc-800/80">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">Primary Backdrop</label>
                  <div className="flex gap-2">
                    {BG_PRESETS.map((bg) => (
                      <button
                        key={bg.color}
                        onClick={() => setBgColor(bg.color)}
                        className={`flex-1 py-2.5 rounded-xl border-2 text-[8px] font-black uppercase tracking-widest transition-all active:scale-95 ${bgColor === bg.color ? 'bg-white text-black border-white shadow-xl scale-105' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600'}`}
                      >
                        {bg.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">Processor</label>
                  <div className="relative group/select">
                    <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value as any)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-[10px] font-black text-zinc-300 outline-none focus:border-indigo-500 cursor-pointer uppercase tracking-widest appearance-none">
                      <option value="gemini">Gemini Standard (Free Tier)</option>
                      <option value="nano-banana">Banana Flash (High Quota)</option>
                      <option value="nano-banana-pro">Banana Pro (Premium Quality)</option>
                      <option value="flux">FLUX Neural Engine</option>
                      <option value="dalle">OpenAI DALL-E 3</option>
                      <option value="sdxl">Stable Diffusion XL</option>
                    </select>
                    <Cpu size={14} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-400" />
                  </div>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-4 text-red-400 bg-red-950/20 p-5 rounded-2xl border border-red-900/40 animate-fade-in shadow-lg">
                  <AlertCircle size={20} className="shrink-0 text-red-500" />
                  <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">{error}</p>
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={loading || (!prompt && !refImage)}
                className="group relative w-full py-5 bg-white text-black rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-4 transition-all shadow-2xl active:scale-95 disabled:opacity-30 disabled:grayscale overflow-hidden uppercase tracking-[0.2em]"
              >
                {loading ? <Loader2 className="animate-spin" size={24} /> : (
                  <>
                    <Sparkles className="group-hover:rotate-12 transition-transform" size={24} />
                    <span>Synthesize Design</span>
                    <div className="absolute inset-0 bg-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Generator;