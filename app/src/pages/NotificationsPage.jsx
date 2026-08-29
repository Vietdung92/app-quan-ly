/**
 * Notifications Page
 * Path: src/pages/NotificationsPage.jsx
 */

import { useState, useEffect } from 'react';
import {
  Bell,
  Trash2,
  CheckCircle,
  AlertCircle,
  Info,
  Mail,
  CheckSquare,
  DollarSign,
  Calendar,
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/notifications?filter=${filter}`);
      if (response.data.success) {
        setNotifications(response.data.data);
      }
    } catch (error) {
      console.error('Fetch notifications error:', error);
      toast.error('Không thể tải thông báo');
      // Mock data for development
      setNotifications([
        {
          id: 1,
          type: 'success',
          title: 'Dự án hoàn thành',
          message: 'Dự án "Thi công nội thất quận 2" đã hoàn thành',
          date: '2024-08-28T10:30:00',
          read: false,
          icon: CheckCircle,
        },
        {
          id: 2,
          type: 'info',
          title: 'Thông báo mới',
          message: 'Bảng lương tháng 8 đã được cập nhật',
          date: '2024-08-27T14:20:00',
          read: false,
          icon: Mail,
        },
        {
          id: 3,
          type: 'warning',
          title: 'Cảnh báo',
          message: 'Chi phí vượt quá ngân sách dự án',
          date: '2024-08-26T09:15:00',
          read: true,
          icon: AlertCircle,
        },
        {
          id: 4,
          type: 'success',
          title: 'Đơn phê duyệt',
          message: 'Đơn xin nghỉ phép của bạn đã được phê duyệt',
          date: '2024-08-25T16:45:00',
          read: true,
          icon: CheckSquare,
        },
        {
          id: 5,
          type: 'info',
          title: 'Thông báo hệ thống',
          message: 'Hệ thống sẽ bảo trì vào ngày mai',
          date: '2024-08-24T11:00:00',
          read: true,
          icon: Info,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error('Mark as read error:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      toast.success('Đã xóa thông báo');
    } catch (error) {
      console.error('Delete notification error:', error);
      toast.error('Không thể xóa thông báo');
    }
  };

  const handleDeleteAll = async () => {
    try {
      await api.delete('/notifications');
      setNotifications([]);
      toast.success('Đã xóa tất cả thông báo');
    } catch (error) {
      console.error('Delete all notifications error:', error);
      toast.error('Không thể xóa thông báo');
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="text-green-600" size={20} />;
      case 'warning':
        return <AlertCircle className="text-yellow-600" size={20} />;
      case 'error':
        return <AlertCircle className="text-red-600" size={20} />;
      case 'info':
      default:
        return <Info className="text-blue-600" size={20} />;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins}p trước`;
    if (diffHours < 24) return `${diffHours}h trước`;
    if (diffDays < 7) return `${diffDays}d trước`;
    return date.toLocaleDateString('vi-VN');
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Thông Báo</h1>
          <p className="text-gray-600 mt-1">
            Quản lý thông báo của bạn ({unreadCount} chưa đọc)
          </p>
        </div>
        {notifications.length > 0 && (
          <button
            onClick={handleDeleteAll}
            className="btn-secondary flex items-center gap-2"
          >
            <Trash2 size={18} />
            Xóa Tất Cả
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="flex border-b border-gray-200">
          {['all', 'unread', 'success', 'info', 'warning'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                filter === f
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {f === 'all'
                ? 'Tất Cả'
                : f === 'unread'
                  ? 'Chưa Đọc'
                  : f === 'success'
                    ? 'Thành Công'
                    : f === 'info'
                      ? 'Thông Tin'
                      : 'Cảnh Báo'}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-2">Đang tải thông báo...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Bell className="mx-auto text-gray-400 mb-3" size={32} />
            <p className="text-gray-600">Không có thông báo nào</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-white rounded-lg shadow p-4 border-l-4 transition-all ${
                !notification.read
                  ? 'border-l-blue-600 bg-gradient-to-r from-blue-50'
                  : 'border-l-gray-200'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="mt-1">
                  {getTypeIcon(notification.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3
                        className={`font-medium ${
                          notification.read
                            ? 'text-gray-900'
                            : 'text-blue-900 font-semibold'
                        }`}
                      >
                        {notification.title}
                      </h3>
                      <p className="text-gray-600 text-sm mt-1">
                        {notification.message}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <span className="text-xs text-gray-500">
                        {formatDate(notification.date)}
                      </span>

                      {!notification.read && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="ml-2 p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
                          title="Đánh dấu đã đọc"
                        >
                          <CheckCircle size={16} />
                        </button>
                      )}

                      <button
                        onClick={() => handleDelete(notification.id)}
                        className="p-1 hover:bg-red-100 rounded text-gray-400 hover:text-red-600"
                        title="Xóa thông báo"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
