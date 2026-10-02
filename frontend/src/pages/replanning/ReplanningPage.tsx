import React, { useEffect, useState } from 'react';
import { drivesApi } from '../../services/drivesApi';
import { replansApi } from '../../services/replansApi';
import { PlacementDrive, DisruptionType, ScheduleDiff, ScheduleChangeType } from '../../types/domain';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { DataTable, Column } from '../../components/ui/DataTable';
import { AlertTriangle, Layers, CheckCircle2 } from 'lucide-react';

export const ReplanningPage: React.FC = () => {
    const [drives, setDrives] = useState<PlacementDrive[]>([]);
    const [selectedDriveId, setSelectedDriveId] = useState<string>('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [replanning, setReplanning] = useState(false);
    const [lastReplanResult, setLastReplanResult] = useState<{
        disruptionId: string;
        oldVersionNumber: number;
        newVersionNumber: number;
        summary: { totalAffected: number; rescheduled: number; cancelled: number; unaffected: number };
        diffs: ScheduleDiff[];
    } | null>(null);

    // Form State
    const [disruptionType, setDisruptionType] = useState<DisruptionType>(DisruptionType.COMPANY_DELAY);
    const [targetId, setTargetId] = useState('');
    const [delayMinutes, setDelayMinutes] = useState(60);
    const [description, setDescription] = useState('');

    useEffect(() => {
        const fetchDrives = async () => {
            try {
                const driveData = await drivesApi.getAll();
                setDrives(driveData || []);
                if (driveData && driveData.length > 0) {
                    setSelectedDriveId(driveData[0].id);
                }
            } catch (err) {
                console.error('Failed to fetch placement drives', err);
            }
        };
        fetchDrives();
    }, []);

    const handleExecuteReplan = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDriveId) return;

        try {
            setReplanning(true);
            const payload: any = {
                placementDriveId: selectedDriveId,
                type: disruptionType,
                description,
            };

            if (disruptionType === DisruptionType.COMPANY_DELAY) {
                payload.companyId = targetId;
                payload.delayMinutes = Number(delayMinutes);
            } else if (disruptionType === DisruptionType.ROOM_UNAVAILABLE) {
                payload.roomId = targetId;
            } else if (disruptionType === DisruptionType.PANEL_UNAVAILABLE) {
                payload.panelId = targetId;
            } else if (disruptionType === DisruptionType.STUDENT_WITHDRAWAL) {
                payload.studentId = targetId;
            }

            const result = await replansApi.triggerReplan(payload);
            setLastReplanResult(result as any);
            setIsModalOpen(false);
            // Reset form
            setTargetId('');
            setDescription('');
        } catch (err: any) {
            alert(err.message || 'Dynamic replan execution failed.');
        } finally {
            setReplanning(false);
        }
    };

    const diffColumns: Column<ScheduleDiff>[] = [
        {
            header: 'Change Type',
            cell: (row) => (
                <StatusBadge
                    status={row.changeType === ScheduleChangeType.MOVED ? 'DELAYED' : 'CANCELLED'}
                    label={row.changeType}
                />
            ),
        },
        {
            header: 'Candidate & Company',
            cell: (row) => (
                <div>
                    <p className="font-semibold text-slate-900">{row.details?.studentName || 'Candidate'}</p>
                    <p className="text-[10px] text-slate-500">{row.details?.companyName || 'Recruiter'}</p>
                </div>
            ),
        },
        {
            header: 'Previous Assignment',
            cell: (row) => (
                <div className="text-slate-600 font-mono text-[11px]">
                    {row.details?.oldTime ? (
                        <>
                            {new Date(row.details.oldTime.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} &bull; Room {row.details.oldRoom || '-'}
                        </>
                    ) : (
                        '—'
                    )}
                </div>
            ),
        },
        {
            header: 'New Assignment (Minimal Churn)',
            cell: (row) => (
                <div className="font-mono text-[11px] text-brand-600 font-semibold">
                    {row.details?.newTime ? (
                        <>
                            {new Date(row.details.newTime.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} &bull; Room {row.details.newRoom || '-'}
                        </>
                    ) : (
                        <span className="text-rose-600 font-normal">Cancelled</span>
                    )}
                </div>
            ),
        },
        {
            header: 'Disruption Context',
            cell: (row) => <span className="text-slate-500 text-xs">{row.details?.reason || 'System Replan'}</span>,
        },
    ];

    // Map rows with safe fallback IDs for DataTable
    const formattedDiffs = (lastReplanResult?.diffs || []).map((d, index) => ({
        ...d,
        id: d.id || `${d.assignmentId}-${index}`,
    }));

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white border border-surface-border rounded-xl p-5 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-lg font-bold text-slate-900">Dynamic Disruption & Replanning Engine</h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Ingest real-world state changes, freeze unaffected assignments, and restore feasible schedules with minimal churn.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <select
                        value={selectedDriveId}
                        onChange={(e) => setSelectedDriveId(e.target.value)}
                        className="border border-surface-border bg-slate-50 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-brand-600"
                    >
                        {drives.map((d) => (
                            <option key={d.id} value={d.id}>
                                {d.name} ({d.academicYear})
                            </option>
                        ))}
                    </select>

                    <Button variant="destructive" icon={AlertTriangle} onClick={() => setIsModalOpen(true)}>
                        Report Disruption & Replan
                    </Button>
                </div>
            </div>

            {/* Replan Summary Panel */}
            {lastReplanResult ? (
                <div className="space-y-4">
                    <div className="bg-white border border-surface-border rounded-xl p-5 shadow-subtle space-y-4">
                        <div className="flex items-center justify-between border-b border-surface-border pb-3">
                            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                <span>Replan Executed: Version V{lastReplanResult.oldVersionNumber} &rarr; V{lastReplanResult.newVersionNumber}</span>
                            </div>
                            <span className="text-xs font-mono text-slate-500">Disruption ID: {lastReplanResult.disruptionId}</span>
                        </div>

                        {/* Impact Metrics Row */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                            <div className="p-3 bg-slate-50 border border-surface-border rounded-lg">
                                <p className="text-[10px] font-semibold text-slate-400 uppercase">Blast Radius (Affected)</p>
                                <p className="text-lg font-bold text-slate-900">{lastReplanResult.summary.totalAffected}</p>
                            </div>
                            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
                                <p className="text-[10px] font-semibold text-emerald-600 uppercase">Frozen / Unaffected</p>
                                <p className="text-lg font-bold text-emerald-700">{lastReplanResult.summary.unaffected}</p>
                            </div>
                            <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                                <p className="text-[10px] font-semibold text-blue-600 uppercase">Rescheduled</p>
                                <p className="text-lg font-bold text-blue-700">{lastReplanResult.summary.rescheduled}</p>
                            </div>
                            <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg">
                                <p className="text-[10px] font-semibold text-rose-600 uppercase">Cancelled</p>
                                <p className="text-lg font-bold text-rose-700">{lastReplanResult.summary.cancelled}</p>
                            </div>
                        </div>
                    </div>

                    {/* Granular Schedule Diff Table */}
                    <div className="space-y-2">
                        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Granular Schedule Diff Summary</h3>
                        <DataTable
                            columns={diffColumns}
                            data={formattedDiffs}
                            emptyMessage="No assignments were changed during this replan."
                        />
                    </div>
                </div>
            ) : (
                <div className="bg-white border border-surface-border rounded-xl p-12 text-center space-y-2 shadow-subtle">
                    <Layers className="w-8 h-8 text-slate-300 mx-auto" />
                    <h3 className="text-xs font-bold text-slate-700">No Replan Executed in Current Session</h3>
                    <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                        Click 'Report Disruption & Replan' to simulate a company delay, panel dropout, room closure, or candidate withdrawal.
                    </p>
                </div>
            )}

            {/* Disruption Ingestion Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Report Operational Disruption"
                description="Ingest disruption parameters into the constraint engine to trigger dynamic replanning."
            >
                <form onSubmit={handleExecuteReplan} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                            Disruption Type
                        </label>
                        <select
                            value={disruptionType}
                            onChange={(e) => setDisruptionType(e.target.value as DisruptionType)}
                            className="w-full border border-surface-border rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-brand-600"
                        >
                            <option value={DisruptionType.COMPANY_DELAY}>Company Delay / Late Arrival</option>
                            <option value={DisruptionType.ROOM_UNAVAILABLE}>Room Emergency Closure</option>
                            <option value={DisruptionType.PANEL_UNAVAILABLE}>Panel Dropout / Offline</option>
                            <option value={DisruptionType.STUDENT_WITHDRAWAL}>Student Offer Withdrawal</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                            Affected Resource UUID
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="Enter Company / Room / Panel / Student ID"
                            value={targetId}
                            onChange={(e) => setTargetId(e.target.value)}
                            className="w-full border border-surface-border rounded-lg px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-brand-600"
                        />
                    </div>

                    {disruptionType === DisruptionType.COMPANY_DELAY && (
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                                Delay Duration (Minutes)
                            </label>
                            <input
                                type="number"
                                required
                                value={delayMinutes}
                                onChange={(e) => setDelayMinutes(Number(e.target.value))}
                                className="w-full border border-surface-border rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-brand-600"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                            Context / Audit Reason
                        </label>
                        <textarea
                            required
                            rows={2}
                            placeholder="e.g. Recruiter flight delayed by 60 mins..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full border border-surface-border rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-brand-600"
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" type="submit" loading={replanning}>
                            Execute Replan
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};