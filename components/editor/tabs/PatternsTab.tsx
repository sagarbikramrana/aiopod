import React from 'react';
import { EditorState } from '../../../types';
import { Repeat, Grid, Maximize, RotateCw, Move } from 'lucide-react';

interface PatternsTabProps {
  state: EditorState;
  updateState: (s: Partial<EditorState>) => void;
}

const PatternsTab: React.FC<PatternsTabProps> = ({ state, updateState }) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-zinc-900/40 p-6 rounded-[2rem] border border-zinc-800/60 space-y-6 shadow-xl studio-glass">
        <div className="flex items-center justify-between px-1">
          <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
            <Repeat size={14} /> Seamless Tiling
          </h4>
          <button 
            onClick={() => updateState({ isPattern: !state.isPattern })} 
            className={`w-10 h-5 rounded-full relative transition-all ${state.isPattern ? 'bg-indigo-600' : 'bg-zinc-800'}`}
          >
            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${state.isPattern ? 'right-1' : 'left-1'}`}/>
          </button>
        </div>

        {state.isPattern ? (
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between text-[10px] text-zinc-600 font-black uppercase tracking-widest px-1">
                  <span>Pattern Scale</span>
                  <span className="text-indigo-400 font-mono">{state.patternScale}%</span>
                </div>
                <input 
                  type="range" min="5" max="200" value={state.patternScale} 
                  onChange={e => updateState({ patternScale: parseInt(e.target.value) })} 
                  className="w-full"
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-[10px] text-zinc-600 font-black uppercase tracking-widest px-1">
                  <span className="flex items-center gap-2"><RotateCw size={10}/> Rotation</span>
                  <span className="text-indigo-400 font-mono">{state.patternRotation}°</span>
                </div>
                <input 
                  type="range" min="-180" max="180" value={state.patternRotation} 
                  onChange={e => updateState({ patternRotation: parseInt(e.target.value) })} 
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex justify-between text-[10px] text-zinc-600 font-black uppercase tracking-widest px-1">
                    <span className="flex items-center gap-2"><Move size={10}/> Offset X</span>
                  </div>
                  <input 
                    type="range" min="-100" max="100" value={state.patternOffsetX} 
                    onChange={e => updateState({ patternOffsetX: parseInt(e.target.value) })} 
                    className="w-full"
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-[10px] text-zinc-600 font-black uppercase tracking-widest px-1">
                    <span className="flex items-center gap-2"><Move size={10}/> Offset Y</span>
                  </div>
                  <input 
                    type="range" min="-100" max="100" value={state.patternOffsetY} 
                    onChange={e => updateState({ patternOffsetY: parseInt(e.target.value) })} 
                    className="w-full"
                  />
                </div>
              </div>
            </div>
            
            <div className="pt-4 border-t border-zinc-800/60 grid grid-cols-2 gap-3">
              <button className="p-4 bg-zinc-950/50 rounded-2xl border border-indigo-500/30 flex flex-col items-center gap-2 hover:bg-zinc-900 transition-all">
                <Grid size={20} className="text-indigo-400"/>
                <span className="text-[8px] font-black uppercase tracking-widest text-indigo-400">Standard Grid</span>
              </button>
              <button className="p-4 bg-zinc-950/50 rounded-2xl border border-zinc-800 flex flex-col items-center gap-2 grayscale opacity-50 cursor-not-allowed">
                <Maximize size={20} className="text-zinc-600"/>
                <span className="text-[8px] font-black uppercase tracking-widest text-zinc-600">Brick Offset</span>
              </button>
            </div>
          </div>
        ) : (
          <p className="text-[10px] text-zinc-600 italic text-center py-10 px-6 leading-relaxed">
            Activate the Tiling Engine to transform your design into a seamless repeating pattern suitable for all-over apparel and textile printing.
          </p>
        )}
      </div>
    </div>
  );
};

export default PatternsTab;