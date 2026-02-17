
import { ImageFilters } from '../types';

export const applyFilters = (
  data: ImageData,
  filters: ImageFilters
): ImageData => {
  const { brightness, contrast, saturation, noise, vintage, posterize, halftone, inkBleed, crackle } = filters;
  const w = data.width;
  const h = data.height;
  const dst = new Uint8ClampedArray(data.data);

  const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));
  const satMult = 1 + (saturation / 100);
  const vintageFactor = vintage / 100;
  const halftoneSize = halftone > 0 ? Math.max(2, Math.floor(halftone / 5)) : 0;

  for (let i = 0; i < dst.length; i += 4) {
    let r = dst[i];
    let g = dst[i + 1];
    let b = dst[i + 2];
    let a = dst[i + 3];

    if (a === 0) continue;

    // 1. Ink Bleed Simulation (Micro-blur on edges only)
    if (inkBleed > 0) {
      const bleedFactor = inkBleed / 50;
      // Simple approximation: if alpha is semi-transparent, it's an edge
      if (a < 240) {
        a = Math.min(255, a + (Math.random() * bleedFactor * 20));
        r *= (1 + Math.random() * bleedFactor * 0.1);
        g *= (1 + Math.random() * bleedFactor * 0.1);
        b *= (1 + Math.random() * bleedFactor * 0.1);
      }
    }

    // 2. Brightness & Contrast
    r = contrastFactor * (r + brightness - 128) + 128;
    g = contrastFactor * (g + brightness - 128) + 128;
    b = contrastFactor * (b + brightness - 128) + 128;

    // 3. Saturation
    if (saturation !== 0) {
      const gray = 0.2989 * r + 0.5870 * g + 0.1140 * b;
      r = gray + (r - gray) * satMult;
      g = gray + (g - gray) * satMult;
      b = gray + (b - gray) * satMult;
    }

    // 4. Crackle / Distressing
    if (crackle > 0) {
      // Procedural "cracks" based on coordinate noise
      const x = (i / 4) % w;
      const y = Math.floor((i / 4) / w);
      const crackleNoise = Math.sin(x * 0.1) * Math.cos(y * 0.1) + Math.sin(x * 0.05 + y * 0.05);
      if (crackleNoise > (2.5 - (crackle / 40))) {
        a *= (1 - (crackle / 100)); // Make it look like the ink flaked off
      }
    }

    // 5. Vintage
    if (vintage > 0) {
      const tr = (r * 0.393) + (g * 0.769) + (b * 0.189);
      const tg = (r * 0.349) + (g * 0.686) + (b * 0.168);
      const tb = (r * 0.272) + (g * 0.534) + (b * 0.131);
      r = r * (1 - vintageFactor) + tr * vintageFactor;
      g = g * (1 - vintageFactor) + tg * vintageFactor;
      b = b * (1 - vintageFactor) + tb * vintageFactor;
    }

    // 6. Halftone
    if (halftoneSize > 0) {
      const x = (i / 4) % w;
      const y = Math.floor((i / 4) / w);
      const centerX = Math.floor(x / halftoneSize) * halftoneSize + halftoneSize / 2;
      const centerY = Math.floor(y / halftoneSize) * halftoneSize + halftoneSize / 2;
      const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      const maxRadius = (halftoneSize / 2) * 1.2;
      const dotRadius = maxRadius * (1 - (gray / 255));
      if (dist > dotRadius) {
        const dim = 0.4;
        r *= dim; g *= dim; b *= dim;
      }
    }

    // 7. Posterize
    if (posterize > 0) {
      const levels = Math.max(2, 34 - posterize); 
      const step = 255 / (levels - 1);
      r = Math.round(r / step) * step;
      g = Math.round(g / step) * step;
      b = Math.round(b / step) * step;
    }

    // 8. Noise
    if (noise > 0) {
      const random = (Math.random() - 0.5) * noise;
      r += random; g += random; b += random;
    }

    dst[i] = r; dst[i + 1] = g; dst[i + 2] = b; dst[i + 3] = a;
  }

  return new ImageData(dst, w, h);
};
