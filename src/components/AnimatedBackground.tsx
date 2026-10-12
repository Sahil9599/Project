import React, { useEffect, useRef, useState } from 'react';

export const AnimatedBackground: React.FC = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [smoothPos, setSmoothPos] = useState({ x: 0, y: 0 });
  const [cursorVisible, setCursorVisible] = useState(false);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      setCursorVisible(true);
      targetX = e.clientX;
      targetY = e.clientY;

      const normX = (e.clientX / window.innerWidth) * 2 - 1;
      const normY = (e.clientY / window.innerHeight) * 2 - 1;
      setMousePos({ x: normX, y: normY });
    };

    const handleMouseLeave = () => {
      setCursorVisible(false);
    };

    // Smooth animation loop for fluid cursor following
    const updateSmoothPosition = () => {
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;
      setSmoothPos({ x: currentX, y: currentY });
      animFrameRef.current = requestAnimationFrame(updateSmoothPosition);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    animFrameRef.current = requestAnimationFrame(updateSmoothPosition);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none">
      {/* Deep neutral base background */}
      <div className="absolute inset-0 bg-neutral-950" />

      {/* Interactive Cursor Spotlight / Halo */}
      {cursorVisible && (
        <div
          className="absolute w-[450px] h-[450px] rounded-full blur-[110px] pointer-events-none transition-opacity duration-500"
          style={{
            left: `${smoothPos.x}px`,
            top: `${smoothPos.y}px`,
            transform: 'translate(-50%, -50%)',
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.08) 40%, transparent 70%)',
          }}
        />
      )}

      {/* Orb 1: Indigo Luminous Glow (Top-Left) */}
      <div
        className="absolute top-[-5%] left-[10%] w-[600px] h-[600px] rounded-full blur-[140px] opacity-40 bg-gradient-to-br from-indigo-500/30 via-indigo-600/15 to-transparent transition-transform duration-700 ease-out animate-pulse"
        style={{
          transform: `translate(${mousePos.x * 40}px, ${mousePos.y * 35}px)`,
          animationDuration: '7s',
        }}
      />

      {/* Orb 2: Deep Purple / Violet Aura (Bottom-Right) */}
      <div
        className="absolute bottom-[-10%] right-[5%] w-[650px] h-[650px] rounded-full blur-[160px] opacity-35 bg-gradient-to-tl from-purple-600/30 via-fuchsia-600/15 to-transparent transition-transform duration-700 ease-out"
        style={{
          transform: `translate(${mousePos.x * -45}px, ${mousePos.y * -40}px)`,
        }}
      />

      {/* Orb 3: Deep Slate & Cyan Accent (Center-Left) */}
      <div
        className="absolute top-[40%] left-[20%] w-[500px] h-[500px] rounded-full blur-[130px] opacity-25 bg-gradient-to-r from-cyan-500/15 via-slate-600/20 to-transparent transition-transform duration-1000 ease-out"
        style={{
          transform: `translate(${mousePos.x * 25}px, ${mousePos.y * 20}px)`,
        }}
      />

      {/* Orb 4: Deep Slate Core Contrast (Center-Right) */}
      <div
        className="absolute top-[30%] right-[25%] w-[550px] h-[550px] rounded-full blur-[170px] opacity-25 bg-neutral-800/60 transition-transform duration-700 ease-out"
        style={{
          transform: `translate(${mousePos.x * -20}px, ${mousePos.y * -25}px)`,
        }}
      />

      {/* Fine architectural micro-grid */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #ffffff 1px, transparent 1px),
            linear-gradient(to bottom, #ffffff 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Subtle Ambient Vignette */}
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-neutral-950/30 to-neutral-950 pointer-events-none" />
    </div>
  );
};
