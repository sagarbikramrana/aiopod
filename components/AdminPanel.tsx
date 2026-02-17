import React, { useState, useEffect } from 'react';
import { getStyles, saveStyles, addStyle, removeStyle, getMockups, addMockup, removeMockup, getTextures, addTexture, removeTexture, resetToDefaults, getApiKeys, saveApiKeys, CategorizedStyles } from '../services/storage';
import { Palette, Shirt, Box, Settings, Trash2, LogOut, Key, Save, Menu, X, Plus, ExternalLink, ChevronRight } from 'lucide-react';

interface AdminPanelProps {
  onLogout: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onLogout }) => {
  const [tab, setTab] = useState<'styles' | 'mockups' | 'textures' | 'keys' | 'settings'>('styles');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [categorizedStyles, setCategorizedStyles] = useState<CategorizedStyles>({});
  const [mockups, setMockups] = useState<any>({ apparel: [], home: [], accessories: [] });
  const [textures, setTextures] = useState<any[]>([]);
  const [apiKeys, setApiKeys] = useState<any>({ gemini: '', stability: '', openai: '', huggingface: '' });
  
  const [newStyle, setNewStyle] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');

  const [newMockupUrl, setNewMockupUrl] = useState('');
  const [mockupCategory, setMockupCategory] = useState<'apparel' | 'home' | 'accessories'>('apparel');
  const [newTextureName, setNewTextureName] = useState('');
  const [newTextureUrl, setNewTextureUrl] = useState('');

  useEffect(() => {
    const loadedStyles = getStyles();
    setCategorizedStyles(loadedStyles);
    setActiveCategory(Object.keys(loadedStyles)[0] || '');
    setMockups(getMockups());
    setTextures(getTextures());
    setApiKeys(getApiKeys());
  }, []);

  const handleAddStyle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStyle || !activeCategory) return;
    const updated = addStyle(activeCategory, newStyle);
    setCategorizedStyles(updated);
    setNewStyle('');
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName) return;
    const current = { ...categorizedStyles };
    if (!current[newCategoryName]) current[newCategoryName] = [];
    saveStyles(current);
    setCategorizedStyles(current);
    setActiveCategory(newCategoryName);
    setNewCategoryName('');
  };

  const handleAddTexture = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTextureName || !newTextureUrl) return;
    const updated = addTexture(newTextureName, newTextureUrl);
    setTextures(updated);
    setNewTextureName('');
    setNewTextureUrl('');
  };

  return (
    <div className="flex h-[100dvh] bg-zinc-950 text-zinc-100 font-sans relative">
      {isSidebarOpen && <div className="fixed inset-0 bg-black/80 z-[60] lg:hidden" onClick={() => setIsSidebarOpen(false)} />}
      
      <aside className={`fixed inset-y-0 left-0 w-64 bg-zinc-900 border-r border-zinc-800 p-6 flex flex-col z-[70] transition-transform lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between mb-8 shrink-0">
           <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-indigo-600 flex items-center justify-center font-bold text-sm">A</div>
              <span className="font-bold tracking-tight">Admin<span className="text-zinc-500 text-xs">Studio</span></span>
           </div>
           <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-1 text-zinc-500"><X size={20}/></button>
        </div>
        
        <nav className="space-y-1 flex-1">
          {[
            { id: 'styles', label: 'Artist Styles', icon: <Palette size={18}/> },
            { id: 'mockups', label: 'Mockups', icon: <Shirt size={18}/> },
            { id: 'textures', label: 'Textures', icon: <Box size={18}/> },
            { id: 'keys', label: 'API Keys', icon: <Key size={18}/> },
            { id: 'settings', label: 'System', icon: <Settings size={18}/> },
          ].map(item => (
            <button key={item.id} onClick={() => { setTab(item.id as any); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === item.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white hover:bg-zinc-800/50'}`}>
              {item.icon} {item.label}
            </button>
          ))}
        </nav>

        <button onClick={onLogout} className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-bold text-red-500 hover:bg-red-950/20 transition-all mt-4 shrink-0">
          <LogOut size={18} /> Exit Admin
        </button>
      </aside>

      <main className="flex-1 overflow-y-auto flex flex-col">
        <header className="h-14 flex items-center px-6 border-b border-zinc-800 bg-zinc-950 lg:hidden shrink-0">
           <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-zinc-400"><Menu size={24}/></button>
           <h1 className="ml-2 font-bold capitalize text-sm">{tab}</h1>
        </header>

        <div className="p-6 sm:p-10 max-w-4xl w-full mx-auto space-y-8">
           {tab === 'styles' && (
             <div className="space-y-6">
                <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 shadow-xl space-y-6">
                   <div className="space-y-2">
                      <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Manage Categories</h3>
                      <form onSubmit={handleAddCategory} className="flex gap-2">
                        <input value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="New Category Name..." className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm" />
                        <button type="submit" className="px-4 bg-zinc-100 text-black font-bold rounded-xl text-xs flex items-center gap-2"><Plus size={16}/> Create</button>
                      </form>
                   </div>
                   
                   <div className="flex flex-wrap gap-2 pt-4 border-t border-zinc-800">
                      {Object.keys(categorizedStyles).map(cat => (
                        <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-4 py-2 rounded-lg text-[10px] font-bold border transition-all ${activeCategory === cat ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-zinc-950 border-zinc-800 text-zinc-500'}`}>
                          {cat}
                        </button>
                      ))}
                   </div>

                   {activeCategory && (
                     <div className="pt-4 border-t border-zinc-800 space-y-4 animate-fade-in">
                        <div className="flex items-center justify-between">
                           <h3 className="text-sm font-bold text-indigo-400">Styles in {activeCategory}</h3>
                           <button onClick={() => { if(window.confirm(`Delete entire category ${activeCategory}?`)) { const c = {...categorizedStyles}; delete c[activeCategory]; saveStyles(c); setCategorizedStyles(c); setActiveCategory(Object.keys(c)[0] || ''); } }} className="text-[10px] text-red-500 hover:underline">Delete Category</button>
                        </div>
                        <form onSubmit={handleAddStyle} className="flex gap-2">
                           <input value={newStyle} onChange={e => setNewStyle(e.target.value)} placeholder={`Add style to ${activeCategory}...`} className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm" />
                           <button type="submit" className="px-4 bg-white text-black font-bold rounded-xl text-xs flex items-center gap-2"><Plus size={16}/> Add</button>
                        </form>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                           {(categorizedStyles[activeCategory] || []).map(s => (
                             <div key={s} className="flex items-center justify-between p-3 bg-zinc-950 border border-zinc-800 rounded-xl group">
                                <span className="text-xs font-semibold text-zinc-300">{s}</span>
                                <button onClick={() => setCategorizedStyles(removeStyle(activeCategory, s))} className="text-zinc-600 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                             </div>
                           ))}
                        </div>
                     </div>
                   )}
                </div>
             </div>
           )}

           {tab === 'mockups' && (
             <div className="space-y-6">
               <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 shadow-xl space-y-4">
                  <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Register New Mockup</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <select value={mockupCategory} onChange={e => setMockupCategory(e.target.value as any)} className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white outline-none">
                      <option value="apparel">Apparel</option>
                      <option value="home">Home & Decor</option>
                      <option value="accessories">Accessories</option>
                    </select>
                    <input value={newMockupUrl} onChange={e => setNewMockupUrl(e.target.value)} placeholder="Image URL..." className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500" />
                  </div>
                  <button onClick={() => { if(newMockupUrl) { setMockups(addMockup(mockupCategory, newMockupUrl)); setNewMockupUrl(''); } }} className="w-full py-3 bg-white text-black font-bold rounded-xl text-xs hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2">
                    <Plus size={16}/> Register Mockup Resource
                  </button>
               </div>
               {['apparel', 'home', 'accessories'].map(cat => (
                 <div key={cat} className="space-y-3">
                   <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-2">{cat}</h4>
                   <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                     {(mockups[cat] || []).map((url: string, i: number) => (
                       <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-zinc-800 group bg-zinc-900">
                         <img src={url} className="w-full h-full object-cover" />
                         <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                           <button onClick={() => setMockups(removeMockup(cat as any, url))} className="p-2 bg-red-950/40 rounded-lg text-red-500 hover:bg-red-500 hover:text-white transition-all"><Trash2 size={16}/></button>
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
               ))}
             </div>
           )}

           {tab === 'textures' && (
             <div className="space-y-6">
                <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 shadow-xl space-y-4">
                   <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Register Surface Texture</h3>
                   <form onSubmit={handleAddTexture} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <input value={newTextureName} onChange={e => setNewTextureName(e.target.value)} placeholder="Texture Name (e.g. Fine Cotton)..." className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500" />
                      <input value={newTextureUrl} onChange={e => setNewTextureUrl(e.target.value)} placeholder="Transparent PNG Pattern URL..." className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500" />
                      <button type="submit" className="sm:col-span-2 py-3 bg-white text-black font-bold rounded-xl text-xs hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2">
                        <Plus size={16}/> Register Texture
                      </button>
                   </form>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   {textures.map((t, i) => (
                     <div key={i} className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 rounded-xl bg-zinc-950 border border-zinc-800 overflow-hidden relative">
                              <div className="absolute inset-0 opacity-50" style={{ backgroundImage: `url(${t.url})`, backgroundSize: '20px' }} />
                           </div>
                           <div>
                              <p className="text-xs font-bold text-white uppercase tracking-widest">{t.name}</p>
                              <p className="text-[10px] text-zinc-500 truncate w-40">{t.url}</p>
                           </div>
                        </div>
                        <button onClick={() => setTextures(removeTexture(t.url))} className="p-2 text-zinc-600 hover:text-red-500 transition-colors"><Trash2 size={18}/></button>
                     </div>
                   ))}
                </div>
             </div>
           )}

           {tab === 'keys' && (
             <div className="space-y-6 bg-zinc-900 p-6 rounded-2xl border border-zinc-800 shadow-xl">
               <div className="space-y-6">
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-500">Gemini API Key</label>
                    <input type="password" value={apiKeys.gemini} onChange={e => setApiKeys({...apiKeys, gemini: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm" placeholder="AIza..."/>
                 </div>
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-500">OpenAI API Key (DALL-E 3)</label>
                    <input type="password" value={apiKeys.openai} onChange={e => setApiKeys({...apiKeys, openai: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm" placeholder="sk-..."/>
                 </div>
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-500">Hugging Face API Key</label>
                    <input type="password" value={apiKeys.huggingface} onChange={e => setApiKeys({...apiKeys, huggingface: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm" placeholder="hf_..."/>
                 </div>
                 <button onClick={() => { saveApiKeys(apiKeys); alert("API Configuration Saved!"); }} className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-indigo-900/20"><Save size={18}/> Commit Changes</button>
               </div>
             </div>
           )}

           {tab === 'settings' && (
             <div className="p-8 bg-red-950/10 border border-red-900/40 rounded-3xl space-y-4">
                <div className="flex items-center gap-3 text-red-500">
                   <Settings className="animate-spin-slow" />
                   <h3 className="font-bold text-lg">Factory Data Reset</h3>
                </div>
                <p className="text-sm text-zinc-500">This action will permanently purge all custom styles, mockups, and textures from your local storage. API keys will also be cleared.</p>
                <button onClick={() => { if (window.confirm("ARE YOU SURE? This cannot be undone.")) { resetToDefaults(); window.location.reload(); } }} className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-2xl text-xs transition-colors shadow-lg shadow-red-900/20">Purge Studio Data</button>
             </div>
           )}
        </div>
      </main>
    </div>
  );
};

export default AdminPanel;