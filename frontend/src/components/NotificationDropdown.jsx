import React, { useState } from 'react';
import { Bell, Check, CheckCheck, Trash2, X, Mail, ExternalLink } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
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

function NotificationItem({ notification, onMarkAsRead, onDelete, onNavigate }) {
    const isInquiry = notification.type === 'inquiry';

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
                if (isInquiry && notification.data?.boarding_house_id) {
                    onNavigate(`/owner/boarding-houses/${notification.data.boarding_house_id}/inquiries`);
                }
            }}
        >
            <div className="flex items-start gap-3">
                <div
                    className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                        isInquiry ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'
                    )}
                >
                    {isInquiry ? <Mail className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                        <p className={cn('text-sm font-medium', !notification.is_read && 'text-blue-900')}>
                            {notification.title}
                        </p>
                        {!notification.is_read && (
                            <span className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0" />
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
    const { notifications, unreadCount, loading, markAsRead, markAllAsRead, deleteNotification, fetchNotifications } =
        useNotifications();
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

                <ScrollArea className="max-h-[400px]">
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
