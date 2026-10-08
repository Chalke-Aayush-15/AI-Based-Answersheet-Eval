import { ParticleField } from './ParticleField';
import { useState } from 'react';

export const HeroScene = () => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: '100%',
        height: '400px',
        cursor: isHovered ? 'grab' : 'default',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '16px'
      }}
    >
      {/* Particle field */}
      <ParticleField count={isHovered ? 300 : 200} size={1.5} />

      {/* Gradient overlay for depth */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.1) 100%)',
        pointerEvents: 'none'
      }} />

      {/* Floating geometric shapes */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '10%',
        width: '60px',
        height: '60px',
        border: '2px solid rgba(59, 130, 246, 0.3)',
        borderRadius: '50%',
        animation: 'float 6s ease-in-out infinite'
      }} />

      <div style={{
        position: 'absolute',
        bottom: '20%',
        right: '10%',
        width: '40px',
        height: '40px',
        background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.2))',
        borderRadius: '12px',
        transform: 'rotate(45deg)',
        animation: 'float 8s ease-in-out infinite 1s'
      }} />

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(20px, -10px) rotate(90deg); }
          50% { transform: translate(-10px, 20px) rotate(180deg); }
          75% { transform: translate(10px, -15px) rotate(270deg); }
        }
      `}</style>
    </div>
  );
};