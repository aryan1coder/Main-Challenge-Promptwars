import { useState, useEffect } from 'react';

/**
 * Animated number counter hook with cubic easing.
 * Respects 'prefers-reduced-motion'.
 * Guarantees landing precisely on exact deterministic target value.
 */
export function useCountUp(endValue, duration = 1000, decimals = null) {
  const [displayValue, setDisplayValue] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return endValue;
    }
    const num = typeof endValue === 'number' ? endValue : parseFloat(endValue);
    if (isNaN(num)) return endValue;
    return 0;
  });

  useEffect(() => {
    const num = typeof endValue === 'number' ? endValue : parseFloat(endValue);
    if (isNaN(num)) return;

    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    let precision = decimals;
    if (precision === null) {
      const str = endValue.toString();
      const parts = str.split('.');
      precision = parts.length > 1 ? Math.min(parts[1].length, 2) : 0;
    }

    let startTime = null;
    let animId = null;

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // Smooth cubic ease-out
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = eased * num;

      if (progress < 1) {
        setDisplayValue(precision > 0 ? parseFloat(current.toFixed(precision)) : Math.round(current));
        animId = requestAnimationFrame(step);
      } else {
        setDisplayValue(num);
      }
    };

    animId = requestAnimationFrame(step);
    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [endValue, duration, decimals]);

  return displayValue;
}
