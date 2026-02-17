import React, { useState, useRef, useEffect } from 'react';
import { Download, Loader2, Shirt, ArrowLeft, Upload, CheckCircle2, Layers, RotateCw } from 'lucide-react';
import { getMockups, addMockup } from '../services/storage';

interface MockupStudioProps {
  designUrl: string;
  onBack: () => void;
}

type BlendMode = 'normal' | 'multiply' | 'screen' | 'overlay';

const MockupStudio: React.FC<MockupStudioProps> = ({ designUrl, onBack }) => {
  const [mockups, setMockups] = useState<any>({ apparel: [], home: [], accessories: [], custom: [] });
  const [activeCategory, setActiveCategory] = useState<string>('apparel');
  const [mockupImage, setMockupImage] = useState<string>('');
  const [scale, setScale] = useState(30);
  const [posX, setPosX] = useState(50);
  const [posY, setPosY] = useState(40);
  const [rotation, setRotation] = useState(0);
  const [blendMode, setBlendMode] = useState<BlendMode>('normal');
  const [opacity, setOpacity] = useState(100);
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const exportCanvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));

  useEffect(() => {
    const data = getMockups();
    setMockups(data);
    if (data.apparel?.length) setMockupImage(data.apparel[0]);
    else if (data.custom?.length) { setMockupImage(data.custom[0]); setActiveCategory('custom'); }
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const url = ev.target?.result as string;
        const updated = addMockup('custom', url);
        setMockups(updated);
        setMockupImage(url);
        setActiveCategory('custom');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const canvas = exportCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const mockupImg = new Image(); mockupImg.crossOrigin = "anonymous"; mockupImg.src = mockupImage;
      const designImg = new Image(); designImg.crossOrigin = "anonymous"; designImg.src = designUrl;

      await Promise.all([
        new Promise((res, rej) => { mockupImg.onload = res; mockupImg.onerror = rej; }),
        new Promise((res, rej) => { designImg.onload = res; designImg.onerror = rej; })
      ]);

      canvas.width = mockupImg.width; canvas.height = mockupImg.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(mockupImg, 0, 0);

      ctx.save();
      const w = (canvas.width * scale) / 100;
      const h = (designImg.height * (w / designImg.width));
      ctx.translate((canvas.width * posX) / 100, (canvas.height * posY) / 100);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.globalAlpha = opacity / 100;

      const compositeMap: Record<BlendMode, GlobalCompositeOperation> = {
        'normal': 'source-over', 'multiply': 'multiply', 'screen': 'screen', 'overlay': 'overlay'
      };
      ctx.globalCompositeOperation = compositeMap[blendMode];
      ctx.drawImage(designImg, -w / 2, -h / 2, w, h);
      ctx.restore();

      const link = document.createElement('a');
      link.download = `composite-mockup-${Date.now()}.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.95);
      link.click();
    } catch (err) {
      console.error("Export failed", err);
      alert("Failed to export mockup. Ensure image sources allow cross-origin access.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-full gap-6 animate-fade-in relative overflow-hidden">
      <div className="flex-1 bg-zinc-950/20 border border-zinc-800 rounded-2xl flex items-center justify-center p-4 sm:p-12 relative overflow-hidden min-h-[50vh]">
        <div className="relative shadow-2xl rounded-lg overflow-hidden max-h-full">
          {mockupImage && <img src={mockupImage} className="max-w-full max-h-[70vh] object-contain block animate-fade-in" />}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute" style={{
              top: `${posY}%`, left: `${posX}%`, width: `${scale}%`,
              transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
              opacity: opacity / 100, mixBlendMode: blendMode as any
            }}>
              <img src={designUrl} className="w-full h-auto" />
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-96 bg-zinc-900 p-6 border-l border-zinc-800 flex flex-col gap-6 overflow-y-auto no-scrollbar">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold flex items-center gap-2"><Shirt className="text-indigo-400" size={20} /> Mockup Engine</h3>
          <button onClick={() => fileInputRef.current?.click()} className="p-2 bg-indigo-600/20 text-indigo-400 rounded-lg hover:bg-indigo-600/30 transition-all">
            <Upload size={18} />
          </button>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
        </div>

        <div className="flex gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
          {['apparel', 'home', 'accessories', 'custom'].map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)} className={`flex-1 py-2 rounded-lg text-[10px] font-bold capitalize transition-all ${activeCategory === cat ? 'bg-zinc-800 text-white shadow-inner' : 'text-zinc-500 hover:text-zinc-300'}`}>
              {cat}
            </button>
          ))}
        </div>

        <div className="flex overflow-x-auto gap-2 pb-2 no-scrollbar min-h-[72px]">
          {(mockups[activeCategory] || []).map((url: string, i: number) => (
            <button key={i} onClick={() => setMockupImage(url)} className={`shrink-0 w-16 h-16 rounded-xl border-2 transition-all relative overflow-hidden ${mockupImage === url ? 'border-indigo-500 shadow-lg' : 'border-zinc-800 opacity-60 hover:opacity-100'}`}>
              <img src={url} className="w-full h-full object-cover" />
              {mockupImage === url && <div className="absolute top-1 right-1 p-0.5 bg-indigo-500 rounded-full text-white shadow-sm"><CheckCircle2 size={10} /></div>}
            </button>
          ))}
        </div>

        <div className="space-y-6 bg-zinc-950 p-4 rounded-xl border border-zinc-800 shadow-inner">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-2"><Layers size={12} /> Appearance</label>
            <div className="grid grid-cols-2 gap-2">
              {(['normal', 'multiply', 'screen', 'overlay'] as BlendMode[]).map(mode => (
                <button key={mode} onClick={() => setBlendMode(mode)} className={`py-2 px-1 rounded-lg text-[10px] font-bold border transition-all capitalize ${blendMode === mode ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'}`}>
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4 pt-2 border-t border-zinc-900">
            <div className="space-y-1">
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] font-bold text-zinc-600 uppercase">Design Scale</label>
                <span className="text-[10px] font-mono text-indigo-400">{scale}%</span>
              </div>
              <input type="range" min="5" max="95" value={scale} onChange={e => setScale(parseInt(e.target.value))} className="w-full h-1.5 bg-zinc-800 accent-indigo-500 rounded-lg" />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] font-bold text-zinc-600 uppercase flex items-center gap-1"><RotateCw size={10} /> Rotation</label>
                <span className="text-[10px] font-mono text-indigo-400">{rotation}°</span>
              </div>
              <input type="range" min="-180" max="180" value={rotation} onChange={e => setRotation(parseInt(e.target.value))} className="w-full h-1.5 bg-zinc-800 accent-indigo-500 rounded-lg" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><label className="text-[10px] font-bold text-zinc-600 uppercase">X Position</label><input type="range" min="0" max="100" value={posX} onChange={e => setPosX(parseInt(e.target.value))} className="w-full h-1.5 bg-zinc-800 accent-indigo-500 rounded-lg" /></div>
              <div className="space-y-1"><label className="text-[10px] font-bold text-zinc-600 uppercase">Y Position</label><input type="range" min="0" max="100" value={posY} onChange={e => setPosY(parseInt(e.target.value))} className="w-full h-1.5 bg-zinc-800 accent-indigo-500 rounded-lg" /></div>
            </div>
          </div>
        </div>

        <div className="mt-auto pt-4 space-y-3 safe-bottom">
          <button onClick={handleExport} disabled={isExporting} className="w-full py-4 bg-white text-black rounded-xl font-black uppercase text-xs flex items-center justify-center gap-3 shadow-2xl hover:bg-zinc-100 active:scale-95 transition-all">
            {isExporting ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />} Export HQ Mockup
          </button>
          <button onClick={onBack} className="w-full py-2 text-xs font-bold text-zinc-500 hover:text-white flex items-center justify-center gap-2 transition-colors uppercase"><ArrowLeft size={14} /> Back to Editor</button>
        </div>
      </div>
    </div>
  );
};

export default MockupStudio;