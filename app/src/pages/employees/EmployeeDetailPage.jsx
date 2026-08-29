/**
 * Employee Detail Page
 * Path: src/pages/employees/EmployeeDetailPage.jsx
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit2,
  Mail,
  Phone,
  Briefcase,
  Calendar,
  Shield,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import Button from '../../components/common/Button';
import employeeService from '../../services/employeeService';
import toast from 'react-hot-toast';

export default function EmployeeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchEmployee();
  }, [id]);

  const fetchEmployee = async () => {
    try {
      setIsLoading(true);
      const response = await employeeService.getById(id);
      setEmployee(response.data);
    } catch (error) {
      toast.error('Không thể tải thông tin nhân viên');
      // Mock data
      setEmployee({
        id: parseInt(id),
        fullName: 'Nguyễn Văn A',
        email: 'nguyenvana@example.com',
        phone: '0912345678',
        role: 'QL',
        position: 'Quản lý',
        department: 'Quản lý',
        salary: 10000000,
        status: 'active',
        joinDate: '2023-01-15',
        address: '123 Đường ABC, Quận 2, TP HCM',
        avatar: null,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleBadge = (role) => {
    const badges = {
      QL: { bg: 'bg-red-100', text: 'text-red-800', label: 'Quản Lý' },
      VP: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Phó Quản Lý' },
      KT: { bg: 'bg-green-100', text: 'text-green-800', label: 'Kỹ Thuật' },
    };
    return badges[role] || badges.KT;
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle, label: 'Đang Làm' },
      inactive: { bg: 'bg-gray-100', text: 'text-gray-800', icon: AlertCircle, label: 'Nghỉ Việc' },
      onleave: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: AlertCircle, label: 'Đang Nghỉ' },
    };
    return badges[status] || badges.active;
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

  if (!employee) {
    return <div className="text-center py-12">Không tìm thấy nhân viên</div>;
  }

  const roleBadge = getRoleBadge(employee.role);
  const statusBadge = getStatusBadge(employee.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <button
        onClick={() => navigate('/employees')}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
      >
        <ArrowLeft size={20} />
        Quay lại
      </button>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile */}
        <div className="lg:col-span-2 space-y-6">
          {/* Employee Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{employee.fullName}</h1>
                <p className="text-gray-600 mt-1">{employee.position}</p>
              </div>
              <div
                className={`px-4 py-2 rounded-full text-sm font-medium ${statusBadge.bg} ${statusBadge.text}`}
              >
                {statusBadge.label}
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-4 py-6 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Thông Tin Liên Hệ</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail size={18} className="text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <a href={`mailto:${employee.email}`} className="font-medium text-blue-600 hover:text-blue-700">
                      {employee.email}
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone size={18} className="text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Điện Thoại</p>
                    <a href={`tel:${employee.phone}`} className="font-medium text-gray-900">
                      {employee.phone}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Work Info */}
            <div className="space-y-4 py-6 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Thông Tin Công Việc</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 text-gray-600 mb-2">
                    <Briefcase size={16} />
                    Phòng Ban
                  </div>
                  <p className="font-semibold text-gray-900">{employee.department}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-gray-600 mb-2">
                    <Shield size={16} />
                    Vai Trò
                  </div>
                  <p className={`font-semibold px-3 py-1 rounded-full text-sm w-fit ${roleBadge.bg} ${roleBadge.text}`}>
                    {roleBadge.label}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-gray-600 mb-2">
                    <Calendar size={16} />
                    Ngày Vào Làm
                  </div>
                  <p className="font-semibold text-gray-900">
                    {new Date(employee.joinDate).toLocaleDateString('vi-VN')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">Lương Cơ Bản</p>
                  <p className="font-bold text-green-600">
                    {(employee.salary / 1000000).toFixed(1)}M đ
                  </p>
                </div>
              </div>
            </div>

            {/* Address */}
            {employee.address && (
              <div className="py-4">
                <p className="text-sm text-gray-600 mb-2">Địa Chỉ</p>
                <p className="text-gray-900">{employee.address}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Actions */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-bold text-gray-900 mb-4">Hành Động</h3>
            <div className="space-y-3">
              <Button
                variant="outline"
                fullWidth
                icon={Edit2}
                onClick={() => navigate(`/employees/${employee.id}/edit`)}
              >
                Chỉnh Sửa Thông Tin
              </Button>
              <Button
                variant="outline"
                fullWidth
                onClick={() => navigate(`/payroll/employee/${employee.id}`)}
              >
                Xem Bảng Lương
              </Button>
              <Button
                variant="outline"
                fullWidth
                onClick={() => navigate(`/tasks?assignedTo=${employee.id}`)}
              >
                Xem Công Việc
              </Button>
            </div>
          </div>

          {/* Status Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-bold text-gray-900 mb-4">Trạng Thái</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    employee.status === 'active' ? 'bg-green-600' : 'bg-gray-400'
                  }`}
                ></div>
                <span className="text-sm text-gray-600">
                  {employee.status === 'active'
                    ? 'Đang làm việc'
                    : employee.status === 'onleave'
                      ? 'Đang nghỉ phép'
                      : 'Đã nghỉ việc'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-3 text-sm">Thông Tin Nhanh</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-700">Mã NV:</span>
                <span className="font-semibold text-blue-900">#{employee.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Vai Trò:</span>
                <span className="font-semibold text-blue-900">{roleBadge.label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Phòng Ban:</span>
                <span className="font-semibold text-blue-900">{employee.department}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
