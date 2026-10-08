import { useRef } from 'react';

export const ThreeDButton = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  ...props
}) => {
  const buttonRef = useRef(null);

  // 3D tilt effect
  const handleMouseMove = (e) => {
    if (!buttonRef.current || disabled) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * 10;
    const rotateY = ((centerX - x) / centerX) * 10;

    buttonRef.current.style.transform = `
      perspective(1000px)
      rotateX(${rotateX}deg)
      rotateY(${rotateY}deg)
      scale3d(1.05, 1.05, 1.05)
    `;
  };

  const handleMouseLeave = () => {
    if (buttonRef.current && !disabled) {
      buttonRef.current.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
    }
  };

  const handleMouseDown = () => {
    if (buttonRef.current && !disabled) {
      buttonRef.current.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(0.98)';
    }
  };

  const handleMouseUp = () => {
    if (buttonRef.current && !disabled) {
      buttonRef.current.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1.05)';
    }
  };

  const variants = {
    primary: {
      background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
      color: 'white',
      border: 'none'
    },
    secondary: {
      background: 'rgba(255, 255, 255, 0.1)',
      color: 'white',
      border: '1px solid rgba(255, 255, 255, 0.2)'
    },
    outline: {
      background: 'transparent',
      color: '#3b82f6',
      border: '2px solid #3b82f6'
    }
  };

  const sizes = {
    sm: { padding: '0.5rem 1rem', fontSize: '0.875rem' },
    md: { padding: '0.75rem 1.5rem', fontSize: '1rem' },
    lg: { padding: '1rem 2rem', fontSize: '1.125rem' }
  };

  const baseStyle = {
    ...variants[variant],
    ...sizes[size],
    borderRadius: '0.75rem',
    fontWeight: '600',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    '&:active': {
      transform: 'scale(0.98)'
    }
  };

  return (
    <button
      ref={buttonRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      disabled={disabled}
      className={className}
      style={baseStyle}
      {...props}
    >
      {/* Gradient overlay for 3D effect */}
      <span
        className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"
        style={{ pointerEvents: 'none', position: 'absolute', inset: 0 }}
      ></span>

      <span className="relative z-10">{children}</span>
    </button>
  );
};