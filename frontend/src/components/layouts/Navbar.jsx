import React from 'react';
import { Menu } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import NotificationDropdown from '@/components/NotificationDropdown';

export default function Navbar({ onMenuClick }) {
    const { user } = useAuth();

    return (
        <header className="sticky top-0 z-20 flex min-h-14 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 lg:px-6">
            <button
                onClick={onMenuClick}
                className="lg:hidden text-slate-500 hover:text-slate-900"
                aria-label="Open menu"
            >
                <Menu className="h-5 w-5" />
            </button>

            <div className="hidden lg:block" />

            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                <NotificationDropdown />
                <span className="hidden truncate text-sm text-slate-500 sm:block">
                    Welcome, <span className="font-medium text-slate-800">{user?.name}</span>
                </span>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                    {user?.name?.charAt(0).toUpperCase()}
                </div>
            </div>
        </header>
    );
}
