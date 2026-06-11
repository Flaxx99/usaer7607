import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  /** Current search value (controlled) */
  value: string;
  /** Called with the SEARCH term after debounce settles */
  onChange: (value: string) => void;
  /** Called on EVERY keystroke — for instant local filtering */
  onInput?: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
}

/**
 * Search input with icon, clear button, and internal debounce.
 * 
 * Pattern: `pendingValue` tracks keystrokes locally. The `<input>` displays
 * `pendingValue ?? value` — while the user is typing it shows their input,
 * otherwise it reflects the external controlled `value`. This avoids
 * a sync useEffect that triggers cascading re-renders.
 * 
 * - `onChange` fires after debounce settles (for API calls).
 * - `onInput` fires on every keystroke (for local client-side filtering).
 * - Clear button (X) resets both.
 */
export function SearchBar({
  value,
  onChange,
  onInput,
  placeholder = 'Buscar...',
  debounceMs = 300,
}: SearchBarProps) {
  const [pendingValue, setPendingValue] = useState<string | null>(null);

  // Debounce: fire onChange after user stops typing
  useEffect(() => {
    if (pendingValue === null) return;
    const timer = setTimeout(() => {
      onChange(pendingValue);
      setPendingValue(null);
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [pendingValue, debounceMs, onChange]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    setPendingValue(next);
    onInput?.(next);
  };

  const handleClear = () => {
    setPendingValue(null);
    onChange('');
    onInput?.('');
  };

  // Show pending input while typing, otherwise the controlled value
  const displayValue = pendingValue !== null ? pendingValue : value;

  return (
    <div className="relative max-w-sm">
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 pointer-events-none"
        size={18}
        aria-hidden="true"
      />
      <input
        type="text"
        placeholder={placeholder}
        className="input input-bordered pl-10 pr-10 w-full"
        value={displayValue}
        onChange={handleChange}
        aria-label={placeholder}
      />
      {displayValue && (
        <button
          type="button"
          className="absolute right-2 top-1/2 -translate-y-1/2 btn btn-ghost btn-xs text-base-content/40 hover:text-base-content"
          onClick={handleClear}
          aria-label="Limpiar búsqueda"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
