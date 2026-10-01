import React from 'react';

export type StatusVariant =
    | 'SCHEDULED'
    | 'IN_PROGRESS'
    | 'COMPLETED'
    | 'CANCELLED'
    | 'ACTIVE'
    | 'WITHDRAWN'
    | 'AVAILABLE'
    | 'UNAVAILABLE'
    | 'DELAYED'
    | 'CONFLICT'
    | 'HIGH'
    | 'MEDIUM'
    | 'LOW';

interface StatusBadgeProps {
    status: string | StatusVariant;
    label?: string;
    className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, className = '' }) => {
    const normalizedStatus = String(status).toUpperCase() as StatusVariant;

    const styles: Record<string, string> = {
        SCHEDULED: 'bg-blue-50 text-blue-700 border-blue-200/60',
        IN_PROGRESS: 'bg-amber-50 text-amber-700 border-amber-200/60',
        COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
        CANCELLED: 'bg-rose-50 text-rose-700 border-rose-200/60',
        ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
        WITHDRAWN: 'bg-slate-100 text-slate-600 border-slate-200',
        AVAILABLE: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
        UNAVAILABLE: 'bg-rose-50 text-rose-700 border-rose-200/60',
        DELAYED: 'bg-amber-50 text-amber-700 border-amber-200/60',
        CONFLICT: 'bg-rose-50 text-rose-700 border-rose-200/60',
        HIGH: 'bg-purple-50 text-purple-700 border-purple-200/60',
        MEDIUM: 'bg-blue-50 text-blue-700 border-blue-200/60',
        LOW: 'bg-slate-100 text-slate-600 border-slate-200',
    };

    const defaultStyle = 'bg-slate-50 text-slate-600 border-slate-200';
    const appliedStyle = styles[normalizedStatus] || defaultStyle;

    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${appliedStyle} ${className}`}
        >
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
            <span>{label || normalizedStatus}</span>
        </span>
    );
};