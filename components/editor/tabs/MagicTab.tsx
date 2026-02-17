import React, { useState } from 'react';
import { EditorState, EditorTool } from '../../../types';
import { Sparkles, Square, RotateCcw, MousePointer2, Eraser, Plus, Wand2, Loader2 } from 'lucide-react';

interface MagicTabProps {
  state: EditorState;
  updateState: (s: Partial<EditorState>) => void;
  activeTool: EditorTool;
  setActiveTool: (t: EditorTool) => void;
  onAIExtend: (prompt: string) => void;
  onAIAddComponent: (prompt: string) => void;
  onAIRemoveBackground: () => void;
}

const MagicTab: React.FC<MagicTabProps> = ({ 
  state, updateState, activeTool, setActiveTool, 
  onAIExtend, onAIAddComponent, onAIRemoveBackground 
}) => {
  const [remasterPrompt, setRemasterPrompt] = useState('');
  const [componentPrompt, setComponentPrompt] = useState('');

  return (
    <div className="space-y-6 animate-fade-in">
      {/* SECTION 1: NEURAL REFINER (Remaster/Inpaint) */}
      <div className="bg-indigo-600/5 p-6 rounded-[2rem] border border-indigo-500/20 space-y-5 shadow-xl backdrop-blur-md">
        <h4 className="text-[10px] font-black text-indigo-400 uppercase flex items-center gap-2 tracking-[0.2em] mb-2">
          <Sparkles size={16}/> Neural Refiner
        </h4>
        <div className="flex gap-2.5">
          <button 
            onClick={() => setActiveTool(activeTool === EditorTool.SELECT_AREA ? EditorTool.NONE : EditorTool.SELECT_AREA)} 
            className={`flex-1 py-4 border-2 rounded-2xl flex flex-col items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${activeTool === EditorTool.SELECT_AREA ? 'bg-indigo-600 border-indigo-400 text-white shadow-2xl shadow-indigo-500/30' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-700'}`}
          >
            <Square size={20}/> {state.selection ? 'Area Defined' : 'Area Select'}
          </button>
          <button 
            onClick={() => updateState({ selection: null })} 
            className="p-4 bg-zinc-950 border-2 border-zinc-800 rounded-2xl text-zinc-500 hover:text-red-500 hover:border-red-500/30 transition-all shadow-xl active:scale-90"
          >
            <RotateCcw size={20}/>
          </button>
        </div>
        <textarea 
          value={remasterPrompt} 
          onChange={e => setRemasterPrompt(e.target.value)} 
          placeholder="Enter AI rework instructions for selected area..." 
          className="w-full h-24 bg-zinc-950 border border-indigo-500/10 rounded-2xl p-5 text-xs text-white outline-none resize-none focus:border-indigo-500 transition-all font-medium leading-relaxed shadow-inner"
        />
        <button 
          onClick={() => { onAIExtend(remasterPrompt); setRemasterPrompt(''); }} 
          className="w-full py-5 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-zinc-200 transition-all shadow-2xl active:scale-95"
        >
          REMASTER DESIGN
        </button>
      </div>

      {/* SECTION 2: AI COMPONENT GENERATOR (Add new elements) */}
      <div className="bg-zinc-900/30 p-6 rounded-[2rem] border border-zinc-800/60 space-y-5 shadow-xl">
        <h4 className="text-[10px] font-black text-zinc-500 uppercase flex items-center gap-2 tracking-widest px-1">
          <Plus size={16}/> Synthetic Elements
        </h4>
        <div className="relative">
          <textarea 
            value={componentPrompt} 
            onChange={e => setComponentPrompt(e.target.value)} 
            placeholder="Describe a new graphic to add (e.g., 'vintage crown', 'lightning bolt')..." 
            className="w-full h-20 bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-xs text-white outline-none resize-none focus:border-zinc-700 transition-all"
          />
          <button 
            onClick={() => { onAIAddComponent(componentPrompt); setComponentPrompt(''); }}
            disabled={!componentPrompt.trim()}
            className="absolute right-3 bottom-3 p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-all disabled:opacity-30"
          >
            <Wand2 size={16}/>
          </button>
        </div>
      </div>
      
      {/* SECTION 3: NEURAL ISOLATION (Background removal & Masking) */}
      <div className="bg-zinc-900/30 p-6 rounded-[2rem] border border-zinc-800/60 space-y-5 shadow-xl">
        <h4 className="text-[10px] font-black text-zinc-500 uppercase flex items-center gap-2 tracking-widest px-1">
          <Eraser size={16}/> Isolated Erase
        </h4>
        <button 
          onClick={onAIRemoveBackground} 
          className="w-full py-5 bg-indigo-950/20 text-indigo-400 border-2 border-indigo-500/20 rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-indigo-900/40 hover:border-indigo-500/40 transition-all shadow-xl active:scale-95"
        >
          Auto Neural Segmentation
        </button>
        <div className="flex gap-2.5">
          {[EditorTool.MASK_BRUSH, EditorTool.MASK_RECT].map(t => (
            <button 
              key={t} 
              onClick={() => setActiveTool(activeTool === t ? EditorTool.NONE : t)} 
              className={`flex-1 py-4 rounded-2xl border-2 flex items-center justify-center transition-all active:scale-95 ${activeTool === t ? 'bg-indigo-600 border-indigo-400 text-white shadow-xl' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-white'}`}
            >
              {t === EditorTool.MASK_BRUSH ? <MousePointer2 size={18}/> : <Square size={18}/>}
            </button>
          ))}
          <button 
            onClick={() => updateState({ maskPaths: [] })} 
            className="p-4 bg-zinc-950 border-2 border-zinc-800 rounded-2xl text-zinc-500 hover:text-red-500 hover:border-red-500/30 transition-all shadow-xl"
          >
            <RotateCcw size={18}/>
          </button>
        </div>
        {activeTool === EditorTool.MASK_BRUSH && (
          <div className="space-y-3 px-1 pt-2 animate-fade-in">
             <div className="flex justify-between text-[9px] text-zinc-600 font-black uppercase"><span>Brush Diameter</span><span>{state.brushSize}px</span></div>
             <input type="range" min="5" max="200" value={state.brushSize} onChange={e => updateState({ brushSize: parseInt(e.target.value) })} className="w-full" />
          </div>
        )}
      </div>
    </div>
  );
};

export default MagicTab;