import { EditorState, TextLayer } from '../types';

export const drawText = (ctx: CanvasRenderingContext2D, layer: TextLayer) => {
  ctx.save();
  ctx.font = `bold ${layer.size}px ${layer.fontFamily}`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = layer.color;
  if (layer.shadowBlur > 0) { ctx.shadowColor = layer.shadowColor; ctx.shadowBlur = layer.shadowBlur; }
  
  const chars = layer.text.split('');
  const spacing = layer.letterSpacing || 0;
  const curve = layer.curve || 0;

  if (curve === 0) {
    const charWidths = chars.map(c => ctx.measureText(c).width + spacing);
    const totalWidth = charWidths.reduce((a, b) => a + b, 0) - spacing;
    let curX = -totalWidth / 2;
    chars.forEach((char) => {
      const cw = ctx.measureText(char).width;
      if (layer.strokeWidth > 0) { ctx.strokeStyle = layer.strokeColor; ctx.lineWidth = layer.strokeWidth; ctx.strokeText(char, curX + cw/2, 0); }
      ctx.fillText(char, curX + cw / 2, 0);
      curX += cw + spacing;
    });
  } else {
    const radius = 10000 / Math.abs(curve);
    const angleStep = (layer.size + spacing) / radius;
    const startAngle = (curve > 0 ? -Math.PI / 2 : Math.PI / 2) - (angleStep * chars.length) / 2;
    chars.forEach((char, i) => {
      const angle = startAngle + (i + 0.5) * angleStep;
      ctx.save();
      if (curve > 0) { ctx.translate(Math.cos(angle) * radius, Math.sin(angle) * radius + radius); ctx.rotate(angle + Math.PI / 2); }
      else { ctx.translate(Math.cos(angle) * radius, Math.sin(angle) * radius - radius); ctx.rotate(angle - Math.PI / 2); }
      if (layer.strokeWidth > 0) { ctx.strokeStyle = layer.strokeColor; ctx.lineWidth = layer.strokeWidth; ctx.strokeText(char, 0, 0); }
      ctx.fillText(char, 0, 0);
      ctx.restore();
    });
  }
  ctx.restore();
};

export const drawStickerBorder = (ctx: CanvasRenderingContext2D, state: EditorState) => {
  if (!state.isSticker) return;
  const w = ctx.canvas.width; const h = ctx.canvas.height;
  const borderCanvas = document.createElement('canvas'); borderCanvas.width = w; borderCanvas.height = h;
  const bCtx = borderCanvas.getContext('2d', { willReadFrequently: true })!;
  bCtx.save();
  bCtx.shadowColor = state.stickerBorderColor; bCtx.shadowBlur = state.stickerBorderWidth / 2;
  bCtx.strokeStyle = state.stickerBorderColor; bCtx.lineWidth = state.stickerBorderWidth * 2;
  bCtx.lineCap = 'round'; bCtx.lineJoin = 'round';
  bCtx.drawImage(ctx.canvas, 0, 0);
  bCtx.globalCompositeOperation = 'source-in';
  bCtx.fillStyle = state.stickerBorderColor; bCtx.fillRect(0, 0, w, h);
  bCtx.globalCompositeOperation = 'destination-over';
  const offset = state.stickerBorderWidth;
  for (let a = 0; a < 360; a += 45) bCtx.drawImage(ctx.canvas, Math.cos(a) * offset, Math.sin(a) * offset);
  bCtx.restore();
  ctx.save(); ctx.globalCompositeOperation = 'destination-over'; ctx.drawImage(borderCanvas, 0, 0); ctx.restore();
};

const textureCache: Record<string, { img: HTMLImageElement, broken: boolean }> = {};

export const getExportCanvas = (baseCanvas: HTMLCanvasElement, state: EditorState, includeFabric: boolean) => {
  const w = baseCanvas.width; const h = baseCanvas.height;
  const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  
  if (includeFabric) { ctx.fillStyle = state.fabricColor; ctx.fillRect(0, 0, w, h); }
  
  const drawDesign = (targetCtx: CanvasRenderingContext2D) => {
    if (state.isPattern) {
      const tileScale = state.patternScale / 100;
      const tW = w * tileScale; const tH = h * tileScale;
      const tile = document.createElement('canvas'); tile.width = tW; tile.height = tH;
      const tCtx = tile.getContext('2d')!;
      tCtx.translate(tW/2 + (state.patternOffsetX * tW / 100), tH/2 + (state.patternOffsetY * tH / 100));
      tCtx.rotate(state.patternRotation * Math.PI / 180);
      tCtx.drawImage(baseCanvas, -tW/2, -tH/2, tW, tH);
      const pattern = targetCtx.createPattern(tile, 'repeat');
      if (pattern) { targetCtx.fillStyle = pattern; targetCtx.fillRect(0, 0, w, h); }
    } else {
      targetCtx.drawImage(baseCanvas, 0, 0);
    }
  };

  drawDesign(ctx);

  if (includeFabric && state.filters.texture) {
    const texUrl = state.filters.texture;
    if (!textureCache[texUrl]) {
      const img = new Image(); img.crossOrigin = "anonymous";
      img.onerror = () => { if (textureCache[texUrl]) textureCache[texUrl].broken = true; };
      img.src = texUrl; textureCache[texUrl] = { img, broken: false };
    }
    const entry = textureCache[texUrl];
    if (entry.img.complete && entry.img.naturalWidth > 0 && !entry.broken) {
      try {
        ctx.save();
        ctx.globalAlpha = state.filters.textureOpacity / 100;
        ctx.globalCompositeOperation = 'overlay';
        const pat = ctx.createPattern(entry.img, 'repeat');
        if (pat) { ctx.fillStyle = pat; ctx.fillRect(0, 0, w, h); }
        ctx.restore();
      } catch (e) { console.warn("Pattern drawing failed:", e); }
    }
  }
  return canvas;
};