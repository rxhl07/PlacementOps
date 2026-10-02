import React from 'react';
import { Modal } from '../ui/Modal';
import { DataTable, Column } from '../ui/DataTable';
import { AlertCircle } from 'lucide-react';

export interface UnscheduledReason {
    id?: string; // Satisfies DataTable's expected constraint
    studentId: string;
    studentName: string;
    companyId: string;
    companyName: string;
    roundId: string;
    roundName: string;
    reasons: string[];
}

interface UnscheduledModalProps {
    isOpen: boolean;
    onClose: () => void;
    unscheduledItems: UnscheduledReason[];
    totalScheduled: number;
    totalRequested: number;
}

export const UnscheduledModal: React.FC<UnscheduledModalProps> = ({
    isOpen,
    onClose,
    unscheduledItems,
    totalScheduled,
    totalRequested,
}) => {
    // Ensure every row has a unique fallback id for rendering
    const rowsWithId = unscheduledItems.map((item, index) => ({
        ...item,
        id: item.id || `${item.studentId}-${item.companyId}-${item.roundId}-${index}`,
    }));

    const columns: Column<UnscheduledReason>[] = [
        {
            header: 'Candidate',
            cell: (row) => <span className="font-semibold text-slate-900">{row.studentName}</span>,
        },
        {
            header: 'Company & Round',
            cell: (row) => (
                <div>
                    <p className="font-medium text-slate-800">{row.companyName}</p>
                    <p className="text-[10px] text-slate-400">{row.roundName}</p>
                </div>
            ),
        },
        {
            header: 'Constraint Failure Reasons',
            cell: (row) => (
                <div className="space-y-1">
                    {row.reasons.map((r, idx) => (
                        <p key={idx} className="text-[11px] text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                            &bull; {r}
                        </p>
                    ))}
                </div>
            ),
        },
    ];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Schedule Generation Execution Result"
            description="Infeasibility reporting breakdown for unassigned candidates."
            maxWidth="xl"
        >
            <div className="space-y-4">
                {/* Execution Summary Cards */}
                <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-3 bg-slate-50 border border-surface-border rounded-lg">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase">Total Requested</p>
                        <p className="text-lg font-bold text-slate-900">{totalRequested}</p>
                    </div>
                    <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
                        <p className="text-[10px] font-semibold text-emerald-600 uppercase">Scheduled</p>
                        <p className="text-lg font-bold text-emerald-700">{totalScheduled}</p>
                    </div>
                    <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg">
                        <p className="text-[10px] font-semibold text-rose-600 uppercase">Unscheduled</p>
                        <p className="text-lg font-bold text-rose-700">{unscheduledItems.length}</p>
                    </div>
                </div>

                {unscheduledItems.length > 0 ? (
                    <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-xs text-amber-800 font-semibold bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                            <span>The constraint engine could not find feasible slots for the following interviews:</span>
                        </div>
                        <DataTable columns={columns} data={rowsWithId} emptyMessage="All interviews successfully scheduled." />
                    </div>
                ) : (
                    <div className="p-6 text-center text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl font-semibold">
                        100% Feasible Schedule! All requested candidate interviews were assigned without conflicts.
                    </div>
                )}
            </div>
        </Modal>
    );
};