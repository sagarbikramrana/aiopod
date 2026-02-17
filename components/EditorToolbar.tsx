import React, { useState } from 'react';
import { EditorState, EditorTool, FONTS, TextLayer, ExportFormat } from '../types';
import { Palette, Layers, X, Repeat, Type, Trash2, Download, Image as ImageIcon, Box, ChevronRight, Sliders, Sparkles } from 'lucide-react';
import DesignTab from './editor/tabs/DesignTab';
import PatternsTab from './editor/tabs/PatternsTab';
import MagicTab from './editor/tabs/MagicTab';
import FabricTab from './editor/tabs/FabricTab';
import EffectsTab from './editor/tabs/EffectsTab';

interface EditorToolbarProps {
  state: EditorState; updateState: (s: Partial<EditorState>) => void;
  activeTool: EditorTool; setActiveTool: (t: EditorTool) => void;
  selectedLayerId: string | null; onComplete: () => void;
  onBack: () => void; onAIExtend: (prompt: string) => void;
  onAIAddComponent: (prompt: string) => void; onAIRemoveBackground: () => void;
  onDownload: (format: ExportFormat) => void;
}

const EditorToolbar: React.FC<EditorToolbarProps> = (props) => {
  const { state, updateState, activeTool, setActiveTool, selectedLayerId, onComplete, onBack, onAIExtend, onAIAddComponent, onAIRemoveBackground, onDownload } = props;
  const [tab, setTab] = useState<'design' | 'layers' | 'patterns' | 'effects' | 'fabric' | 'magic'>('design');
  const [showExportMenu, setShowExportMenu] = useState(false);

  return (
    <div className="w-full lg:w-[360px] bg-[#09090b] flex flex-col h-[50%] lg:h-full shrink-0 overflow-hidden shadow-2xl z-50">
      <div className="flex bg-zinc-950/80 p-1.5 gap-1 shrink-0 overflow-x-auto no-scrollbar border-b border-zinc-800/60 studio-glass">
        {[
          { id: 'design', icon: <Palette size={14}/> },
          { id: 'layers', icon: <Layers size={14}/> },
          { id: 'patterns', icon: <Repeat size={14}/> },
          { id: 'fabric', icon: <Box size={14}/> },
          { id: 'effects', icon: <Sliders size={14}/> },
          { id: 'magic', icon: <Sparkles size={14}/> }
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)} className={`flex-1 min-w-[50px] py-2 rounded-xl text-[8px] font-black uppercase tracking-widest flex flex-col items-center gap-1 transition-all ${tab === t.id ? 'bg-indigo-600 text-white shadow-xl' : 'text-zinc-500 hover:text-zinc-300'}`}>
            {t.icon} <span className="scale-[0.85]">{t.id}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-5 no-scrollbar">
        {tab === 'design' && <DesignTab state={state} updateState={updateState} activeTool={activeTool} setActiveTool={setActiveTool} />}
        {tab === 'patterns' && <PatternsTab state={state} updateState={updateState} />}
        {tab === 'magic' && <MagicTab state={state} updateState={updateState} activeTool={activeTool} setActiveTool={setActiveTool} onAIExtend={onAIExtend} onAIAddComponent={onAIAddComponent} onAIRemoveBackground={onAIRemoveBackground} />}
        {tab === 'fabric' && <FabricTab state={state} updateState={updateState} />}
        {tab === 'effects' && <EffectsTab state={state} updateState={updateState} />}
        {tab === 'layers' && (
          <div className="space-y-4 pb-4 animate-fade-in">
            <button onClick={() => updateState({ layers: [...state.layers, { id: Date.now().toString(), type: 'text', text: 'NEW TEXT', x: 50, y: 50, scale: 100, rotation: 0, opacity: 100, visible: true, fontFamily: FONTS[0].family, color: '#ffffff', size: 60, strokeColor: '#000000', strokeWidth: 0, letterSpacing: 0, curve: 0, shadowColor: '#000000', shadowBlur: 0 }] })} className="w-full py-4 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2"><Type size={16}/> Add Text</button>
            {state.layers.map(l => (
              <div key={l.id} className={`flex items-center justify-between p-3 rounded-2xl border ${selectedLayerId === l.id ? 'bg-indigo-600/10 border-indigo-500' : 'bg-zinc-900 border-zinc-800'}`}>
                <span className="text-[10px] font-bold uppercase truncate w-32">{l.type === 'text' ? (l as TextLayer).text : 'Image Layer'}</span>
                <button onClick={() => updateState({ layers: state.layers.filter(x => x.id !== l.id) })} className="text-zinc-600 hover:text-red-500"><Trash2 size={14}/></button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showExportMenu && (
        <div className="absolute inset-0 z-[100] flex items-end p-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowExportMenu(false)}/>
          <div className="w-full bg-zinc-900 border border-zinc-700 rounded-[2.5rem] p-6 shadow-2xl relative space-y-4">
            <div className="flex justify-between items-center"><h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Master Export Suite</h4><button onClick={() => setShowExportMenu(false)} className="text-zinc-500"><X size={20}/></button></div>
            <div className="grid grid-cols-1 gap-2.5">
              {[
                { id: ExportFormat.PNG_TRANSPARENT, label: 'DTG Print Master', sub: 'High-Res Transparent PNG', icon: <Download size={18} className="text-indigo-400"/> },
                { id: ExportFormat.JPG_WHITE, label: 'Social Mockup', sub: 'Flattened JPG with fabric', icon: <ImageIcon size={18} className="text-zinc-400"/> },
                { id: ExportFormat.PNG_PATTERN, label: 'Pattern Source', sub: 'Seamless tile asset', icon: <Repeat size={18} className="text-emerald-400"/> },
                { id: ExportFormat.STICKER_PACK, label: 'Sticker Cut-File', sub: 'PNG with die-cut border', icon: <Box size={18} className="text-amber-400"/> }
              ].map(opt => (
                <button key={opt.id} onClick={() => { onDownload(opt.id); setShowExportMenu(false); }} className="flex items-center gap-4 p-4 bg-zinc-950 border border-zinc-800 rounded-3xl hover:border-indigo-500/50 transition-all text-left">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center shrink-0">{opt.icon}</div>
                  <div><p className="text-[10px] font-black text-white uppercase tracking-widest">{opt.label}</p><p className="text-[8px] text-zinc-500 font-medium">{opt.sub}</p></div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="p-4 border-t border-zinc-800/80 studio-glass shrink-0 flex flex-col gap-2 safe-bottom z-10 shadow-2xl">
        <div className="flex gap-2">
          <button onClick={onBack} className="flex-1 py-3 text-[9px] font-black text-zinc-600 hover:text-white transition-all uppercase tracking-widest">Back</button>
          <button onClick={() => setShowExportMenu(true)} className="flex-1 py-3 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-2xl font-black text-[9px] flex items-center justify-center gap-2 transition-all active:scale-95 uppercase tracking-widest"><Download size={14}/> Export</button>
        </div>
        <button onClick={onComplete} className="w-full py-4 bg-white text-black rounded-2xl font-black text-[10px] flex items-center justify-center gap-2 shadow-2xl hover:bg-zinc-100 transition-all active:scale-95 uppercase tracking-widest">Mockup Preview <ChevronRight size={16}/></button>
      </div>
    </div>
  );
};

export default EditorToolbar;