import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../services/apiClient';
import { InterviewAssignment } from '../../types/domain';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Calendar, Building2, MapPin, Clock, CheckCircle2 } from 'lucide-react';

export const StudentDashboard: React.FC = () => {
    const { user } = useAuth();
    const [assignments, setAssignments] = useState<InterviewAssignment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStudentSchedule = async () => {
            if (!user?.student?.id) return;
            try {
                setLoading(true);
                const res = await apiClient.get(`/students/${user.student.id}/schedule`);
                setAssignments(res.data.data || []);
            } catch (err) {
                console.warn('No active schedule found for current candidate.');
                setAssignments([]);
            } finally {
                setLoading(false);
            }
        };

        fetchStudentSchedule();
    }, [user]);

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="bg-white border border-surface-border rounded-xl p-5 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-lg font-bold text-slate-900">Welcome, {user?.student?.name || 'Candidate'}</h1>
                        <StatusBadge status={user?.student?.status || 'ACTIVE'} />
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Roll Number: <span className="font-mono text-slate-700">{user?.student?.rollNumber}</span> &bull; Branch:{' '}
                        <span className="font-semibold text-slate-700">{user?.student?.branch}</span> &bull; CGPA:{' '}
                        <span className="font-mono text-slate-700">{Number(user?.student?.cgpa || 0).toFixed(2)}</span>
                    </p>
                </div>

                <div className="text-right">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Scheduled Rounds</p>
                    <p className="text-xl font-bold text-slate-900">{assignments.length}</p>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-brand-600" />
                        <span>My Placement Interview Schedule</span>
                    </h2>
                    <span className="text-[11px] text-slate-400">Times displayed in local campus time</span>
                </div>

                {loading ? (
                    <div className="bg-white border border-surface-border rounded-xl p-8 text-center text-xs text-slate-400 animate-pulse">
                        Loading candidate timetable...
                    </div>
                ) : assignments.length > 0 ? (
                    <div className="space-y-3">
                        {assignments.map((assignment) => (
                            <div
                                key={assignment.id}
                                className="bg-white border border-surface-border rounded-xl p-4 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-brand-200 transition-colors"
                            >
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <Building2 className="w-4 h-4 text-slate-400" />
                                        <span className="font-bold text-sm text-slate-900">{assignment.company.name}</span>
                                        <span className="text-xs text-slate-500">&bull; {assignment.round.name}</span>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1">
                                        <span className="flex items-center gap-1 font-mono font-semibold text-brand-600">
                                            <Clock className="w-3.5 h-3.5" />
                                            {new Date(assignment.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                                            {new Date(assignment.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>

                                        <span className="flex items-center gap-1">
                                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                            Room {assignment.room.name}
                                        </span>

                                        <span className="text-slate-400">&bull; Panel: {assignment.panel.name}</span>
                                    </div>
                                </div>

                                <div>
                                    <StatusBadge status={assignment.status} />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white border border-surface-border rounded-xl p-12 text-center space-y-2 shadow-subtle">
                        <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto" />
                        <h3 className="text-xs font-bold text-slate-700">No Scheduled Interviews</h3>
                        <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                            You currently have no active interview assignments in the published drive schedule.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};