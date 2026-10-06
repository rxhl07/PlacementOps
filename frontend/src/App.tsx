import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute, RoleGuard } from './components/auth/Guards';
import { AppShell } from './components/layout/AppShell';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { LoginPage } from './pages/auth/LoginPage';
import { Role } from './types/domain';

import { DrivesPage } from './pages/drives/DrivesPage';
import { StudentsPage } from './pages/students/StudentsPage';
import { CompaniesPage } from './pages/companies/CompaniesPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { ConflictsPage } from './pages/schedules/ConflictsPage';
import { ReplanningPage } from './pages/replanning/ReplanningPage';
import { StudentDashboard } from './pages/students/StudentDashboard';
import { CompanyDashboard } from './pages/companies/CompanyDashboard';
import { NotificationsPage } from './pages/notifications/NotificationsPage';
import { AuditLogsPage } from './pages/audit/AuditLogsPage';
import { UsersPage } from './pages/admin/UsersPage';
import { NotFoundPage } from './pages/errors/NotFoundPage';

const DashboardPlaceholder = () => (
    <div className="p-6 bg-white border border-surface-border rounded-xl shadow-subtle">
        <h2 className="text-base font-bold text-slate-900">PlacementOps Workspace</h2>
        <p className="text-xs text-slate-500 mt-1">Operational view & KPI metrics loading...</p>
    </div>
);

const DashboardRedirect = () => {
    const { user } = useAuth();
    if (user?.role === Role.STUDENT) {
        return <Navigate to="/student/dashboard" replace />;
    }
    if (user?.role === Role.COMPANY_COORDINATOR) {
        return <Navigate to="/company/dashboard" replace />;
    }
    return <DashboardPage />;
};

const UnauthorizedPage = () => (
    <div className="min-h-screen bg-surface-background flex flex-col items-center justify-center p-4">
        <div className="bg-white border border-surface-border rounded-xl p-8 max-w-md w-full text-center space-y-4 shadow-subtle">
            <h1 className="text-lg font-bold text-slate-900">403 - Forbidden Access</h1>
            <p className="text-xs text-slate-500">You do not have required role permissions to view this resource.</p>
            <a href="/dashboard" className="inline-block text-xs font-semibold text-brand-600 hover:underline">
                Return to Dashboard
            </a>
        </div>
    </div>
);

export function App() {
    return (
        <ErrorBoundary>
            <BrowserRouter>
                <AuthProvider>
                    <Routes>
                        {/* Public Auth Routes */}
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/unauthorized" element={<UnauthorizedPage />} />

                        {/* Authenticated Application Shell */}
                        <Route element={<ProtectedRoute />}>
                            <Route element={<AppShell />}>
                                {/* Smart Dashboard Route */}
                                <Route path="/dashboard" element={<DashboardRedirect />} />

                                {/* Notifications & Audit Logs (Accessible to Coordinators/Admins) */}
                                <Route path="/notifications" element={<NotificationsPage />} />
                                <Route path="/audit-logs" element={<AuditLogsPage />} />

                                {/* Coordinator / Admin Protected Routes */}
                                <Route element={<RoleGuard allowedRoles={[Role.COORDINATOR, Role.ADMIN]} />}>
                                    <Route path="/drives" element={<DrivesPage />} />
                                    <Route path="/students" element={<StudentsPage />} />
                                    <Route path="/companies" element={<CompaniesPage />} />
                                    <Route path="/rooms" element={<DashboardPlaceholder />} />
                                    <Route path="/panels" element={<DashboardPlaceholder />} />
                                    <Route path="/schedules" element={<DashboardPlaceholder />} />
                                    <Route path="/schedules/:driveId/conflicts" element={<ConflictsPage />} />
                                    <Route path="/replans" element={<ReplanningPage />} />
                                </Route>

                                {/* Admin-Only User Management Route */}
                                <Route element={<RoleGuard allowedRoles={[Role.ADMIN]} />}>
                                    <Route path="/users" element={<UsersPage />} />
                                </Route>

                                {/* Student Protected Routes */}
                                <Route element={<RoleGuard allowedRoles={[Role.STUDENT]} />}>
                                    <Route path="/student/dashboard" element={<StudentDashboard />} />
                                    <Route path="/student/schedule" element={<StudentDashboard />} />
                                </Route>

                                {/* Company Coordinator Protected Routes */}
                                <Route element={<RoleGuard allowedRoles={[Role.COMPANY_COORDINATOR]} />}>
                                    <Route path="/company/dashboard" element={<CompanyDashboard />} />
                                    <Route path="/company/schedule" element={<CompanyDashboard />} />
                                </Route>

                                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                            </Route>
                        </Route>

                        {/* Catch-all 404 Route */}
                        <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                </AuthProvider>
            </BrowserRouter>
        </ErrorBoundary>
    );
}

export default App;