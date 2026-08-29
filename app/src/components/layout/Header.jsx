/**
 * Header Component
 * Path: src/components/layout/Header.jsx
 *
 * - Nút Telegram: mở thẳng nhóm công ty (link cấu hình trong Cài Đặt)
 * - Tự đăng ký thông báo đẩy Web Push sau khi đăng nhập (cần HTTPS)
 */

import { useState, useEffect } from 'react';
import { Menu, Bell, Search, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import api from '../../services/api';

// Chuyển VAPID public key (base64url) → Uint8Array cho subscribe
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

async function registerPush() {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    if (Notification.permission === 'denied') return;
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      if (Notification.permission !== 'granted') {
        const perm = await Notification.requestPermission();
        if (perm !== 'granted') return;
      }
      const keyRes = await api.get('/push/key');
      const key = keyRes.data.data.key;
      if (!key) return;
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key),
      });
    }
    await api.post('/push/subscribe', { subscription: sub.toJSON() });
  } catch { /* im lặng — push là tiện ích, không được làm hỏng app */ }
}

export default function Header({ onMenuClick }) {
  const { user } = useAuthStore();
  const [telegramLink, setTelegramLink] = useState('');

  useEffect(() => {
    api.get('/push/app-config')
      .then((res) => setTelegramLink(res.data.data.telegram_group_link || ''))
      .catch(() => {});
    // Đăng ký push sau 3 giây (để app tải xong, không hỏi quyền dồn dập lúc mở)
    const t = setTimeout(registerPush, 3000);
    return () => clearTimeout(t);
  }, []);

  return (
    <header className="bg-white shadow-sm sticky top-0 z-40">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        {/* Menu button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-gray-100 rounded"
        >
          <Menu size={24} />
        </button>

        {/* Search bar */}
        <div className="hidden md:flex flex-1 mx-4">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Telegram nhóm công ty */}
          {telegramLink && telegramLink.startsWith('http') && (
            <a
              href={telegramLink}
              target="_blank"
              rel="noreferrer"
              title="Mở nhóm Telegram công ty"
              className="p-2 text-sky-500 hover:bg-sky-50 rounded-lg transition-colors"
            >
              <Send size={20} />
            </a>
          )}

          {/* Notifications */}
          <Link
            to="/notifications"
            className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </Link>

          {/* User avatar */}
          <div className="flex items-center gap-3 ml-1">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{user?.full_name}</p>
              <p className="text-xs text-gray-500">
                {user?.role === 'QL' ? 'Quản lý' : user?.role === 'VP' ? 'Văn phòng' : 'Kỹ thuật'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
