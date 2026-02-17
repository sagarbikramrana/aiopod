import { ReactNode } from 'react';

export enum AppStep {
  GENERATE = 'GENERATE',
  EDIT = 'EDIT',
  MOCKUP = 'MOCKUP',
  ADMIN = 'ADMIN'
}

export enum EditorTool {
  NONE = 'NONE',
  PICKER_REMOVE = 'PICKER_REMOVE',
  PICKER_EDIT = 'PICKER_EDIT',
  MASK_BRUSH = 'MASK_BRUSH',
  MASK_RECT = 'MASK_RECT',
  MASK_CIRCLE = 'MASK_CIRCLE',
  SELECT_AREA = 'SELECT_AREA'
}

export type AIModel = 'auto' | 'gemini' | 'nano-banana' | 'nano-banana-pro' | 'flux' | 'sdxl' | 'sd3' | 'dalle' | 'huggingface';

export interface GalleryItem {
  url: string;
  prompt: string;
  mode: 'default' | 'pattern' | 'sticker';
}

export interface SavedPrompt {
  id: string;
  text: string;
  timestamp: number;
}

export interface RGB { r: number; g: number; b: number; }
export interface HSL { h: number; s: number; l: number; }

export interface ColorReplacement {
  id: string;
  target: RGB;
  hue: number;
  sat: number;
  lit: number;
  tolerance: number;
}

export interface LayerBase {
  id: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
  visible: boolean;
}

export interface TextLayer extends LayerBase {
  type: 'text';
  text: string;
  fontFamily: string;
  color: string;
  size: number;
  strokeColor: string;
  strokeWidth: number;
  letterSpacing: number;
  curve: number; 
  shadowColor: string;
  shadowBlur: number;
}

export interface ImageLayer extends LayerBase {
  type: 'image';
  url: string;
}

export type Layer = TextLayer | ImageLayer;

export interface ImageFilters {
  brightness: number;
  contrast: number;
  saturation: number;
  noise: number;
  halftone: number;
  texture: string | null;
  textureOpacity: number;
  vintage: number;
  blur: number;
  sharpen: number;
  posterize: number;
  inkBleed: number;
  crackle: number;
  grainType: 'cotton' | 'canvas' | 'denim' | 'heather' | 'none';
}

export interface MaskPath {
  id: string;
  type: 'brush' | 'rect' | 'circle';
  points: { x: number; y: number }[];
  width: number;
}

export interface SelectionArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface EditorState {
  removeColors: { color: RGB; tolerance: number; feather: number; id: string }[];
  editColors: ColorReplacement[];
  layers: Layer[];
  filters: ImageFilters;
  fabricColor: string;
  showGuides: boolean;
  maskPaths: MaskPath[];
  brushSize: number;
  isPattern: boolean;
  patternScale: number;
  patternRotation: number;
  patternOffsetX: number;
  patternOffsetY: number;
  isSticker: boolean;
  stickerBorderWidth: number;
  stickerBorderColor: string;
  selection: SelectionArea | null;
}

export const getInitialEditorState = (): EditorState => ({
  removeColors: [],
  editColors: [],
  layers: [],
  filters: { 
    brightness: 0, contrast: 0, saturation: 0, noise: 0, halftone: 0, 
    texture: null, textureOpacity: 50, vintage: 0, blur: 0, sharpen: 0, posterize: 0,
    inkBleed: 0, crackle: 0, grainType: 'none'
  },
  fabricColor: '#18181b',
  showGuides: false,
  maskPaths: [],
  brushSize: 40,
  isPattern: false,
  patternScale: 50,
  patternRotation: 0,
  patternOffsetX: 0,
  patternOffsetY: 0,
  isSticker: false,
  stickerBorderWidth: 15,
  stickerBorderColor: '#ffffff',
  selection: null
});

export const INITIAL_EDITOR_STATE = getInitialEditorState();

export const FONTS = [
  { name: 'Inter', family: "'Inter', sans-serif" },
  { name: 'Anton', family: "'Anton', sans-serif" },
  { name: 'Oswald', family: "'Oswald', sans-serif" },
  { name: 'Pacifico', family: "'Pacifico', cursive" },
  { name: 'Marker', family: "'Permanent Marker', cursive" }
];

export interface ErrorBoundaryProps { children?: ReactNode; }
export interface ErrorBoundaryState { hasError: boolean; error: Error | null; }

export const DEFAULT_TEXTURES = [
  { name: 'Cotton (Fine)', url: 'https://www.transparenttextures.com/patterns/pinstriped-suit.png', type: 'cotton' },
  { name: 'Canvas (Heavy)', url: 'https://www.transparenttextures.com/patterns/canvas-fabric.png', type: 'canvas' },
  { name: 'Vintage Wash', url: 'https://www.transparenttextures.com/patterns/denim.png', type: 'denim' }
];

export interface PodSizeTemplate {
  label: string;
  aspectRatio: "1:1" | "3:4" | "4:3" | "9:16" | "16:9";
  width: number;
  height: number;
}

export const POD_TEMPLATES: PodSizeTemplate[] = [
  { label: 'Square (1:1)', aspectRatio: '1:1', width: 2000, height: 2000 },
  { label: 'Portrait (3:4)', aspectRatio: '3:4', width: 1800, height: 2400 },
  { label: 'Wide (4:3)', aspectRatio: '4:3', width: 2400, height: 1800 }
];

export interface PreFlightResult {
  thinLines: boolean;
  lowContrast: boolean;
  issues: string[];
}

export enum ExportFormat {
  PNG_TRANSPARENT = 'PNG_TRANSPARENT',
  JPG_WHITE = 'JPG_WHITE',
  PNG_PATTERN = 'PNG_PATTERN',
  STICKER_PACK = 'STICKER_PACK'
}