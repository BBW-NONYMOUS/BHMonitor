import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { cn } from '@/lib/utils';
import api from '@/services/api';
import {
    LayoutDashboard, Users, Building2, Map, UserCog,
    FileText, LogOut, X, Home, Search, BookOpen, GraduationCap,
    ShieldCheck, Database, Settings2
} from 'lucide-react';
import { toast } from 'sonner';

const navItems = [
    // Admin / Owner
    { to: '/dashboard',         label: 'Dashboard',      icon: LayoutDashboard, roles: ['admin', 'owner'] },
    { to: '/students',          label: 'Students',        icon: Users,           roles: ['admin', 'owner'] },
    { to: '/boarding-houses',   label: 'Boarding Houses', icon: Building2,       roles: ['admin', 'owner'] },
    { to: '/boarding-houses/map', label: 'Map View',      icon: Map,             roles: ['admin', 'owner'] },
    { to: '/reservations',      label: 'Reservations',    icon: BookOpen,        roles: ['owner'], showBadge: true },
    { to: '/owners',            label: 'Owners',          icon: UserCog,         roles: ['admin'] },
    { to: '/accounts',          label: 'Accounts',        icon: ShieldCheck,     roles: ['admin', 'owner'], showAccountBadge: true },
    {
        label: 'Reports', icon: FileText, roles: ['admin', 'owner'],
        children: [
            { to: '/reports/students',       label: 'Students' },
            { to: '/reports/boarding-houses', label: 'Boarding Houses' },
            { to: '/reports/occupancy',       label: 'Occupancy' },
            { to: '/reports/geo',             label: 'Geo Report' },
        ]
    },
    { to: '/backup', label: 'Backup & Restore', icon: Database, roles: ['admin'] },
    { to: '/settings', label: 'Settings', icon: Settings2, roles: ['admin', 'owner'] },
    // Student
    { to: '/student-dashboard', label: 'My Dashboard', icon: GraduationCap, roles: ['student'] },
    { to: '/student-reservations', label: 'My Reservations', icon: BookOpen, roles: ['student'] },
    { to: '/student-documents', label: 'My Documents',  icon: FileText,      roles: ['student'] },
    { to: '/student-settings', label: 'Settings', icon: Settings2, roles: ['student'] },
];

export default function Sidebar({ open, onClose }) {
    const { user, logout } = useAuth();
    const { unreadCount } = useNotifications();
    const navigate = useNavigate();
    const [pendingAccounts, setPendingAccounts] = useState(0);
    const [pendingReservations, setPendingReservations] = useState(0);

    // Poll pending account count for admin/owner
    useEffect(() => {
        if (!['admin', 'owner'].includes(user?.role)) return;
        const fetchCount = () => {
            api.get('/accounts/pending-count')
               .then(r => setPendingAccounts(r.data.pending_accounts || 0))
               .catch(() => {});
        };
        fetchCount();
        const interval = setInterval(fetchCount, 60000);
        return () => clearInterval(interval);
    }, [user?.role]);

    // Poll pending reservation count for owner
    useEffect(() => {
        if (user?.role !== 'owner') return;
        const fetchReservations = () => {
            api.get('/reservations/counts')
               .then(r => setPendingReservations(r.data.pending || 0))
               .catch(() => {});
        };
        fetchReservations();
        const interval = setInterval(fetchReservations, 30000);
        return () => clearInterval(interval);
    }, [user?.role]);

    const handleLogout = async () => {
        await logout();
        toast.success('Logged out successfully.');
        navigate('/login');
    };

    const filtered = navItems.filter(item => !item.roles || item.roles.includes(user?.role));

    return (
        <>
            {/* Mobile overlay */}
            {open && (
                <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={onClose} />
            )}

            <aside className={cn(
                'fixed top-0 left-0 z-40 flex h-full w-[85vw] max-w-64 flex-col bg-slate-900 text-slate-100 transition-transform duration-300',
                open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
            )}>
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-5 border-b border-slate-700">
                    <div className="flex items-center gap-2">
                        <Home className="h-6 w-6 text-blue-400" />
                        <div>
                            <p className="text-sm font-bold leading-tight text-white">Boarders</p>
                            <p className="text-xs text-slate-400">Monitoring System</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Nav */}
                <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
                    {filtered.map((item) => {
                        if (item.children) {
                            return (
                                <div key={item.label}>
                                    <div className="flex items-center gap-2 px-3 py-2 text-xs uppercase tracking-wider text-slate-400 font-semibold mt-2">
                                        <item.icon className="h-4 w-4" />
                                        {item.label}
                                    </div>
                                    <div className="ml-2 space-y-0.5">
                                        {item.children.map(child => (
                                            <NavLink
                                                key={child.to}
                                                to={child.to}
                                                onClick={onClose}
                                                className={({ isActive }) => cn(
                                                    'block rounded-md px-4 py-2 text-sm transition-colors',
                                                    isActive
                                                        ? 'bg-blue-600 text-white'
                                                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                                )}
                                            >
                                                {child.label}
                                            </NavLink>
                                        ))}
                                    </div>
                                </div>
                            );
                        }

                        return (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                onClick={onClose}
                                className={({ isActive }) => cn(
                                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                                    isActive
                                        ? 'bg-blue-600 text-white'
                                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                )}
                            >
                                <item.icon className="h-4 w-4 shrink-0" />
                                {item.label}
                                {item.showBadge && pendingReservations > 0 && (
                                    <span className="ml-auto bg-red-500 text-white text-xs font-medium px-1.5 py-0.5 rounded-full">
                                        {pendingReservations > 9 ? '9+' : pendingReservations}
                                    </span>
                                )}
                                {item.showAccountBadge && pendingAccounts > 0 && (
                                    <span className="ml-auto bg-amber-500 text-white text-xs font-medium px-1.5 py-0.5 rounded-full">
                                        {pendingAccounts > 9 ? '9+' : pendingAccounts}
                                    </span>
                                )}
                            </NavLink>
                        );
                    })}

                    {/* Public Finder */}
                    {user?.role !== 'owner' && (
                        <NavLink
                            to="/find-boarding"
                            target="_blank"
                            rel="noopener"
                            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
                        >
                            <Search className="h-4 w-4 shrink-0" />
                            Find Boarding
                        </NavLink>
                    )}
                </nav>

                {/* User */}
                <div className="border-t border-slate-700 p-4">
                    <div className="flex items-center gap-3 mb-3">
                        {user?.profile_photo_url ? (
                            <img
                                src={user.profile_photo_url}
                                alt={user.name}
                                className="h-8 w-8 rounded-full object-cover ring-2 ring-blue-500"
                            />
                        ) : (
                            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
                                {user?.name?.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                            <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-300 hover:bg-red-600 hover:text-white transition-colors"
                    >
                        <LogOut className="h-4 w-4" />
                        Logout
                    </button>
                </div>
            </aside>
        </>
    );
}
