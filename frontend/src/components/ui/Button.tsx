import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'destructive' | 'ghost' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    icon?: React.ElementType;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    icon: Icon,
    disabled,
    className = '',
    ...props
}) => {
    const baseStyles =
        'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-50 disabled:cursor-not-allowed shadow-subtle';

    const variants = {
        primary: 'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800',
        secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-surface-border',
        destructive: 'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800',
        ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 shadow-none',
        outline: 'bg-white text-slate-700 border border-surface-border hover:bg-slate-50',
    };

    const sizes = {
        sm: 'text-xs px-2.5 py-1.5 gap-1.5',
        md: 'text-xs px-3.5 py-2 gap-2',
        lg: 'text-sm px-4 py-2.5 gap-2',
    };

    return (
        <button
            disabled={disabled || loading}
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            {...props}
        >
            {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
            ) : Icon ? (
                <Icon className="w-3.5 h-3.5 shrink-0" />
            ) : null}
            <span>{children}</span>
        </button>
    );
};