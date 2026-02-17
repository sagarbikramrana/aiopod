import React, { useState, useEffect } from 'react';
import { EditorState } from '../../../types';
import { getTextures } from '../../../services/storage';
import { Palette, Box, Check } from 'lucide-react';

interface FabricTabProps {
  state: EditorState;
  updateState: (s: Partial<EditorState>) => void;
}

const FABRIC_PRESETS = [
  { name: 'Midnight', hex: '#09090b' },
  { name: 'White', hex: '#ffffff' },
  { name: 'Navy', hex: '#1e3a8a' },
  { name: 'Heather', hex: '#71717a' },
  { name: 'Maroon', hex: '#7f1d1d' },
  { name: 'Forest', hex: '#064e3b' }
];

const FabricTab: React.FC<FabricTabProps> = ({ state, updateState }) => {
  const [availableTextures, setAvailableTextures] = useState<any[]>([]);

  useEffect(() => {
    // Sync with storage to ensure any textures added in Admin panel appear here
    setAvailableTextures(getTextures());
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Garment Color Section */}
      <div className="bg-zinc-900/30 p-5 rounded-3xl border border-zinc-800/60 space-y-5 shadow-inner">
        <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
          <Palette size={14}/> Garment Color
        </h4>
        <div className="grid grid-cols-3 gap-2">
          {FABRIC_PRESETS.map(f => (
            <button 
              key={f.hex} 
              onClick={() => updateState({ fabricColor: f.hex })} 
              className={`group relative h-12 rounded-xl border-2 transition-all flex items-center justify-center ${state.fabricColor === f.hex ? 'border-indigo-500 scale-105 shadow-lg bg-zinc-800' : 'border-zinc-800 hover:border-zinc-700'}`} 
              style={{ backgroundColor: f.hex }}
            >
              {state.fabricColor === f.hex && (
                <Check size={14} className={f.hex === '#ffffff' ? 'text-black' : 'text-white'} />
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 p-3 bg-zinc-950 rounded-2xl border border-zinc-800">
          <input 
            type="color" 
            value={state.fabricColor} 
            onChange={e => updateState({ fabricColor: e.target.value })} 
            className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-none appearance-none" 
          />
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-tighter">{state.fabricColor}</span>
        </div>
      </div>

      {/* Textile Texture Section - Now synced with Admin Panel */}
      <div className="bg-zinc-900/30 p-5 rounded-3xl border border-zinc-800/60 space-y-5 shadow-inner">
        <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
          <Box size={14}/> Textile Texture
        </h4>
        <div className="space-y-2">
          {availableTextures.map(t => (
            <button 
              key={t.url} 
              onClick={() => updateState({ filters: { ...state.filters, texture: t.url, grainType: t.type || 'cotton' } })} 
              className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all group ${state.filters.texture === t.url ? 'bg-indigo-600/10 border-indigo-500' : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded bg-zinc-900 border border-zinc-800 relative overflow-hidden">
                  <div className="absolute inset-0 opacity-40" style={{ backgroundImage: `url(${t.url})`, backgroundSize: '12px' }} />
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${state.filters.texture === t.url ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300'}`}>
                  {t.name}
                </span>
              </div>
              {state.filters.texture === t.url && <Check size={14} className="text-indigo-400" />}
            </button>
          ))}
          
          <button 
            onClick={() => updateState({ filters: { ...state.filters, texture: null, grainType: 'none' } })} 
            className={`w-full p-4 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${!state.filters.texture ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-transparent border-zinc-800 text-zinc-600 hover:text-zinc-400'}`}
          >
            Clear Texture
          </button>
        </div>

        {state.filters.texture && (
          <div className="space-y-3 pt-3 border-t border-zinc-800/60 animate-fade-in">
            <div className="flex justify-between text-[9px] text-zinc-600 font-black uppercase tracking-widest">
              <span>Texture Intensity</span>
              <span className="text-indigo-400">{state.filters.textureOpacity}%</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={state.filters.textureOpacity} 
              onChange={e => updateState({ filters: { ...state.filters, textureOpacity: parseInt(e.target.value) } })} 
              className="w-full" 
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default FabricTab;