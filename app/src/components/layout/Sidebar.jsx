/**
 * Sidebar Component
 * Path: src/components/layout/Sidebar.jsx
 *
 * Navigation sidebar
 */

import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import {
  BarChart3,
  Wallet,
  Building2,
  FolderOpen,
  DollarSign,
  Users,
  Clock,
  CheckSquare,
  Calendar,
  TrendingUp,
  FileText,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  Globe,
  Receipt,
} from 'lucide-react';

const MENU_ITEMS = [
  { path: '/', label: 'Tổng Quan', icon: BarChart3 },
  { path: '/funds', label: 'Thu Chi Quỹ', icon: Wallet },
  { path: '/apartments', label: 'Căn Hộ', icon: Building2 },
  { path: '/residents', label: 'Tạm Trú', icon: Globe },
  { path: '/taxes', label: 'Thuế Hộ', icon: Receipt, roles: ['QL', 'VP'] },
  { path: '/projects', label: 'Dự Án', icon: FolderOpen },
  { path: '/expenses', label: 'Chi Phí', icon: DollarSign },
  { path: '/tasks', label: 'Công Việc', icon: CheckSquare },
  { path: '/attendance', label: 'Điểm Danh', icon: Clock, roles: ['QL', 'VP'] },
  { path: '/employees', label: 'Nhân Viên', icon: Users, roles: ['QL', 'VP'] },
  { path: '/leaves', label: 'Nghỉ Phép', icon: Calendar },
  { path: '/advances', label: 'Ứng Lương', icon: TrendingUp },
  { path: '/payroll', label: 'Bảng Lương', icon: FileText },
  { path: '/notifications', label: 'Thông Báo', icon: Bell },
];

export default function Sidebar({ open, onToggle }) {
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const filteredMenuItems = MENU_ITEMS.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(user?.role);
  });

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 lg:hidden z-40"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 bg-gray-900 text-white transform transition-transform
          ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          lg:translate-x-0
        `}
      >
        <div className="flex flex-col h-screen">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-700">
            <h1 className="text-xl font-bold">Quản Lý</h1>
            <button
              onClick={onToggle}
              className="lg:hidden p-2 hover:bg-gray-800 rounded"
            >
              <X size={20} />
            </button>
          </div>

          {/* Menu */}
          <nav className="flex-1 overflow-y-auto px-2 py-4">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    flex items-center gap-3 px-4 py-2 rounded-lg transition-colors
                    ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-800'
                    }
                  `}
                  onClick={() => { if (open && window.innerWidth < 1024) onToggle(); }}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="border-t border-gray-700 p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                {user?.full_name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.full_name}</p>
                <p className="text-xs text-gray-400 truncate">{user?.email}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Link
                to="/settings"
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors"
              >
                <Settings size={18} />
                <span className="hidden sm:inline">Settings</span>
              </Link>
              <button
                onClick={logout}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-gray-300 hover:bg-red-600 hover:text-white transition-colors"
              >
                <LogOut size={18} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
