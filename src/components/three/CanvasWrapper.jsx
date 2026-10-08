import { Canvas, useThree } from '@react-three/fiber';
import { Stats } from '@react-three/drei';
import { useEffect } from 'react';

// Device tiering for performance
const getDeviceTier = () => {
  if (typeof navigator === 'undefined') return 'high';
  const { deviceMemory, hardwareConcurrency } = navigator;
  const isLowEnd =
    (deviceMemory && deviceMemory <= 2) ||
    (hardwareConcurrency && hardwareConcurrency <= 4) ||
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  return isLowEnd ? 'low' : 'high';
};

export const CanvasWrapper = ({ children, ...props }) => {
  const { size } = useThree();
  const tier = getDeviceTier();

  // Adjust rendering based on device capability
  const cameraProps = tier === 'low'
    ? { fov: 50, position: [0, 1.5, 3] }
    : { fov: 60, position: [0, 2, 4] };

  return (
    <Canvas
      camera={cameraProps}
      gl={{ antialias: tier === 'high', powerPreference: 'high-performance' }}
      style={{ pointerEvents: 'none' }}
      {...props}
    >
      {/* Performance monitor (dev only) */}
      {process.env.NODE_ENV === 'development' && <Stats />}
      {children}
    </Canvas>
  );
};