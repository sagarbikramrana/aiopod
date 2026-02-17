
import { RGB, HSL, ColorReplacement } from '../types';

export const getColorDistance = (c1: RGB, c2: RGB): number => {
  return Math.sqrt(Math.pow(c1.r - c2.r, 2) + Math.pow(c1.g - c2.g, 2) + Math.pow(c1.b - c2.b, 2));
};

export const hexToRgb = (hex: string): RGB => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
};

export const rgbToHsl = (r: number, g: number, b: number): HSL => {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
};

export const hslToRgb = (h: number, s: number, l: number): RGB => {
  h /= 360; s /= 100; l /= 100;
  let r, g, b;
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  r = hue2rgb(p, q, h + 1 / 3); g = hue2rgb(p, q, h); b = hue2rgb(p, q, h - 1 / 3);
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
};

export const processImage = (
  ctx: CanvasRenderingContext2D,
  originalData: ImageData,
  removeTargets: { color: RGB; tolerance: number; feather: number }[],
  editTargets: ColorReplacement[]
): ImageData => {
  const processed = ctx.createImageData(originalData.width, originalData.height);
  const data = processed.data;
  const src = originalData.data;

  for (let i = 0; i < src.length; i += 4) {
    let r = src[i], g = src[i+1], b = src[i+2], a = src[i+3];
    if (a === 0) continue;

    const currentRGB = { r, g, b };
    
    // 1. Transparency Removal logic
    for (const t of removeTargets) {
      const dist = getColorDistance(currentRGB, t.color);
      if (dist <= t.tolerance) {
        a = 0;
      } else if (dist <= t.tolerance + t.feather) {
        const featherFactor = (dist - t.tolerance) / t.feather;
        const newAlpha = Math.floor(255 * featherFactor);
        a = Math.min(a, newAlpha);
      }
    }

    if (a === 0) {
      data[i+3] = 0;
      continue;
    }

    // 2. Selective Color Replacement with Soft Falloff
    for (const e of editTargets) {
      const dist = getColorDistance(currentRGB, e.target);
      const softEdge = 20; // Soft transition range
      
      if (dist <= e.tolerance + softEdge) {
        // Calculate influence factor (1 inside tolerance, 0 outside tolerance+softEdge)
        let factor = 1.0;
        if (dist > e.tolerance) {
          factor = 1.0 - ((dist - e.tolerance) / softEdge);
        }
        
        if (factor > 0) {
          const hsl = rgbToHsl(r, g, b);
          
          // Apply shifts scaled by factor
          let nh = (hsl.h + (e.hue * factor)) % 360; if (nh < 0) nh += 360;
          let ns = Math.max(0, Math.min(100, hsl.s + (e.sat * factor)));
          let nl = Math.max(0, Math.min(100, hsl.l + (e.lit * factor)));
          
          const nrgb = hslToRgb(nh, ns, nl);
          r = nrgb.r; g = nrgb.g; b = nrgb.b;
        }
      }
    }

    data[i] = r; data[i+1] = g; data[i+2] = b; data[i+3] = a;
  }
  return processed;
};
