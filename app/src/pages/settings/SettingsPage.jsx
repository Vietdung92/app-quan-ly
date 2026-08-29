/**
 * Settings Page
 * Path: src/pages/settings/SettingsPage.jsx
 */

import { useState, useEffect } from 'react';
import {
  Bell,
  Lock,
  Eye,
  Database,
  Users,
  FileText,
  CheckCircle,
} from 'lucide-react';
import Button from '../../components/common/Button';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../stores/authStore';
import api from '../../services/api';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [captionTpl, setCaptionTpl] = useState('');
  useEffect(() => {
    if (['QL', 'VP'].includes(user?.role)) {
      api.get('/tasks/config/photo-caption')
        .then((res) => setCaptionTpl(res.data.data.value))
        .catch(() => {});
    }
  }, [user]);
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    weeklyReport: true,
    twoFactorAuth: false,
    publicProfile: false,
    dataExport: false,
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = (key) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success('Cài đặt đã được lưu');
    } catch (error) {
      toast.error('Không thể lưu cài đặt');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Cài Đặt</h1>
        <p className="text-gray-600 mt-1">Quản lý cài đặt tài khoản và thông báo của bạn</p>
      </div>

      <div className="max-w-2xl">
        {/* Mẫu chú thích ảnh Telegram (QL/VP) */}
        {['QL', 'VP'].includes(user?.role) && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Mẫu Chú Thích Ảnh Telegram</h2>
            <p className="text-sm text-gray-500 mb-3">
              Khi nhân viên gửi ảnh công việc, Telegram nhận chú thích theo mẫu này.
              Biến tự thay: <code className="bg-gray-100 px-1 rounded">{'{task}'}</code>{' '}
              <code className="bg-gray-100 px-1 rounded">{'{employee}'}</code>{' '}
              <code className="bg-gray-100 px-1 rounded">{'{note}'}</code>{' '}
              <code className="bg-gray-100 px-1 rounded">{'{date}'}</code>
            </p>
            <textarea
              value={captionTpl}
              onChange={(e) => setCaptionTpl(e.target.value)}
              className="input-field"
              rows={3}
            />
            <button
              onClick={async () => {
                try {
                  await api.put('/tasks/config/photo-caption', { value: captionTpl });
                  toast.success('Đã lưu mẫu chú thích');
                } catch (error) {
                  toast.error(error.response?.data?.error || 'Không thể lưu');
                }
              }}
              className="btn-primary mt-3"
            >
              Lưu Mẫu
            </button>
          </div>
        )}

        {/* Notifications Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-200">
            <Bell size={20} className="text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Thông Báo</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="font-medium text-gray-900">Thông báo qua Email</p>
                <p className="text-sm text-gray-600">Nhận thông báo qua email khi có sự kiện mới</p>
              </div>
              <button
                onClick={() => handleToggle('emailNotifications')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                  settings.emailNotifications ? 'bg-green-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    settings.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="font-medium text-gray-900">Thông báo Push</p>
                <p className="text-sm text-gray-600">Nhận thông báo trên trình duyệt</p>
              </div>
              <button
                onClick={() => handleToggle('pushNotifications')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                  settings.pushNotifications ? 'bg-green-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    settings.pushNotifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="font-medium text-gray-900">Báo cáo hàng tuần</p>
                <p className="text-sm text-gray-600">Nhận báo cáo hoạt động hàng tuần</p>
              </div>
              <button
                onClick={() => handleToggle('weeklyReport')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                  settings.weeklyReport ? 'bg-green-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    settings.weeklyReport ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Security Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-200">
            <Lock size={20} className="text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Bảo Mật</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="font-medium text-gray-900">Xác thực hai yếu tố (2FA)</p>
                <p className="text-sm text-gray-600">Tăng cường bảo mật cho tài khoản của bạn</p>
              </div>
              <button
                onClick={() => handleToggle('twoFactorAuth')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                  settings.twoFactorAuth ? 'bg-green-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    settings.twoFactorAuth ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Privacy Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-200">
            <Eye size={20} className="text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Quyền Riêng Tư</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="font-medium text-gray-900">Hồ sơ công khai</p>
                <p className="text-sm text-gray-600">Cho phép người khác xem hồ sơ của bạn</p>
              </div>
              <button
                onClick={() => handleToggle('publicProfile')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                  settings.publicProfile ? 'bg-green-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    settings.publicProfile ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Data Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-200">
            <Database size={20} className="text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Dữ Liệu</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="font-medium text-gray-900">Xuất dữ liệu cá nhân</p>
                <p className="text-sm text-gray-600">Tải xuống tất cả dữ liệu cá nhân của bạn</p>
              </div>
              <Button variant="outline" size="sm">
                Xuất
              </Button>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex gap-3">
          <Button
            variant="primary"
            loading={isSaving}
            onClick={handleSave}
          >
            Lưu Cài Đặt
          </Button>
          <Button
            variant="secondary"
            onClick={() => window.location.reload()}
          >
            Thoát
          </Button>
        </div>

        {/* Success Message */}
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <CheckCircle size={18} className="text-green-600" />
          <p className="text-sm text-green-700">
            Cài đặt của bạn đã được lưu thành công
          </p>
        </div>
      </div>
    </div>
  );
}
