import { authFetch } from './auth';

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

export async function getNotifications(pageSize = 20, pageNumber = 1): Promise<Notification[]> {
    const response = await authFetch(`/api/notifications?pageSize=${pageSize}&pageNumber=${pageNumber}`);
    if (!response.ok) throw new Error('Failed to fetch notifications');
    return response.json();
}

export async function getUnreadCount(): Promise<number> {
    const response = await authFetch('/api/notifications/unread');
    if (!response.ok) throw new Error('Failed to fetch unread count');
    const data = await response.json();
    return data.unreadCount;
}

export async function markAsRead(notificationId: number): Promise<boolean> {
    const response = await authFetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST'
    });
    if (!response.ok) throw new Error('Failed to mark notification as read');
    const data = await response.json();
    return data.success;
}

export async function deleteNotification(notificationId: number): Promise<void> {
    const response = await authFetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete notification');
}
