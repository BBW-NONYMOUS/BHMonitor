import React from 'react';
import { Menu } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import NotificationDropdown from '@/components/NotificationDropdown';

export default function Navbar({ onMenuClick }) {
    const { user } = useAuth();

    return (
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-20">
            <button
                onClick={onMenuClick}
                className="lg:hidden text-slate-500 hover:text-slate-900"
                aria-label="Open menu"
            >
                <Menu className="h-5 w-5" />
            </button>

            <div className="hidden lg:block" />

            <div className="flex items-center gap-3">
                <NotificationDropdown />
                <span className="text-sm text-slate-500">
                    Welcome, <span className="font-medium text-slate-800">{user?.name}</span>
                </span>
                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
                    {user?.name?.charAt(0).toUpperCase()}
                </div>
            </div>
        </header>
    );
}
