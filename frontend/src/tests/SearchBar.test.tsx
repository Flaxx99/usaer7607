import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SearchBar } from '../components/SearchBar';

describe('SearchBar', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render with default placeholder', () => {
    render(<SearchBar value="" onChange={vi.fn()} />);
    expect(screen.getByPlaceholderText('Buscar...')).toBeInTheDocument();
  });

  it('should render with custom placeholder', () => {
    render(<SearchBar value="" onChange={vi.fn()} placeholder="Buscar alumno..." />);
    expect(screen.getByPlaceholderText('Buscar alumno...')).toBeInTheDocument();
  });

  it('should call onInput on every keystroke', () => {
    const onInput = vi.fn();
    render(<SearchBar value="" onChange={vi.fn()} onInput={onInput} />);

    const input = screen.getByPlaceholderText('Buscar...');
    fireEvent.change(input, { target: { value: 'a' } });
    expect(onInput).toHaveBeenCalledWith('a');

    fireEvent.change(input, { target: { value: 'ab' } });
    expect(onInput).toHaveBeenCalledWith('ab');
  });

  it('should show clear button when there is display text', () => {
    render(<SearchBar value="test" onChange={vi.fn()} />);
    expect(screen.getByLabelText('Limpiar búsqueda')).toBeInTheDocument();
  });

  it('should not show clear button when input is empty', () => {
    render(<SearchBar value="" onChange={vi.fn()} />);
    expect(screen.queryByLabelText('Limpiar búsqueda')).not.toBeInTheDocument();
  });

  it('should clear value when X is clicked', () => {
    const onChange = vi.fn();
    const onInput = vi.fn();
    render(<SearchBar value="test" onChange={onChange} onInput={onInput} />);

    fireEvent.click(screen.getByLabelText('Limpiar búsqueda'));
    expect(onChange).toHaveBeenCalledWith('');
    expect(onInput).toHaveBeenCalledWith('');
  });

  it('should fire onChange after debounce delay', () => {
    const onChange = vi.fn();
    render(<SearchBar value="" onChange={onChange} debounceMs={300} />);

    const input = screen.getByPlaceholderText('Buscar...');
    fireEvent.change(input, { target: { value: 'test' } });

    // Should NOT fire immediately
    expect(onChange).not.toHaveBeenCalled();

    // Advance time past the 300ms debounce
    act(() => { vi.advanceTimersByTime(300); });

    expect(onChange).toHaveBeenCalledWith('test');
  });

  it('should NOT fire onChange for controlled value changes', () => {
    const onChange = vi.fn();
    // Simulate parent re-render with new value — pendingValue is null, so debounce should NOT fire
    const { rerender } = render(<SearchBar value="initial" onChange={onChange} />);

    // Rerender with different controlled value
    rerender(<SearchBar value="updated" onChange={onChange} />);

    // onChange should only fire when the USER types, not when the prop changes
    act(() => { vi.advanceTimersByTime(500); });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('should display pending input while typing, not controlled value', () => {
    const { rerender } = render(<SearchBar value="original" onChange={vi.fn()} />);

    const input = screen.getByPlaceholderText('Buscar...') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'typing...' } });

    // Should show what user is typing, not the controlled value
    expect(input.value).toBe('typing...');

    // After debounce settles, pendingValue becomes null, display falls back to value
    act(() => { vi.advanceTimersByTime(300); });

    // But onChange fires but doesn't update the prop — rerender to simulate
    rerender(<SearchBar value="typing..." onChange={vi.fn()} />);
    expect(input.value).toBe('typing...');
  });

  it('should have accessible aria-label on input', () => {
    render(<SearchBar value="" onChange={vi.fn()} placeholder="Buscar escuela..." />);
    expect(screen.getByLabelText('Buscar escuela...')).toBeInTheDocument();
  });
});
