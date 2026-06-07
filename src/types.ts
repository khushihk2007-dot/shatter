/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Vec2 {
  x: number;
  y: number;
}

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface Shard {
  id: number;
  // Bounding points of this polygonal shard relative to original canvas layout
  originalPoints: Vec2[];
  // Bounding points of this shard with current physical translations applied
  currentPoints: Vec2[];
  // Original center of mass of this polygon shard
  originCenter: Vec2;
  
  // Physics States
  position: Vec2;         // 2D displacement offset
  velocity: Vec2;         // 2D velocity of translation
  depth: number;          // 3D z-axis extrusion/depth
  depthVelocity: number;  // Velocity of 3D depth movement
  rotation: number;       // 2D skew/yaw rotational offset
  angularVelocity: number;// Rotational velocity
  tiltX: number;          // 3D tilt X
  tiltY: number;          // 3D tilt Y
  tiltVelX: number;       // 3D tilt velocity X
  tiltVelY: number;       // 3D tilt velocity Y
  
  mass: number;           // Shard size proportional mass
  isBroken: boolean;      // Whether the fracture wave has hit this shard
  distanceToImpact: number; // Distance from parent impact point
  impactAngle: number;    // Angle from parent impact point
  friction: number;       // Material resistance
}

export interface ImpactPoint {
  id: string;
  x: number;
  y: number;
  time: number;           // Timestamp when impact occurred
  force: number;          // Input force magnitude
  radius: number;         // Current wave propagation radius
}

export interface GlassDustParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  vz: number;
  z: number;
  size: number;
  alpha: number;
  color: string;
  rotation: number;
  omega: number;          // Angular velocity
  life: number;           // Current remaining life percentage (0 to 1)
  decay: number;          // Life depletion rate per frame
}

export interface GlassConfig {
  crackDensity: number;      // Number of radial rays
  ringCount: number;         // Number of concentric rings
  crackThickness: number;    // Line thickness of the cracks
  fractureSpreadRadius: number; // Max distance cracks can spread
  shardCount: number;        // Shard count multiplier
  refractionStrength: number;// Bending index of the image in cracked facets
  chromaticAberration: number;// Spectral separation on edges (px)
  reflectionStrength: number;// Specular intensity of normal lighting
  blurAmount: number;        // Backdrop blur of unfractured regions
  specularShine: number;     // Inner glow and specular brightness
  physicsDamping: number;    // Damping/friction for movement
  springTension: number;     // Return-to-home spring tension (springK)
  displacementIntensity: number; // How far shards fly out on z-axis
  rotationIntensity: number; // Rotational factor on impact
  vibrationIntensity: number; // Screen vibration magnitude
  particleCount: number;     // How many dust particles to generate on impact
  particleGlow: boolean;     // Enable particle glare glow
  surfaceTension: number;    // Hover tension bending of the image
  parallaxDepth: number;     // Hover parallax offset strength
  ambientGlow: number;       // Soft inner vignette lighting
}

export interface BackgroundPreset {
  id: string;
  name: string;
  url: string;
  credit: string;
  category: string;
  darkTheme: boolean;
}
