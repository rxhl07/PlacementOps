import React, { useEffect, useState } from 'react';
import { apiClient } from '../../services/apiClient';
import { User } from '../../types/domain';
import { DataTable, Column } from '../../components/ui/DataTable';

export const UsersPage: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setLoading(true);
                const res = await apiClient.get('/users');
                setUsers(res.data.data || []);
            } catch (err) {
                console.warn('Failed to load user accounts.');
                setUsers([]);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    const columns: Column<User>[] = [
        {
            header: 'Account Email',
            cell: (row) => <span className="font-semibold text-slate-900">{row.email}</span>,
        },
        {
            header: 'User UUID',
            cell: (row) => <span className="font-mono text-[10px] text-slate-400">{row.id}</span>,
        },
        {
            header: 'Assigned Role',
            cell: (row) => (
                <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border border-surface-border">
                    {row.role}
                </span>
            ),
        },
        {
            header: 'Associated Entity',
            cell: (row) => (
                <span className="text-slate-600 text-xs">
                    {row.student
                        ? `Student: ${row.student.name}`
                        : row.companyCoordinator
                            ? `Recruiter: ${row.companyCoordinator.name}`
                            : 'System User'}
                </span>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-lg font-bold text-slate-900">User Management</h1>
                <p className="text-xs text-slate-500">Registered system accounts and role-based clearance levels.</p>
            </div>

            <DataTable columns={columns} data={users} loading={loading} emptyMessage="No registered user accounts found." />
        </div>
    );
};