import { useEffect, useState } from 'react';

export const useTVLibrary = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if already loaded
    if (typeof window !== 'undefined' && window.LightweightCharts) {
      setIsLoaded(true);
      return;
    }

    // Check if script is already being loaded
    if (document.querySelector('script[src="/tv.js"]')) {
      return;
    }

    setIsLoading(true);
    setError(null);

    const script = document.createElement('script');
    script.src = '/tv.js';
    script.async = true;
    
    script.onload = () => {
      if (typeof window !== 'undefined' && window.LightweightCharts) {
        setIsLoaded(true);
        setIsLoading(false);
        console.log('TradingView Lightweight Charts loaded successfully');
      } else {
        setError('Library loaded but LightweightCharts not found on window object');
        setIsLoading(false);
      }
    };
    
    script.onerror = () => {
      setError('Failed to load TradingView Lightweight Charts');
      setIsLoading(false);
    };
    
    document.head.appendChild(script);
    
    return () => {
      // Cleanup if component unmounts during loading
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  return {
    isLoaded,
    isLoading,
    error,
    LightweightCharts: typeof window !== 'undefined' ? window.LightweightCharts : null,
  };
}; 