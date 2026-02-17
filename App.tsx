
"use client";

import React, { ErrorInfo, ReactNode } from 'react';
import { AppStep, ErrorBoundaryProps, ErrorBoundaryState, EditorState, GalleryItem, getInitialEditorState } from './types';
import Generator from './components/Generator';
import Editor from './components/Editor';
import MockupStudio from './components/MockupStudio';
import AdminPanel from './components/AdminPanel';
import { Shirt, ShieldCheck, AlertOctagon, RefreshCw } from 'lucide-react';

/**
 * ErrorBoundary component to catch rendering errors in the app.
 */
// Fix: Explicitly use React.Component and declare state property for TypeScript compatibility
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  // Declare state property to satisfy TypeScript compiler
  state: ErrorBoundaryState = { hasError: false, error: null };

  constructor(props: ErrorBoundaryProps) {
    super(props);
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  // Lifecycle method to handle error reporting
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Uncaught Error:", error, info);
  }

  render(): ReactNode {
    // Access children and state from instance properties
    const { children } = this.props;
    const { hasError, error } = this.state;
    if (hasError) {
      return (
        <div className="h-full bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
          <AlertOctagon className="text-red-500 mb-4" size={56} />
          <h1 className="text-3xl font-black text-white mb-2 tracking-tight uppercase">System Error</h1>
          <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800 font-mono text-[11px] text-red-300 mb-8 max-w-lg overflow-auto text-left shadow-2xl backdrop-blur-md">{error?.message}</div>
          <button onClick={() => { localStorage.removeItem('pod_gallery_v2'); window.location.reload(); }} className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black flex items-center gap-3 active:scale-95 shadow-xl uppercase tracking-widest text-xs"><RefreshCw size={18} /> Recover Session</button>
        </div>
      );
    }
    return children;
  }
}

const App = () => {
  const [currentStep, setCurrentStep] = React.useState<AppStep>(AppStep.GENERATE);
  const [workingBaseImage, setWorkingBaseImage] = React.useState<string | null>(null);
  const [processedImage, setProcessedImage] = React.useState<string | null>(null);
  const [gallery, setGallery] = React.useState<GalleryItem[]>([]);
  const [adminPin, setAdminPin] = React.useState('');
  const [showAdminLogin, setShowAdminLogin] = React.useState(false);
  const [editorState, setEditorState] = React.useState<EditorState>(getInitialEditorState());

  React.useEffect(() => {
    const saved = localStorage.getItem('pod_gallery_v2');
    if (saved) {
      try { const parsed = JSON.parse(saved); setGallery(Array.isArray(parsed) ? parsed : []); }
      catch (e) { localStorage.removeItem('pod_gallery_v2'); }
    }
  }, []);

  React.useEffect(() => {
    if (gallery.length > 0) {
      try { localStorage.setItem('pod_gallery_v2', JSON.stringify(gallery)); }
      catch (e) { try { localStorage.setItem('pod_gallery_v2', JSON.stringify(gallery.slice(0, 3))); } catch (e2) { } }
    }
  }, [gallery]);

  const handleStartOver = () => {
    if (window.confirm("Start over from scratch? All current progress and unsaved edits will be lost.")) {
      setWorkingBaseImage(null);
      setProcessedImage(null);
      setEditorState(getInitialEditorState());
      setCurrentStep(AppStep.GENERATE);
    }
  };

  if (currentStep === AppStep.ADMIN) return <AdminPanel onLogout={() => setCurrentStep(AppStep.GENERATE)} />;

  return (
    <ErrorBoundary>
      <div className="flex flex-col min-h-screen bg-[#09090b] text-zinc-100 selection:bg-indigo-500/40 safe-top">
        <header className="h-14 border-b border-zinc-800/60 studio-glass flex items-center justify-between px-6 lg:px-10 z-[60] shrink-0">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setCurrentStep(AppStep.GENERATE)}>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform"><Shirt size={18} className="text-white" /></div>
            <div className="flex flex-col -space-y-1">
              <span className="text-lg font-black tracking-tighter uppercase italic">POD<span className="text-indigo-400">STUDIO</span></span>
              <span className="text-[8px] font-black text-zinc-500 tracking-[0.2em] uppercase">Premium Tier</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {currentStep !== AppStep.GENERATE && (
              <button
                onClick={handleStartOver}
                className="px-4 py-2 rounded-xl text-[10px] font-black text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all flex items-center gap-2 uppercase tracking-widest"
              >
                <RefreshCw size={12} /> Start Over
              </button>
            )}
            <div className="relative">
              <button onClick={() => setShowAdminLogin(!showAdminLogin)} className="px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-[10px] font-black text-zinc-500 hover:text-white hover:border-zinc-600 transition-all uppercase tracking-widest"><ShieldCheck size={12} className="inline mr-1" /> Config</button>
              {showAdminLogin && (
                <div className="absolute top-full right-0 mt-3 w-56 studio-glass border border-zinc-700/50 rounded-2xl p-4 z-[70] shadow-2xl animate-fade-in">
                  <form onSubmit={e => { e.preventDefault(); if (adminPin === '1234') { setCurrentStep(AppStep.ADMIN); setShowAdminLogin(false); setAdminPin(''); } else alert("Access Denied."); }}>
                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-2 px-1">Security PIN</p>
                    <input type="password" autoFocus className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-center text-sm mb-3 focus:border-indigo-500 outline-none transition-all" value={adminPin} onChange={e => setAdminPin(e.target.value)} maxLength={4} placeholder="••••" />
                    <button type="submit" className="w-full py-3 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-zinc-200 transition-all active:scale-95">Authenticate</button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 relative bg-gradient-to-b from-zinc-950 to-black flex flex-col">
          <div className="flex-1 w-full max-w-[1800px] mx-auto">
            {currentStep === AppStep.GENERATE && (
              <div className="min-h-full overflow-y-auto no-scrollbar p-4 sm:p-6 lg:p-10 animate-fade-in">
                <Generator
                  onImageGenerated={(url, m, pr) => {
                    setGallery(p => [{ url, mode: m, prompt: pr }, ...p].slice(0, 15));
                    setWorkingBaseImage(url);
                    setEditorState({ ...getInitialEditorState(), isPattern: m === 'pattern', isSticker: m === 'sticker' });
                    setCurrentStep(AppStep.EDIT);
                  }}
                  gallery={gallery}
                  onSelectFromGallery={(item) => {
                    setWorkingBaseImage(item.url);
                    setEditorState({ ...getInitialEditorState(), isPattern: item.mode === 'pattern', isSticker: item.mode === 'sticker' });
                    setCurrentStep(AppStep.EDIT);
                  }}
                />
              </div>
            )}
            {currentStep === AppStep.EDIT && workingBaseImage && (
              <Editor
                imageUrl={workingBaseImage}
                setImageUrl={setWorkingBaseImage}
                state={editorState}
                setState={setEditorState}
                onComplete={(url) => { setProcessedImage(url); setCurrentStep(AppStep.MOCKUP); }}
                onBack={() => setCurrentStep(AppStep.GENERATE)}
              />
            )}
            {currentStep === AppStep.MOCKUP && processedImage && (
              <div className="h-full w-full animate-fade-in"><MockupStudio designUrl={processedImage} onBack={() => setCurrentStep(AppStep.EDIT)} /></div>
            )}
          </div>
        </main>
      </div>
    </ErrorBoundary>
  );
};

export default App;
