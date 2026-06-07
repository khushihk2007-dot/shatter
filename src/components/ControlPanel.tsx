/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GlassConfig, BackgroundPreset } from '../types';
import { MATERIAL_PRESETS, LUXURY_BACKGROUNDS } from '../constants';
import { 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  Layers, 
  Sparkles, 
  Activity, 
  Eye, 
  Image as ImageIcon,
  Zap,
  Check,
  Compass,
  FileCode,
  Sliders
} from 'lucide-react';

interface ControlPanelProps {
  config: GlassConfig;
  setConfig: React.Dispatch<React.SetStateAction<GlassConfig>>;
  activeBackground: BackgroundPreset;
  setActiveBackground: (bg: BackgroundPreset) => void;
  generatorType: 'radial' | 'voronoi';
  setGeneratorType: (type: 'radial' | 'voronoi') => void;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  customImageUrl: string;
  setCustomImageUrl: (url: string) => void;
  onReset: () => void;
  onRandomStrike: () => void;
  debugMode: boolean;
  setDebugMode: (debug: boolean) => void;
  onBackToLanding?: () => void;
}

export default function ControlPanel({
  config,
  setConfig,
  activeBackground,
  setActiveBackground,
  generatorType,
  setGeneratorType,
  isMuted,
  setIsMuted,
  customImageUrl,
  setCustomImageUrl,
  onReset,
  onRandomStrike,
  debugMode,
  setDebugMode,
  onBackToLanding
}: ControlPanelProps) {
  const [activeTab, setActiveTab] = useState<'fracture' | 'physics' | 'optics'>('fracture');
  const [urlInput, setUrlInput] = useState(customImageUrl);

  // Apply a specific material preset config
  const applyPreset = (key: string) => {
    const preset = MATERIAL_PRESETS[key];
    if (preset) {
      setConfig((prev) => ({
        ...prev,
        ...preset.config,
      }));
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomImageUrl(urlInput);
  };

  // Helper to dynamically update numeric configuration options
  const updateConfigVal = (key: keyof GlassConfig, val: number | boolean) => {
    setConfig((prev) => ({
      ...prev,
      [key]: val,
    }));
  };

  return (
    <div 
      id="controls-panel-container"
      className="w-full lg:w-[400px] shrink-0 flex flex-col bg-white border border-[#E8E8E8] rounded-3xl p-6 md:p-8 shadow-2xl select-none h-fit text-[#111111]"
    >
      {/* Branding and quick master actions */}
      <div className="flex items-center justify-between border-b border-[#E8E8E8] pb-5 mb-5">
        <div className="flex flex-col">
          <span className="font-mono text-[9px] tracking-[0.2em] uppercase font-bold text-[#7A0000]">TACTILE CONTROLS</span>
          <h3 className="font-display text-base tracking-tight uppercase font-extrabold text-[#111111]">Release Settings</h3>
        </div>
        
        <div className="flex gap-1.5">
          {/* Sounds */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`p-2 rounded-xl border transition-all ${!isMuted ? 'border-[#E8E8E8] bg-[#F5F5F3] text-neutral-800 hover:bg-neutral-100' : 'border-red-100 bg-[#7A0000]/5 text-[#7A0000]'}`}
            title={isMuted ? "Unmute Sounds" : "Mute Sounds"}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
          
          {/* Reset */}
          <button
            onClick={onReset}
            className="p-2 rounded-xl border border-[#E8E8E8] bg-[#F5F5F3] text-neutral-800 hover:bg-neutral-100 transition-all"
            title="Restore Surface"
            id="main-suture-btn"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Mode selectors: Radial / Voronoi */}
      <div className="grid grid-cols-2 gap-1 p-1 bg-[#F5F5F3] border border-[#E8E8E8] rounded-xl mb-5">
        <button
          onClick={() => setGeneratorType('radial')}
          className={`py-2 px-3 rounded-lg font-sans text-[10px] tracking-wider uppercase transition-all duration-300 ${
            generatorType === 'radial'
              ? 'bg-[#111111] text-white font-bold shadow-sm'
              : 'text-[#4A0000] hover:text-[#7A0000]'
          }`}
        >
          Radial Spiderweb
        </button>
        <button
          onClick={() => setGeneratorType('voronoi')}
          className={`py-2 px-3 rounded-lg font-sans text-[10px] tracking-wider uppercase transition-all duration-300 ${
            generatorType === 'voronoi'
              ? 'bg-[#111111] text-white font-bold shadow-sm'
              : 'text-[#4A0000] hover:text-[#7A0000]'
          }`}
        >
          Organic Voronoi
        </button>
      </div>

      {/* Collapsible/Tabbed menu selection bar */}
      <div id="controls-tab-bar" className="flex border-b border-[#E8E8E8] pb-2.5 mb-5 overflow-x-auto gap-3.5 no-scrollbar">
        <button
          onClick={() => setActiveTab('fracture')}
          className={`text-[10px] font-mono font-bold tracking-widest uppercase pb-1 border-b-2 transition-all duration-300 ${
            activeTab === 'fracture' ? 'border-[#7A0000] text-[#7A0000]' : 'border-transparent text-neutral-400 hover:text-neutral-900'
          }`}
        >
          Presets
        </button>
        <button
          onClick={() => setActiveTab('physics')}
          className={`text-[10px] font-mono font-bold tracking-widest uppercase pb-1 border-b-2 transition-all duration-300 ${
            activeTab === 'physics' ? 'border-[#7A0000] text-[#7A0000]' : 'border-transparent text-neutral-400 hover:text-neutral-900'
          }`}
        >
          Tactility
        </button>
        <button
          onClick={() => setActiveTab('optics')}
          className={`text-[10px] font-mono font-bold tracking-widest uppercase pb-1 border-b-2 transition-all duration-300 ${
            activeTab === 'optics' ? 'border-[#7A0000] text-[#7A0000]' : 'border-transparent text-neutral-400 hover:text-neutral-900'
          }`}
        >
          Optics
        </button>
      </div>

      {/* TAB SUB-CONTENT PLACEMENT */}
      <div id="controls-tab-content" className="flex-1 overflow-y-auto space-y-4 pr-1 max-h-[460px] select-none no-scrollbar">
        
        {/* TAB 1: PRESETS */}
        {activeTab === 'fracture' && (
          <div className="space-y-4 animate-fade-in text-left">
            <p className="text-[11px] text-neutral-500 font-sans leading-relaxed">
              Alter the material density of the glass plane. Each crystalline structure fractures with distinct stress dissipation coefficients.
            </p>

            <div className="grid grid-cols-1 gap-2.5">
              {Object.entries(MATERIAL_PRESETS).map(([key, details]) => {
                const isSelected = Object.keys(details.config).every(
                  (cfgKey) => config[cfgKey as keyof GlassConfig] === details.config[cfgKey as keyof GlassConfig]
                );

                return (
                  <button
                    key={key}
                    onClick={() => applyPreset(key)}
                    className={`text-left p-4 rounded-xl border transition-all duration-300 relative overflow-hidden group ${
                      isSelected 
                        ? 'border-[#7A0000] bg-[#7A0000]/5 shadow-sm' 
                        : 'border-[#E8E8E8] bg-[#F5F5F3]/50 hover:bg-[#F5F5F3]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-[10px] font-extrabold tracking-widest uppercase text-[#111111]">{details.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#7A0000]" />}
                    </div>
                    <p className="font-sans text-[10px] text-neutral-500 leading-normal font-normal">{details.description}</p>
                  </button>
                );
              })}
            </div>

            {/* Simulated Heavy Strike button right on Presets */}
            <div className="border border-[#E8E8E8] rounded-xl p-4 bg-[#F5F5F3]/50 mt-4 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-mono text-[9px] font-extrabold text-[#7A0000] uppercase tracking-wider">CRASH SIMULATOR</span>
                <span className="font-sans text-[9px] text-neutral-500">Hammer a spontaneous fracture</span>
              </div>
              <button
                onClick={onRandomStrike}
                className="flex items-center gap-1 bg-[#7A0000] hover:bg-[#4A0000] text-white font-bold font-sans text-[9px] uppercase tracking-widest px-3 py-2 rounded-lg transition-all active:scale-95"
              >
                <Zap className="w-2.5 h-2.5 fill-white text-white" />
                Strike
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: PHYSICS */}
        {activeTab === 'physics' && (
          <div className="space-y-4 animate-fade-in font-sans text-left">
            <div className="flex items-center justify-between border-b border-[#E8E8E8] pb-1 bg-white">
              <span className="text-[10px] text-neutral-400 uppercase tracking-widest font-bold">Kinetic Values</span>
              <Activity className="w-3 h-3 text-[#7A0000]" />
            </div>

            {/* Slider: Spring Tension */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[10px] tracking-wider uppercase font-semibold">
                <span className="text-neutral-500">Spring Elastic Recall</span>
                <span className="font-mono text-[#7A0000]">{config.springTension.toFixed(2)}</span>
              </div>
              <input 
                type="range" min="0.01" max="0.30" step="0.01"
                value={config.springTension}
                onChange={(e) => updateConfigVal('springTension', parseFloat(e.target.value))}
                className="w-full h-1 bg-[#E8E8E8] rounded-lg appearance-none cursor-pointer accent-[#7A0000]"
              />
              <span className="text-[9px] text-neutral-400 block leading-tight">Controls speed shards snap back to resting position.</span>
            </div>

            {/* Slider: Physics Damping */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[10px] tracking-wider uppercase font-semibold">
                <span className="text-neutral-500">Friction Dampening</span>
                <span className="font-mono text-[#7A0000]">{(config.physicsDamping * 100).toFixed(0)}%</span>
              </div>
              <input 
                type="range" min="0.02" max="0.30" step="0.01"
                value={config.physicsDamping}
                onChange={(e) => updateConfigVal('physicsDamping', parseFloat(e.target.value))}
                className="w-full h-1 bg-[#E8E8E8] rounded-lg appearance-none cursor-pointer accent-[#7A0000]"
              />
              <span className="text-[9px] text-neutral-400 block leading-tight">Rate of energy loss. High value ensures rapid inertia absorption.</span>
            </div>

            {/* Slider: Displacement Intensity */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[10px] tracking-wider uppercase font-semibold">
                <span className="text-neutral-500">Shard Displacement Depth</span>
                <span className="font-mono text-[#7A0000]">{config.displacementIntensity}px</span>
              </div>
              <input 
                type="range" min="5" max="60" step="1"
                value={config.displacementIntensity}
                onChange={(e) => updateConfigVal('displacementIntensity', parseFloat(e.target.value))}
                className="w-full h-1 bg-[#E8E8E8] rounded-lg appearance-none cursor-pointer accent-[#7A0000]"
              />
              <span className="text-[9px] text-neutral-400 block leading-tight">Determines how far outward shards fly when struck.</span>
            </div>

            {/* Slider: Rotation Intensity */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[10px] tracking-wider uppercase font-semibold">
                <span className="text-neutral-500">3D Facet Rotational Torque</span>
                <span className="font-mono text-[#7A0000]">{config.rotationIntensity.toFixed(2)}</span>
              </div>
              <input 
                type="range" min="0.00" max="0.40" step="0.02"
                value={config.rotationIntensity}
                onChange={(e) => updateConfigVal('rotationIntensity', parseFloat(e.target.value))}
                className="w-full h-1 bg-[#E8E8E8] rounded-lg appearance-none cursor-pointer accent-[#7A0000]"
              />
              <span className="text-[9px] text-neutral-400 block leading-tight font-light">Torsional twist factor. Controls face-angle tilt.</span>
            </div>

            {/* Slider: Surface Tension (Hover Drag) */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[10px] tracking-wider uppercase font-semibold">
                <span className="text-neutral-500">Cursor Friction Drag</span>
                <span className="font-mono text-[#7A0000]">{config.surfaceTension.toFixed(1)}</span>
              </div>
              <input 
                type="range" min="0.0" max="4.0" step="0.2"
                value={config.surfaceTension}
                onChange={(e) => updateConfigVal('surfaceTension', parseFloat(e.target.value))}
                className="w-full h-1 bg-[#E8E8E8] rounded-lg appearance-none cursor-pointer accent-[#7A0000]"
              />
            </div>

            {/* Slider: Particle Multiplier */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[10px] tracking-wider uppercase font-semibold">
                <span className="text-neutral-500">Ejected Glass Dust</span>
                <span className="font-mono text-[#7A0000]">{config.particleCount}</span>
              </div>
              <input 
                type="range" min="0" max="200" step="10"
                value={config.particleCount}
                onChange={(e) => updateConfigVal('particleCount', parseInt(e.target.value))}
                className="w-full h-1 bg-[#E8E8E8] rounded-lg appearance-none cursor-pointer accent-[#7A0000]"
              />
            </div>
          </div>
        )}

        {/* TAB 3: OPTICS & SHADERS */}
        {activeTab === 'optics' && (
          <div className="space-y-4 animate-fade-in font-sans text-left">
            <div className="flex items-center justify-between border-b border-[#E8E8E8] pb-1 bg-white">
              <span className="text-[10px] text-neutral-400 uppercase tracking-widest font-bold">Refractive Shader</span>
              <Eye className="w-3 h-3 text-[#7A0000]" />
            </div>

            {/* Slider: Refraction */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[10px] tracking-wider uppercase font-semibold">
                <span className="text-neutral-500">Refractive Index Warp</span>
                <span className="font-mono text-[#7A0000]">{config.refractionStrength.toFixed(2)}</span>
              </div>
              <input 
                type="range" min="0.00" max="0.60" step="0.02"
                value={config.refractionStrength}
                onChange={(e) => updateConfigVal('refractionStrength', parseFloat(e.target.value))}
                className="w-full h-1 bg-[#E8E8E8] rounded-lg appearance-none cursor-pointer accent-[#7A0000]"
              />
              <span className="text-[9px] text-neutral-400 block leading-tight">Light-bending distortion inside independent fragmented facets.</span>
            </div>

            {/* Slider: Chromatic Aberration */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[10px] tracking-wider uppercase font-semibold">
                <span className="text-neutral-500">Spectral Dispersion Split</span>
                <span className="font-mono text-[#7A0000]">{config.chromaticAberration.toFixed(1)}px</span>
              </div>
              <input 
                type="range" min="0.0" max="6.0" step="0.5"
                value={config.chromaticAberration}
                onChange={(e) => updateConfigVal('chromaticAberration', parseFloat(e.target.value))}
                className="w-full h-1 bg-[#E8E8E8] rounded-lg appearance-none cursor-pointer accent-[#7A0000]"
              />
              <span className="text-[9px] text-neutral-400 block leading-tight">Cyan/red spectrum split along cracked boundaries.</span>
            </div>

            {/* Slider: Crack Thickness */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[10px] tracking-wider uppercase font-semibold">
                <span className="text-neutral-500">Crack Structural Width</span>
                <span className="font-mono text-[#7A0000]">{config.crackThickness.toFixed(1)}px</span>
              </div>
              <input 
                type="range" min="0.5" max="3.5" step="0.1"
                value={config.crackThickness}
                onChange={(e) => updateConfigVal('crackThickness', parseFloat(e.target.value))}
                className="w-full h-1 bg-[#E8E8E8] rounded-lg appearance-none cursor-pointer accent-[#7A0000]"
              />
            </div>

            {/* Slider: Spotlight Glare */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[10px] tracking-wider uppercase font-semibold">
                <span className="text-neutral-500">Spotlight Specular Reflection</span>
                <span className="font-mono text-[#7A0000]">{(config.reflectionStrength * 100).toFixed(0)}%</span>
              </div>
              <input 
                type="range" min="0.0" max="1.2" step="0.05"
                value={config.reflectionStrength}
                onChange={(e) => updateConfigVal('reflectionStrength', parseFloat(e.target.value))}
                className="w-full h-1 bg-[#E8E8E8] rounded-lg appearance-none cursor-pointer accent-[#7A0000]"
              />
            </div>

            {/* Slider: Crack Ray density */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[10px] tracking-wider uppercase font-semibold">
                <span className="text-neutral-500">Sector Divide Ray Density</span>
                <span className="font-mono text-[#7A0000]">{config.crackDensity}</span>
              </div>
              <input 
                type="range" min="8" max="40" step="1"
                value={config.crackDensity}
                onChange={(e) => updateConfigVal('crackDensity', parseInt(e.target.value))}
                className="w-full h-1 bg-[#E8E8E8] rounded-lg appearance-none cursor-pointer accent-[#7A0000]"
              />
              <span className="text-[9px] text-neutral-400 block leading-tight">Complexity of dividing branches. Applied on next reset or click.</span>
            </div>

            {/* Anatomy Wireframe Toggle */}
            <div className="flex items-center justify-between border-t border-[#E8E8E8] pt-3 mt-1.5">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-neutral-500 uppercase">Interactive Wireframe</span>
                <span className="text-[9px] text-neutral-400">Draw spring vectors & shard vertices</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" checked={debugMode}
                  onChange={(e) => setDebugMode(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-neutral-500 after:border-neutral-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#7A0000] peer-checked:after:bg-white"></div>
              </label>
            </div>
          </div>
        )}

      </div>

      {/* Credit footer */}
      <div className="mt-5 pt-3.5 border-t border-[#E8E8E8] text-center font-mono text-[8px] text-neutral-400 tracking-wider">
        FORMULA INDEX: CLASSICAL DISPERSION • GLASS RECONSTRUCTION ONLINE
      </div>
    </div>
  );
}
