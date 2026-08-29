/**
 * Profile Page
 * Path: src/pages/settings/ProfilePage.jsx
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  Calendar,
  Briefcase,
  Edit2,
  Lock,
  LogOut,
} from 'lucide-react';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import employeeService from '../../services/employeeService';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      if (user) {
        const response = await employeeService.getById(user.employeeId);
        setProfile(response.data);
      }
    } catch (error) {
      // Mock profile if not loaded
      setProfile({
        id: user?.employeeId || 1,
        fullName: user?.name || 'Nguyễn Văn A',
        email: user?.email || 'nguyenvana@example.com',
        phone: '0912345678',
        position: 'Quản lý',
        department: 'Quản lý',
        role: 'QL',
        salary: 10000000,
        joinDate: '2023-01-15',
        avatar: null,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Đã đăng xuất thành công');
    navigate('/login');
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Hồ Sơ Cá Nhân</h1>
        <p className="text-gray-600 mt-1">Quản lý thông tin cá nhân và cài đặt tài khoản</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Profile Card */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6 space-y-6">
            {/* Profile Header */}
            <div className="flex items-start justify-between pb-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{profile?.fullName}</h2>
                <p className="text-gray-600">{profile?.position}</p>
              </div>
              <Button variant="outline" icon={Edit2} size="sm">
                Chỉnh Sửa
              </Button>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông Tin Liên Hệ</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="text-gray-400" size={18} />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium text-gray-900">{profile?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="text-gray-400" size={18} />
                  <div>
                    <p className="text-sm text-gray-600">Điện Thoại</p>
                    <p className="font-medium text-gray-900">{profile?.phone}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Work Information */}
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông Tin Công Việc</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Briefcase className="text-gray-400" size={18} />
                  <div>
                    <p className="text-sm text-gray-600">Phòng Ban</p>
                    <p className="font-medium text-gray-900">{profile?.department}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="text-gray-400" size={18} />
                  <div>
                    <p className="text-sm text-gray-600">Ngày Vào Làm</p>
                    <p className="font-medium text-gray-900">
                      {profile?.joinDate ? new Date(profile.joinDate).toLocaleDateString('vi-VN') : '-'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Account Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-bold text-gray-900 mb-4">Tài Khoản</h3>
            <div className="space-y-3">
              <Button
                variant="outline"
                fullWidth
                icon={Lock}
                onClick={() => navigate('/settings/change-password')}
              >
                Đổi Mật Khẩu
              </Button>
              <Button
                variant="danger"
                fullWidth
                icon={LogOut}
                onClick={() => setShowLogoutModal(true)}
              >
                Đăng Xuất
              </Button>
            </div>
          </div>

          {/* Quick Info */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-3 text-sm">Thông Tin Tài Khoản</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-700">Vai Trò:</span>
                <span className="font-semibold text-blue-900">{profile?.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Mã NV:</span>
                <span className="font-semibold text-blue-900">#{profile?.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Trạng Thái:</span>
                <span className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                  Hoạt Động
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Logout Modal */}
      <Modal
        isOpen={showLogoutModal}
        title="Đăng Xuất"
        onClose={() => setShowLogoutModal(false)}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setShowLogoutModal(false)}
            >
              Hủy
            </Button>
            <Button
              variant="danger"
              onClick={handleLogout}
            >
              Đăng Xuất
            </Button>
          </>
        }
      >
        <p className="text-gray-600">
          Bạn có chắc chắn muốn đăng xuất khỏi tài khoản này không?
        </p>
      </Modal>
    </div>
  );
}
