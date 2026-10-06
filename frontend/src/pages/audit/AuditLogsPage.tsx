import React, { useEffect, useState } from 'react';
import { apiClient } from '../../services/apiClient';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Search } from 'lucide-react';

interface AuditLogRecord {
    id: string;
    userId?: string;
    action: string;
    entity: string;
    entityId: string;
    reason?: string;
    timestamp: string;
}

export const AuditLogsPage: React.FC = () => {
    const [logs, setLogs] = useState<AuditLogRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const fetchAuditLogs = async () => {
            try {
                setLoading(true);
                const res = await apiClient.get('/audit-logs');
                setLogs(res.data.data || []);
            } catch (err) {
                console.warn('Failed to load audit records.');
                setLogs([]);
            } finally {
                setLoading(false);
            }
        };

        fetchAuditLogs();
    }, []);

    const filteredLogs = logs.filter(
        (l) =>
            l.action.toLowerCase().includes(search.toLowerCase()) ||
            l.entity.toLowerCase().includes(search.toLowerCase()) ||
            (l.reason && l.reason.toLowerCase().includes(search.toLowerCase()))
    );

    const columns: Column<AuditLogRecord>[] = [
        {
            header: 'Timestamp',
            cell: (row) => (
                <span className="font-mono text-[11px] text-slate-600">
                    {new Date(row.timestamp).toLocaleString()}
                </span>
            ),
        },
        {
            header: 'Action',
            cell: (row) => (
                <span className="font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[11px] font-mono border border-surface-border">
                    {row.action}
                </span>
            ),
        },
        {
            header: 'Target Entity',
            cell: (row) => (
                <div>
                    <p className="font-medium text-slate-800">{row.entity}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{row.entityId}</p>
                </div>
            ),
        },
        {
            header: 'Audit Reason / Notes',
            cell: (row) => <span className="text-slate-600 text-xs">{row.reason || '—'}</span>,
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-lg font-bold text-slate-900">System Audit Trail</h1>
                <p className="text-xs text-slate-500">
                    Append-only historical record of all administrative actions, disruptions, and schedule replan triggers.
                </p>
            </div>

            <div className="bg-white border border-surface-border rounded-xl p-3 flex items-center justify-between shadow-subtle">
                <div className="relative w-full md:w-80">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                        type="text"
                        placeholder="Search audit action, entity, or reason..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full border border-surface-border rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-brand-600"
                    />
                </div>
            </div>

            <DataTable
                columns={columns}
                data={filteredLogs}
                loading={loading}
                emptyMessage="No audit log records found matching search query."
            />
        </div>
    );
};