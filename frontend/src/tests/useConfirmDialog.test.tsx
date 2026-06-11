import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useConfirmDialog } from '../components/useConfirmDialog';

function TestComponent({ onResult }: { onResult?: (value: boolean) => void }) {
  const { confirm, dialog } = useConfirmDialog();

  const handleOpen = async () => {
    const result = await confirm({
      title: 'Eliminar registro',
      message: 'Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    onResult?.(result);
  };

  return (
    <div>
      <button onClick={handleOpen}>Abrir diálogo</button>
      {dialog}
    </div>
  );
}

describe('useConfirmDialog', () => {
  it('should not render dialog by default', () => {
    render(<TestComponent />);
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(screen.queryByText('Eliminar registro')).not.toBeInTheDocument();
  });

  it('should render dialog when confirm is triggered', async () => {
    render(<TestComponent />);

    fireEvent.click(screen.getByText('Abrir diálogo'));

    await waitFor(() => {
      expect(screen.getByText('Eliminar registro')).toBeInTheDocument();
    });
    expect(screen.getByText('Esta acción no se puede deshacer.')).toBeInTheDocument();
  });

  it('should call onResult(true) when confirm button is clicked', async () => {
    const onResult = vi.fn();
    render(<TestComponent onResult={onResult} />);

    fireEvent.click(screen.getByText('Abrir diálogo'));

    await waitFor(() => {
      expect(screen.getByText('Eliminar')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Eliminar'));

    await waitFor(() => {
      expect(onResult).toHaveBeenCalledWith(true);
    });
  });

  it('should call onResult(false) when cancel button is clicked', async () => {
    const onResult = vi.fn();
    render(<TestComponent onResult={onResult} />);

    fireEvent.click(screen.getByText('Abrir diálogo'));

    await waitFor(() => {
      expect(screen.getByText('Cancelar')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Cancelar'));

    await waitFor(() => {
      expect(onResult).toHaveBeenCalledWith(false);
    });
  });

  it('should close dialog after confirm action', async () => {
    const onResult = vi.fn();
    render(<TestComponent onResult={onResult} />);

    fireEvent.click(screen.getByText('Abrir diálogo'));

    await waitFor(() => {
      expect(screen.getByText('Eliminar registro')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Cancelar'));

    await waitFor(() => {
      // Dialog should disappear
      expect(screen.queryByText('Eliminar registro')).not.toBeInTheDocument();
    });
  });

  it('should call onResult(false) when close button (X) is clicked', async () => {
    const onResult = vi.fn();
    render(<TestComponent onResult={onResult} />);

    fireEvent.click(screen.getByText('Abrir diálogo'));

    await waitFor(() => {
      expect(screen.getByLabelText('Cerrar')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText('Cerrar'));

    await waitFor(() => {
      expect(onResult).toHaveBeenCalledWith(false);
    });
  });

  it('should render with custom icon when provided', async () => {
    function TestWithCustomIcon() {
      const { confirm, dialog } = useConfirmDialog();

      const handleOpen = () => {
        confirm({
          title: 'Con icono',
          message: 'Mensaje',
          icon: <span data-testid="custom-icon">🔔</span>,
        });
      };

      return (
        <div>
          <button onClick={handleOpen}>Abrir</button>
          {dialog}
        </div>
      );
    }

    render(<TestWithCustomIcon />);

    fireEvent.click(screen.getByText('Abrir'));

    await waitFor(() => {
      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    });
  });
});
