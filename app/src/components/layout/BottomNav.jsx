/**
 * Bottom Navigation - thanh điều hướng đáy màn hình cho điện thoại
 * Path: src/components/layout/BottomNav.jsx
 *
 * Chỉ hiện trên màn hình nhỏ (ẩn từ md trở lên).
 * 5 mục chính theo tần suất dùng hằng ngày.
 */

import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { BarChart3, Wallet, Building2, CheckSquare, User, DollarSign, Wrench } from 'lucide-react';

const MANAGER_ITEMS = [
  { path: '/', label: 'Tổng quan', icon: BarChart3 },
  { path: '/funds', label: 'Thu Chi', icon: Wallet },
  { path: '/apartments', label: 'Căn Hộ', icon: Building2 },
  { path: '/tasks', label: 'Việc', icon: CheckSquare },
  { path: '/profile', label: 'Cá nhân', icon: User },
];

// Kỹ thuật: chỉ những gì liên quan trực tiếp công việc của họ
const KT_ITEMS = [
  { path: '/', label: 'Tổng quan', icon: BarChart3 },
  { path: '/tasks', label: 'Việc', icon: CheckSquare },
  { path: '/expenses', label: 'Chi Phí', icon: DollarSign },
  { path: '/repairs', label: 'Báo Hỏng', icon: Wrench },
  { path: '/profile', label: 'Cá nhân', icon: User },
];

export default function BottomNav() {
  const location = useLocation();
  const { user } = useAuthStore();
  const NAV_ITEMS = ['QL', 'VP'].includes(user?.role) ? MANAGER_ITEMS : KT_ITEMS;

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-[0_-2px_8px_rgba(0,0,0,0.06)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="grid grid-cols-5">
        {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
          const active = isActive(path);
          return (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] ${
                active ? 'text-blue-600' : 'text-gray-500'
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.4 : 1.9} />
              <span className={`text-[11px] leading-tight ${active ? 'font-semibold' : 'font-medium'}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
