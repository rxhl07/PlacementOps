import React, { useEffect, useState } from 'react';
import { apiClient } from '../../services/apiClient';
import { Student } from '../../types/domain';
import { DataTable, Column } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Search, Filter } from 'lucide-react';

export const StudentsPage: React.FC = () => {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [branchFilter, setBranchFilter] = useState('ALL');

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                setLoading(true);
                const res = await apiClient.get('/students');
                const payload = res.data;
                setStudents(Array.isArray(payload) ? payload : payload.data || []);
            } catch (err) {
                console.error('Failed to fetch students', err);
            } finally {
                setLoading(false);
            }
        };
        fetchStudents();
    }, []);

    const filteredStudents = students.filter((s) => {
        const matchesSearch =
            s.name.toLowerCase().includes(search.toLowerCase()) ||
            s.rollNumber.toLowerCase().includes(search.toLowerCase());
        const matchesBranch = branchFilter === 'ALL' || s.branch === branchFilter;
        return matchesSearch && matchesBranch;
    });

    const columns: Column<Student>[] = [
        {
            header: 'Roll Number',
            accessorKey: 'rollNumber',
            className: 'font-mono text-slate-600',
        },
        {
            header: 'Candidate Name',
            cell: (row) => <span className="font-semibold text-slate-900">{row.name}</span>,
        },
        {
            header: 'Branch',
            accessorKey: 'branch',
        },
        {
            header: 'CGPA',
            cell: (row) => <span className="font-semibold text-slate-900 font-mono">{Number(row.cgpa).toFixed(2)}</span>,
        },
        {
            header: 'Graduation Year',
            accessorKey: 'graduationYear',
        },
        {
            header: 'Status',
            cell: (row) => <StatusBadge status={row.status} />,
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-lg font-bold text-slate-900">Students Directory</h1>
                <p className="text-xs text-slate-500">Registered candidates eligible for campus placement drives.</p>
            </div>

            {/* Filter Toolbar */}
            <div className="bg-white border border-surface-border rounded-xl p-3 flex flex-col md:flex-row items-center justify-between gap-3 shadow-subtle">
                <div className="relative w-full md:w-72">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                        type="text"
                        placeholder="Search candidate or roll number..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full border border-surface-border rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-brand-600"
                    />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Filter className="w-3.5 h-3.5 text-slate-400" />
                    <select
                        value={branchFilter}
                        onChange={(e) => setBranchFilter(e.target.value)}
                        className="border border-surface-border rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-brand-600"
                    >
                        <option value="ALL">All Branches</option>
                        <option value="CSE">CSE</option>
                        <option value="ECE">ECE</option>
                        <option value="EEE">EEE</option>
                        <option value="MECH">MECH</option>
                    </select>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={filteredStudents}
                loading={loading}
                emptyMessage="No students match the selected filter criteria."
            />
        </div>
    );
};