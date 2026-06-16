import { useEffect } from 'react';
import { X } from 'lucide-react';

type ModalColor = 'primary' | 'warning' | 'neutral' | 'indigo';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    icon?: React.ReactNode;
    color?: ModalColor;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    children: React.ReactNode;
}

const RESPONSIVE_SIZE: Record<string, string> = {
    sm: 'sm:max-w-md',
    md: 'sm:max-w-lg',
    lg: 'sm:max-w-2xl',
    xl: 'sm:max-w-4xl',
};

const COLOR_HEADER_MAP: Record<string, string> = {
    primary: 'bg-primary text-primary-content',
    warning: 'bg-warning text-warning-content',
    neutral: 'bg-neutral text-neutral-content',
    indigo: 'bg-indigo-600 text-white',
};

const Modal = ({ isOpen, onClose, title, icon, color = 'primary', size = 'md', children }: ModalProps) => {
    const lastFocusedElement = React.useRef<HTMLElement | null>(null);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            lastFocusedElement.current = document.activeElement as HTMLElement;
            window.addEventListener('keydown', handleEsc);
            document.body.style.overflow = 'hidden';
            
            // Focus the first focusable element
            setTimeout(() => {
                const focusable = document.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
                if (focusable.length > 0) {
                    (focusable[0] as HTMLElement).focus();
                }
            }, 10);
        }
        return () => {
            window.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = '';
            if (lastFocusedElement.current) {
                lastFocusedElement.current.focus();
            }
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="modal modal-open modal-bottom sm:modal-middle" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <div className={`modal-box ${RESPONSIVE_SIZE[size]} p-0 overflow-hidden`}>
                {/* Colored header */}
                <div className={`${COLOR_HEADER_MAP[color]} p-6 flex items-center justify-between`}>
                    <h3 id="modal-title" className="text-xl font-bold flex items-center gap-2">
                        {icon && <span className="opacity-80">{icon}</span>}
                        {title}
                    </h3>
                    <button
                        className="btn btn-ghost btn-circle btn-sm text-white/80 hover:text-white hover:bg-white/10"
                        onClick={onClose}
                        aria-label="Cerrar"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Scrollable content */}
                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                    {children}
                </div>
            </div>
            <div className="modal-backdrop" onClick={onClose}></div>
        </div>
    );
};

export default Modal;
