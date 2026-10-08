import { useEffect } from 'react';

// Mock Lenis implementation for now - will be replaced when dependency is installed
export const SmoothScrollProvider = ({ children }) => {
  useEffect(() => {
    // This would normally initialize Lenis smooth scroll
    // For now, we'll add a comment indicating where it would go
    console.log('SmoothScrollProvider: Would initialize Lenis here when dependency is available');

    // Add smooth scroll behavior to HTML element as fallback
    document.documentElement.style.scrollBehavior = 'smooth';

    return () => {
      // Cleanup would go here
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

  return <>{children}</>;
};