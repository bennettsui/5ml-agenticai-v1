'use client';

import { useState, useEffect } from 'react';

export function ServicesCube() {
  const [rotationX, setRotationX] = useState(20);
  const [rotationY, setRotationY] = useState(-30);
  const [isAutoRotating, setIsAutoRotating] = useState(true);

  useEffect(() => {
    if (!isAutoRotating) return;

    const interval = setInterval(() => {
      setRotationY(prev => (prev + 1) % 360);
      setRotationX(prev => Math.sin((prev + 1) * 0.01) * 10 + 20);
    }, 50);

    return () => clearInterval(interval);
  }, [isAutoRotating]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isAutoRotating) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientY - rect.top) / rect.height * 40 - 20;
    const y = (e.clientX - rect.left) / rect.width * 40 - 20;

    setRotationX(x);
    setRotationY(y);
  };

  const services = [
    { name: 'Public Relations', icon: '📢', position: 'front' },
    { name: 'Events & Experiences', icon: '🎪', position: 'back' },
    { name: 'Social Media', icon: '📱', position: 'right' },
    { name: 'KOL Marketing', icon: '⭐', position: 'left' },
    { name: 'Creative Production', icon: '🎨', position: 'top' },
    { name: 'Martech & Digital', icon: '⚡', position: 'bottom' },
  ];

  const positions: Record<string, string> = {
    front: 'translateZ(100px)',
    back: 'rotateY(180deg) translateZ(100px)',
    right: 'rotateY(90deg) translateZ(100px)',
    left: 'rotateY(-90deg) translateZ(100px)',
    top: 'rotateX(90deg) translateZ(100px)',
    bottom: 'rotateX(-90deg) translateZ(100px)',
  };

  return (
    <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Background gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center px-6">
        {/* Content Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 w-full max-w-6xl items-center">
          {/* Left Text Section */}
          <div className="space-y-8 lg:order-1">
            <div className="space-y-4">
              <h2 className="text-5xl md:text-6xl font-bold text-white leading-tight">
                What we do
              </h2>
              <p className="text-xl text-slate-300 leading-relaxed">
                We connect the world of strategy with real execution. From PR to events to digital—everything works together to amplify your brand.
              </p>
            </div>

            <div className="space-y-4">
              {services.map((service, idx) => (
                <div key={idx} className="flex gap-4 group cursor-pointer">
                  <div className="text-3xl flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    {service.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white group-hover:text-purple-300 transition-colors text-lg">
                      {service.name}
                    </h3>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-4 pt-4">
              <button className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-all transform hover:scale-105">
                Learn More →
              </button>
              <button
                onClick={() => setIsAutoRotating(!isAutoRotating)}
                className="px-6 py-3 border border-purple-400 text-purple-300 hover:bg-purple-400/10 rounded-lg transition-colors text-sm font-medium"
              >
                {isAutoRotating ? 'Pause Cube' : 'Resume Cube'}
              </button>
            </div>
          </div>

          {/* Right 3D Cube Section */}
          <div
            className="h-96 flex items-center justify-center perspective lg:order-2 cursor-grab active:cursor-grabbing"
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsAutoRotating(false)}
            onMouseLeave={() => setIsAutoRotating(true)}
            style={{
              perspective: '1200px',
            }}
          >
            <div
              style={{
                width: '200px',
                height: '200px',
                position: 'relative',
                transformStyle: 'preserve-3d',
                transform: `rotateX(${rotationX}deg) rotateY(${rotationY}deg)`,
                transition: isAutoRotating ? 'none' : 'transform 0.1s ease-out',
              }}
            >
              {services.map((service, idx) => (
                <div
                  key={idx}
                  style={{
                    position: 'absolute',
                    width: '200px',
                    height: '200px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: '600',
                    backfaceVisibility: 'hidden',
                    transformStyle: 'preserve-3d',
                    transform: positions[service.position],
                    background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.3), rgba(168, 85, 247, 0.2))',
                    border: '2px solid rgba(168, 85, 247, 0.5)',
                    borderRadius: '12px',
                    padding: '16px',
                    color: 'white',
                    textAlign: 'center',
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  <div className="text-4xl mb-3">{service.icon}</div>
                  <div className="font-semibold leading-tight">{service.name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Instruction Text */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center text-slate-400 text-sm">
          <p>Hover over the cube to explore • or let it rotate automatically</p>
        </div>
      </div>
    </div>
  );
}
