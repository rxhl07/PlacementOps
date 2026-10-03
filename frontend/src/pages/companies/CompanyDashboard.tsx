import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../services/apiClient';
import { InterviewAssignment } from '../../types/domain';
import { DataTable, Column } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Building2 } from 'lucide-react';

export const CompanyDashboard: React.FC = () => {
    const { user } = useAuth();
    const [assignments, setAssignments] = useState<InterviewAssignment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCompanySchedule = async () => {
            if (!user?.companyCoordinator?.companyId) return;
            try {
                setLoading(true);
                await apiClient.get(`/companies/${user.companyCoordinator.companyId}`);

                const scheduleRes = await apiClient.get('/schedules/active');
                const activeAssignments = (scheduleRes.data.data.assignments || []).filter(
                    (a: InterviewAssignment) => a.companyId === user.companyCoordinator?.companyId
                );
                setAssignments(activeAssignments);
            } catch (err) {
                console.warn('No active company schedule found.');
                setAssignments([]);
            } finally {
                setLoading(false);
            }
        };

        fetchCompanySchedule();
    }, [user]);

    const columns: Column<InterviewAssignment>[] = [
        {
            header: 'Time Slot',
            cell: (row) => (
                <span className="font-mono text-xs font-semibold text-slate-700">
                    {new Date(row.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                    {new Date(row.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
            ),
        },
        {
            header: 'Candidate Name',
            cell: (row) => (
                <div>
                    <p className="font-semibold text-slate-900">{row.student.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{row.student.rollNumber} &bull; {row.student.branch}</p>
                </div>
            ),
        },
        {
            header: 'Interview Round',
            cell: (row) => <span className="text-slate-700 font-medium">{row.round.name}</span>,
        },
        {
            header: 'Assigned Room',
            cell: (row) => (
                <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono font-semibold text-[10px]">
                    {row.room.name}
                </span>
            ),
        },
        {
            header: 'Interview Panel',
            cell: (row) => <span className="text-slate-600">{row.panel.name}</span>,
        },
        {
            header: 'Status',
            cell: (row) => <StatusBadge status={row.status} />,
        },
    ];

    return (
        <div className="space-y-6">
            <div className="bg-white border border-surface-border rounded-xl p-5 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-brand-600" />
                        <h1 className="text-lg font-bold text-slate-900">Recruiter Portal</h1>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Recruiter representative: <span className="font-semibold text-slate-700">{user?.companyCoordinator?.name}</span>
                    </p>
                </div>

                <div className="flex items-center gap-4 text-xs">
                    <div className="p-2 bg-slate-50 border border-surface-border rounded-lg">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase">Interview Volume</p>
                        <p className="text-base font-bold text-slate-900">{assignments.length} Candidates</p>
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Assigned Candidates & Rooms</h2>
                <DataTable columns={columns} data={assignments} loading={loading} emptyMessage="No candidate interviews scheduled." />
            </div>
        </div>
    );
};