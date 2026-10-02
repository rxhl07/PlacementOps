import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { schedulesApi } from '../../services/schedulesApi';
import { InterviewAssignment } from '../../types/domain';
import { DataTable, Column } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { AlertTriangle, RefreshCw, ArrowLeft, ShieldAlert } from 'lucide-react';

export const ConflictsPage: React.FC = () => {
    const { driveId } = useParams<{ driveId: string }>();
    const navigate = useNavigate();
    const [assignments, setAssignments] = useState<InterviewAssignment[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchSchedule = async () => {
        if (!driveId) return;
        try {
            setLoading(true);
            const res = await schedulesApi.getActiveSchedule(driveId);
            const version = res.data || res;
            setAssignments(version?.assignments || []);
        } catch (err) {
            console.error('Failed to fetch schedule conflicts', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSchedule();
    }, [driveId]);

    // Identify cancelled or conflicting assignments
    const activeConflicts = assignments.filter((a) => a.status === 'CANCELLED');

    const columns: Column<InterviewAssignment>[] = [
        {
            header: 'Affected Candidate',
            cell: (row) => (
                <div>
                    <p className="font-semibold text-slate-900">{row.student.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{row.student.rollNumber}</p>
                </div>
            ),
        },
        {
            header: 'Company & Round',
            cell: (row) => (
                <div>
                    <p className="font-medium text-slate-800">{row.company.name}</p>
                    <p className="text-[10px] text-slate-500">{row.round.name}</p>
                </div>
            ),
        },
        {
            header: 'Assigned Location',
            cell: (row) => <span className="font-mono text-slate-700 text-xs">{row.room.name}</span>,
        },
        {
            header: 'Assigned Panel',
            cell: (row) => <span className="text-slate-600 text-xs">{row.panel.name}</span>,
        },
        {
            header: 'Conflict Status',
            cell: (row) => <StatusBadge status={row.status} label="Operational Conflict" />,
        },
        {
            header: 'Action',
            cell: () => (
                <Button
                    size="sm"
                    variant="destructive"
                    icon={AlertTriangle}
                    onClick={() => navigate('/replans')}
                >
                    Replan Slot
                </Button>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            {/* Top Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div>
                        <h1 className="text-lg font-bold text-slate-900">Conflicts & Disruption Workspace</h1>
                        <p className="text-xs text-slate-500">Active schedule clashes requiring dynamic replanning.</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchSchedule}
                        className="p-2 text-slate-500 hover:text-slate-700 bg-white border border-surface-border rounded-lg transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                    <Button variant="destructive" icon={AlertTriangle} onClick={() => navigate('/replans')}>
                        Report Disruption
                    </Button>
                </div>
            </div>

            {/* Summary Alert Banner */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
                        <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-xs font-bold text-amber-900">Active Schedule Clashes ({activeConflicts.length})</h3>
                        <p className="text-[11px] text-amber-700">
                            Interviews flagged as CANCELLED or unscheduled following recent resource disruptions.
                        </p>
                    </div>
                </div>

                {activeConflicts.length > 0 && (
                    <Button size="sm" variant="destructive" onClick={() => navigate('/replans')}>
                        Trigger Minimal Replan
                    </Button>
                )}
            </div>

            <DataTable
                columns={columns}
                data={activeConflicts}
                loading={loading}
                emptyMessage="No active conflicts detected in current schedule version."
            />
        </div>
    );
};