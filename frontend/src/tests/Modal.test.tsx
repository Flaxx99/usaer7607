import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Modal from '../components/Modal';

describe('Modal Component', () => {
  it('renders nothing when closed', () => {
    const { container } = render(
      <Modal isOpen={false} onClose={() => {}} title="Test">
        <p>Content</p>
      </Modal>
    );
    expect(container.innerHTML).toBe('');
    expect(screen.queryByText('Test')).not.toBeInTheDocument();
    expect(screen.queryByText('Content')).not.toBeInTheDocument();
  });

  it('renders title and children when open', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Modal Title">
        <p>Modal Content</p>
      </Modal>
    );
    expect(screen.getByText('Modal Title')).toBeInTheDocument();
    expect(screen.getByText('Modal Content')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="Test">
        <p>Content</p>
      </Modal>
    );
    fireEvent.click(screen.getByLabelText('Cerrar'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="Test">
        <p>Content</p>
      </Modal>
    );
    // The backdrop is the last child of the modal wrapper
    const backdrop = document.querySelector('.modal-backdrop');
    expect(backdrop).toBeInTheDocument();
    fireEvent.click(backdrop!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose on Escape key press', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="Test">
        <p>Content</p>
      </Modal>
    );
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose on other key presses', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="Test">
        <p>Content</p>
      </Modal>
    );
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('locks body scroll when open', () => {
    const onClose = vi.fn();
    const { unmount } = render(
      <Modal isOpen={true} onClose={onClose} title="Test">
        <p>Content</p>
      </Modal>
    );
    expect(document.body.style.overflow).toBe('hidden');

    unmount();
    expect(document.body.style.overflow).toBe('');
  });

  it('cleans up event listener on close', () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <Modal isOpen={true} onClose={onClose} title="Test">
        <p>Content</p>
      </Modal>
    );

    // Re-render as closed — should remove Escape listener
    rerender(
      <Modal isOpen={false} onClose={onClose} title="Test">
        <p>Content</p>
      </Modal>
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('renders with icon when provided', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="With Icon" icon={<span data-testid="test-icon">🔔</span>}>
        <p>Content</p>
      </Modal>
    );
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  it('renders with different color variants', () => {
    const { rerender } = render(
      <Modal isOpen={true} onClose={() => {}} title="Primary" color="primary">
        <p>Content</p>
      </Modal>
    );
    // Header should have bg-primary class
    const header = screen.getByText('Primary').closest('div');
    expect(header?.className).toContain('bg-primary');

    rerender(
      <Modal isOpen={true} onClose={() => {}} title="Warning" color="warning">
        <p>Content</p>
      </Modal>
    );
    const warningHeader = screen.getByText('Warning').closest('div');
    expect(warningHeader?.className).toContain('bg-warning');
  });

  it('renders with different sizes', () => {
    const { rerender } = render(
      <Modal isOpen={true} onClose={() => {}} title="Small" size="sm">
        <p>Content</p>
      </Modal>
    );
    const modalBox = screen.getByText('Small').closest('.modal-box');
    expect(modalBox?.className).toContain('sm:max-w-md');

    rerender(
      <Modal isOpen={true} onClose={() => {}} title="Large" size="xl">
        <p>Content</p>
      </Modal>
    );
    const largeBox = screen.getByText('Large').closest('.modal-box');
    expect(largeBox?.className).toContain('sm:max-w-4xl');
  });
});
