/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';

export default function CustomCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [trailPosition, setTrailPosition] = useState({ x: 0, y: 0 });
  const [hovering, setHovering] = useState(false);
  const [clicked, setClicked] = useState(false);
  const [hidden, setHidden] = useState(true);
  const [isPointerDevice, setIsPointerDevice] = useState(false);

  useEffect(() => {
    // Check if device supports finepointer (mouse/trackpad)
    const mediaQuery = window.matchMedia('(pointer: fine)');
    setIsPointerDevice(mediaQuery.matches);

    const handleMediaChange = (e: MediaQueryListEvent) => {
      setIsPointerDevice(e.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleMediaChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleMediaChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleMediaChange);
      } else {
        mediaQuery.removeListener(handleMediaChange);
      }
    };
  }, []);

  useEffect(() => {
    if (!isPointerDevice) return;

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      setHidden(false);
    };

    const handleMouseDown = () => setClicked(true);
    const handleMouseUp = () => setClicked(false);

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.closest('button') ||
        target.closest('a') ||
        target.closest('[role="button"]') ||
        target.classList.contains('cursor-pointer') ||
        target.id === 'canvas-container-root'
      ) {
        setHovering(true);
      } else {
        setHovering(false);
      }
    };

    const handleMouseLeaveWindow = () => {
      setHidden(true);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseleave', handleMouseLeaveWindow);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseleave', handleMouseLeaveWindow);
    };
  }, [isPointerDevice]);

  // Smooth trail effect using requestAnimationFrame-style math
  useEffect(() => {
    if (!isPointerDevice || hidden) return;

    let animFrameId: number;
    const updateTrail = () => {
      setTrailPosition((prev) => {
        // Linear interpolation for smooth trailing
        const dx = position.x - prev.x;
        const dy = position.y - prev.y;
        return {
          x: prev.x + dx * 0.18,
          y: prev.y + dy * 0.18,
        };
      });
      animFrameId = requestAnimationFrame(updateTrail);
    };

    animFrameId = requestAnimationFrame(updateTrail);
    return () => cancelAnimationFrame(animFrameId);
  }, [position, isPointerDevice, hidden]);

  if (!isPointerDevice || hidden) return null;

  return (
    <>
      {/* Hide standard cursor globally via injected styles when pointer is present */}
      <style>{`
        @media (pointer: fine) {
          body, button, a, [role="button"], .cursor-pointer, select, input {
            cursor: none !important;
          }
        }
      `}</style>

      {/* Main Core Dot Cursor */}
      <div
        className="fixed top-0 left-0 w-2 h-2 bg-[#7A0000] rounded-full pointer-events-none z-[9999] transition-transform duration-100 ease-out"
        style={{
          transform: `translate3d(${position.x - 4}px, ${position.y - 4}px, 0) scale(${clicked ? 0.8 : hovering ? 1.2 : 1})`,
        }}
      />

      {/* Outer Halo ring trailing behind with minor inertia */}
      <div
        className="fixed top-0 left-0 w-8 h-8 border border-[#7A0000]/60 rounded-full pointer-events-none z-[9998] transition-transform duration-200 ease-out flex items-center justify-center bg-transparent"
        style={{
          transform: `translate3d(${trailPosition.x - 16}px, ${trailPosition.y - 16}px, 0) scale(${clicked ? 0.9 : hovering ? 1.6 : 1})`,
        }}
      >
        {/* Subtle crosshairs inside halo during click or hover trigger */}
        {hovering && (
          <div className="w-1.5 h-1.5 bg-[#7A0000]/20 rounded-full animate-ping" />
        )}
      </div>
    </>
  );
}
