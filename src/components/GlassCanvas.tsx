/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Shard, ImpactPoint, GlassDustParticle, GlassConfig, BackgroundPreset, Vec2 } from '../types';
import { generateRadialShards, generateVoronoiShards } from '../utils/crackGenerator';
import { Sparkles, Image as ImageIcon, Touchpad, Zap, Compass } from 'lucide-react';

interface GlassCanvasProps {
  config: GlassConfig;
  activeBackground: BackgroundPreset;
  generatorType: 'radial' | 'voronoi';
  isMuted: boolean;
  onImpactTriggered?: () => void;
  customImageUrl?: string;
  debugMode?: boolean;
  strikeTrigger?: number;
}

export default function GlassCanvas({
  config,
  activeBackground,
  generatorType,
  isMuted,
  onImpactTriggered,
  customImageUrl,
  debugMode = false,
  strikeTrigger = 0
}: GlassCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Loaded image ref
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  // Game/Simulation states
  const [impacts, setImpacts] = useState<ImpactPoint[]>([]);
  const latestImpactRef = useRef<ImpactPoint | null>(null);
  const shardsRef = useRef<Shard[]>([]);
  const particlesRef = useRef<GlassDustParticle[]>([]);
  const seedsRef = useRef<Vec2[]>([]);

  // Mouse & Parallax Intertia (smooth LERP tracking)
  const mousePosRef = useRef<Vec2>({ x: 0, y: 0 });
  const glarePosRef = useRef<Vec2>({ x: 0, y: 0 });
  const isHoveredRef = useRef(false);
  const isDraggingRef = useRef(false);

  // Performance stats
  const [showStats, setShowStats] = useState(false);
  const [fps, setFps] = useState(60);
  const [activeShardCount, setActiveShardCount] = useState(0);

  // Screen Shake timer
  const screenShakeRef = useRef(0);

  // Trigger audio frequency synthesized clicks
  const playGlassSound = (intensity: number) => {
    if (isMuted) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      // High pitch metallic clink
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      // High-frequency crystal strike frequency
      osc.frequency.setValueAtTime(2500 + Math.random() * 1500, ctx.currentTime);
      // Exponential decay
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.15);
      
      gain.gain.setValueAtTime(intensity * 0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      
      // Add a tiny bit of noisy crunch for crack propagation
      const bufferSize = ctx.sampleRate * 0.05; // 50ms crunch
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 4) * 0.12;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(intensity * 0.4, ctx.currentTime);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

      osc.connect(gain);
      noise.connect(noiseGain);
      
      gain.connect(ctx.destination);
      noiseGain.connect(ctx.destination);
      
      osc.start();
      noise.start();
      
      osc.stop(ctx.currentTime + 0.3);
      noise.stop(ctx.currentTime + 0.3);
    } catch (e) {
      // Audio permission or Web Audio API error
    }
  };

  // Determine actual image source URL (standard or user input)
  const imageSource = useMemo(() => {
    if (customImageUrl && customImageUrl.trim() !== '') {
      return customImageUrl;
    }
    return activeBackground.url;
  }, [activeBackground, customImageUrl]);

  // Load Image on source change
  useEffect(() => {
    setImageLoading(true);
    setImageError(false);
    setBgImage(null);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSource;
    img.referrerPolicy = 'no-referrer';

    img.onload = () => {
      setBgImage(img);
      setImageLoading(false);
      handleReset(true); // Quiet reset on image load to ensure new crop begins pristine
    };

    img.onerror = () => {
      // Re-try without cross-origin in case bucket blocks it
      const imgFallback = new Image();
      imgFallback.src = imageSource;
      imgFallback.referrerPolicy = 'no-referrer';
      imgFallback.onload = () => {
        setBgImage(imgFallback);
        setImageLoading(false);
        handleReset(true); // Quiet reset on fallback image load as well
      };
      imgFallback.onerror = () => {
        setImageError(true);
        setImageLoading(false);
      };
    };
  }, [imageSource]);

  // Reset function
  const handleReset = (silentParam?: boolean | React.MouseEvent | any) => {
    const silent = silentParam === true;
    setImpacts([]);
    latestImpactRef.current = null;
    shardsRef.current = [];
    particlesRef.current = [];
    seedsRef.current = [];
    screenShakeRef.current = 0;
    setActiveShardCount(0);
    if (!silent) {
      playGlassSound(0.2);
    }
  };

  // Listen to external triggers for random demonstration strikes
  useEffect(() => {
    if (strikeTrigger > 0 && canvasRef.current) {
      const canv = canvasRef.current;
      const dpr = window.devicePixelRatio || 1;
      const canvW = canv.width / dpr;
      const canvH = canv.height / dpr;
      // Strike randomly inside the inner 60% of the canvas bounds
      const x = canvW * (0.2 + Math.random() * 0.6);
      const y = canvH * (0.2 + Math.random() * 0.6);
      triggerImpact(x, y);
    }
  }, [strikeTrigger]);

  // Trigger Glass Fracture Impact at coordinates
  const triggerImpact = (x: number, y: number, isSwipe = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (onImpactTriggered) onImpactTriggered();

    const timestamp = performance.now();
    const impactForce = isSwipe ? 0.45 : 1.0;
    const dpr = window.devicePixelRatio || 1;
    
    // 1. Play clink audio
    playGlassSound(impactForce);

    // 2. Add shake velocity
    screenShakeRef.current = config.vibrationIntensity * impactForce;

    // 3. Register Impact State
    const newImpact: ImpactPoint = {
      id: `${timestamp}-${Math.random()}`,
      x,
      y,
      time: timestamp,
      force: impactForce,
      radius: 0
    };

    latestImpactRef.current = newImpact;
    setImpacts(prev => [...prev, newImpact]);

    // 4. Generate or append Shards (scaled by dpr for high-density accuracy)
    const w = canvas.width;
    const h = canvas.height;
    const scaledConfig = {
      ...config,
      fractureSpreadRadius: config.fractureSpreadRadius * dpr,
    };

    if (shardsRef.current.length === 0) {
      // First structural strike - split the glass layout!
      if (generatorType === 'radial') {
        shardsRef.current = generateRadialShards(x, y, w, h, scaledConfig);
      } else {
        const { shards, seeds } = generateVoronoiShards(x, y, w, h, scaledConfig, []);
        shardsRef.current = shards;
        seedsRef.current = seeds;
      }
    } else if (generatorType === 'voronoi') {
      // Multi-impact support in Voronoi by adding seeds and re-tesselating
      const { shards, seeds } = generateVoronoiShards(x, y, w, h, scaledConfig, seedsRef.current);
      
      // Preserve dynamic offsets and velocities of currently existing shards where possible
      // In this system, we re-fracture, giving beautiful physical continuity
      shardsRef.current = shards;
      seedsRef.current = seeds;
    } else {
      // In Radial mode, subsequent impacts push existing shards.
      // We can add a micro-impact point so shards recognize a new shockwave root
    }

    // 5. Apply outward momentum pushing shards based on distance to impact point
    const forceRadius = config.fractureSpreadRadius * dpr;
    shardsRef.current.forEach(shard => {
      const dx = shard.originCenter.x - x;
      const dy = shard.originCenter.y - y;
      const dist = Math.hypot(dx, dy);

      if (dist < forceRadius) {
        // Shockwave falloff factor
        const falloff = Math.exp(-dist / (forceRadius * 0.5));
        const theta = Math.atan2(dy, dx);
        
        // Outward slide vector scales with dpr
        shard.velocity.x += Math.cos(theta) * config.displacementIntensity * dpr * falloff * (0.8 + Math.random() * 0.4);
        shard.velocity.y += Math.sin(theta) * config.displacementIntensity * dpr * falloff * (0.8 + Math.random() * 0.4);
        
        // Pull outwards and depth kick scales with dpr
        shard.depthVelocity += config.displacementIntensity * dpr * 0.6 * falloff * (0.5 + Math.random() * 0.7);
        
        // Twist rotation
        shard.angularVelocity += (Math.random() - 0.5) * config.rotationIntensity * falloff * 5;

        // 3D normal tilt
        shard.tiltVelX += (Math.random() - 0.5) * config.rotationIntensity * falloff * 0.4;
        shard.tiltVelY += (Math.random() - 0.5) * config.rotationIntensity * falloff * 0.4;
      }
    });

    // 6. Spawn crystalline glitter particles (accelerated/offset matching physical screen coordinates)
    const pCount = Math.round(config.particleCount * impactForce);
    for (let i = 0; i < pCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (Math.random() * 6 + 1.2) * dpr;
      const size = Math.random() * 3.5 + 0.8;
      const life = 1.0;
      const decay = 0.01 + Math.random() * 0.02;

      // Color palette of reflecting luxury diamonds/glass
      const colorChance = Math.random();
      let color = 'rgba(255, 255, 255, 0.9)'; // Specular white
      if (colorChance > 0.8) color = 'rgba(164, 235, 255, 0.95)'; // Aqua refract
      else if (colorChance > 0.6) color = 'rgba(255, 187, 187, 0.95)'; // Amber aberr

      particlesRef.current.push({
        id: Math.random(),
        x,
        y,
        vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 2 * dpr,
        vy: Math.sin(angle) * speed + (Math.random() - 0.5) * 2 * dpr - 1.5 * dpr, // Float slightly up initially
        vz: (Math.random() * 5 + 2) * dpr,
        z: 0,
        size,
        alpha: 0.9,
        color,
        rotation: Math.random() * Math.PI * 2,
        omega: (Math.random() - 0.5) * 0.4,
        life,
        decay
      });
    }

    setActiveShardCount(shardsRef.current.length);
  };

  // Setup pointer handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    isDraggingRef.current = true;
    mousePosRef.current = { x: clickX, y: clickY };

    triggerImpact(clickX, clickY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    isHoveredRef.current = true;

    // Drags trigger continuous micro-cracks
    if (isDraggingRef.current && shardsRef.current.length > 0) {
      // Check velocity
      const lastX = mousePosRef.current.x;
      const lastY = mousePosRef.current.y;
      const dragDist = Math.hypot(x - lastX, y - lastY);

      // Only fracture dragging lines if we moved far enough to prevent overcrowding
      if (dragDist > 30) {
        triggerImpact(x, y, true);
      }
    }

    mousePosRef.current = { x, y };
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  const handlePointerLeave = () => {
    isHoveredRef.current = false;
    isDraggingRef.current = false;
  };

  // Core Physics and Rendering loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !bgImage) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let lastTime = performance.now();
    let frameCount = 0;
    let fpsInterval = lastTime;

    const tick = (now: number) => {
      const dt = Math.min(33, now - lastTime) / 16.666; // Normalize around 60fps frame delta
      const dpr = window.devicePixelRatio || 1;
      lastTime = now;

      // Override refraction and parallax depth for custom cropped images to ensure the face stays perfectly undistorted
      const isCustomImage = customImageUrl && customImageUrl.trim() !== '';
      const activeRefractionStrength = config.refractionStrength;
      const activeParallaxDepth = isCustomImage ? 0 : config.parallaxDepth;

      // 1. Calculate FPS
      frameCount++;
      if (now - fpsInterval >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        fpsInterval = now;
      }

      // 2. Physics - Handle pointer tracking delay (smooth luxury hover lag)
      const lerpSpeed = 0.08 * dt;
      glarePosRef.current.x += (mousePosRef.current.x - glarePosRef.current.x) * lerpSpeed;
      glarePosRef.current.y += (mousePosRef.current.y - glarePosRef.current.y) * lerpSpeed;

      // Update Screen Shake decay
      if (screenShakeRef.current > 0.05) {
        screenShakeRef.current *= Math.pow(0.85, dt);
      } else {
        screenShakeRef.current = 0;
      }

      // 3. Shockwave wave propagation
      const propagationSpeed = 16 * dt; // speed of crack spread
      impacts.forEach(imp => {
        imp.radius += propagationSpeed;
      });

      // 4. Update Shard Physics
      const dampingFactor = 1 - config.physicsDamping;
      const springK = config.springTension;
      const w = canvas.width;
      const h = canvas.height;

      shardsRef.current.forEach(shard => {
        // Evaluate if propagation wave reached this shard yet
        if (!shard.isBroken && impacts.length > 0) {
          const inRange = impacts.some(imp => {
            const timeElapsed = now - imp.time;
            // Scale propagation wave radius by dpr so it reaches shards at the same physical rate on high-density mobile screens
            const currentWaveRadius = timeElapsed * 0.45 * dpr;
            return shard.distanceToImpact <= currentWaveRadius;
          });
          
          if (inRange) {
            shard.isBroken = true;
          }
        }

        // Apply springs returning to default rest pose (dx=0, dy=0, angle=0)
        if (shard.isBroken) {
          // Hooke's Law with mechanical damping
          const forceX = -springK * shard.position.x - config.physicsDamping * shard.velocity.x;
          const forceY = -springK * shard.position.y - config.physicsDamping * shard.velocity.y;
          const forceZ = -springK * shard.depth - config.physicsDamping * shard.depthVelocity;
          const forceRot = -springK * shard.rotation - config.physicsDamping * shard.angularVelocity;
          const forceTiltX = -springK * shard.tiltX - config.physicsDamping * shard.tiltVelX;
          const forceTiltY = -springK * shard.tiltY - config.physicsDamping * shard.tiltVelY;

          shard.velocity.x += (forceX / shard.mass) * dt;
          shard.velocity.y += (forceY / shard.mass) * dt;
          shard.depthVelocity += (forceZ / shard.mass) * dt;
          shard.angularVelocity += (forceRot / shard.mass) * dt;
          shard.tiltVelX += (forceTiltX / shard.mass) * dt;
          shard.tiltVelY += (forceTiltY / shard.mass) * dt;

          shard.position.x += shard.velocity.x * dt;
          shard.position.y += shard.velocity.y * dt;
          shard.depth += shard.depthVelocity * dt;
          shard.rotation += shard.angularVelocity * dt;
          shard.tiltX += shard.tiltVelX * dt;
          shard.tiltY += shard.tiltVelY * dt;

          // Drag effect: hover applies kinetic displacement (scaled by dpr)
          if (isHoveredRef.current) {
            const mDist = Math.hypot(glarePosRef.current.x - shard.originCenter.x, glarePosRef.current.y - shard.originCenter.y);
            const activeThreshold = 80 * dpr;
            if (mDist < activeThreshold) {
              const hoverFalloff = 1 - mDist / activeThreshold;
              const angle = Math.atan2(shard.originCenter.y - glarePosRef.current.y, shard.originCenter.x - glarePosRef.current.x);
              
              // Push shards away from active hover cursor
              shard.position.x += Math.cos(angle) * (config.surfaceTension * dpr) * hoverFalloff * dt;
              shard.position.y += Math.sin(angle) * (config.surfaceTension * dpr) * hoverFalloff * dt;
              shard.depth += (config.surfaceTension * dpr) * 0.7 * hoverFalloff * dt;
              shard.rotation += (Math.random() - 0.5) * 0.02 * hoverFalloff * dt;
            }
          }
        }
      });

      // 5. Update Particle Simulation (scaled by dpr)
      particlesRef.current.forEach(p => {
        p.life -= p.decay * dt;
        p.vx *= Math.pow(0.97, dt);
        p.vy += 0.15 * dpr * dt; // Gravity
        
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.z += p.vz * dt;
        p.vz -= 0.1 * dpr * dt; // axial drop decay
        p.rotation += p.omega * dt;
        p.alpha = Math.max(0, p.life);
      });

      // Prune expired dust particles
      particlesRef.current = particlesRef.current.filter(p => p.life > 0);

      // Rendering Step
      ctx.clearRect(0, 0, w, h);

      // Calculate cover fit metrics to draw bgImage with matching aspect ratio without distortion
      let coverX = 0;
      let coverY = 0;
      let coverW = w;
      let coverH = h;
      if (bgImage) {
        if (isCustomImage) {
          // Since the custom image is already cropped exactly matching the aspect-ratio,
          // draw it filling the canvas boundaries perfectly to prevent any scaling offsets or clipping jumps.
          coverX = 0;
          coverY = 0;
          coverW = w;
          coverH = h;
        } else {
          const rCanvas = w / h;
          const rImage = bgImage.naturalWidth / bgImage.naturalHeight;
          if (rImage > rCanvas) {
            const s = h / bgImage.naturalHeight;
            coverW = bgImage.naturalWidth * s;
            coverH = h;
            coverX = (w - coverW) / 2;
            coverY = 0;
          } else {
            const s = w / bgImage.naturalWidth;
            coverW = w;
            coverH = bgImage.naturalHeight * s;
            coverX = 0;
            coverY = (h - coverH) / 2;
          }
        }
      }

      // Save baseline composition for screen shake effect
      ctx.save();
      if (screenShakeRef.current > 0.01) {
        const sx = (Math.random() - 0.5) * screenShakeRef.current;
        const sy = (Math.random() - 0.5) * screenShakeRef.current;
        ctx.translate(sx, sy);
      }

      // 6. Draw background image / shards
      if (shardsRef.current.length === 0) {
        // GLASS INTENSIVELY WHOLE (PRISTINE STAGE)
        ctx.save();
        
        // Dynamic hover parallax (extremely luxurious subtle depth movement)
        if (isHoveredRef.current && activeParallaxDepth > 0) {
          const px = -(mousePosRef.current.x - w / 2) * (activeParallaxDepth / (w / 2));
          const py = -(mousePosRef.current.y - h / 2) * (activeParallaxDepth / (h / 2));
          ctx.translate(px, py);
          // Micro-lens scale overlay stretching under surface tension
          const scale = 1.002;
          ctx.scale(scale, scale);
          ctx.translate(-w * 0.001, -h * 0.001);
        }

        // Draw basic background scaled to cover the bounds perfectly without distortion
        ctx.drawImage(bgImage, coverX, coverY, coverW, coverH);
        ctx.restore();

        // Overlay light glow tracker on pristine surface
        if (isHoveredRef.current) {
          const hoverGlare = ctx.createRadialGradient(
            glarePosRef.current.x, glarePosRef.current.y, 0,
            glarePosRef.current.x, glarePosRef.current.y, 250
          );
          // Elegant minimal specular spot
          hoverGlare.addColorStop(0, `rgba(255, 255, 255, ${config.reflectionStrength * 0.3})`);
          hoverGlare.addColorStop(0.3, `rgba(255, 255, 255, ${config.reflectionStrength * 0.08})`);
          hoverGlare.addColorStop(1, 'rgba(255, 255, 255, 0)');
          
          ctx.globalCompositeOperation = 'screen';
          ctx.fillStyle = hoverGlare;
          ctx.fillRect(0, 0, w, h);
          ctx.globalCompositeOperation = 'source-over';
        }
      } else {
        // GLASS BROKEN (SHATTERED STAGE INDEPENDENT RENDERING)
        shardsRef.current.forEach(shard => {
          // If the shard isn't activated inside our fracture wave yet, render static
          if (!shard.isBroken) {
            ctx.save();
            
            ctx.beginPath();
            ctx.moveTo(shard.originalPoints[0].x, shard.originalPoints[0].y);
            for (let v = 1; v < shard.originalPoints.length; v++) {
              ctx.lineTo(shard.originalPoints[v].x, shard.originalPoints[v].y);
            }
            ctx.closePath();
            ctx.clip();
            
            // Draw background image flat with correct aspect ratio
            ctx.drawImage(bgImage, coverX, coverY, coverW, coverH);
            ctx.restore();
            return;
          }

          ctx.save();

          // Move coordinate canvas to shard center for physical 3D transforms
          const cx = shard.originCenter.x;
          const cy = shard.originCenter.y;

          // Apply translations: translation + rotation + 3D skew coordinates
          ctx.translate(cx + shard.position.x, cy + shard.position.y);
          ctx.rotate(shard.rotation);
          
          // Apply skew shear representing 3D facial tilt
          ctx.transform(1, shard.tiltY * 0.3, shard.tiltX * 0.3, 1, 0, 0);
          
          // Center transformation back to original layout coordinates
          ctx.translate(-cx, -cy);

          // Path layout for clipping mask
          ctx.beginPath();
          ctx.moveTo(shard.originalPoints[0].x, shard.originalPoints[0].y);
          for (let v = 1; v < shard.originalPoints.length; v++) {
            ctx.lineTo(shard.originalPoints[v].x, shard.originalPoints[v].y);
          }
          ctx.closePath();
          ctx.clip();

          // Refraction warp: shifting texture back based on physically active depth and translation
          ctx.save();
          const refractX = shard.position.x * activeRefractionStrength;
          const refractY = shard.position.y * activeRefractionStrength;
          ctx.translate(refractX, refractY);
          
          // Draw underlying texturing inside clipped cell with correct aspect ratio
          ctx.drawImage(bgImage, coverX, coverY, coverW, coverH);
          ctx.restore();

          // Specular face normal tint (glowing facets reflecting direct lights on rotation)
          if (config.reflectionStrength > 0 && Math.abs(shard.depth) > 0.1) {
            const specX = cx + shard.position.x;
            const specY = cy + shard.position.y;
            const faceGlint = ctx.createLinearGradient(
              specX - 40, specY - 40,
              specX + 40, specY + 40
            );
            // Flash brightness proportional to z-axis displacement and rotation velocity
            const peakOpacity = Math.min(0.85, (Math.abs(shard.depthVelocity) + Math.abs(shard.angularVelocity * 10)) * config.reflectionStrength * 0.2);
            faceGlint.addColorStop(0, `rgba(255, 255, 255, ${peakOpacity})`);
            faceGlint.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
            faceGlint.addColorStop(1, `rgba(255, 255, 255, ${peakOpacity * 0.3})`);

            ctx.globalCompositeOperation = 'screen';
            ctx.fillStyle = faceGlint;
            ctx.beginPath();
            ctx.moveTo(shard.originalPoints[0].x, shard.originalPoints[0].y);
            for (let v = 1; v < shard.originalPoints.length; v++) {
              ctx.lineTo(shard.originalPoints[v].x, shard.originalPoints[v].y);
            }
            ctx.closePath();
            ctx.fill();
            ctx.globalCompositeOperation = 'source-over';
          }

          ctx.restore(); // Restore shard spatial transformation
          
          // DRAW CRISPY SPECULAR CRACK EDGES (aligned with dynamic physical screen density)
          // To implement luxurious Chromatic Aberration & high realism, we draw borders with offset lines
          const splitAmount = config.chromaticAberration * dpr;
          
          const drawBorder = (color: string, ox: number, oy: number, widthVal: number) => {
            ctx.save();
            ctx.translate(ox, oy);
            ctx.strokeStyle = color;
            ctx.lineWidth = widthVal;
            ctx.lineJoin = 'round';
            ctx.beginPath();
            ctx.moveTo(shard.originalPoints[0].x + shard.position.x, shard.originalPoints[0].y + shard.position.y);
            for (let v = 1; v < shard.originalPoints.length; v++) {
              ctx.lineTo(shard.originalPoints[v].x + shard.position.x, shard.originalPoints[v].y + shard.position.y);
            }
            ctx.closePath();
            ctx.stroke();
            ctx.restore();
          };

          // Specular highlight outline
          if (splitAmount > 0.1) {
            // Draw red-aberration crack line slightly left
            drawBorder('rgba(255, 75, 75, 0.35)', -splitAmount * 0.4, 0, config.crackThickness * dpr);
            // Draw cyan-aberration crack line slightly right
            drawBorder('rgba(0, 240, 255, 0.35)', splitAmount * 0.4, 0, config.crackThickness * dpr);
          }
          
          // Draw clean crisp white-silver specular edge
          drawBorder(`rgba(255, 255, 255, ${config.specularShine * 0.85})`, 0, 0, config.crackThickness * dpr);
        });
      }

      // 7. Render dynamic glass sparks & floating dust
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      particlesRef.current.forEach(p => {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);

        // Make particles glitter by oscillating size/opacity based on rotation
        const sparkleGlint = Math.cos(p.rotation * 4) * 0.4 + 0.6;
        const finalAlpha = p.alpha * sparkleGlint;
        const finalSize = p.size * dpr;

        const pGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, finalSize * (config.particleGlow ? 3 : 1));
        pGrad.addColorStop(0, p.color.replace('0.9', `${finalAlpha}`));
        pGrad.addColorStop(0.3, p.color.replace('0.9', `${finalAlpha * 0.4}`));
        pGrad.addColorStop(1, 'rgba(255,255,255,0)');

        ctx.fillStyle = pGrad;
        ctx.beginPath();
        ctx.arc(0, 0, finalSize * (config.particleGlow ? 3 : 1), 0, Math.PI * 2);
        ctx.fill();

        // Draw solid crystalline shard center core
        ctx.fillStyle = `rgba(255, 255, 255, ${finalAlpha})`;
        ctx.beginPath();
        // Little crystal diamond shapes
        ctx.moveTo(0, -finalSize);
        ctx.lineTo(finalSize * 0.7, 0);
        ctx.lineTo(0, finalSize);
        ctx.lineTo(-finalSize * 0.7, 0);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
      });
      ctx.restore();

      // 8. Draw global ambient glare light source overlay tracking cursor (spotlight tie-together)
      if (isHoveredRef.current) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        
        // Large ambient reflection spotlight (scaled by dpr)
        const glareRadiance = ctx.createRadialGradient(
          glarePosRef.current.x, glarePosRef.current.y, 5,
          glarePosRef.current.x, glarePosRef.current.y, 450 * dpr
        );
        // White gold soft gloss
        glareRadiance.addColorStop(0, `rgba(255, 255, 255, ${config.reflectionStrength * 0.25})`);
        glareRadiance.addColorStop(0.4, `rgba(255, 255, 255, ${config.reflectionStrength * 0.06})`);
        glareRadiance.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.fillStyle = glareRadiance;
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
      }

      // Draw subtle dark vignette overlay for luxurious high-contrast depth
      if (config.ambientGlow > 0) {
        ctx.save();
        const vignette = ctx.createRadialGradient(w / 2, h / 2, w / 4, w / 2, h / 2, w * 0.82);
        vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
        vignette.addColorStop(1, `rgba(0, 0, 0, ${config.ambientGlow * 0.8})`);
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
      }

      // 9. Draw Debug Seeds / Polygons (crack structures overlay)
      if (debugMode && shardsRef.current.length > 0) {
        ctx.save();
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 1;
        shardsRef.current.forEach(s => {
          ctx.beginPath();
          ctx.arc(s.originCenter.x + s.position.x, s.originCenter.y + s.position.y, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = s.isBroken ? '#ef4444' : '#10b981';
          ctx.fill();
          ctx.stroke();
        });
        ctx.restore();
      }

      ctx.restore(); // Restore shake baseline

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [bgImage, config, generatorType, isHoveredRef.current, impacts, debugMode, customImageUrl]);

  // Adjust canvas size to parent container with ResizeObserver
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        const dpr = window.devicePixelRatio || 1;
        
        // High density rendering - match backing store precisely with dpr physical resolution
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        // When resized, we clean currently scheduled shards because coordinates must change.
        // But to prevent annoying breakage, we just clear and let the user re-crack it!
        handleReset();
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  // Set canvas container style to match image aspect ratio if a custom image is loaded
  const containerStyle = useMemo<React.CSSProperties>(() => {
    if (bgImage && customImageUrl && customImageUrl.trim() !== '') {
      return {
        aspectRatio: `${bgImage.naturalWidth} / ${bgImage.naturalHeight}`,
        height: 'auto',
      };
    }
    return {};
  }, [bgImage, customImageUrl]);

  return (
    <div 
      id="canvas-container-root" 
      ref={containerRef} 
      style={containerStyle}
      className={`relative w-full select-none cursor-crosshair rounded-2xl md:rounded-3xl overflow-hidden bg-[#F5F5F3] border border-[#E8E8E8] shadow-[0_32px_80px_rgba(0,0,0,0.06)] max-w-full ${
        customImageUrl && customImageUrl.trim() !== '' ? '' : 'h-[420px] sm:h-[520px] md:h-[680px]'
      }`}
    >
      {/* Luxury Loading state UI */}
      {imageLoading && (
        <div id="canvas-skeleton" className="absolute inset-0 flex flex-col items-center justify-center bg-white/95 z-20 transition-all duration-500 animate-pulse">
          <div className="relative flex items-center justify-center p-8 border border-[#E8E8E8] rounded-full w-20 h-20 mb-4 bg-[#F5F5F3]">
            <Sparkles className="w-8 h-8 text-[#7A0000] stroke-[1.2] animate-spin" />
            <div className="absolute inset-0 border border-t-[#7A0000] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
          </div>
          <p className="font-mono text-[9px] tracking-[0.25em] uppercase text-neutral-500 animate-pulse font-bold">PREPARING PORTRAIT MEMORIES</p>
        </div>
      )}

      {/* Luxury Error state UI */}
      {imageError && (
        <div id="canvas-error" className="absolute inset-0 flex flex-col items-center justify-center bg-white/98 z-20 text-[#111111] font-sans p-6 text-center">
          <div className="p-4 border border-red-100 rounded-full bg-[#7A0000]/5 text-[#7A0000] mb-4">
            <ImageIcon className="w-8 h-8 stroke-[1.2]" />
          </div>
          <h4 className="text-xs font-mono font-extrabold uppercase tracking-widest text-[#111111] mb-2">Secure Load Incomplete</h4>
          <p className="text-[11px] text-neutral-500 max-w-xs leading-relaxed mb-4">The selected image source might be blocking cross-origin loading. Please try standard subjects or another link.</p>
          <button 
            onClick={() => handleReset()}
            className="px-4 py-2 bg-[#7A0000] hover:bg-[#4A0000] transition-all rounded-xl text-[9px] font-bold uppercase tracking-widest text-white font-mono active:scale-95 border-none"
          >
            Reset Template
          </button>
        </div>
      )}

      {/* Main interactive canvas element */}
      <canvas
        id="interactive-glass-canvas"
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        className="block touch-none select-none z-10 relative bg-white"
        style={{ backfaceVisibility: 'hidden' }}
      />

      {/* Instructions overlaid in corner */}
      {impacts.length === 0 && !imageLoading && !imageError && (
        <div 
          id="canvas-hint"
          className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 backdrop-blur-md border border-[#E8E8E8] py-3 px-6 rounded-full text-neutral-700 font-sans shadow-lg pointer-events-none transition-all duration-700 select-none animate-bounce bg-white/90"
        >
          <Touchpad className="w-3.5 h-3.5 text-[#7A0000] stroke-[1.5]" />
          <span className="text-[10px] font-mono font-bold uppercase tracking-[0.18em] whitespace-nowrap text-neutral-800">CLICK TO BREAK • DRAG TO STRETCH</span>
        </div>
      )}

      {/* Active simulation stats */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-1 pointer-events-none select-none">
        <div className="flex gap-1.5">
          <div className="backdrop-blur-md rounded-lg py-1 px-2.5 border border-[#E8E8E8] bg-white/80 flex items-center gap-1.5 font-mono text-[9px] text-neutral-600 tracking-tight shadow-sm font-bold uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-[#7A0000] animate-pulse"></span>
            <span>{fps} FPS</span>
          </div>
          <div className="backdrop-blur-md rounded-lg py-1 px-2.5 border border-[#E8E8E8] bg-white/80 flex items-center gap-1.5 font-mono text-[9px] text-neutral-600 tracking-tight shadow-sm font-bold uppercase">
            <span>{activeShardCount} SHARDS</span>
          </div>
        </div>
        {generatorType === 'voronoi' && (
          <div className="backdrop-blur-md self-start rounded-lg py-0.5 px-2 bg-white/80 text-neutral-500 font-mono text-[8px] uppercase tracking-widest mt-1 border border-[#E8E8E8] font-bold">
            VORONOI PATTERN
          </div>
        )}
        {generatorType === 'radial' && (
          <div className="backdrop-blur-md self-start rounded-lg py-0.5 px-2 bg-white/80 text-neutral-500 font-mono text-[8px] uppercase tracking-widest mt-1 border border-[#E8E8E8] font-bold">
            RADIAL WEB PATTERN
          </div>
        )}
      </div>

      {/* Right controls layout overlays: Clear, Reset */}
      {impacts.length > 0 && (
        <button
          id="canvas-reset-btn"
          onClick={handleReset}
          className="absolute top-4 right-4 z-20 font-mono tracking-[0.16em] uppercase text-[9px] font-bold text-white hover:bg-[#4A0000] px-4 py-2 rounded-xl transition-all duration-300 shadow-md cursor-pointer bg-[#7A0000] active:scale-95 border-0 focus:outline-none"
        >
          Suturing Glass
        </button>
      )}
    </div>
  );
}
