/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { GlassConfig, BackgroundPreset } from './types';
import { DEFAULT_CONFIG, LUXURY_BACKGROUNDS } from './constants';
import GlassCanvas from './components/GlassCanvas';
import ControlPanel from './components/ControlPanel';
import LuxuryHeader from './components/LuxuryHeader';
import CustomCursor from './components/CustomCursor';
import ImageCropper from './components/ImageCropper';
import { 
  Sparkles, 
  Atom, 
  Layers, 
  Scale,
  Upload,
  ArrowRight,
  HeartCrack,
  Activity,
  X,
  BookOpen,
  Compass,
  FileCode,
  Download
} from 'lucide-react';

export default function App() {
  // Master configs
  const [config, setConfig] = useState<GlassConfig>(DEFAULT_CONFIG);
  const [activeBackground, setActiveBackground] = useState<BackgroundPreset>(LUXURY_BACKGROUNDS[0]);
  const [generatorType, setGeneratorType] = useState<'radial' | 'voronoi'>('radial');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [customImageUrl, setCustomImageUrl] = useState<string>('');
  const [sensorMode, setSensorMode] = useState<'sandbox' | 'gallery' | 'wireframe'>('sandbox');
  const [debugMode, setDebugMode] = useState<boolean>(false);

  // Interaction Flow state
  const [imageSelected, setImageSelected] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [showUploadZone, setShowUploadZone] = useState<boolean>(false);
  const [rawUploadedImageUrl, setRawUploadedImageUrl] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Smooth scroll Refs
  const howItWorksRef = useRef<HTMLDivElement>(null);
  const manifestoRef = useRef<HTMLDivElement>(null);
  const uploadZoneRef = useRef<HTMLDivElement>(null);

  // External action trigger counts
  const [strikeTrigger, setStrikeTrigger] = useState<number>(0);

  // Synchronize wireframe mode with debugState
  const currentDebugMode = sensorMode === 'wireframe' || debugMode;

  const handleRandomStrike = () => {
    setStrikeTrigger((prev) => prev + 1);
  };

  const handleReset = () => {
    const canvasBtn = document.getElementById('canvas-reset-btn');
    if (canvasBtn) {
      (canvasBtn as HTMLButtonElement).click();
    }
  };

  const handleSaveFragment = () => {
    try {
      const canvas = document.getElementById('interactive-glass-canvas') as HTMLCanvasElement | null;
      if (!canvas) {
        setSaveStatus({
          type: 'error',
          message: 'Interactive glass canvas not fully initialized.'
        });
        return;
      }

      const imageUrl = canvas.toDataURL('image/png');
      const mockLink = document.createElement('a');
      mockLink.download = `shattered-glass-fragment-${Date.now()}.png`;
      mockLink.href = imageUrl;
      document.body.appendChild(mockLink);
      mockLink.click();
      document.body.removeChild(mockLink);

      setSaveStatus({
        type: 'success',
        message: 'Glass fragment saved successfully.'
      });
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err: any) {
      console.error(err);
      setSaveStatus({
        type: 'error',
        message: 'CORS protection on external image prevented screenshot. Try custom file uploads.'
      });
      setTimeout(() => setSaveStatus(null), 5000);
    }
  };

  const scrollToSection = (sectionRef: React.RefObject<HTMLDivElement>) => {
    if (imageSelected) {
      setImageSelected(false);
      setTimeout(() => {
        sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    } else {
      sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Drag handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setRawUploadedImageUrl(url);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleSelectPresetAndBegin = (bg: BackgroundPreset) => {
    setCustomImageUrl('');
    setActiveBackground(bg);
    setImageSelected(true);
  };

  const handleBackToLanding = () => {
    setImageSelected(false);
    setShowUploadZone(false);
  };

  return (
    <div 
      id="app-theme-root" 
      className="min-h-screen bg-white text-[#111111] flex flex-col items-center justify-start p-4 md:p-8 lg:p-12 selection:bg-[#7A0000] selection:text-white font-sans leading-relaxed relative"
    >
      <CustomCursor />

      {/* Viewport Alignment Cropper */}
      {rawUploadedImageUrl && (
        <ImageCropper
          imageUrl={rawUploadedImageUrl}
          onCropComplete={(croppedUrl) => {
            setCustomImageUrl(croppedUrl);
            setImageSelected(true);
            setRawUploadedImageUrl('');
          }}
          onCancel={() => {
            setRawUploadedImageUrl('');
          }}
        />
      )}

      {/* Toast Notification for premium feedback */}
      {saveStatus && (
        <div 
          id="shatter-toast-notification"
          className={`fixed bottom-6 right-6 z-[999] backdrop-blur-md px-5 py-3.5 rounded-2xl border text-[10px] font-mono font-bold tracking-wider shadow-lg flex items-center gap-3 animate-fade-in ${
            saveStatus.type === 'success' 
              ? 'bg-[#111111]/95 text-white border-neutral-800' 
              : 'bg-[#7A0000]/95 text-white border-red-500/30'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${saveStatus.type === 'success' ? 'bg-emerald-400' : 'bg-white animate-ping'}`} />
          <span>{saveStatus.message.toUpperCase()}</span>
          <button 
            onClick={() => setSaveStatus(null)}
            className="text-neutral-400 hover:text-white ml-2 focus:outline-none"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div id="app-max-viewport" className="w-full max-w-7xl mx-auto space-y-10 animate-fade-in">
        
        {/* PREMIUM MINIMALIST SHATTER HEADER NAVIGATION BAR */}
        <header 
          id="shatter-global-header" 
          className="w-full flex items-center justify-between py-2 border-b border-[#E8E8E8] select-none"
        >
          {/* Brand Identity */}
          <div 
            onClick={handleBackToLanding}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <span className="w-3.5 h-3.5 rounded-full bg-[#7A0000] group-hover:scale-110 transition-transform duration-300"></span>
            <span className="font-serif text-xl font-bold tracking-tight text-[#111111] uppercase select-none">
              Shatter
            </span>
          </div>

          {/* Navigation link elements */}
          <div className="flex items-center gap-6 md:gap-8">
            <button 
              onClick={() => scrollToSection(howItWorksRef)}
              className="text-xs md:text-sm font-sans text-[#111111] hover:text-[#7A0000] transition-colors cursor-pointer font-medium"
            >
              How it works
            </button>
            <button 
              onClick={() => scrollToSection(manifestoRef)}
              className="text-xs md:text-sm font-sans text-[#111111] hover:text-[#7A0000] transition-colors cursor-pointer font-medium"
            >
              Manifesto
            </button>
          </div>
        </header>

        {/* CONDITIONAL LAYOUT: LANDING VS ACTIVE INTERACTIVE VIEW */}
        {!imageSelected ? (
          <div id="landing-composition" className="space-y-12 py-8">
            
            {/* Colossal statement headline (EXACT MATCH to photo layout & colors) */}
            <div id="colossal-headline-group" className="text-center space-y-6 max-w-4xl mx-auto py-6">
              <span className="font-mono text-[10px] md:text-[11px] uppercase tracking-[0.3em] text-[#7A0000] font-extrabold flex items-center justify-center gap-2">
                A DIGITAL STRESS-RELIEF EXPERIENCE
              </span>
              
              <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-[110px] font-bold tracking-tight text-[#111111] leading-[0.9] select-none font-serif text-center">
                Break. <span className="text-[#7A0000] italic font-normal font-serif">Release.</span>
                <br />
                Repeat.
              </h1>

              <p className="font-sans text-sm md:text-base text-neutral-500 max-w-xl mx-auto font-normal leading-relaxed">
                Upload any image. Smash it into beautiful, harmless pieces.
                <br />
                Walk away lighter.
              </p>

              {/* Action buttons matching exact design styling */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <button
                  onClick={() => {
                    setShowUploadZone(true);
                    setTimeout(() => {
                      uploadZoneRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 120);
                  }}
                  className="px-8 py-4 bg-[#7A0000] hover:bg-[#4A0000] text-white rounded-full text-sm font-sans font-bold uppercase tracking-wider transition-all duration-300 shadow-md active:scale-95 flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  <span>Upload image</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => scrollToSection(howItWorksRef)}
                  className="px-6 py-4 text-neutral-600 hover:text-[#111111] hover:underline rounded-full text-sm font-sans font-medium transition-all w-full sm:w-auto"
                >
                  See how it works
                </button>
              </div>
            </div>

            {/* Centered Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Drag and Drop Zone Container (only open when Upload is clicked) */}
            {showUploadZone && (
              <div 
                ref={uploadZoneRef}
                id="upload-lux-container"
                className="max-w-2xl mx-auto animate-fade-in"
              >
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={triggerFileSelect}
                  className={`relative border-2 border-dashed rounded-3xl p-10 md:p-14 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center space-y-4 bg-[#F5F5F3] ${
                    dragActive 
                      ? "border-[#7A0000] bg-[#7A0000]/5 scale-[0.98]" 
                      : "border-neutral-200 hover:border-[#7A0000] hover:bg-neutral-100/30"
                  }`}
                >
                  <div className="p-4 border border-neutral-250 bg-white text-[#7A0000] rounded-full shadow-sm">
                    <Upload className="w-6 h-6 stroke-[1.2]" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-sans text-xs font-bold uppercase tracking-widest text-[#111111]">
                      Drag & Drop Silhouette Here
                    </h3>
                    <p className="text-[11px] text-neutral-500 max-w-sm mx-auto font-normal">
                      Or select a local memory image to lock behind glass. Processed entirely local & secure in your browser container.
                    </p>
                  </div>
                </div>
              </div>
            )}




            {/* Section 1: The Ritual (How it Works) */}
            <div 
              ref={howItWorksRef}
              className="pt-24 pb-16 border-t border-[#E8E8E8] grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-14 text-left animate-fade-in"
            >
              {/* Left Display Typography Column (The Ritual: Three steps. Zero regret.) */}
              <div className="md:col-span-5 space-y-4 pr-4">
                <span className="font-mono text-[10px] md:text-[11px] uppercase tracking-[0.25em] text-[#7A0000] font-extrabold block">
                  THE RITUAL
                </span>
                <h2 className="font-serif text-5xl sm:text-6xl md:text-7xl font-bold text-[#111111] leading-[0.98] tracking-tight">
                  Three steps.<br />
                  Zero regret.
                </h2>
              </div>

              {/* Right Steps Process Column */}
              <div className="md:col-span-7 space-y-12">
                {/* Step 01 */}
                <div className="border-b border-[#E8E8E8] pb-8 md:pb-10 space-y-3">
                  <div className="flex items-baseline gap-4">
                    <span className="font-serif text-lg md:text-xl font-bold text-[#7A0000] tracking-tight">01</span>
                    <h3 className="font-serif text-[28px] md:text-[34px] font-bold text-[#111111] leading-tight">
                      Upload
                    </h3>
                  </div>
                  <p className="text-sm md:text-[15px] text-neutral-500 font-sans leading-relaxed pl-8">
                    Drop in any image — the email, the screenshot, the face you&apos;d rather not see.
                  </p>
                </div>

                {/* Step 02 */}
                <div className="border-b border-[#E8E8E8] pb-8 md:pb-10 space-y-3">
                  <div className="flex items-baseline gap-4">
                    <span className="font-serif text-lg md:text-xl font-bold text-[#7A0000] tracking-tight">02</span>
                    <h3 className="font-serif text-[28px] md:text-[34px] font-bold text-[#111111] leading-tight">
                      Smash
                    </h3>
                  </div>
                  <p className="text-sm md:text-[15px] text-neutral-500 font-sans leading-relaxed pl-8">
                    Click. Crack. Shatter. Each impact is rendered with frame-perfect physics.
                  </p>
                </div>

                {/* Step 03 */}
                <div id="step-exhale-container" className="space-y-3">
                  <div className="flex items-baseline gap-4">
                    <span className="font-serif text-lg md:text-xl font-bold text-[#7A0000] tracking-tight">03</span>
                    <h3 className="font-serif text-[28px] md:text-[34px] font-bold text-[#111111] leading-tight">
                      Exhale
                    </h3>
                  </div>
                  <p className="text-sm md:text-[15px] text-neutral-500 font-sans leading-relaxed pl-8">
                    Watch it dissolve into confetti. Refresh and do it again.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 2: Manifesto */}
            <div 
              ref={manifestoRef}
              className="pt-24 pb-20 border-t border-[#E8E8E8] text-center space-y-10 animate-fade-in"
            >
              <div className="space-y-5 max-w-4xl mx-auto">
                <span className="font-mono text-[10px] md:text-[11px] uppercase tracking-[0.25em] text-[#7A0000] font-extrabold block">
                  MANIFESTO
                </span>
                <h2 className="font-serif text-4xl sm:text-5xl md:text-[68px] font-bold text-[#111111] leading-[1.08] tracking-tight max-w-3xl mx-auto">
                  Frustration is energy.<br />
                  We just need somewhere to put it.
                </h2>
              </div>

              <div className="pt-4 flex items-center justify-center">
                <button
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-10 py-4 bg-[#7D0000] hover:bg-[#500000] text-white rounded-full text-xs font-sans font-bold uppercase tracking-[0.16em] transition-all duration-300 shadow-md active:scale-95 inline-flex items-center gap-2"
                >
                  Try it now
                </button>
              </div>
            </div>

          </div>
        ) : (
          /* ACTIVE DESTRUCTION WORKSPACE */
          <div id="interactive-workspace" className="space-y-8 animate-fade-in">
            {/* Minimal Sub-header with back navigation and mode togglers */}
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#E8E8E8] pb-4 gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleBackToLanding}
                  className="px-3.5 py-1.5 border border-neutral-200 hover:border-[#7A0000] rounded-xl text-[9px] font-mono font-bold uppercase tracking-wider transition-all bg-white hover:text-[#7A0000] hover:bg-[#F5F5F3]"
                >
                  ← BACK TO THE GALLERY
                </button>
                <div className="h-4 w-px bg-neutral-200 hidden md:block"></div>
                <span className="font-mono text-[9px] text-neutral-400 tracking-widest uppercase">
                  ACTIVE SUBJECT: <span className="text-neutral-850 font-extrabold">{customImageUrl ? "CUSTOM PORTRAIT TRAPPED" : activeBackground.name.toUpperCase()}</span>
                </span>
              </div>
              <div className="flex gap-2 flex-wrap justify-end">
                <button
                  onClick={handleSaveFragment}
                  className="px-3.5 py-1.5 border border-[#7A0000] text-[#7A0000] hover:bg-[#7A0000] hover:text-white rounded-xl text-[9px] font-mono font-bold uppercase tracking-widest transition-all active:scale-95 flex items-center gap-1.5 bg-white shadow-sm"
                >
                  <Download className="w-3 h-3" /> SAVE FRAGMENT
                </button>
              </div>
            </div>

            {/* Layout Grid: Left Canvas Frame | Right Control sidebar */}
            <main 
              id="workspace-layout-grid" 
              className="flex flex-col lg:flex-row gap-8 items-start justify-stretch w-full"
            >
              {/* Active Canvas Showcase wrapped in luxury portrait border */}
              <div className="flex-1 w-full min-w-0 bg-white p-3 md:p-5 rounded-[32px] border border-[#E8E8E8] shadow-[0_48px_100px_rgba(0,0,0,0.05)] relative overflow-hidden group">
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#7A0000]/45 to-transparent"></div>
                <GlassCanvas
                  config={config}
                  activeBackground={activeBackground}
                  generatorType={generatorType}
                  isMuted={isMuted}
                  customImageUrl={customImageUrl}
                  debugMode={currentDebugMode}
                  strikeTrigger={strikeTrigger}
                  onImpactTriggered={() => {}}
                />
              </div>

              {/* Interactive controls panel */}
              <ControlPanel
                config={config}
                setConfig={setConfig}
                activeBackground={activeBackground}
                setActiveBackground={setActiveBackground}
                generatorType={generatorType}
                setGeneratorType={setGeneratorType}
                isMuted={isMuted}
                setIsMuted={setIsMuted}
                customImageUrl={customImageUrl}
                setCustomImageUrl={setCustomImageUrl}
                onReset={handleReset}
                onRandomStrike={handleRandomStrike}
                debugMode={debugMode}
                setDebugMode={setDebugMode}
                onBackToLanding={handleBackToLanding}
              />
            </main>
          </div>
        )}

        {/* Global info and system credits */}
        <footer 
          id="app-footer-credits" 
          className="border-t border-[#E8E8E8] pt-8 pb-12 flex flex-col md:flex-row items-center justify-between text-neutral-400 font-mono text-[9px] tracking-widest uppercase gap-4"
        >
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#7A0000]"></span>
            <span>Refractive Index Platform</span>
          </div>
          <div>
            <span>© 2026 FACE BREAK ATELIER • ALL INTEGERS CONSERVED</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
