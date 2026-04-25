import React, { useState } from 'react';
import { Bell, Check, CheckCheck, Trash2, Mail, CheckCircle, XCircle, MessageCircle, UserPlus, Building2, ShieldCheck, ShieldX } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/AuthContext';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

function formatTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
}

function getNotificationPath(type, data, role) {
    switch (type) {
        case 'inquiry':
            if (role === 'admin') {
                return data?.inquiry_id
                    ? `/reservations?inquiry=${data.inquiry_id}`
                    : '/reservations';
            }
            // owner
            if (data?.boarding_house_id) {
                const base = `/boarding-houses/${data.boarding_house_id}/inquiries`;
                return data?.inquiry_id ? `${base}?inquiry=${data.inquiry_id}` : base;
            }
            return null;

        case 'reservation_approved':
        case 'reservation_declined':
        case 'reservation_contacted':
            return '/student-reservations';

        case 'account_approved':
        case 'account_rejected':
            return null;

        case 'new_account_registration':
        case 'new_student_registration':
            return '/accounts';

        case 'new_boarding_house':
            return '/boarding-houses';

        case 'boarding_house_approved':
        case 'boarding_house_rejected':
            return '/boarding-houses';

        default:
            return null;
    }
}

const NOTIFICATION_ICON_CONFIG = {
    inquiry:                   { icon: Mail,        color: 'bg-blue-100 text-blue-600' },
    reservation_approved:      { icon: CheckCircle, color: 'bg-green-100 text-green-600' },
    reservation_declined:      { icon: XCircle,     color: 'bg-red-100 text-red-600' },
    reservation_contacted:     { icon: MessageCircle, color: 'bg-yellow-100 text-yellow-600' },
    account_approved:          { icon: ShieldCheck, color: 'bg-green-100 text-green-600' },
    account_rejected:          { icon: ShieldX,     color: 'bg-red-100 text-red-600' },
    new_account_registration:  { icon: UserPlus,    color: 'bg-purple-100 text-purple-600' },
    new_student_registration:  { icon: UserPlus,    color: 'bg-purple-100 text-purple-600' },
    new_boarding_house:        { icon: Building2,   color: 'bg-orange-100 text-orange-600' },
    boarding_house_approved:   { icon: Building2,   color: 'bg-green-100 text-green-600' },
    boarding_house_rejected:   { icon: Building2,   color: 'bg-red-100 text-red-600' },
};

function NotificationItem({ notification, userRole, onMarkAsRead, onDelete, onNavigate }) {
    const config = NOTIFICATION_ICON_CONFIG[notification.type] ?? {
        icon: Bell,
        color: 'bg-slate-100 text-slate-600',
    };
    const Icon = config.icon;
    const navigatePath = getNotificationPath(notification.type, notification.data, userRole);

    return (
        <div
            className={cn(
                'p-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors cursor-pointer',
                !notification.is_read && 'bg-blue-50/50'
            )}
            onClick={() => {
                if (!notification.is_read) {
                    onMarkAsRead(notification.id);
                }
                if (navigatePath) {
                    onNavigate(navigatePath);
                }
            }}
        >
            <div className="flex items-start gap-3">
                <div className={cn('w-8 h-8 rounded-full flex items-center justify-center shrink-0', config.color)}>
                    <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                        <p className={cn('text-sm font-medium', !notification.is_read && 'text-blue-900')}>
                            {notification.title}
                        </p>
                        {!notification.is_read && (
                            <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                        )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{notification.message}</p>
                    <p className="text-xs text-slate-400 mt-1">{formatTimeAgo(notification.created_at)}</p>
                </div>
            </div>
            <div className="flex items-center justify-end gap-1 mt-2">
                {!notification.is_read && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={(e) => {
                            e.stopPropagation();
                            onMarkAsRead(notification.id);
                        }}
                    >
                        <Check className="h-3 w-3 mr-1" />
                        Mark read
                    </Button>
                )}
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(notification.id);
                    }}
                >
                    <Trash2 className="h-3 w-3" />
                </Button>
            </div>
        </div>
    );
}

export default function NotificationDropdown() {
    const { notifications, unreadCount, loading, markAsRead, markAllAsRead, deleteNotification } =
        useNotifications();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);

    const handleNavigate = (path) => {
        setOpen(false);
        navigate(path);
    };

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="relative h-8 w-8 p-0">
                    <Bell className="h-5 w-5 text-slate-500" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-medium">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0">
                <div className="flex items-center justify-between p-3 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm">Notifications</h3>
                        {unreadCount > 0 && (
                            <Badge variant="secondary" className="text-xs">
                                {unreadCount} new
                            </Badge>
                        )}
                    </div>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => markAllAsRead()}
                        >
                            <CheckCheck className="h-3 w-3 mr-1" />
                            Mark all read
                        </Button>
                    )}
                </div>

                <ScrollArea className="max-h-96">
                    {loading && notifications.length === 0 ? (
                        <div className="p-6 text-center text-sm text-slate-500">Loading...</div>
                    ) : notifications.length === 0 ? (
                        <div className="p-6 text-center">
                            <Bell className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                            <p className="text-sm text-slate-500">No notifications yet</p>
                        </div>
                    ) : (
                        notifications.map((notification) => (
                            <NotificationItem
                                key={notification.id}
                                notification={notification}
                                userRole={user?.role}
                                onMarkAsRead={markAsRead}
                                onDelete={deleteNotification}
                                onNavigate={handleNavigate}
                            />
                        ))
                    )}
                </ScrollArea>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
