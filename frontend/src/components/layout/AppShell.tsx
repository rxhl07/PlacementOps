import React from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types/domain';
import {
    LayoutDashboard,
    CalendarDays,
    Users,
    Building2,
    DoorOpen,
    Sliders,
    CalendarCheck,
    RefreshCw,
    Bell,
    FileText,
    LogOut,
    User as UserIcon,
} from 'lucide-react';

export const AppShell: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const getNavItems = () => {
        if (!user) return [];

        switch (user.role) {
            case Role.ADMIN:
                return [
                    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
                    { label: 'Placement Drives', path: '/drives', icon: CalendarDays },
                    { label: 'User Management', path: '/users', icon: Users },
                    { label: 'Audit Logs', path: '/audit-logs', icon: FileText },
                ];

            case Role.COORDINATOR:
                return [
                    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
                    { label: 'Placement Drives', path: '/drives', icon: CalendarDays },
                    { label: 'Students', path: '/students', icon: Users },
                    { label: 'Companies', path: '/companies', icon: Building2 },
                    { label: 'Rooms', path: '/rooms', icon: DoorOpen },
                    { label: 'Panels', path: '/panels', icon: Sliders },
                    { label: 'Schedules', path: '/schedules', icon: CalendarCheck },
                    { label: 'Replanning Engine', path: '/replans', icon: RefreshCw },
                    { label: 'Notifications', path: '/notifications', icon: Bell },
                    { label: 'Audit Logs', path: '/audit-logs', icon: FileText },
                ];

            case Role.STUDENT:
                return [
                    { label: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
                    { label: 'My Schedule', path: '/student/schedule', icon: CalendarCheck },
                    { label: 'Notifications', path: '/notifications', icon: Bell },
                    { label: 'My Profile', path: '/profile', icon: UserIcon },
                ];

            case Role.COMPANY_COORDINATOR:
                return [
                    { label: 'Dashboard', path: '/company/dashboard', icon: LayoutDashboard },
                    { label: 'Company Schedule', path: '/company/schedule', icon: CalendarCheck },
                    { label: 'Notifications', path: '/notifications', icon: Bell },
                ];

            default:
                return [];
        }
    };

    const navItems = getNavItems();
    const activePathLabel = location.pathname.split('/').pop() || 'Dashboard';

    return (
        <div className="min-h-screen bg-surface-background flex flex-col md:flex-row">
            {/* Sidebar Navigation */}
            <aside className="w-full md:w-64 bg-white border-r border-surface-border flex flex-col shrink-0">
                {/* App Title Header */}
                <div className="h-14 px-5 border-b border-surface-border flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-md bg-brand-600 text-white font-bold text-xs flex items-center justify-center">
                            P
                        </div>
                        <span className="font-bold text-sm text-slate-900 tracking-tight">PlacementOps</span>
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                        {user?.role}
                    </span>
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${isActive
                                        ? 'bg-brand-50 text-brand-600 border border-brand-100 font-semibold'
                                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                    }`
                                }
                            >
                                <Icon className="w-4 h-4 shrink-0" />
                                <span>{item.label}</span>
                            </NavLink>
                        );
                    })}
                </nav>

                {/* User Footer Account Info */}
                <div className="p-3 border-t border-surface-border">
                    <div className="p-2.5 rounded-lg bg-surface-background border border-surface-border flex items-center justify-between">
                        <div className="min-w-0 pr-2">
                            <p className="text-xs font-semibold text-slate-900 truncate">
                                {user?.student?.name || user?.email.split('@')[0]}
                            </p>
                            <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            title="Sign Out"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Viewport */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Minimal Top Bar */}
                <header className="h-14 bg-white border-b border-surface-border px-6 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>PlacementOps</span>
                        <span>/</span>
                        <span className="font-semibold text-slate-900 capitalize">
                            {activePathLabel}
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/notifications')}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg relative transition-colors"
                        >
                            <Bell className="w-4 h-4" />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-600 rounded-full" />
                        </button>
                    </div>
                </header>

                {/* Main Route Workspace */}
                <main className="flex-1 overflow-y-auto p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};