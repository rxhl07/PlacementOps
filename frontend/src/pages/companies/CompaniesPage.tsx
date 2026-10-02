import React, { useEffect, useState } from 'react';
import { apiClient } from '../../services/apiClient';
import { Company } from '../../types/domain';
import { DataTable, Column } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Building2 } from 'lucide-react';

export const CompaniesPage: React.FC = () => {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCompanies = async () => {
            try {
                setLoading(true);
                const res = await apiClient.get('/companies');
                // Safely extract the data array
                const payload = res.data;
                const companyList = Array.isArray(payload) ? payload : (payload.data || []);
                setCompanies(companyList);
            } catch (err) {
                console.error('Failed to load companies', err);
            } finally {
                setLoading(false);
            }
        };
        fetchCompanies();
    }, []);

    const columns: Column<Company>[] = [
        {
            header: 'Company Name',
            cell: (row) => (
                <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-md bg-slate-100 border border-surface-border flex items-center justify-center text-slate-600">
                        <Building2 className="w-3.5 h-3.5" />
                    </div>
                    <div>
                        <span className="font-semibold text-slate-900">{row.name}</span>
                        <p className="text-[10px] text-slate-400 font-mono">ID: {row.id}</p>
                    </div>
                </div>
            ),
        },
        {
            header: 'Priority Tier',
            cell: (row) => <StatusBadge status={row.priority} />,
        },
        {
            header: 'Min CGPA Cutoff',
            cell: (row) => <span className="font-mono text-slate-900 font-semibold">{Number(row.minimumCgpa).toFixed(2)}</span>,
        },
        {
            header: 'Eligible Branches',
            cell: (row) => (
                <div className="flex flex-wrap gap-1">
                    {row.eligibleBranches && row.eligibleBranches.length > 0 ? (
                        row.eligibleBranches.map((b) => (
                            <span key={b} className="px-1.5 py-0.5 bg-slate-100 text-[10px] font-semibold text-slate-600 rounded">
                                {b}
                            </span>
                        ))
                    ) : (
                        <span className="text-[10px] text-slate-400">All Branches</span>
                    )}
                </div>
            ),
        },
        {
            header: 'Operational Window',
            cell: (row) => (
                <span className="text-slate-500 font-mono text-[11px]">
                    {row.expectedArrival && row.expectedDeparture ? (
                        <>
                            {new Date(row.expectedArrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                            {new Date(row.expectedDeparture).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </>
                    ) : (
                        '—'
                    )}
                </span>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-lg font-bold text-slate-900">Participating Companies</h1>
                <p className="text-xs text-slate-500">Registered recruiters, tier priorities, and eligibility criteria.</p>
            </div>

            <DataTable columns={columns} data={companies} loading={loading} emptyMessage="No participating companies registered." />
        </div>
    );
};