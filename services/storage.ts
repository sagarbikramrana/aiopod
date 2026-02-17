import { DEFAULT_TEXTURES, SavedPrompt } from '../types';

export interface CategorizedStyles {
  [category: string]: string[];
}

const DEFAULT_STYLES: CategorizedStyles = {
  "Logo & Mascot": ["Bold Sport Mascot", "Vintage Badge", "Minimalist Vector Logo", "Circular Emblem", "Heraldic Shield", "Crest Style"],
  "Illustration Style": ["High-Contrast Woodcut", "Linocut Print", "Ukiyo-e Inspired", "Duo-Tone Vector", "Stipple Art", "Risograph", "Black & White Doodle Sketch"],
  "Textile & Pattern": ["Flat Geometric Pattern", "Boho Floral Tile", "Ditsy Print", "Tribal Vector", "Memphis Design", "Abstract Bauhaus"],
  "Modern Apparel": ["Streetwear Graphic", "Y2K Cyber-Vector", "Acid Wash Aesthetic", "90s Retro Sport", "Distressed Vintage", "Glitch Aesthetic"],
  "Clean & Minimal": ["Thin Line Art", "Swiss Typography Layout", "Scandinavian Flat Design", "Mono-line Illustration", "Organic Shapes"],
  "Cute & Playful": ["Kawaii Sticker Graphic", "Hand-Drawn Doodle", "Crayon Sketch", "Pastel Pop Art", "Chibi Character", "Messy Marker Sketch"]
};

const DEFAULT_MOCKUPS = {
  apparel: [
    "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop", 
    "https://images.unsplash.com/photo-1503341455253-b2e723099de5?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=800&auto=format&fit=crop",
  ],
  home: [
    "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?q=80&w=800&auto=format&fit=crop", 
    "https://images.unsplash.com/photo-1584100936595-c0654b55a2e6?q=80&w=800&auto=format&fit=crop", 
    "https://plus.unsplash.com/premium_photo-1675808560942-83416b0808b2?q=80&w=800&auto=format&fit=crop",
  ],
  accessories: [
    "https://images.unsplash.com/photo-1578353022142-091753d59042?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1588645065097-9e7978255b91?q=80&w=800&auto=format&fit=crop",
  ],
  custom: []
};

const STORAGE_KEYS = {
  STYLES_V2: 'pod_store_v6_categorized_styles',
  MOCKUPS: 'pod_store_v5_mockups',
  TEXTURES: 'pod_store_v5_textures',
  API_KEYS: 'pod_store_v5_api_keys',
  SAVED_PROMPTS: 'pod_store_v1_saved_prompts'
};

export const getSavedPrompts = (): SavedPrompt[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.SAVED_PROMPTS);
  return stored ? JSON.parse(stored) : [];
};

export const addSavedPrompt = (text: string): SavedPrompt[] => {
  const current = getSavedPrompts();
  const newItem: SavedPrompt = { id: Date.now().toString(), text, timestamp: Date.now() };
  const updated = [newItem, ...current].slice(0, 50);
  localStorage.setItem(STORAGE_KEYS.SAVED_PROMPTS, JSON.stringify(updated));
  return updated;
};

export const removeSavedPrompt = (id: string): SavedPrompt[] => {
  const updated = getSavedPrompts().filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEYS.SAVED_PROMPTS, JSON.stringify(updated));
  return updated;
};

export const getStyles = (): CategorizedStyles => {
  const stored = localStorage.getItem(STORAGE_KEYS.STYLES_V2);
  return stored ? JSON.parse(stored) : DEFAULT_STYLES;
};

export const saveStyles = (styles: CategorizedStyles) => {
  localStorage.setItem(STORAGE_KEYS.STYLES_V2, JSON.stringify(styles));
};

export const addStyle = (category: string, style: string) => {
  const current = getStyles();
  if (!current[category]) current[category] = [];
  if (!current[category].includes(style)) {
    current[category].push(style);
    saveStyles(current);
  }
  return current;
};

export const removeStyle = (category: string, style: string) => {
  const current = getStyles();
  if (current[category]) {
    current[category] = current[category].filter(s => s !== style);
    if (current[category].length === 0) delete current[category];
    saveStyles(current);
  }
  return current;
};

export const getMockups = () => {
  const stored = localStorage.getItem(STORAGE_KEYS.MOCKUPS);
  if (!stored) return JSON.parse(JSON.stringify(DEFAULT_MOCKUPS));
  try {
    const parsed = JSON.parse(stored);
    const defaults = DEFAULT_MOCKUPS;
    const validate = (arr: any, fallback: string[]) => (Array.isArray(arr)) ? arr : fallback;
    return {
      apparel: validate(parsed.apparel, defaults.apparel),
      home: validate(parsed.home, defaults.home),
      accessories: validate(parsed.accessories, defaults.accessories),
      custom: validate(parsed.custom, defaults.custom)
    };
  } catch (e) {
    return JSON.parse(JSON.stringify(DEFAULT_MOCKUPS));
  }
};

export const addMockup = (category: 'apparel' | 'home' | 'accessories' | 'custom', url: string) => {
  const current = getMockups();
  current[category] = [url, ...(current[category] || [])];
  localStorage.setItem(STORAGE_KEYS.MOCKUPS, JSON.stringify(current));
  return current;
};

export const removeMockup = (category: 'apparel' | 'home' | 'accessories' | 'custom', url: string) => {
  const current = getMockups();
  if (current[category]) {
    current[category] = current[category].filter((u: string) => u !== url);
    localStorage.setItem(STORAGE_KEYS.MOCKUPS, JSON.stringify(current));
  }
  return current;
};

export const getTextures = () => {
  const stored = localStorage.getItem(STORAGE_KEYS.TEXTURES);
  return stored ? JSON.parse(stored) : DEFAULT_TEXTURES;
};

export const addTexture = (name: string, url: string) => {
  const current = getTextures();
  const updated = [...current, { name, url }];
  localStorage.setItem(STORAGE_KEYS.TEXTURES, JSON.stringify(updated));
  return updated;
};

export const removeTexture = (url: string) => {
  const current = getTextures();
  const updated = current.filter((t: any) => t.url !== url);
  localStorage.setItem(STORAGE_KEYS.TEXTURES, JSON.stringify(updated));
  return updated;
};

export const getApiKeys = () => {
  const stored = localStorage.getItem(STORAGE_KEYS.API_KEYS);
  return stored ? JSON.parse(stored) : { gemini: '', stability: '', openai: '', huggingface: '' };
};

export const saveApiKeys = (keys: any) => {
  localStorage.setItem(STORAGE_KEYS.API_KEYS, JSON.stringify(keys));
};

export const resetToDefaults = () => {
  localStorage.removeItem(STORAGE_KEYS.STYLES_V2);
  localStorage.removeItem(STORAGE_KEYS.MOCKUPS);
  localStorage.removeItem(STORAGE_KEYS.TEXTURES);
  localStorage.removeItem(STORAGE_KEYS.API_KEYS);
  localStorage.removeItem(STORAGE_KEYS.SAVED_PROMPTS);
};