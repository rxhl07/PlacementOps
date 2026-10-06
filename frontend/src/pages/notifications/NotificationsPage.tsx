import React, { useEffect, useState } from 'react';
import { apiClient } from '../../services/apiClient';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { Bell, CheckCircle2 } from 'lucide-react';

interface NotificationItem {
    id: string;
    title: string;
    message: string;
    type: 'SCHEDULE_CHANGE' | 'REPLAN_NOTICE' | 'DISRUPTION_ALERT';
    isRead: boolean;
    createdAt: string;
}

export const NotificationsPage: React.FC = () => {
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const res = await apiClient.get('/notifications');
            setNotifications(res.data.data || []);
        } catch (err) {
            console.warn('Failed to load notifications from server.');
            setNotifications([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const handleMarkAsRead = async (id: string) => {
        try {
            await apiClient.put(`/notifications/${id}/read`);
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
            );
        } catch (err) {
            console.error('Failed to mark notification as read', err);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-bold text-slate-900">Notifications Feed</h1>
                    <p className="text-xs text-slate-500">
                        System alerts, schedule shift notices, and automated BullMQ operational dispatches.
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchNotifications}>
                    Refresh Feed
                </Button>
            </div>

            {loading ? (
                <div className="bg-white border border-surface-border rounded-xl p-8 text-center text-xs text-slate-400 animate-pulse">
                    Loading notification feed...
                </div>
            ) : notifications.length > 0 ? (
                <div className="space-y-3">
                    {notifications.map((item) => (
                        <div
                            key={item.id}
                            className={`bg-white border rounded-xl p-4 shadow-subtle flex items-start justify-between gap-4 transition-colors ${item.isRead ? 'border-surface-border' : 'border-brand-200 bg-brand-50/20'
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-slate-100 text-slate-600 rounded-lg shrink-0 mt-0.5">
                                    <Bell className="w-4 h-4 text-brand-600" />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-xs font-bold text-slate-900">{item.title}</h3>
                                        <StatusBadge status={item.type} />
                                    </div>
                                    <p className="text-xs text-slate-600">{item.message}</p>
                                    <p className="text-[10px] text-slate-400 font-mono">
                                        {new Date(item.createdAt).toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            {!item.isRead && (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleMarkAsRead(item.id)}
                                >
                                    Mark Read
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white border border-surface-border rounded-xl p-12 text-center space-y-2 shadow-subtle">
                    <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto" />
                    <h3 className="text-xs font-bold text-slate-700">All Caught Up!</h3>
                    <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                        No unread operational notifications or schedule update alerts in your queue.
                    </p>
                </div>
            )}
        </div>
    );
};