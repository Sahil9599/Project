import React, { useEffect, useState } from 'react';

export const AnimatedBackground: React.FC = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setHasInteracted(true);
      // Normalized from -1 to 1
      const normX = (e.clientX / window.innerWidth) * 2 - 1;
      const normY = (e.clientY / window.innerHeight) * 2 - 1;
      setMousePos({ x: normX, y: normY });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none bg-neutral-950">
      {/* Primary Ambient Orb 1: Luminous Indigo Glow (Top Left) */}
      <div
        className="absolute top-[-8%] left-[5%] w-[650px] h-[650px] rounded-full blur-[100px] animate-orb-1 transition-transform duration-500 ease-out"
        style={{
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.45) 0%, rgba(79, 70, 229, 0.25) 50%, transparent 75%)',
          transform: `translate(${mousePos.x * 55}px, ${mousePos.y * 50}px)`,
        }}
      />

      {/* Primary Ambient Orb 2: Deep Purple / Violet Glow (Bottom Right) */}
      <div
        className="absolute bottom-[-10%] right-[5%] w-[700px] h-[700px] rounded-full blur-[110px] animate-orb-2 transition-transform duration-500 ease-out"
        style={{
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.42) 0%, rgba(147, 51, 234, 0.22) 50%, transparent 75%)',
          transform: `translate(${mousePos.x * -60}px, ${mousePos.y * -55}px)`,
        }}
      />

      {/* Primary Ambient Orb 3: Cyan / Electric Blue Highlight (Center Right) */}
      <div
        className="absolute top-[35%] right-[20%] w-[500px] h-[500px] rounded-full blur-[90px] animate-orb-3 transition-transform duration-700 ease-out"
        style={{
          background: 'radial-gradient(circle, rgba(14, 165, 233, 0.35) 0%, rgba(59, 130, 246, 0.18) 50%, transparent 70%)',
          transform: `translate(${mousePos.x * 40}px, ${mousePos.y * -35}px)`,
        }}
      />

      {/* Primary Ambient Orb 4: Deep Slate & Magenta Underglow (Center Left) */}
      <div
        className="absolute top-[50%] left-[10%] w-[550px] h-[550px] rounded-full blur-[100px] animate-orb-1 transition-transform duration-700 ease-out"
        style={{
          background: 'radial-gradient(circle, rgba(192, 132, 252, 0.3) 0%, rgba(99, 102, 241, 0.15) 50%, transparent 70%)',
          transform: `translate(${mousePos.x * -45}px, ${mousePos.y * 40}px)`,
        }}
      />

      {/* Direct Interactive Mouse Follower Halo */}
      {hasInteracted && (
        <div
          className="absolute w-[500px] h-[500px] rounded-full blur-[90px] transition-transform duration-200 ease-out"
          style={{
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${mousePos.x * (window.innerWidth / 2.5)}px), calc(-50% + ${mousePos.y * (window.innerHeight / 2.5)}px))`,
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.35) 0%, rgba(99, 102, 241, 0.18) 45%, transparent 70%)',
          }}
        />
      )}

      {/* Fine Geometric Grid Matrix for Tech Aesthetic */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.4) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.4) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />
    </div>
  );
};
