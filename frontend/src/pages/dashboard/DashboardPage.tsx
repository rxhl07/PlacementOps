import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { drivesApi } from '../../services/drivesApi';
import { schedulesApi } from '../../services/schedulesApi';
import { PlacementDrive, InterviewAssignment } from '../../types/domain';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { Drawer } from '../../components/ui/Drawer';
import { DataTable, Column } from '../../components/ui/DataTable';
import {
    CalendarDays,
    AlertTriangle,
    Users,
    Building2,
    RefreshCw,
    DoorOpen,
    Play,
    Filter,
    Search,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
    const navigate = useNavigate();
    const [drives, setDrives] = useState<PlacementDrive[]>([]);
    const [selectedDriveId, setSelectedDriveId] = useState<string>('');
    const [assignments, setAssignments] = useState<InterviewAssignment[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [generating, setGenerating] = useState<boolean>(false);

    // Filter & Inspection State
    const [search, setSearch] = useState('');
    const [companyFilter, setCompanyFilter] = useState('ALL');
    const [selectedAssignment, setSelectedAssignment] = useState<InterviewAssignment | null>(null);

    // Load drives on mount
    useEffect(() => {
        const fetchDrives = async () => {
            try {
                const driveData = await drivesApi.getAll();
                setDrives(driveData || []);
                if (driveData && driveData.length > 0) {
                    setSelectedDriveId(driveData[0].id);
                }
            } catch (err) {
                console.error('Failed to load placement drives', err);
            }
        };
        fetchDrives();
    }, []);

    // Load schedule whenever active drive changes
    const fetchSchedule = async () => {
        if (!selectedDriveId) return;
        try {
            setLoading(true);
            const res = await schedulesApi.getActiveSchedule(selectedDriveId);
            // Extract version payload from API response wrapper
            const version = res.data || res;
            setAssignments(version?.assignments || []);
        } catch (err) {
            console.warn('No active schedule version found for selected drive.', err);
            setAssignments([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSchedule();
    }, [selectedDriveId]);

    const handleGenerateSchedule = async () => {
        if (!selectedDriveId) return;
        try {
            setGenerating(true);
            await schedulesApi.generateSchedule(selectedDriveId);
            await fetchSchedule();
        } catch (err: any) {
            alert(err.message || 'Schedule generation failed.');
        } finally {
            setGenerating(false);
        }
    };

    // Compute operational KPI metrics
    const totalScheduled = assignments.length;
    const uniqueStudents = new Set(assignments.map((a) => a.studentId)).size;
    const uniqueCompanies = new Set(assignments.map((a) => a.companyId)).size;
    const uniqueRooms = new Set(assignments.map((a) => a.roomId)).size;

    // Filter assignments
    const filteredAssignments = assignments.filter((a) => {
        const matchesSearch =
            a.student.name.toLowerCase().includes(search.toLowerCase()) ||
            a.student.rollNumber.toLowerCase().includes(search.toLowerCase()) ||
            a.company.name.toLowerCase().includes(search.toLowerCase());
        const matchesCompany = companyFilter === 'ALL' || a.companyId === companyFilter;
        return matchesSearch && matchesCompany;
    });

    const columns: Column<InterviewAssignment>[] = [
        {
            header: 'Time Slot',
            cell: (row) => (
                <span className="font-mono text-[11px] font-semibold text-slate-700">
                    {new Date(row.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                    {new Date(row.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
            ),
        },
        {
            header: 'Candidate',
            cell: (row) => (
                <div>
                    <p className="font-semibold text-slate-900">{row.student.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{row.student.rollNumber} &bull; {row.student.branch}</p>
                </div>
            ),
        },
        {
            header: 'Company',
            cell: (row) => <span className="font-medium text-slate-800">{row.company.name}</span>,
        },
        {
            header: 'Round',
            cell: (row) => <span className="text-slate-600">{row.round.name}</span>,
        },
        {
            header: 'Location',
            cell: (row) => (
                <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono font-semibold text-[10px] border border-surface-border">
                    {row.room.name}
                </span>
            ),
        },
        {
            header: 'Panel',
            cell: (row) => <span className="text-slate-600">{row.panel.name}</span>,
        },
        {
            header: 'Status',
            cell: (row) => <StatusBadge status={row.status} />,
        },
    ];

    const uniqueCompaniesList = Array.from(
        new Map(assignments.map((a) => [a.companyId, a.company])).values()
    );

    return (
        <div className="space-y-6">
            {/* Top Header & Drive Selection */}
            <div className="bg-white border border-surface-border rounded-xl p-5 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-lg font-bold text-slate-900">Placement Operations Center</h1>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Real-time schedule monitoring, conflict detection, and dynamic disruption handling.
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

                    <Button icon={Play} loading={generating} onClick={handleGenerateSchedule}>
                        Generate Schedule
                    </Button>

                    <Button
                        variant="destructive"
                        icon={AlertTriangle}
                        onClick={() => navigate('/replans')}
                    >
                        Report Disruption
                    </Button>
                </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-surface-border rounded-xl p-4 shadow-subtle flex items-center gap-3.5">
                    <div className="p-2.5 bg-blue-50 text-brand-600 rounded-lg border border-blue-100">
                        <CalendarDays className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Scheduled Interviews</p>
                        <p className="text-xl font-bold text-slate-900 mt-0.5">{totalScheduled}</p>
                    </div>
                </div>

                <div className="bg-white border border-surface-border rounded-xl p-4 shadow-subtle flex items-center gap-3.5">
                    <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
                        <Users className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Active Candidates</p>
                        <p className="text-xl font-bold text-slate-900 mt-0.5">{uniqueStudents}</p>
                    </div>
                </div>

                <div className="bg-white border border-surface-border rounded-xl p-4 shadow-subtle flex items-center gap-3.5">
                    <div className="p-2.5 bg-purple-50 text-purple-600 rounded-lg border border-purple-100">
                        <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Recruiters Engaged</p>
                        <p className="text-xl font-bold text-slate-900 mt-0.5">{uniqueCompanies}</p>
                    </div>
                </div>

                <div className="bg-white border border-surface-border rounded-xl p-4 shadow-subtle flex items-center gap-3.5">
                    <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg border border-amber-100">
                        <DoorOpen className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Rooms Utilized</p>
                        <p className="text-xl font-bold text-slate-900 mt-0.5">{uniqueRooms}</p>
                    </div>
                </div>
            </div>

            {/* Main Timetable Workspace */}
            <div className="space-y-3">
                {/* Filter Controls Toolbar */}
                <div className="bg-white border border-surface-border rounded-xl p-3 flex flex-col md:flex-row items-center justify-between gap-3 shadow-subtle">
                    <div className="relative w-full md:w-80">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                        <input
                            type="text"
                            placeholder="Search candidate, roll no, or company..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full border border-surface-border rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-brand-600"
                        />
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <Filter className="w-3.5 h-3.5 text-slate-400" />
                        <select
                            value={companyFilter}
                            onChange={(e) => setCompanyFilter(e.target.value)}
                            className="border border-surface-border rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-brand-600"
                        >
                            <option value="ALL">All Companies</option>
                            {uniqueCompaniesList.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>

                        <button
                            onClick={fetchSchedule}
                            title="Refresh Schedule Matrix"
                            className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors border border-surface-border"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

                {/* Schedule Data Matrix */}
                <DataTable
                    columns={columns}
                    data={filteredAssignments}
                    loading={loading}
                    emptyMessage="No interview assignments found for this drive. Click 'Generate Schedule' to create a timetable."
                    onRowClick={(row) => setSelectedAssignment(row)}
                />
            </div>

            {/* Quick-Inspect Drawer */}
            <Drawer
                isOpen={!!selectedAssignment}
                onClose={() => setSelectedAssignment(null)}
                title="Interview Assignment Inspection"
            >
                {selectedAssignment && (
                    <div className="space-y-4 text-xs">
                        <div className="p-3 bg-slate-50 border border-surface-border rounded-lg space-y-1">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase">Assignment ID</span>
                            <p className="font-mono font-semibold text-slate-900 text-[11px]">{selectedAssignment.id}</p>
                        </div>

                        <div className="space-y-2">
                            <h4 className="font-semibold text-slate-900 border-b border-surface-border pb-1">Candidate Details</h4>
                            <p><strong className="text-slate-600">Name:</strong> {selectedAssignment.student.name}</p>
                            <p><strong className="text-slate-600">Roll Number:</strong> {selectedAssignment.student.rollNumber}</p>
                            <p><strong className="text-slate-600">Branch:</strong> {selectedAssignment.student.branch}</p>
                            <p><strong className="text-slate-600">CGPA:</strong> {Number(selectedAssignment.student.cgpa).toFixed(2)}</p>
                        </div>

                        <div className="space-y-2">
                            <h4 className="font-semibold text-slate-900 border-b border-surface-border pb-1">Recruiter & Round</h4>
                            <p><strong className="text-slate-600">Company:</strong> {selectedAssignment.company.name}</p>
                            <p><strong className="text-slate-600">Round:</strong> {selectedAssignment.round.name}</p>
                            <p><strong className="text-slate-600">Duration:</strong> {selectedAssignment.round.durationMinutes} minutes</p>
                        </div>

                        <div className="space-y-2">
                            <h4 className="font-semibold text-slate-900 border-b border-surface-border pb-1">Resource Allocation</h4>
                            <p><strong className="text-slate-600">Assigned Room:</strong> {selectedAssignment.room.name}</p>
                            <p><strong className="text-slate-600">Assigned Panel:</strong> {selectedAssignment.panel.name}</p>
                            <p><strong className="text-slate-600">Start Time:</strong> {new Date(selectedAssignment.startTime).toLocaleString()}</p>
                            <p><strong className="text-slate-600">End Time:</strong> {new Date(selectedAssignment.endTime).toLocaleString()}</p>
                        </div>

                        <div className="pt-2">
                            <StatusBadge status={selectedAssignment.status} />
                        </div>
                    </div>
                )}
            </Drawer>
        </div>
    );
};