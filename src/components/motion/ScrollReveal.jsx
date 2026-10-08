import { useState, useEffect, useRef } from 'react';

export const ScrollReveal = ({
  children,
  delay = 0,
  type = 'fade-up',
  distance = 40,
  once = true
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
            if (once) {
              observer.unobserve(entry.target);
            }
          } else if (!once) {
            setIsVisible(false);
          }
        });
      },
      { threshold: 0.2, rootMargin: '-50px' }
    );

    const currentElement = elementRef.current;
    if (currentElement) {
      observer.observe(currentElement);
    }

    return () => {
      if (currentElement) {
        observer.unobserve(currentElement);
      }
    };
  }, [delay, once]);

  // Animation variants
  const getInitialStyle = () => {
    switch (type) {
      case 'fade-up':
        return { opacity: 0, transform: `translateY(${distance}px)` };
      case 'fade-down':
        return { opacity: 0, transform: `translateY(${-distance}px)` };
      case 'fade-left':
        return { opacity: 0, transform: `translateX(${-distance}px)` };
      case 'fade-right':
        return { opacity: 0, transform: `translateX(${distance}px)` };
      case 'scale':
        return { opacity: 0, transform: 'scale(0.8)' };
      case 'fade-in':
      default:
        return { opacity: 0 };
    }
  };

  const initialStyle = getInitialStyle();
  const animateStyle = isVisible ? { opacity: 1, transform: 'none' } : initialStyle;

  return (
    <div
      ref={elementRef}
      style={{
        ...initialStyle,
        transition: `all 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) ${delay}s`,
        ...animateStyle
      }}
    >
      {children}
    </div>
  );
};