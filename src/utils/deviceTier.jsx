import { useState, useEffect } from 'react';

export const getDeviceTier = () => {
  if (typeof navigator === 'undefined') return 'high';

  const { deviceMemory, hardwareConcurrency } = navigator;
  const isLowEnd =
    (deviceMemory && deviceMemory <= 2) ||
    (hardwareConcurrency && hardwareConcurrency <= 4) ||
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  return isLowEnd ? 'low' : 'high';
};

export const useDeviceTier = () => {
  const [tier, setTier] = useState<'low' | 'high'>(() => getDeviceTier());

  useEffect(() => {
    // Re-check on resize/orientation change
    const handleChange = () => setTier(getDeviceTier());
    window.addEventListener('resize', handleChange);
    window.addEventListener('orientationchange', handleChange);

    return () => {
      window.removeEventListener('resize', handleChange);
      window.removeEventListener('orientationchange', handleChange);
    };
  }, []);

  return tier;
};