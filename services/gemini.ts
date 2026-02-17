import { GoogleGenAI } from "@google/genai";
import { getApiKeys } from './storage';
import { PodSizeTemplate } from '../types';
import { withRetry } from '../utils/apiUtils';

const createClient = () => {
  const storedKeys = getApiKeys();
  const apiKey = storedKeys.gemini || process.env.API_KEY;
  if (!apiKey) throw new Error("API Key missing.");
  return new GoogleGenAI({ apiKey });
};

export const enhancePrompt = async (
  simplePrompt: string,
  styles: string[],
  bgColor: string = "PURE WHITE",
  aspectRatio: string = "1:1"
): Promise<string> => {
  return withRetry(async () => {
    const ai = createClient();

    const styleContext = styles.length === 0
      ? "Professional high-end graphic design."
      : `Integration of: ${styles.join(', ')}.`;

    const prompt = `Act as a Senior Graphic Design Architect for premium Print-on-Demand merchandise.
    Concept: "${simplePrompt}"
    Required Styles: ${styleContext}
    Orientation: ${aspectRatio} format.
    
    DESIGN ARCHITECTURE DIRECTIVES:
    1. STRUCTURE: Define the composition as a 'centered mascot', 'vintage circular badge', or 'isolated vector emblem'.
    2. STROKE: Mandate thick, constant-width 4pt outlines for print clarity. No soft edges.
    3. COLOR: Demand a 'limited flat spot-color palette' (max 5 colors). Strictly forbid photorealism, gradients, and lens flares.
    4. ISOLATION: Subject must be centered on solid ${bgColor.toUpperCase()} background. No shadows or ambient occlusion on the background.
    5. TERMINOLOGY: Use professional terms: 'Vector silhouette', 'Negative space balance', 'Visual hierarchy', 'Flat fill'.
    
    TASK: Write a 40-word technical prompt for a professional generation engine. No generic artistic fluff.`;

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash-latest',
      contents: prompt
    });
    return response.text?.trim() || simplePrompt;
  });
};

export const removeBackgroundAI = async (imageBase64: string): Promise<string> => {
  return withRetry(async () => {
    const ai = createClient();
    const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash-latest',
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType: 'image/png' } },
          { text: "Segment the main subject from this image. Return ONLY the subject on a pure LIME GREEN background. Ensure the edges are extremely sharp and clean for background removal. No shadows, no gradients on the background." }
        ],
      }
    });
    const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    if (part?.inlineData?.data) return `data:image/png;base64,${part.inlineData.data}`;
    throw new Error("AI Background removal failed.");
  });
};

export const modifyDesign = async (imageBase64: string, modificationPrompt: string): Promise<string> => {
  return withRetry(async () => {
    const ai = createClient();
    const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType: 'image/png' } },
          { text: `Technical Remaster: "${modificationPrompt}". Preserve vector line weight. Maintain flat color regions. Background must remain solid.` }
        ],
      }
    });
    const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    if (part?.inlineData?.data) return `data:image/png;base64,${part.inlineData.data}`;
    throw new Error("AI modification failed.");
  });
};

export const generateComponent = async (prompt: string, styles: string[]): Promise<string> => {
  return withRetry(async () => {
    const ai = createClient();
    const stylePart = styles.length > 0 ? ` in ${styles.join(', ')} design` : '';
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: `Isolated graphic component: ${prompt}${stylePart}. Flat design, clean vector paths, pure white background, zero shadows.` }]
      }
    });
    const data = response.candidates?.[0]?.content?.parts.find(p => p.inlineData)?.inlineData?.data;
    if (data) return `data:image/png;base64,${data}`;
    throw new Error("AI component generation failed.");
  });
};

export const upscaleDesign = async (imageBase64: string, template: PodSizeTemplate): Promise<string> => {
  return withRetry(async () => {
    const ai = createClient();
    const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType: 'image/png' } },
          { text: `High-resolution remaster for "${template.label}". Sharpen all edges. Simplify colors into professional flat zones. Print-ready master.` }
        ],
      },
      config: { imageConfig: { aspectRatio: template.aspectRatio } }
    });
    const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    if (part?.inlineData?.data) return `data:image/png;base64,${part.inlineData.data}`;
    throw new Error("Remastering failed.");
  });
};