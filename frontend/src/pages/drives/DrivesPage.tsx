import React, { useEffect, useState } from 'react';
import { drivesApi } from '../../services/drivesApi';
import { PlacementDrive } from '../../types/domain';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Plus, Building2, DoorOpen, ArrowRight } from 'lucide-react';

export const DrivesPage: React.FC = () => {
    const [drives, setDrives] = useState<PlacementDrive[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [creating, setCreating] = useState(false);

    // Form State (Format: YYYY-MM-DDTHH:mm for datetime-local compatibility)
    const [name, setName] = useState('');
    const [academicYear, setAcademicYear] = useState('2025-2026');
    const [startDate, setStartDate] = useState('2026-10-01T09:00');
    const [endDate, setEndDate] = useState('2026-10-05T18:00');

    const fetchDrives = async () => {
        try {
            setLoading(true);
            const data = await drivesApi.getAll();
            setDrives(data || []);
        } catch (err) {
            console.error('Failed to load placement drives', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDrives();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setCreating(true);
            await drivesApi.create({
                name,
                academicYear,
                startDate: new Date(startDate).toISOString(),
                endDate: new Date(endDate).toISOString(),
            });
            setIsModalOpen(false);
            setName('');
            await fetchDrives();
        } catch (err) {
            alert('Failed to create placement drive.');
        } finally {
            setCreating(false);
        }
    };

    const columns: Column<PlacementDrive>[] = [
        {
            header: 'Drive Name',
            cell: (row) => (
                <div>
                    <p className="font-semibold text-slate-900">{row.name}</p>
                    <p className="text-[10px] text-slate-400">ID: {row.id}</p>
                </div>
            ),
        },
        {
            header: 'Academic Year',
            accessorKey: 'academicYear',
        },
        {
            header: 'Duration',
            cell: (row) => (
                <span className="text-slate-600 font-mono text-[11px]">
                    {new Date(row.startDate).toLocaleDateString()} - {new Date(row.endDate).toLocaleDateString()}
                </span>
            ),
        },
        {
            header: 'Status',
            cell: (row) => (
                <StatusBadge status={row.isActive ? 'ACTIVE' : 'WITHDRAWN'} label={row.isActive ? 'Active' : 'Closed'} />
            ),
        },
        {
            header: 'Resources Registered',
            cell: (row) => (
                <div className="flex items-center gap-3 text-slate-500 text-[11px]">
                    <span className="flex items-center gap-1" title="Companies">
                        <Building2 className="w-3.5 h-3.5" />
                        {row._count?.companies ?? 0}
                    </span>
                    <span className="flex items-center gap-1" title="Rooms">
                        <DoorOpen className="w-3.5 h-3.5" />
                        {row._count?.rooms ?? 0}
                    </span>
                </div>
            ),
        },
        {
            header: 'Action',
            cell: (row) => (
                <a
                    href={`/schedules/${row.id}`}
                    className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-700 font-medium text-xs"
                >
                    <span>Open Workspace</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                </a>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-bold text-slate-900">Placement Drives</h1>
                    <p className="text-xs text-slate-500">Manage university placement drives and top-level schedule bounds.</p>
                </div>
                <Button icon={Plus} onClick={() => setIsModalOpen(true)}>
                    Create Placement Drive
                </Button>
            </div>

            <DataTable columns={columns} data={drives} loading={loading} emptyMessage="No placement drives found." />

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Create New Placement Drive"
                description="Establish a top-level drive boundary for companies, rooms, and panels."
            >
                <form onSubmit={handleCreate} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                            Drive Name
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. 2026 Campus Placement Drive"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full border border-surface-border rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-brand-600"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                            Academic Year
                        </label>
                        <input
                            type="text"
                            required
                            value={academicYear}
                            onChange={(e) => setAcademicYear(e.target.value)}
                            className="w-full border border-surface-border rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-brand-600"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                                Start Date
                            </label>
                            <input
                                type="datetime-local"
                                required
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full border border-surface-border rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-brand-600"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                                End Date
                            </label>
                            <input
                                type="datetime-local"
                                required
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full border border-surface-border rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-brand-600"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" loading={creating}>
                            Create Drive
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};