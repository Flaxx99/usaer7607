import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LoadingButton } from '../components/LoadingButton';
import { Save } from 'lucide-react';

describe('LoadingButton', () => {
  it('should render children', () => {
    render(<LoadingButton>Guardar</LoadingButton>);
    expect(screen.getByText('Guardar')).toBeInTheDocument();
  });

  it('should show spinner when loading', () => {
    const { container } = render(<LoadingButton loading>Guardar</LoadingButton>);
    expect(container.querySelector('.loading-spinner')).toBeInTheDocument();
  });

  it('should not show icon when loading', () => {
    const { container } = render(<LoadingButton loading icon={Save}>Guardar</LoadingButton>);
    expect(container.querySelector('.loading-spinner')).toBeInTheDocument();
    expect(container.querySelector('svg')).not.toBeInTheDocument();
  });

  it('should show icon when not loading', () => {
    const { container } = render(<LoadingButton icon={Save}>Guardar</LoadingButton>);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('should be disabled when loading', () => {
    render(<LoadingButton loading>Guardar</LoadingButton>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('should be disabled when disabled prop is set', () => {
    render(<LoadingButton disabled>Guardar</LoadingButton>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('should pass type="submit" when provided', () => {
    render(<LoadingButton type="submit">Enviar</LoadingButton>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });

  it('should call onClick when clicked', () => {
    const onClick = vi.fn();
    render(<LoadingButton onClick={onClick}>Guardar</LoadingButton>);
    fireEvent.click(screen.getByText('Guardar'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('should not call onClick when loading', () => {
    const onClick = vi.fn();
    render(<LoadingButton loading onClick={onClick}>Guardar</LoadingButton>);
    fireEvent.click(screen.getByText('Guardar'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('should apply custom className', () => {
    render(<LoadingButton className="btn-primary w-full">Personalizado</LoadingButton>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('btn-primary');
    expect(btn.className).toContain('w-full');
  });
});
