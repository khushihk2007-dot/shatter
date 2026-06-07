/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Layers, ShieldCheck, Compass, Code2, Sparkles } from 'lucide-react';

interface LuxuryHeaderProps {
  sensorMode: 'sandbox' | 'gallery' | 'wireframe';
  setSensorMode: (mode: 'sandbox' | 'gallery' | 'wireframe') => void;
}

export default function LuxuryHeader({ sensorMode, setSensorMode }: LuxuryHeaderProps) {
  return (
    <header 
      id="brand-header-root" 
      className="w-full flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#E8E8E8] select-none"
    >
      <div id="brand-title-group" className="space-y-3 max-w-xl">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#E8E8E8] bg-[#F5F5F3] font-mono text-[9px] text-[#4A0000] tracking-widest uppercase font-bold">
            <ShieldCheck className="w-2.5 h-2.5 text-[#7A0000]" /> EXTRASENSORY RELEASE CHAMBER
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#7A0000] animate-pulse"></span>
          <span className="font-mono text-[9px] text-[#7A0000] tracking-widest uppercase font-bold">STATUS: RECEPTIVE</span>
        </div>
        
        <h1 className="font-display text-3xl md:text-4xl font-extrabold tracking-[-0.04em] text-[#111111] uppercase leading-none">
          Face Break <span className="text-[#7A0000] font-light">Atelier</span>
        </h1>
        
        <p className="font-sans text-xs text-neutral-500 leading-relaxed font-normal max-w-lg">
          An interactive digital canvas to crack, fracture, and let go of lingering weights. Upload an image to trap the memory behind cinematic safety glass, then repeatedly strike to release.
        </p>
      </div>

      {/* Visual Workspace controls selector */}
      <div id="experience-mode-selector" className="flex flex-col gap-2 min-w-[240px]">
        <span className="font-mono text-[9px] font-bold tracking-[0.2em] text-[#7A0000] uppercase">Visual Projection Level</span>
        <div className="flex bg-[#F5F5F3] border border-[#E8E8E8] p-1 rounded-xl gap-1">
          <button
            onClick={() => setSensorMode('sandbox')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-[9px] font-sans font-bold tracking-wider uppercase transition-all duration-300 ${
              sensorMode === 'sandbox'
                ? 'bg-[#111111] text-white shadow-sm'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Compass className="w-3 h-3 stroke-[1.5]" />
            Active
          </button>
          
          <button
            onClick={() => setSensorMode('gallery')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-[9px] font-sans font-bold tracking-wider uppercase transition-all duration-300 ${
              sensorMode === 'gallery'
                ? 'bg-[#111111] text-white shadow-sm'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Layers className="w-3 h-3 stroke-[1.5]" />
            Quiet
          </button>
          
          <button
            onClick={() => setSensorMode('wireframe')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-[9px] font-sans font-bold tracking-wider uppercase transition-all duration-300 ${
              sensorMode === 'wireframe'
                ? 'bg-[#111111] text-white shadow-sm'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Code2 className="w-3 h-3 stroke-[1.5]" />
            Vector
          </button>
        </div>
      </div>
    </header>
  );
}
