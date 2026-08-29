/**
 * Main Layout
 * Path: src/layouts/MainLayout.jsx
 *
 * Layout for authenticated pages
 */

import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import BottomNav from '../components/layout/BottomNav';
import { useState } from 'react';

export default function MainLayout() {
  // Desktop: mở sẵn; điện thoại: đóng (tránh màn che đen khi vừa vào app)
  const [sidebarOpen, setSidebarOpen] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );
  const location = useLocation();

  // Hide sidebar on certain pages
  const hideSidebar = ['/profile'].includes(location.pathname);

  return (
    <div className="flex h-screen bg-gray-100">
      {!hideSidebar && (
        <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 overflow-auto">
          <div className="container-main py-4 md:py-6">
            <Outlet />
          </div>
        </main>

        {/* Thanh điều hướng đáy - chỉ hiện trên điện thoại */}
        <BottomNav />
      </div>
    </div>
  );
}
