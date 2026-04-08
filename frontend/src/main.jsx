import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import AppLayout from '@/components/layouts/AppLayout';

// Pages
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/auth/LoginPage';
import RegisterOwnerPage from '@/pages/auth/RegisterOwnerPage';
import DashboardPage from '@/pages/dashboard/DashboardPage';
import StudentsPage from '@/pages/students/StudentsPage';
import StudentFormPage from '@/pages/students/StudentFormPage';
import StudentViewPage from '@/pages/students/StudentViewPage';
import AssignBoardingPage from '@/pages/students/AssignBoardingPage';
import FindBoardingPage from '@/pages/students/FindBoardingPage';
import StudentBoardingDetailPage from '@/pages/students/StudentBoardingDetailPage';
import InquiriesPage from '@/pages/owners/InquiriesPage';
import AllInquiriesPage from '@/pages/owners/AllInquiriesPage';
import BoardingHousesPage from '@/pages/boarding-houses/BoardingHousesPage';
import BoardingHouseFormPage from '@/pages/boarding-houses/BoardingHouseFormPage';
import BoardingHouseViewPage from '@/pages/boarding-houses/BoardingHouseViewPage';
import RoomsPage from '@/pages/boarding-houses/RoomsPage';
import MapPage from '@/pages/boarding-houses/MapPage';
import OwnersPage from '@/pages/owners/OwnersPage';
import OwnerFormPage from '@/pages/owners/OwnerFormPage';
import StudentsReportPage from '@/pages/reports/StudentsReportPage';
import BoardingReportPage from '@/pages/reports/BoardingReportPage';
import OccupancyReportPage from '@/pages/reports/OccupancyReportPage';
import GeoReportPage from '@/pages/reports/GeoReportPage';

import './index.css';

function ProtectedRoute({ children }) {
    const { user } = useAuth();
    if (!user) return <Navigate to="/login" replace />;
    return children;
}

function AdminRoute({ children }) {
    const { user } = useAuth();
    if (!user) return <Navigate to="/login" replace />;
    if (user.role !== 'admin') return <Navigate to="/dashboard" replace />;
    return children;
}

function GuestRoute({ children }) {
    const { user } = useAuth();
    if (user) return <Navigate to="/dashboard" replace />;
    return children;
}

function App() {
    return (
        <BrowserRouter>
            <Toaster position="top-right" richColors closeButton />
            <Routes>
                {/* Public */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/find-boarding" element={<FindBoardingPage />} />
                <Route path="/find-boarding/:id" element={<StudentBoardingDetailPage />} />

                {/* Guest (redirect to dashboard if logged in) */}
                <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
                <Route path="/register-owner" element={<GuestRoute><RegisterOwnerPage /></GuestRoute>} />

                {/* Protected */}
                <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                    <Route path="dashboard" element={<DashboardPage />} />

                    {/* Students */}
                    <Route path="students" element={<StudentsPage />} />
                    <Route path="students/create" element={<StudentFormPage />} />
                    <Route path="students/:id/edit" element={<StudentFormPage />} />
                    <Route path="students/:id" element={<StudentViewPage />} />
                    <Route path="students/:id/assign" element={<AssignBoardingPage />} />

                    {/* Boarding Houses */}
                    <Route path="boarding-houses" element={<BoardingHousesPage />} />
                    <Route path="boarding-houses/create" element={<BoardingHouseFormPage />} />
                    <Route path="boarding-houses/:id/edit" element={<BoardingHouseFormPage />} />
                    <Route path="boarding-houses/:id" element={<BoardingHouseViewPage />} />
                    <Route path="boarding-houses/:id/rooms" element={<RoomsPage />} />
                    <Route path="boarding-houses/:id/inquiries" element={<InquiriesPage />} />
                    <Route path="boarding-houses/map" element={<MapPage />} />

                    {/* Inquiries (all) */}
                    <Route path="inquiries" element={<AllInquiriesPage />} />

                    {/* Owners — admin only */}
                    <Route path="owners" element={<AdminRoute><OwnersPage /></AdminRoute>} />
                    <Route path="owners/create" element={<AdminRoute><OwnerFormPage /></AdminRoute>} />
                    <Route path="owners/:id/edit" element={<AdminRoute><OwnerFormPage /></AdminRoute>} />

                    {/* Reports */}
                    <Route path="reports/students" element={<StudentsReportPage />} />
                    <Route path="reports/boarding-houses" element={<BoardingReportPage />} />
                    <Route path="reports/occupancy" element={<OccupancyReportPage />} />
                    <Route path="reports/geo" element={<GeoReportPage />} />
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

createRoot(document.getElementById('app')).render(
    <AuthProvider>
        <NotificationProvider>
            <App />
        </NotificationProvider>
    </AuthProvider>
);
