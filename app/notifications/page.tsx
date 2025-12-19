'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Bell, 
  CheckCircle, 
  WarningCircle, 
  Info, 
  X,
  Funnel,
  MagnifyingGlass,
  Spinner
} from '@phosphor-icons/react';
import Link from 'next/link';
import { notificationsService } from '@/lib/api';
import { formatDateTime } from '@/lib/utils/format';

interface Notification {
  id: string;
  type: 'primary' | 'notification';
  category: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
  time: string;
  read: boolean;
  actionUrl?: string;
}

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<'primary' | 'notification'>('primary');
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filter === 'unread') {
        params.read = false;
      }
      
      const response = await notificationsService.getNotifications({
        type: activeTab,
        filter: filter === 'unread' ? 'unread' : undefined,
        search: searchQuery || undefined,
      });
      
      if (response.success && response.data) {
        // Map API response to Notification interface
        const mappedNotifications = (response.data.notifications || []).map((notif: any) => ({
          id: notif.id,
          type: notif.type || 'notification',
          category: notif.category || 'info',
          title: notif.title,
          message: notif.message,
          time: notif.createdAt ? formatDateTime(notif.createdAt) : notif.time || '',
          read: notif.read || false,
          actionUrl: notif.actionUrl,
        }));
        setNotifications(mappedNotifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, filter, searchQuery]);

  // Fetch notifications on mount and when filter/tab/search changes
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Handle mark as read
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const response = await notificationsService.markAsRead(notificationId);
      if (response.success) {
        // Update local state
        setNotifications(notifications.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        ));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const filteredNotifications = notifications.filter(notif => {
    const matchesTab = notif.type === activeTab;
    const matchesFilter = filter === 'all' || !notif.read;
    const matchesSearch = searchQuery === '' || 
      notif.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notif.message.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesTab && matchesFilter && matchesSearch;
  });

  const unreadCount = notifications.filter(n => n.type === activeTab && !n.read).length;
  const primaryUnreadCount = notifications.filter(n => n.type === 'primary' && !n.read).length;
  const notificationUnreadCount = notifications.filter(n => n.type === 'notification' && !n.read).length;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning':
        return <WarningCircle className="w-5 h-5 text-yellow-600" />;
      case 'error':
        return <WarningCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getCategoryBg = (category: string) => {
    switch (category) {
      case 'success':
        return 'bg-green-100';
      case 'warning':
        return 'bg-yellow-100';
      case 'error':
        return 'bg-red-100';
      default:
        return 'bg-blue-100';
    }
  };

  return (
    <div className="p-8 min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="w-full max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">Notifications</h1>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex gap-1 border-b-2 border-gray-200">
            <button
              onClick={() => setActiveTab('primary')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors relative ${
                activeTab === 'primary'
                  ? 'text-gray-900'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Primary
              {primaryUnreadCount > 0 && (
                <span className="px-2 py-0.5 bg-green-500 text-white text-xs font-semibold rounded-full">
                  {primaryUnreadCount}
                </span>
              )}
              {activeTab === 'primary' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-500" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('notification')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors relative ${
                activeTab === 'notification'
                  ? 'text-gray-900'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Notifications
              {notificationUnreadCount > 0 && (
                <span className="px-2 py-0.5 bg-green-500 text-white text-xs font-semibold rounded-full">
                  {notificationUnreadCount}
                </span>
              )}
              {activeTab === 'notification' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-500" />
              )}
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="mb-6 flex gap-4 items-center">
          <div className="flex-1 relative">
            <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-2 border-2 border-gray-200 focus:outline-none focus:border-green-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
              <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${
                filter === 'unread'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Funnel className="w-4 h-4" />
              Unread
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-white text-green-600 text-xs font-semibold rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white border-2 border-gray-200">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Spinner className="w-8 h-8 animate-spin text-green-600" />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <Bell className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No notifications</h3>
              <p className="text-sm text-gray-600">
                {filter === 'unread' 
                  ? "You're all caught up! No unread notifications."
                  : "You don't have any notifications in this category."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-6 hover:bg-gray-50 transition-colors ${
                    !notification.read ? 'bg-green-50/50' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 ${getCategoryBg(notification.category)} rounded-full flex items-center justify-center flex-shrink-0`}>
                      {getCategoryIcon(notification.category)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0 mt-2"></div>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">{notification.time}</span>
                        <div className="flex items-center gap-3">
                          {!notification.read && (
                            <button
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="text-xs text-gray-500 hover:text-gray-700 font-medium"
                            >
                              Mark as read
                            </button>
                          )}
                          {notification.actionUrl && (
                            <Link
                              href={notification.actionUrl}
                              className="text-xs text-green-600 hover:text-green-700 font-medium"
                            >
                              View details →
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

