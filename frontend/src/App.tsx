import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, RoleGuard } from './components/auth/Guards';
import { AppShell } from './components/layout/AppShell';
import { LoginPage } from './pages/auth/LoginPage';
import { Role } from './types/domain';

// Import Phase 4 Operational Management Pages
import { DrivesPage } from './pages/drives/DrivesPage';
import { StudentsPage } from './pages/students/StudentsPage';
import { CompaniesPage } from './pages/companies/CompaniesPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { ConflictsPage } from './pages/schedules/ConflictsPage';
import { ReplanningPage } from './pages/replanning/ReplanningPage';

const DashboardPlaceholder = () => (
    <div className="p-6 bg-white border border-surface-border rounded-xl shadow-subtle">
        <h2 className="text-base font-bold text-slate-900">PlacementOps Workspace</h2>
        <p className="text-xs text-slate-500 mt-1">Operational view & KPI metrics loading...</p>
    </div>
);

const UnauthorizedPage = () => (
    <div className="min-h-screen bg-surface-background flex flex-col items-center justify-center p-4">
        <h1 className="text-lg font-bold text-slate-900">403 - Unauthorized Access</h1>
        <p className="text-xs text-slate-500 mt-1 mb-4">You do not have permissions to access this view.</p>
        <a href="/dashboard" className="text-xs font-semibold text-brand-600 hover:underline">
            Return to Dashboard
        </a>
    </div>
);

export function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/unauthorized" element={<UnauthorizedPage />} />

                    {/* Authenticated Application Shell */}
                    <Route element={<ProtectedRoute />}>
                        <Route element={<AppShell />}>
                            <Route path="/dashboard" element={<DashboardPage />} />

                            {/* Coordinator / Admin Protected Routes */}
                            <Route element={<RoleGuard allowedRoles={[Role.COORDINATOR, Role.ADMIN]} />}>
                                <Route path="/drives" element={<DrivesPage />} />
                                <Route path="/students" element={<StudentsPage />} />
                                <Route path="/companies" element={<CompaniesPage />} />
                                <Route path="/rooms" element={<DashboardPlaceholder />} />
                                <Route path="/panels" element={<DashboardPlaceholder />} />
                                <Route path="/schedules" element={<DashboardPlaceholder />} />
                                <Route path="/audit-logs" element={<DashboardPlaceholder />} />
                                <Route path="/schedules/:driveId/conflicts" element={<ConflictsPage />} />
                                <Route path="/replans" element={<ReplanningPage />} />
                            </Route>

                            {/* Student Protected Routes */}
                            <Route element={<RoleGuard allowedRoles={[Role.STUDENT]} />}>
                                <Route path="/student/dashboard" element={<DashboardPlaceholder />} />
                                <Route path="/student/schedule" element={<DashboardPlaceholder />} />
                            </Route>

                            <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        </Route>
                    </Route>

                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;