import { useState, useEffect } from 'react';

/**
 * useDebouncedValue
 * Delays updating a value until the user stops typing for `delay` ms.
 * Perfect for search inputs to avoid excessive filtering or API calls.
 *
 * Usage:
 *   const [raw, setRaw] = useState('');
 *   const debounced = useDebouncedValue(raw, 300);
 */
export function useDebouncedValue<T>(value: T, delay: number = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
