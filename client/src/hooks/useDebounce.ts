import { useState, useEffect } from 'react';

/**
 * Custom hook to debounce rapid value updates (e.g. live search typing)
 * @param value The value to debounce
 * @param delay Milliseconds to delay
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
