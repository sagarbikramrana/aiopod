import React, { useRef, useEffect, useState, useCallback } from 'react';
import { EditorTool, EditorState, Layer, TextLayer, ImageLayer, MaskPath, ExportFormat } from '../types';
import { processImage } from '../utils/colorUtils';
import { applyFilters } from '../utils/filterUtils';
import { drawText, drawStickerBorder, getExportCanvas } from '../utils/canvasRenderer';
import EditorToolbar from './EditorToolbar';
import { modifyDesign, generateComponent, removeBackgroundAI } from '../services/gemini';
import { Loader2, ChevronRight } from 'lucide-react';

interface EditorProps {
  imageUrl: string; setImageUrl: (url: string) => void;
  state: EditorState; setState: React.Dispatch<React.SetStateAction<EditorState>>;
  onComplete: (processedUrl: string) => void; onBack: () => void;
}

const Editor: React.FC<EditorProps> = ({ imageUrl, setImageUrl, state, setState, onComplete, onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contentCanvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));
  const layerImageCache = useRef<Record<string, HTMLImageElement>>({});
  const [originalImageData, setOriginalImageData] = useState<ImageData | null>(null);
  const [activeTool, setActiveTool] = useState<EditorTool>(EditorTool.NONE);
  const [zoom, setZoom] = useState(0.8);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [isAILoading, setIsAILoading] = useState(false);
  const [currentPath, setCurrentPath] = useState<MaskPath | null>(null);

  useEffect(() => {
    const img = new Image(); img.crossOrigin = "anonymous"; img.src = imageUrl;
    img.onload = () => {
      const c = canvasRef.current; if (!c) return;
      c.width = img.width; c.height = img.height;
      contentCanvasRef.current.width = img.width; contentCanvasRef.current.height = img.height;
      const ctx = contentCanvasRef.current.getContext('2d', { willReadFrequently: true })!;
      ctx.drawImage(img, 0, 0); 
      setOriginalImageData(ctx.getImageData(0, 0, img.width, img.height));
      setZoom(Math.min(0.8, (window.innerWidth * 0.6) / img.width));
    };
  }, [imageUrl]);

  const handleDownload = (format: ExportFormat) => {
    const base = contentCanvasRef.current;
    const final = getExportCanvas(base, state, format === ExportFormat.JPG_WHITE);
    const link = document.createElement('a');
    link.download = `POD-MASTER-${format}-${Date.now()}.${format === ExportFormat.JPG_WHITE ? 'jpg' : 'png'}`;
    link.href = final.toDataURL(format === ExportFormat.JPG_WHITE ? 'image/jpeg' : 'image/png', 1.0);
    link.click();
  };

  const getCanvasCoords = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    return { x, y };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (activeTool === EditorTool.NONE) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    const { x, y } = getCanvasCoords(e);
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;

    if (activeTool === EditorTool.PICKER_REMOVE || activeTool === EditorTool.PICKER_EDIT) {
      const rect = canvas.getBoundingClientRect();
      const localX = (e.clientX - rect.left) / zoom;
      const localY = (e.clientY - rect.top) / zoom;
      const pixel = ctx.getImageData(localX, localY, 1, 1).data;
      const pickedColor = { r: pixel[0], g: pixel[1], b: pixel[2] };

      if (activeTool === EditorTool.PICKER_REMOVE) {
        setState(s => ({
          ...s,
          removeColors: [...s.removeColors, { id: Date.now().toString(), color: pickedColor, tolerance: 30, feather: 10 }]
        }));
      } else {
        setState(s => ({
          ...s,
          editColors: [...s.editColors, { id: Date.now().toString(), target: pickedColor, hue: 0, sat: 0, lit: 0, tolerance: 30 }]
        }));
      }
      setActiveTool(EditorTool.NONE);
    } else if (activeTool === EditorTool.MASK_BRUSH) {
      setCurrentPath({
        id: Date.now().toString(),
        type: 'brush',
        points: [{ x: (x / canvas.width) * 100, y: (y / canvas.height) * 100 }],
        width: state.brushSize
      });
    } else if (activeTool === EditorTool.SELECT_AREA) {
      setState(s => ({ ...s, selection: { x: (x / canvas.width) * 100, y: (y / canvas.height) * 100, width: 0, height: 0 } }));
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
      return;
    }

    if (!canvasRef.current) return;
    const { x, y } = getCanvasCoords(e);
    const canvas = canvasRef.current;

    if (activeTool === EditorTool.MASK_BRUSH && currentPath) {
      setCurrentPath(p => p ? ({
        ...p,
        points: [...p.points, { x: (x / canvas.width) * 100, y: (y / canvas.height) * 100 }]
      }) : null);
    } else if (activeTool === EditorTool.SELECT_AREA && state.selection) {
      setState(s => {
        if (!s.selection) return s;
        return {
          ...s,
          selection: {
            ...s.selection,
            width: (x / canvas.width) * 100 - s.selection.x,
            height: (y / canvas.height) * 100 - s.selection.y
          }
        };
      });
    }
  };

  const handlePointerUp = () => {
    if (isDragging) setIsDragging(false);
    if (currentPath) {
      setState(s => ({ ...s, maskPaths: [...s.maskPaths, currentPath] }));
      setCurrentPath(null);
    }
  };

  const renderCanvas = useCallback(() => {
    if (!canvasRef.current || !originalImageData) return;
    const mainCtx = canvasRef.current.getContext('2d')!;
    const contentCtx = contentCanvasRef.current.getContext('2d')!;
    const w = canvasRef.current.width; const h = canvasRef.current.height;
    
    contentCtx.clearRect(0, 0, w, h);
    const processed = processImage(contentCtx, originalImageData, state.removeColors, state.editColors);
    contentCtx.putImageData(applyFilters(processed, state.filters), 0, 0);
    
    contentCtx.save(); contentCtx.globalCompositeOperation = 'destination-out';
    [...state.maskPaths, ...(currentPath ? [currentPath] : [])].forEach(p => {
      contentCtx.beginPath(); contentCtx.lineWidth = p.width; contentCtx.lineCap = 'round';
      if (p.type === 'brush' && p.points.length > 0) {
        contentCtx.moveTo((w * p.points[0].x) / 100, (h * p.points[0].y) / 100);
        p.points.forEach(pt => contentCtx.lineTo((w * pt.x) / 100, (h * pt.y) / 100));
        contentCtx.stroke();
      }
      else if (p.type === 'rect' && p.points.length >= 2) {
        contentCtx.fillRect((w * p.points[0].x) / 100, (h * p.points[0].y) / 100, (w * (p.points[p.points.length - 1].x - p.points[0].x)) / 100, (h * (p.points[p.points.length - 1].y - p.points[0].y)) / 100);
      }
    });
    contentCtx.restore();

    state.layers.filter(l => l.visible).forEach(l => {
      contentCtx.save(); contentCtx.translate((w * l.x) / 100, (h * l.y) / 100); contentCtx.rotate((l.rotation * Math.PI) / 180);
      contentCtx.scale(l.scale / 100, l.scale / 100); contentCtx.globalAlpha = l.opacity / 100;
      if (l.type === 'text') drawText(contentCtx, l as TextLayer);
      else {
        const imgLayer = l as ImageLayer;
        let img = layerImageCache.current[imgLayer.url];
        if (!img) { img = new Image(); img.crossOrigin = "anonymous"; img.src = imgLayer.url; layerImageCache.current[imgLayer.url] = img; }
        if (img.complete && img.naturalWidth > 0) contentCtx.drawImage(img, -w * 0.2, -w * 0.2 * (img.height / img.width), w * 0.4, w * 0.4 * (img.height / img.width));
      }
      contentCtx.restore();
    });

    if (state.isSticker) drawStickerBorder(contentCtx, state);
    
    mainCtx.clearRect(0, 0, w, h);
    mainCtx.drawImage(getExportCanvas(contentCanvasRef.current, state, true), 0, 0);

    // Draw Selection Overlay
    if (activeTool === EditorTool.SELECT_AREA && state.selection) {
      mainCtx.strokeStyle = '#6366f1';
      mainCtx.lineWidth = 2 / zoom;
      mainCtx.setLineDash([5, 5]);
      mainCtx.strokeRect(
        (state.selection.x * w) / 100,
        (state.selection.y * h) / 100,
        (state.selection.width * w) / 100,
        (state.selection.height * h) / 100
      );
      mainCtx.setLineDash([]);
    }
  }, [originalImageData, state, currentPath, zoom, activeTool]);

  useEffect(() => { const frame = requestAnimationFrame(renderCanvas); return () => cancelAnimationFrame(frame); }, [renderCanvas]);

  return (
    <div className="h-full flex flex-col lg:flex-row relative overflow-hidden bg-zinc-950">
      {isAILoading && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex flex-col items-center justify-center backdrop-blur-md">
          <Loader2 className="animate-spin text-indigo-500 mb-4" size={48} />
          <p className="text-white text-xs font-black uppercase tracking-widest animate-pulse">Neural Syncing...</p>
        </div>
      )}
      <div 
        className={`flex-1 min-h-0 bg-zinc-900 border-b lg:border-r border-zinc-800 relative overflow-hidden flex items-center justify-center touch-none ${activeTool !== EditorTool.NONE ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing'}`} 
        onPointerDown={handlePointerDown} 
        onPointerMove={handlePointerMove} 
        onPointerUp={handlePointerUp}
      >
        <canvas 
          ref={canvasRef} 
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }} 
          className="shadow-2xl bg-zinc-950 max-w-full max-h-full" 
        />
        <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
          <button onClick={() => setZoom(z => z * 1.2)} className="p-3 bg-zinc-800 text-white rounded-xl border border-zinc-700 hover:bg-zinc-700 shadow-xl transition-all"><ChevronRight className="-rotate-90" size={18}/></button>
          <button onClick={() => setZoom(z => Math.max(0.1, z * 0.8))} className="p-3 bg-zinc-800 text-white rounded-xl border border-zinc-700 hover:bg-zinc-700 shadow-xl transition-all"><ChevronRight className="rotate-90" size={18}/></button>
          <button onClick={() => { setPan({ x: 0, y: 0 }); setZoom(0.8); }} className="p-3 bg-zinc-800 text-white rounded-xl border border-zinc-700 hover:bg-zinc-700 shadow-xl transition-all text-[10px] font-bold">1:1</button>
        </div>
      </div>
      <EditorToolbar 
        state={state} 
        updateState={u => setState(p => ({...p, ...u}))} 
        activeTool={activeTool} 
        setActiveTool={setActiveTool} 
        onComplete={() => onComplete(getExportCanvas(contentCanvasRef.current, state, false).toDataURL())} 
        onBack={onBack} 
        onDownload={handleDownload} 
        onAIRemoveBackground={async () => { 
          setIsAILoading(true); 
          try {
            const url = await removeBackgroundAI(contentCanvasRef.current.toDataURL()); 
            setImageUrl(url); 
          } catch(e) { alert("Background removal failed"); }
          setIsAILoading(false); 
        }} 
        onAIExtend={async (p) => { 
          setIsAILoading(true); 
          try {
            const url = await modifyDesign(contentCanvasRef.current.toDataURL(), p); 
            setImageUrl(url); 
          } catch(e) { alert("AI Modification failed"); }
          setIsAILoading(false); 
        }} 
        onAIAddComponent={async (p) => { 
          setIsAILoading(true); 
          try {
            const url = await generateComponent(p, []); 
            setState(s => ({...s, layers: [...s.layers, { id: Date.now().toString(), type: 'image', url, x: 50, y: 50, scale: 50, rotation: 0, opacity: 100, visible: true }]})); 
          } catch(e) { alert("Component generation failed"); }
          setIsAILoading(false); 
        }} 
        selectedLayerId={selectedLayerId} 
      />
    </div>
  );
};

export default Editor;