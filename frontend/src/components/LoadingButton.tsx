import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  icon?: LucideIcon;
  children: React.ReactNode;
}

export function LoadingButton({
  loading = false,
  icon: Icon,
  children,
  disabled,
  className = '',
  ...props
}: LoadingButtonProps) {
  return (
    <button
      className={`btn gap-2${className ? ' ' + className : ''}`}
      disabled={loading || disabled}
      {...props}
    >
      {loading ? (
        <span className="loading loading-spinner loading-xs" />
      ) : Icon ? (
        <Icon size={18} />
      ) : null}
      {children}
    </button>
  );
}
