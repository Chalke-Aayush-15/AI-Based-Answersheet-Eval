import { useState, useEffect, useRef } from 'react';

export const AnimatedStatCard = ({
  icon,
  value,
  label,
  delay = 0,
  type = 'fade-up'
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              setIsVisible(true);
            }, delay * 1000);
          }
        });
      },
      { threshold: 0.2, rootMargin: '-100px' }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current);
      }
    };
  }, [delay]);

  // Animation variants
  const getInitialStyle = () => {
    switch (type) {
      case 'fade-up':
        return { opacity: 0, transform: 'translateY(20px)' };
      case 'fade-down':
        return { opacity: 0, transform: 'translateY(-20px)' };
      case 'fade-left':
        return { opacity: 0, transform: 'translateX(-20px)' };
      case 'fade-right':
        return { opacity: 0, transform: 'translateX(20px)' };
      case 'scale':
        return { opacity: 0, transform: 'scale(0.8)' };
      case 'fade-in':
      default:
        return { opacity: 0 };
    }
  };

  const initialStyle = getInitialStyle();
  const animateStyle = isVisible ? { opacity: 1, transform: 'none' } : initialStyle;

  // Subtle pulse for the value
  const pulseStyle = isVisible ? { animation: 'pulse 2s ease-in-out infinite' } : {};

  return (
    <div
      ref={elementRef}
      style={{
        ...initialStyle,
        transition: 'all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        ...animateStyle
      }}
      className="flex flex-col items-center text-center"
    >
      <div
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(-10px)',
          transition: `all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) ${delay + 0.2}s`
        }}
      >
        <div className="text-2xl mb-2">{icon}</div>
      </div>

      <div
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(-10px)',
          transition: `all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) ${delay + 0.4}s`,
          ...pulseStyle
        }}
      >
        <div className="text-2xl font-bold">{value}</div>
      </div>

      <div
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(-10px)',
          transition: `all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) ${delay + 0.6}s`
        }}
      >
        <div className="text-sm text-muted">{label}</div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
      `}</style>
    </div>
  );
};