import { useState, useEffect } from 'react';
import { Bell, Calendar, UserPlus, Star, X, Check } from 'lucide-react';
import { getNotifications, getUnreadCount, markAsRead, deleteNotification } from '../services/notifications';

interface Notification {
    id: number;
    type: 'SessionCreated' | 'JoinRequest' | 'Rating' | 'RequestAccepted' | 'RequestRejected';
    title: string;
    content: string;
    relatedSessionId?: number;
    relatedProfileId?: number;
    relatedRatingId?: number;
    createdAt: string;
    isRead: boolean;
}

interface NotificationCenterProps {
    isLoggedIn: boolean;
}

export default function NotificationCenter({ isLoggedIn }: NotificationCenterProps) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);

    const fetchNotifications = async () => {
        try {
            console.log('Fetching notifications...');
            const data = await getNotifications();
            console.log('Notifications fetched:', data);
            setNotifications(data);

            const count = await getUnreadCount();
            console.log('Unread count:', count);
            setUnreadCount(count);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    };

    useEffect(() => {
        if (!isLoggedIn) {
            setNotifications([]);
            setUnreadCount(0);
            return;
        }

        // Fetch immediately when logged in
        fetchNotifications();

        // Poll for new notifications every 10 seconds
        const interval = setInterval(fetchNotifications, 10000);
        return () => clearInterval(interval);
    }, [isLoggedIn]);

    const handleOpenDropdown = () => {
        setIsOpen(true);
        // Fetch latest when opening dropdown
        fetchNotifications();
    };

    const handleMarkAsRead = async (id: number) => {
        try {
            await markAsRead(id);
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, isRead: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await deleteNotification(id);
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch (error) {
            console.error('Failed to delete notification:', error);
        }
    };

    if (!isLoggedIn) return null;

    const getNotificationIcon = (type: Notification['type']) => {
        switch (type) {
            case 'SessionCreated':
                return <Calendar className="w-4 h-4 text-blue-600" />;
            case 'JoinRequest':
                return <UserPlus className="w-4 h-4 text-purple-600" />;
            case 'Rating':
                return <Star className="w-4 h-4 text-yellow-600" />;
            case 'RequestAccepted':
                return <Check className="w-4 h-4 text-green-600" />;
            case 'RequestRejected':
                return <X className="w-4 h-4 text-red-600" />;
            default:
                return <Bell className="w-4 h-4 text-gray-600" />;
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="relative">
            <button
                onClick={() => handleOpenDropdown()}
                className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Notifications"
            >
                <Bell className="w-6 h-6 text-gray-700" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                    <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                        <h3 className="font-semibold text-gray-900">Notifications</h3>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {notifications.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 text-sm">
                            No notifications yet
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200">
                            {notifications.map(notif => (
                                <div
                                    key={notif.id}
                                    className={`p-4 hover:bg-gray-50 transition-colors ${!notif.isRead ? 'bg-blue-50' : ''}`}
                                >
                                    <div className="flex items-start gap-3">
                                        <span className="text-lg shrink-0">
                                            {getNotificationIcon(notif.type)}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm ${!notif.isRead ? 'font-semibold' : 'font-medium'} text-gray-900`}>
                                                {notif.title}
                                            </p>
                                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                                {notif.content}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-2">
                                                {formatDate(notif.createdAt)}
                                            </p>
                                        </div>
                                        <div className="flex gap-1 shrink-0">
                                            {!notif.isRead && (
                                                <button
                                                    onClick={() => handleMarkAsRead(notif.id)}
                                                    className="text-gray-400 hover:text-blue-600 p-1"
                                                    title="Mark as read"
                                                >
                                                    <Check className="w-4 h-4" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDelete(notif.id)}
                                                className="text-gray-400 hover:text-red-600 p-1"
                                                title="Delete"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
