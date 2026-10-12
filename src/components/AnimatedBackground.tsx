import React, { useEffect, useState } from 'react';

export const AnimatedBackground: React.FC = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Calculate normalized mouse coords (-1 to 1)
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      setMousePos({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none">
      {/* Deep neutral base background */}
      <div className="absolute inset-0 bg-neutral-950" />

      {/* Subtle animated floating ambient light orbs */}
      <div
        className="absolute top-[-10%] left-[15%] w-[550px] h-[550px] rounded-full blur-[140px] opacity-25 bg-gradient-to-br from-indigo-500/20 via-blue-500/10 to-transparent transition-transform duration-1000 ease-out animate-pulse"
        style={{
          transform: `translate(${mousePos.x * 25}px, ${mousePos.y * 25}px)`,
          animationDuration: '8s',
        }}
      />

      <div
        className="absolute bottom-[5%] right-[10%] w-[600px] h-[600px] rounded-full blur-[160px] opacity-20 bg-gradient-to-tl from-purple-500/20 via-neutral-600/10 to-transparent transition-transform duration-1000 ease-out"
        style={{
          transform: `translate(${mousePos.x * -35}px, ${mousePos.y * -35}px)`,
        }}
      />

      <div
        className="absolute top-[45%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full blur-[180px] opacity-15 bg-neutral-800/40 transition-transform duration-700 ease-out"
        style={{
          transform: `translate(calc(-50% + ${mousePos.x * 15}px), calc(-50% + ${mousePos.y * 15}px))`,
        }}
      />

      {/* Subtle fine geometric grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #ffffff 1px, transparent 1px),
            linear-gradient(to bottom, #ffffff 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />

      {/* Radial vignette fade for seamless edges */}
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-neutral-950/40 to-neutral-950 pointer-events-none" />
    </div>
  );
};
