import React from 'react';
import type { LucideIcon } from 'lucide-react';

export interface PageHeaderAction {
    label: string;
    icon?: LucideIcon;
    onClick: () => void;
    variant?: 'white' | 'primary' | 'ghost';
    /** Extra class names for the button element */
    className?: string;
}

interface PageHeaderProps {
    icon: LucideIcon;
    title: string;
    description: string;
    gradientClass: string;
    actions?: PageHeaderAction[];
    children?: React.ReactNode;
}

/**
 * Reusable page header with gradient background, decorative circles,
 * icon, title, description, and optional action buttons.
 *
 * Usage:
 * ```tsx
 * <PageHeader
 *   icon={School}
 *   title="Escuelas"
 *   description="Catálogo de centros educativos."
 *   gradientClass="header-escuelas"
 *   actions={[{ label: 'Nueva', icon: Plus, onClick: handleOpen }]}
 * />
 * ```
 */
export function PageHeader({ icon: Icon, title, description, gradientClass, actions, children }: PageHeaderProps) {
    return (
        <div className={`header-section ${gradientClass}`}>
            <div className="header-pattern" />
            <div className="header-circle header-circle-lg" />
            <div className="header-circle header-circle-sm" />
            <div className="relative z-10 p-8 flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center shadow-inner backdrop-blur-sm">
                        <Icon size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight">{title}</h1>
                        <p className="text-sm opacity-90 font-medium">{description}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {actions?.map((action, i) => (
                        <button
                            key={i}
                            type="button"
                            className={`btn btn-${action.variant || 'white'} btn-lg shadow-md hover:scale-105 transition-transform ${action.className || ''}`}
                            onClick={action.onClick}
                        >
                            {action.icon && <action.icon size={22} />}
                            {action.label}
                        </button>
                    ))}
                    {children}
                </div>
            </div>
        </div>
    );
}
