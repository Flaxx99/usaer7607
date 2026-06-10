import { useState, useCallback, useRef, type ReactNode } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmOptions {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'primary';
    icon?: ReactNode;
}

/**
 * Promise-based confirm dialog hook.
 *
 * ```tsx
 * const { confirm, dialog } = useConfirmDialog();
 *
 * const handleDelete = async () => {
 *   const ok = await confirm({
 *     title: 'Eliminar',
 *     message: '¿Estás seguro?',
 *     variant: 'danger',
 *     confirmText: 'Eliminar',
 *   });
 *   if (ok) deleteMutation.mutate(id);
 * };
 *
 * return <>
 *   {dialog}
 *   ...
 * </>;
 * ```
 */
export function useConfirmDialog() {
    const [state, setState] = useState<{
        options: ConfirmOptions;
        resolve: (value: boolean) => void;
    } | null>(null);

    // Use a ref so handleConfirm/handleCancel always see the latest resolve
    const stateRef = useRef(state);
    stateRef.current = state;

    const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
        return new Promise((resolve) => {
            const entry = { options, resolve };
            stateRef.current = entry;
            setState(entry);
        });
    }, []);

    const dismiss = useCallback((result: boolean) => {
        stateRef.current?.resolve(result);
        setState(null);
    }, []);

    const variantStyles: Record<string, string> = {
        danger: 'bg-error/10 text-error',
        warning: 'bg-warning/10 text-warning',
        primary: 'bg-primary/10 text-primary',
    };

    const btnStyles: Record<string, string> = {
        danger: 'btn-error',
        warning: 'btn-warning',
        primary: 'btn-primary',
    };

    const dialog = state ? (
        <div className="modal modal-open">
            <div className="modal-box max-w-md p-0 overflow-hidden">
                {/* Header */}
                <div className="p-5 flex items-center gap-3 border-b border-base-300">
                    {state.options.icon || (
                        <div className={`p-2 rounded-full ${variantStyles[state.options.variant || 'primary']}`}>
                            <AlertTriangle size={20} />
                        </div>
                    )}
                    <h3 className="text-lg font-bold">{state.options.title}</h3>
                    <button
                        className="btn btn-ghost btn-circle btn-sm ml-auto"
                        onClick={() => dismiss(false)}
                        aria-label="Cerrar"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Message */}
                <div className="p-5">
                    <p className="text-sm text-base-content/70 leading-relaxed">
                        {state.options.message}
                    </p>
                </div>

                {/* Footer actions */}
                <div className="flex justify-end gap-3 px-5 pb-5 pt-1">
                    <button className="btn btn-ghost btn-sm" onClick={() => dismiss(false)}>
                        {state.options.cancelText || 'Cancelar'}
                    </button>
                    <button
                        className={`btn btn-sm ${btnStyles[state.options.variant || 'primary']}`}
                        onClick={() => dismiss(true)}
                        autoFocus
                    >
                        {state.options.confirmText || 'Confirmar'}
                    </button>
                </div>
            </div>
            <div className="modal-backdrop" onClick={() => dismiss(false)} />
        </div>
    ) : null;

    return { confirm, dialog } as const;
}
