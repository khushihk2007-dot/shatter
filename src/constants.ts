/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GlassConfig, BackgroundPreset } from './types';

export const LUXURY_BACKGROUNDS: BackgroundPreset[] = [
  {
    id: 'marble-grief',
    name: 'Classic Marble Bust',
    url: 'https://images.unsplash.com/photo-1608155686393-8fdd966d784d?auto=format&fit=crop&q=85&w=1200&h=800',
    credit: 'Giammarco Boscaro',
    category: 'Memory Sculpture',
    darkTheme: false
  },
  {
    id: 'editorial-shadow',
    name: 'Monochromatic Portrait',
    url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=85&w=1200&h=800',
    credit: 'Albert Dera',
    category: 'Dramatic Shadow',
    darkTheme: false
  },
  {
    id: 'brutalist-sculpture',
    name: 'The Heavy Thinker',
    url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&q=85&w=1200&h=800',
    credit: 'Pawel Czerwinski',
    category: 'Grecian Plaster',
    darkTheme: false
  },
  {
    id: 'cyber-gaze',
    name: 'Minimal Silhouette',
    url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=85&w=1200&h=800',
    credit: 'Matheus Ferrero',
    category: 'Faceless Silhouette',
    darkTheme: false
  }
];

export const DEFAULT_CONFIG: GlassConfig = {
  crackDensity: 16,            // Number of angular dividing rays
  ringCount: 6,                 // Number of concentric splitting circles
  crackThickness: 1.2,          // Edge line width in px
  fractureSpreadRadius: 280,    // Target propagation limit in px
  shardCount: 1.0,              // Density scaler
  refractionStrength: 0.15,      // Displacement index
  chromaticAberration: 2.0,     // Pixel split
  reflectionStrength: 0.45,     // Specular hover highlight intensity
  blurAmount: 8,                // Unfractured backdrop blur strength
  specularShine: 0.7,           // Sharp glossy light reflection factor
  physicsDamping: 0.12,          // Energy loss (friction) on spring motion
  springTension: 0.08,          // Bounce recall stiffness
  displacementIntensity: 25,    // Push factor on z-axis
  rotationIntensity: 0.15,      // Twist factor on impact
  vibrationIntensity: 4,        // Dynamic screen-shake amplitude
  particleCount: 120,           // Sparkles on impact
  particleGlow: true,           // Radiant particles
  surfaceTension: 1.5,          // Mouse squeeze highlight intensity
  parallaxDepth: 4.0,           // Inertial parallax background shift
  ambientGlow: 0.35             // Spotlight shadow vignette gradient
};

export interface MaterialPreset {
  name: string;
  description: string;
  config: Partial<GlassConfig>;
}

export const MATERIAL_PRESETS: Record<string, MaterialPreset> = {
  temperedSapphire: {
    name: 'Tempered Sapphire',
    description: 'High rigidity, extremely small, dense cracks, minor displacement but rapid sharp vibrations.',
    config: {
      crackDensity: 24,
      ringCount: 8,
      fractureSpreadRadius: 200,
      springTension: 0.15,
      physicsDamping: 0.18,
      displacementIntensity: 12,
      rotationIntensity: 0.05,
      refractionStrength: 0.08,
      vibrationIntensity: 6,
      crackThickness: 0.8
    }
  },
  premiumAcrylic: {
    name: 'Luxury Acrylic',
    description: 'Highly elastic material yielding larger, flowing irregular shards that swing out elegantly and settle with gentle springy dampening.',
    config: {
      crackDensity: 12,
      ringCount: 4,
      fractureSpreadRadius: 360,
      springTension: 0.05,
      physicsDamping: 0.08,
      displacementIntensity: 45,
      rotationIntensity: 0.25,
      refractionStrength: 0.25,
      vibrationIntensity: 2,
      crackThickness: 1.8
    }
  },
  obsidianGlass: {
    name: 'Studio Obsidian',
    description: 'Cinematic museum-grade material with strong specular glaze, deep shadows, rich chromatic split, and a slow, weighty physical return.',
    config: {
      crackDensity: 18,
      ringCount: 5,
      fractureSpreadRadius: 280,
      springTension: 0.07,
      physicsDamping: 0.14,
      displacementIntensity: 22,
      rotationIntensity: 0.12,
      refractionStrength: 0.18,
      chromaticAberration: 4.0,
      vibrationIntensity: 3,
      crackThickness: 1.3,
      reflectionStrength: 0.65
    }
  },
  frozenGlacier: {
    name: 'Glacial Crust',
    description: 'Brittle crystalloid structures displaying intense refraction distortion, slow movement, and heavy glowing particles simulating light drifting through ice.',
    config: {
      crackDensity: 10,
      ringCount: 5,
      fractureSpreadRadius: 400,
      springTension: 0.03,
      physicsDamping: 0.09,
      displacementIntensity: 55,
      rotationIntensity: 0.35,
      refractionStrength: 0.45,
      vibrationIntensity: 5,
      particleCount: 200,
      crackThickness: 2.5
    }
  }
};
