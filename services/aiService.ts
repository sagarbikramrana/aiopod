import { GoogleGenAI } from "@google/genai";
import { getApiKeys } from './storage';
import { withRetry } from '../utils/apiUtils';
import { AIModel } from '../types';

interface GenerationResult {
  url: string;
  provider: string;
}

const getKeys = () => {
  const keys = getApiKeys();
  return {
    gemini: keys.gemini || process.env.API_KEY,
    huggingface: keys.huggingface,
    openai: keys.openai
  };
};

const resizeForApi = (base64Str: string, targetW: number = 1024, targetH: number = 1024): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error("Canvas context missing"));
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, targetW, targetH);
        const scale = Math.max(targetW / img.width, targetH / img.height);
        const x = (targetW / 2) - (img.width / 2) * scale;
        const y = (targetH / 2) - (img.height / 2) * scale;
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        resolve(canvas.toDataURL('image/png'));
      } catch (err) { reject(err); }
    };
    img.onerror = () => reject(new Error("Failed to load reference image."));
    img.src = base64Str;
  });
};

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const generatePollinations = async (
  prompt: string,
  style: string,
  bgColor: string,
  model: string = 'flux',
  mode: 'default' | 'pattern' | 'sticker' = 'default',
  aspectRatio: string = "1:1"
): Promise<string> => {
  const stylePart = style === "None" ? "" : `${style} design, `;
  let modePart = "";
  if (mode === 'pattern') modePart = "SEAMLESS TILEABLE FLAT PATTERN, repeating edges, ";
  if (mode === 'sticker') modePart = "DIE-CUT STICKER GRAPHIC, white border, bold vector, ";

  let width = 1024, height = 1024;
  if (aspectRatio === "3:4") { width = 896; height = 1152; }
  else if (aspectRatio === "4:3") { width = 1152; height = 896; }

  const fullPrompt = encodeURIComponent(`isolated professional ${modePart}${stylePart}${prompt}. graphic design style, centered, on solid ${bgColor} background, wide margin, clean sharp vector lines, no shadows, no blur, high contrast.`);
  const seed = Math.floor(Math.random() * 999999);
  const url = `https://image.pollinations.ai/prompt/${fullPrompt}?width=${width}&height=${height}&seed=${seed}&model=${model}&nologo=true`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${model.toUpperCase()} API failed with status ${response.status}`);
  const blob = await response.blob();
  return await blobToBase64(blob);
};

const generateDalle = async (
  prompt: string,
  style: string,
  bgColor: string = "WHITE",
  mode: 'default' | 'pattern' | 'sticker' = 'default',
  aspectRatio: string = "1:1"
): Promise<string> => {
  const apiKey = getKeys().openai;
  if (!apiKey) throw new Error("OpenAI API Key missing.");

  const stylePart = style === "None" ? "" : `${style} style. `;
  let modePart = "";
  if (mode === 'pattern') modePart = "SEAMLESS VECTOR PATTERN TILE. Edges must match. ";
  if (mode === 'sticker') modePart = "Bold Die-cut sticker with thick white offset border. ";

  const fullPrompt = `${modePart}Isolated ${stylePart}${prompt}. Professional Graphic Design aesthetic, Kittl-style, centered, high-contrast flat colors on solid ${bgColor} background. Sharp vector edges, no gradients, no photorealism.`;
  const size = aspectRatio === "3:4" ? "1024x1792" : aspectRatio === "4:3" ? "1792x1024" : "1024x1024";

  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "dall-e-3",
      prompt: fullPrompt,
      n: 1,
      size,
      response_format: "b64_json"
    })
  });

  const data = await response.json();
  if (data.error) throw new Error(`OpenAI Error: ${data.error.message}`);
  if (data.data?.[0]?.b64_json) return `data:image/png;base64,${data.data[0].b64_json}`;
  throw new Error("DALL-E 3 failed to return image data.");
};

const generateGemini = async (
  prompt: string,
  style: string,
  bgColor: string = "WHITE",
  refImageBase64?: string,
  mode: 'default' | 'pattern' | 'sticker' = 'default',
  aspectRatio: string = "1:1",
  modelId: string = 'gemini-2.5-flash-image'
): Promise<string> => {
  const apiKey = getKeys().gemini;
  if (!apiKey) throw new Error("Gemini API key missing.");
  const ai = new GoogleGenAI({ apiKey });

  let parts: any[] = [];
  const stylePart = style === "None" ? "" : `${style} style `;
  let modePart = "";
  if (mode === 'pattern') modePart = "SEAMLESS VECTOR TILE. Repeating edges. ";
  if (mode === 'sticker') modePart = "BOLD VECTOR STICKER. Die-cut white border. ";

  const baseInstruction = `isolated ${modePart}${stylePart}graphic design. Subject: ${prompt}. Solid ${bgColor} background. Flat design, sharp edges, print-ready, centered.`;

  if (refImageBase64) {
    const resizedBase64 = await resizeForApi(refImageBase64, 1024, 1024);
    const matches = resizedBase64.match(/^data:(.+);base64,(.+)$/);
    if (!matches) throw new Error("Invalid reference image data");
    parts = [
      { inlineData: { mimeType: matches[1], data: matches[2] } },
      { text: `Re-imagine this image as a professional ${baseInstruction}` }
    ];
  } else {
    parts = [{ text: `Create a professional ${baseInstruction}` }];
  }

  const response = await ai.models.generateContent({
    model: modelId,
    contents: { parts },
    config: { imageConfig: { aspectRatio: aspectRatio as any } }
  });

  const data = response.candidates?.[0]?.content?.parts.find(p => p.inlineData)?.inlineData?.data;
  if (data) return `data:image/png;base64,${data}`;
  throw new Error(`Gemini (${modelId}) produced no image data`);
};

export const generateDesignWithFallback = async (
  prompt: string,
  style: string,
  bgColor: string = "WHITE",
  refImageBase64?: string,
  preferredModel: AIModel = 'auto',
  mode: 'default' | 'pattern' | 'sticker' = 'default',
  aspectRatio: string = "1:1"
): Promise<GenerationResult> => {

  const providers: { id: AIModel; name: string; fn: () => Promise<string> }[] = [
    { id: 'gemini', name: 'Gemini Standard (Free)', fn: () => generateGemini(prompt, style, bgColor, refImageBase64, mode, aspectRatio, 'gemini-1.5-flash') },
    { id: 'nano-banana', name: 'Banana Flash (Fast)', fn: () => generateGemini(prompt, style, bgColor, refImageBase64, mode, aspectRatio, 'gemini-1.5-flash') },
    { id: 'nano-banana-pro', name: 'Banana Pro (HD)', fn: () => generateGemini(prompt, style, bgColor, refImageBase64, mode, aspectRatio, 'gemini-1.5-pro') },
    { id: 'flux', name: 'Flux Pro', fn: () => generatePollinations(prompt, style, bgColor, 'flux', mode, aspectRatio) },
    { id: 'dalle', name: 'DALL-E 3', fn: () => generateDalle(prompt, style, bgColor, mode, aspectRatio) },
    { id: 'sdxl', name: 'SDXL Vector', fn: () => generatePollinations(prompt, style, bgColor, 'sdxl', mode, aspectRatio) },
    { id: 'sd3', name: 'SD 3.5 Turbo', fn: () => generatePollinations(prompt, style, bgColor, 'turbo', mode, aspectRatio) },
  ];

  const chain = preferredModel === 'auto'
    ? providers
    : [
      ...providers.filter(p => p.id === preferredModel),
      ...providers.filter(p => p.id !== preferredModel)
    ];

  const errors: string[] = [];

  for (const provider of chain) {
    try {
      console.log(`[AI Engine] Attempting with ${provider.name}...`);
      const url = await withRetry(provider.fn, 2);
      return { url, provider: provider.name };
    } catch (e: any) {
      const msg = `[${provider.name}]: ${e.message}`;
      console.warn(msg);
      errors.push(msg);
    }
  }

  throw new Error(`All models failed:\n${errors.join('\n')}`);
};