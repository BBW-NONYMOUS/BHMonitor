import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function AppLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen overflow-x-hidden bg-slate-50">
            <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Main content - offset for sidebar on desktop */}
            <div className="lg:ml-64 flex flex-col min-h-screen">
                <Navbar onMenuClick={() => setSidebarOpen(true)} />
                <main className="flex-1 px-4 py-4 sm:px-5 lg:px-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
