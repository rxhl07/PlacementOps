import React from 'react';

export interface Column<T> {
    header: string;
    accessorKey?: keyof T;
    cell?: (row: T) => React.ReactNode;
    className?: string;
}

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    loading?: boolean;
    emptyMessage?: string;
    onRowClick?: (row: T) => void;
}

export function DataTable<T extends { id?: string | number }>({
    columns,
    data,
    loading = false,
    emptyMessage = 'No records found.',
    onRowClick,
}: DataTableProps<T>) {
    if (loading) {
        return (
            <div className="bg-white border border-surface-border rounded-xl overflow-hidden p-6 space-y-3">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-9 bg-slate-100 rounded animate-pulse" />
                ))}
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="bg-white border border-surface-border rounded-xl p-12 text-center space-y-2">
                <p className="text-xs font-semibold text-slate-600">{emptyMessage}</p>
                <p className="text-[11px] text-slate-400">Try adjusting your active filters or create a new resource.</p>
            </div>
        );
    }

    return (
        <div className="bg-white border border-surface-border rounded-xl overflow-hidden shadow-subtle">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/80 border-b border-surface-border text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                            {columns.map((col, idx) => (
                                <th key={idx} className={`px-4 py-3 ${col.className || ''}`}>
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border text-xs text-slate-700">
                        {data.map((row, rowIdx) => (
                            <tr
                                key={row.id || rowIdx}
                                onClick={() => onRowClick && onRowClick(row)}
                                className={`transition-colors ${onRowClick ? 'cursor-pointer hover:bg-slate-50/80' : 'hover:bg-slate-50/40'
                                    }`}
                            >
                                {columns.map((col, colIdx) => (
                                    <td key={colIdx} className={`px-4 py-3.5 ${col.className || ''}`}>
                                        {col.cell
                                            ? col.cell(row)
                                            : col.accessorKey
                                                ? String(row[col.accessorKey] ?? '')
                                                : null}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}