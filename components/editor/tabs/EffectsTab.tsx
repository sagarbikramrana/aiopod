import React from 'react';
import { EditorState } from '../../../types';
import { Sliders, Droplets, Zap, ShieldAlert } from 'lucide-react';

interface EffectsTabProps {
  state: EditorState;
  updateState: (s: Partial<EditorState>) => void;
}

const EffectsTab: React.FC<EffectsTabProps> = ({ state, updateState }) => {
  const updateFilter = (key: string, val: number) => {
    updateState({ filters: { ...state.filters, [key]: val } });
  };

  const CATEGORIES = [
    {
      title: 'Basic Adjustments',
      icon: <Sliders size={14}/>,
      controls: [
        { label: 'Brightness', key: 'brightness', min: -100, max: 100 },
        { label: 'Contrast', key: 'contrast', min: -100, max: 100 },
        { label: 'Saturation', key: 'saturation', min: -100, max: 100 }
      ]
    },
    {
      title: 'Print Effects',
      icon: <Zap size={14}/>,
      controls: [
        { label: 'Halftone', key: 'halftone', min: 0, max: 100 },
        { label: 'Ink Bleed', key: 'inkBleed', min: 0, max: 100 },
        { label: 'Crackle', key: 'crackle', min: 0, max: 100 },
        { label: 'Vintage Wash', key: 'vintage', min: 0, max: 100 },
        { label: 'Posterize', key: 'posterize', min: 0, max: 30 },
        { label: 'Noise', key: 'noise', min: 0, max: 100 }
      ]
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {CATEGORIES.map(cat => (
        <div key={cat.title} className="bg-zinc-900/30 p-5 rounded-3xl border border-zinc-800/60 space-y-5 shadow-inner">
          <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
            {cat.icon} {cat.title}
          </h4>
          <div className="space-y-5">
            {cat.controls.map(ctrl => (
              <div key={ctrl.key} className="space-y-2">
                <div className="flex justify-between text-[9px] text-zinc-600 font-black uppercase">
                  <span>{ctrl.label}</span>
                  <span className="text-indigo-400">{(state.filters as any)[ctrl.key]}</span>
                </div>
                <input 
                  type="range" 
                  min={ctrl.min} 
                  max={ctrl.max} 
                  value={(state.filters as any)[ctrl.key]} 
                  onChange={e => updateFilter(ctrl.key, parseInt(e.target.value))} 
                  className="w-full"
                />
              </div>
            ))}
          </div>
        </div>
      ))}
      <button onClick={() => updateState({ filters: { brightness: 0, contrast: 0, saturation: 0, noise: 0, halftone: 0, texture: null, textureOpacity: 50, vintage: 0, blur: 0, sharpen: 0, posterize: 0, inkBleed: 0, crackle: 0, grainType: 'none' } })} className="w-full py-4 bg-zinc-950 border border-zinc-800 rounded-2xl text-[10px] font-black text-zinc-500 hover:text-white transition-all uppercase tracking-widest">
        Reset All Filters
      </button>
    </div>
  );
};

export default EffectsTab;