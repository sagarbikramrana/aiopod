import React from 'react';
import { EditorState, EditorTool, RGB } from '../../../types';
import { Palette, Pipette, X, Trash2, Sliders, Droplets } from 'lucide-react';

interface DesignTabProps {
  state: EditorState;
  updateState: (s: Partial<EditorState>) => void;
  activeTool: EditorTool;
  setActiveTool: (t: EditorTool) => void;
}

const DesignTab: React.FC<DesignTabProps> = ({ state, updateState, activeTool, setActiveTool }) => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Existing Sticker Engine */}
      <div className="bg-zinc-900/30 p-5 rounded-3xl border border-zinc-800/60 space-y-4 shadow-inner">
        <div className="flex items-center justify-between">
          <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Border Engine</h4>
          <button onClick={() => updateState({ isSticker: !state.isSticker })} className={`w-10 h-5 rounded-full relative transition-all ${state.isSticker ? 'bg-indigo-600' : 'bg-zinc-800'}`}>
            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${state.isSticker ? 'right-1' : 'left-1'}`}/>
          </button>
        </div>
        {state.isSticker && (
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <div className="flex justify-between text-[9px] text-zinc-600 font-black uppercase tracking-wider"><span>Stroke Width</span><span>{state.stickerBorderWidth}px</span></div>
              <input type="range" min="1" max="50" value={state.stickerBorderWidth} onChange={e => updateState({ stickerBorderWidth: parseInt(e.target.value) })} className="w-full"/>
            </div>
            <input type="color" value={state.stickerBorderColor} onChange={e => updateState({ stickerBorderColor: e.target.value })} className="w-full h-10 rounded-xl cursor-pointer bg-zinc-950 border border-zinc-800 p-1 transition-all hover:border-zinc-600"/>
          </div>
        )}
      </div>

      {/* Selective Color Edit Panel (Missing Feature Re-added) */}
      <div className="bg-zinc-900/30 p-5 rounded-3xl border border-zinc-800/60 space-y-5 shadow-inner">
        <div className="flex items-center justify-between px-1">
          <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2"><Droplets size={12}/> Color Shift</h4>
          <button 
            onClick={() => setActiveTool(EditorTool.PICKER_EDIT)} 
            className={`p-2.5 rounded-xl border-2 transition-all active:scale-90 ${activeTool === EditorTool.PICKER_EDIT ? 'bg-purple-600 border-purple-400 text-white shadow-lg' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-white'}`}
          >
            <Pipette size={18}/>
          </button>
        </div>
        
        <div className="space-y-4">
          {state.editColors.length === 0 && <p className="text-[10px] text-zinc-600 italic text-center py-4">Pick a color to shift its properties...</p>}
          {state.editColors.map(e => (
            <div key={e.id} className="p-4 bg-zinc-950/50 rounded-2xl border border-zinc-800 space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-lg shadow-xl border border-white/20" style={{backgroundColor:`rgb(${e.target.r},${e.target.g},${e.target.b})`}}/>
                  <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Target Color</span>
                </div>
                <button onClick={() => updateState({ editColors: state.editColors.filter(x => x.id !== e.id) })} className="text-zinc-600 hover:text-red-500"><X size={14}/></button>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Tolerance', key: 'tolerance', min: 1, max: 150 },
                  { label: 'Hue Shift', key: 'hue', min: -180, max: 180 },
                  { label: 'Saturation', key: 'sat', min: -100, max: 100 },
                  { label: 'Brightness', key: 'lit', min: -100, max: 100 }
                ].map(control => (
                  <div key={control.key} className="space-y-1">
                    <div className="flex justify-between text-[8px] text-zinc-600 font-black uppercase"><span>{control.label}</span><span>{(e as any)[control.key]}</span></div>
                    <input 
                      type="range" 
                      min={control.min} 
                      max={control.max} 
                      value={(e as any)[control.key]} 
                      onChange={val => updateState({ 
                        editColors: state.editColors.map(x => x.id === e.id ? { ...x, [control.key]: parseInt(val.target.value) } : x) 
                      })} 
                      className="w-full"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Transparency Cleanup Panel */}
      <div className="bg-zinc-900/30 p-5 rounded-3xl border border-zinc-800/60 space-y-5 shadow-inner">
        <div className="flex items-center justify-between">
          <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Alpha Cleanup</h4>
          <button onClick={() => setActiveTool(EditorTool.PICKER_REMOVE)} className={`p-2.5 rounded-xl border-2 transition-all active:scale-90 ${activeTool === EditorTool.PICKER_REMOVE ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-white'}`}><Pipette size={18}/></button>
        </div>
        <div className="space-y-4">
          {state.removeColors.length === 0 && <p className="text-[10px] text-zinc-600 italic text-center py-4">Pick colors to isolate subject...</p>}
          {state.removeColors.map(c => (
            <div key={c.id} className="p-4 bg-zinc-950/50 rounded-2xl border border-zinc-800 space-y-4 animate-fade-in group">
              <div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="w-6 h-6 rounded-lg shadow-xl border border-white/20" style={{backgroundColor:`rgb(${c.color.r},${c.color.g},${c.color.b})`}}/><span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">ID: {c.id.slice(-4)}</span></div><button onClick={() => updateState({ removeColors: state.removeColors.filter(x => x.id !== c.id) })} className="p-1.5 text-zinc-700 hover:text-red-500 transition-all"><X size={14}/></button></div>
              <div className="grid grid-cols-1 gap-4">
                 <div className="space-y-2">
                    <div className="flex justify-between text-[9px] text-zinc-600 font-black uppercase"><span>Tolerance</span><span>{c.tolerance}</span></div>
                    <input type="range" min="1" max="150" value={c.tolerance} onChange={e => updateState({ removeColors: state.removeColors.map(x => x.id === c.id ? {...x, tolerance: parseInt(e.target.value)} : x) })} className="w-full"/>
                 </div>
                 <div className="space-y-2">
                    <div className="flex justify-between text-[9px] text-zinc-600 font-black uppercase"><span>Feather</span><span>{c.feather}</span></div>
                    <input type="range" min="0" max="100" value={c.feather} onChange={e => updateState({ removeColors: state.removeColors.map(x => x.id === c.id ? {...x, feather: parseInt(e.target.value)} : x) })} className="w-full"/>
                 </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DesignTab;