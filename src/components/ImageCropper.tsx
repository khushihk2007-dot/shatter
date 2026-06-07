/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Camera, ZoomIn, ZoomOut, RotateCcw, Check, X, ShieldAlert } from 'lucide-react';

interface ImageCropperProps {
  imageUrl: string;
  onCropComplete: (croppedUrl: string) => void;
  onCancel: () => void;
}

export default function ImageCropper({ imageUrl, onCropComplete, onCancel }: ImageCropperProps) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Crop parameters
  const [zoom, setZoom] = useState(1.0);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);

  // Navigation drag records
  const isDragging = useRef(false);
  const startDragPos = useRef({ x: 0, y: 0 });
  const startOffset = useRef({ x: 0, y: 0 });
  
  const viewportRef = useRef<HTMLDivElement>(null);
  const [viewportSize, setViewportSize] = useState({ width: 480, height: 320 });
  const [isPhone, setIsPhone] = useState(false);

  // Update viewport width dynamically based on bounds
  useEffect(() => {
    const handleResize = () => {
      const parentW = viewportRef.current?.parentElement?.clientWidth || window.innerWidth || 500;
      const isPhoneView = parentW < 640 || window.innerWidth < 640;
      setIsPhone(isPhoneView);

      const aspect = isPhoneView ? 0.75 : 1.5; // Vertical section on phone (0.75 ratio), horizontal 1.5 on desktop
      let width = Math.min(parentW - 32, 540);
      let height = Math.round(width / aspect);

      // Standard safety guard for mobile height constraint within max viewport
      const maxHeight = window.innerHeight * 0.45;
      if (height > maxHeight) {
        height = Math.round(maxHeight);
        width = Math.round(height * aspect);
      }

      setViewportSize({ width, height });
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Preload image to get natural ratios
  useEffect(() => {
    setLoading(true);
    setError(false);
    const imageElement = new Image();
    imageElement.src = imageUrl;
    imageElement.onload = () => {
      setImg(imageElement);
      setLoading(false);
    };
    imageElement.onerror = () => {
      setError(true);
      setLoading(false);
    };
  }, [imageUrl]);

  // Derived dimensions when img and viewport size are both available
  const getLayoutDimensions = () => {
    if (!img) return { w0: 0, h0: 0, fitScale: 1 };
    
    const cropWidth = viewportSize.width;
    const cropHeight = viewportSize.height;

    // Calculate fit scale (cover scale)
    const fitScale = Math.max(cropWidth / img.naturalWidth, cropHeight / img.naturalHeight);
    const w0 = img.naturalWidth * fitScale;
    const h0 = img.naturalHeight * fitScale;

    return { w0, h0, fitScale };
  };

  const { w0, h0, fitScale } = getLayoutDimensions();
  const currentW = w0 * zoom;
  const currentH = h0 * zoom;

  // Re-center when image or viewport updates
  useEffect(() => {
    if (img && w0 > 0) {
      setZoom(1.0);
      setOffsetX((viewportSize.width - w0) / 2);
      setOffsetY((viewportSize.height - h0) / 2);
    }
  }, [img, w0, h0, viewportSize]);

  // Clamp helper
  const clampOffset = (x: number, y: number, z: number) => {
    const cropW = viewportSize.width;
    const cropH = viewportSize.height;
    const w = w0 * z;
    const h = h0 * z;

    // Constrain so that there's never an empty background border
    let minX = cropW - w;
    let minY = cropH - h;

    // If image is somehow smaller, keep it centered
    if (minX > 0) minX = minX / 2;
    if (minY > 0) minY = minY / 2;

    const clampedX = Math.max(minX, Math.min(0, x));
    const clampedY = Math.max(minY, Math.min(0, y));

    return { x: clampedX, y: clampedY };
  };

  // Zoom slider helper to keep scale centered
  const handleZoomChange = (newZoom: number) => {
    const cropW = viewportSize.width;
    const cropH = viewportSize.height;

    // Center coordinates in image space
    const centerX = offsetX - cropW / 2;
    const centerY = offsetY - cropH / 2;

    const ratio = newZoom / zoom;
    const targetX = centerX * ratio + cropW / 2;
    const targetY = centerY * ratio + cropH / 2;

    const clamped = clampOffset(targetX, targetY, newZoom);
    setZoom(newZoom);
    setOffsetX(clamped.x);
    setOffsetY(clamped.y);
  };

  // Drag listeners
  const onPointerDown = (e: React.PointerEvent) => {
    if (loading || error) return;
    isDragging.current = true;
    startDragPos.current = { x: e.clientX, y: e.clientY };
    startOffset.current = { x: offsetX, y: offsetY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - startDragPos.current.x;
    const dy = e.clientY - startDragPos.current.y;
    
    const newX = startOffset.current.x + dx;
    const newY = startOffset.current.y + dy;

    const clamped = clampOffset(newX, newY, zoom);
    setOffsetX(clamped.x);
    setOffsetY(clamped.y);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    isDragging.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (_) {}
  };

  const handleResetPlacement = () => {
    setZoom(1.0);
    setOffsetX((viewportSize.width - w0) / 2);
    setOffsetY((viewportSize.height - h0) / 2);
  };

  // Render crop using Canvas API to get high resolution output!
  const handleExportCrop = () => {
    if (!img) return;

    try {
      // Find coordinates on original natural resolution
      const scaleOnOriginal = fitScale * zoom;
      
      const naturalCropX = -offsetX / scaleOnOriginal;
      const naturalCropY = -offsetY / scaleOnOriginal;
      const naturalCropW = viewportSize.width / scaleOnOriginal;
      const naturalCropH = viewportSize.height / scaleOnOriginal;

      const outputW = Math.max(1, Math.round(naturalCropW));
      const outputH = Math.max(1, Math.round(naturalCropH));

      const outputCanvas = document.createElement('canvas');
      // Produce image with the exact natural resolution of the cropped segment to protect quality
      outputCanvas.width = outputW;
      outputCanvas.height = outputH;

      const ctx = outputCanvas.getContext('2d');
      if (ctx) {
        // High quality scale hints
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        ctx.drawImage(
          img,
          naturalCropX,
          naturalCropY,
          naturalCropW,
          naturalCropH,
          0,
          0,
          outputW,
          outputH
        );

        const exportedUrl = outputCanvas.toDataURL('image/jpeg', 0.98);
        onCropComplete(exportedUrl);
      }
    } catch (err) {
      console.error("Cropping operation failed:", err);
    }
  };

  return (
    <div 
      id="modal-image-cropper"
      className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 md:p-8 select-none"
    >
      <div 
        id="cropper-card-wrapper"
        className="w-full max-w-2xl max-h-[94vh] bg-white rounded-2xl md:rounded-3xl border border-neutral-100 shadow-[0_24px_64px_rgba(0,0,0,0.4)] overflow-hidden flex flex-col animate-fade-in text-neutral-900"
      >
        {/* Header bar styled like camera viewport status */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#7A0000] animate-pulse" />
            <span className="font-mono text-[9px] sm:text-[10px] tracking-widest uppercase text-neutral-800 font-extrabold flex items-center gap-1.5">
              <Camera className="w-3 h-3 text-[#7A0000]" /> PortraiAlign Engine
            </span>
          </div>
          <span className="font-mono text-[8px] sm:text-[9px] text-neutral-400 tracking-[0.16em] uppercase font-bold hidden xs:inline">
            Grid Viewport Targeter
          </span>
        </div>

        {/* Viewport alignment workspace wrapper */}
        <div className="p-4 sm:p-6 md:p-8 flex flex-col items-center justify-start sm:justify-center flex-1 bg-neutral-100/50 overflow-y-auto">
          
          <p className="text-[10px] sm:text-[11px] text-neutral-500 font-sans tracking-wide text-center mb-4 sm:mb-6 max-w-sm">
            Drag to pan, use the slider to scale and center. Crop the area exactly as you desire!
          </p>

          {/* Interactive viewport alignment container with touch-none for perfect drag behavior */}
          <div 
            ref={viewportRef}
            className="relative border border-neutral-250 bg-neutral-900 overflow-hidden shadow-inner cursor-move select-none rounded-xl sm:rounded-2xl md:rounded-3xl flex items-center justify-center touch-none"
            style={{ 
              width: `${viewportSize.width}px`, 
              height: `${viewportSize.height}px`,
              touchAction: 'none'
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
          >
            {loading && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/80 gap-3">
                <div className="w-6 h-6 border-2 border-[#7A0000] border-t-transparent rounded-full animate-spin" />
                <span className="font-mono text-[9px] text-neutral-400 tracking-wider">LOADING HIGH-RES DATA</span>
              </div>
            )}

            {error && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/90 p-6 text-center text-white gap-3">
                <ShieldAlert className="w-8 h-8 text-red-500" />
                <p className="font-mono text-xs font-bold text-red-500 uppercase">Memory Allocation Blocked</p>
                <p className="text-[10px] text-neutral-400 max-w-xs">Failed to load local media canvas properly. Please retry.</p>
              </div>
            )}

            {/* Rendered image manipulated behind viewport cropbox */}
            {img && (
              <img
                src={imageUrl}
                alt="Trapped silhouette viewport alignment source"
                draggable={false}
                className="absolute origin-top-left pointer-events-none max-w-none select-none"
                style={{
                  top: 0,
                  left: 0,
                  width: `${currentW}px`,
                  height: `${currentH}px`,
                  transform: `translate3d(${offsetX}px, ${offsetY}px, 0)`,
                  transition: isDragging.current ? 'none' : 'transform 0.15s ease-out, width 0.15s ease-out, height 0.15s ease-out',
                }}
              />
            )}

            {/* Viewfinder Camera Overlay guidelines (Face brackets and Grid of thirds) */}
            <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-3 sm:p-4">
              {/* Camera focal corners */}
              <div className="flex justify-between w-full">
                <div className="w-3 h-3 border-t-2 border-l-2 border-white/40 rounded-tl-sm" />
                <div className="w-3 h-3 border-t-2 border-r-2 border-white/40 rounded-tr-sm" />
              </div>

              {/* Grid guides (Rule of Thirds overlay lines) */}
              <div className="absolute inset-0 flex flex-col justify-evenly pointer-events-none">
                <div className="w-full border-t border-white/15 border-dashed" />
                <div className="w-full border-t border-white/15 border-dashed" />
              </div>
              <div className="absolute inset-0 flex justify-evenly pointer-events-none">
                <div className="h-full border-l border-white/15 border-dashed" />
                <div className="h-full border-l border-white/15 border-dashed" />
              </div>

              <div className="flex justify-between w-full">
                <div className="w-3 h-3 border-b-2 border-l-2 border-white/40 rounded-bl-sm" />
                <div className="w-3 h-3 border-b-2 border-r-2 border-white/40 rounded-br-sm" />
              </div>
            </div>
          </div>

          {/* Interactive controls: zoom slider, rotate reset */}
          {img && (
            <div className="w-full max-w-md mt-4 sm:mt-6 space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between gap-3 sm:gap-4">
                <ZoomOut className="w-4 h-4 text-neutral-400" />
                <input
                  type="range"
                  min="1.0"
                  max="3.0"
                  step="0.01"
                  value={zoom}
                  onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                  className="flex-1 accent-[#7A0000] h-1 bg-neutral-200 rounded-lg cursor-pointer appearance-none range-sm focus:outline-none"
                />
                <ZoomIn className="w-4 h-4 text-[#7A0000]" />
              </div>

              <div className="flex items-center justify-between text-[9px] font-mono">
                {/* Scale metrics info readout */}
                <div className="text-neutral-500 tracking-wider">
                  SCALE RATIO: <span className="font-bold text-neutral-800">{(zoom * 100).toFixed(0)}%</span>
                </div>
                
                {/* Reset button to center orientation */}
                <button
                  type="button"
                  onClick={handleResetPlacement}
                  className="text-neutral-500 hover:text-neutral-800 flex items-center gap-1 tracking-widest uppercase font-bold active:scale-95 transition-all focus:outline-none"
                >
                  <RotateCcw className="w-3 h-3" /> Centering Reset
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Action CTA Buttons */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-neutral-100 flex flex-row items-center justify-end gap-2 sm:gap-3 bg-neutral-50 shrink-0">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 sm:px-4 py-2 sm:py-2 border border-neutral-200 text-neutral-600 hover:bg-neutral-100 rounded-xl text-[8px] sm:text-[9px] font-mono font-bold uppercase tracking-widest transition-all active:scale-95 flex items-center gap-1 sm:gap-1.5 focus:outline-none"
          >
            <X className="w-3.5 h-3.5" /> CANCEL ALIGNMENT
          </button>
          <button
            type="button"
            onClick={handleExportCrop}
            disabled={loading || error}
            className="px-4 sm:px-5 py-2.5 bg-[#7A0000] text-white hover:bg-[#4A0000] disabled:bg-neutral-300 disabled:cursor-not-allowed rounded-xl text-[8px] sm:text-[9px] font-mono font-bold uppercase tracking-widest transition-all active:scale-95 flex items-center gap-1 sm:gap-1.5 shadow-md border-none focus:outline-none"
          >
            <Check className="w-3.5 h-3.5" /> CONFIRM GLASS SEGMENT
          </button>
        </div>
      </div>
    </div>
  );
}
