/**
 * Employees Page
 * Path: src/pages/employees/EmployeesPage.jsx
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Plus,
  Search,
  MoreVertical,
  Mail,
  Phone,
  Briefcase,
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    filterEmployees();
  }, [employees, searchTerm, roleFilter]);

  const fetchEmployees = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/employees');
      if (response.data.success) {
        setEmployees(response.data.data);
      }
    } catch (error) {
      console.error('Fetch employees error:', error);
      toast.error('Không thể tải nhân viên');
      // Mock data for development
      setEmployees([
        {
          id: 1,
          fullName: 'Nguyễn Văn A',
          email: 'nguyenvana@example.com',
          phone: '0912345678',
          role: 'QL',
          position: 'Quản lý',
          department: 'Quản lý',
          status: 'active',
          joinDate: '2023-01-15',
        },
        {
          id: 2,
          fullName: 'Trần Thị B',
          email: 'thithb@example.com',
          phone: '0987654321',
          role: 'VP',
          position: 'Phó quản lý',
          department: 'Quản lý',
          status: 'active',
          joinDate: '2023-06-01',
        },
        {
          id: 3,
          fullName: 'Lê Văn C',
          email: 'levanc@example.com',
          phone: '0901234567',
          role: 'KT',
          position: 'Kỹ thuật viên',
          department: 'Kỹ thuật',
          status: 'active',
          joinDate: '2023-09-15',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const filterEmployees = () => {
    let filtered = employees;

    if (searchTerm) {
      filtered = filtered.filter(
        (e) =>
          e.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          e.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          e.phone.includes(searchTerm)
      );
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter((e) => e.role === roleFilter);
    }

    setFilteredEmployees(filtered);
  };

  const getRoleLabel = (role) => {
    const labels = {
      QL: 'Quản lý',
      VP: 'Phó quản lý',
      KT: 'Kỹ thuật viên',
    };
    return labels[role] || role;
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'QL':
        return 'bg-red-100 text-red-800';
      case 'VP':
        return 'bg-blue-100 text-blue-800';
      case 'KT':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    return status === 'active' ? 'text-green-600' : 'text-red-600';
  };

  const getStatusLabel = (status) => {
    return status === 'active' ? 'Đang làm việc' : 'Nghỉ việc';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nhân Viên</h1>
          <p className="text-gray-600 mt-1">Quản lý nhân viên và thông tin chi tiết</p>
        </div>
        <Link to="/employees/new" className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          Thêm Nhân Viên
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm mb-1">Tổng Nhân Viên</p>
          <p className="text-2xl font-bold text-gray-900">{employees.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm mb-1">Đang Làm Việc</p>
          <p className="text-2xl font-bold text-green-600">
            {employees.filter((e) => e.status === 'active').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm mb-1">Quản Lý</p>
          <p className="text-2xl font-bold text-blue-600">
            {employees.filter((e) => e.role === 'QL' || e.role === 'VP').length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Tìm kiếm nhân viên..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10 w-full"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="input-field"
          >
            <option value="all">Tất cả chức vụ</option>
            <option value="QL">Quản lý</option>
            <option value="VP">Phó quản lý</option>
            <option value="KT">Kỹ thuật viên</option>
          </select>
        </div>
      </div>

      {/* Employees Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <>
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-2/3 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </>
        ) : filteredEmployees.length === 0 ? (
          <div className="col-span-full p-12 text-center">
            <Users className="mx-auto text-gray-400 mb-3" size={32} />
            <p className="text-gray-600">Không tìm thấy nhân viên nào</p>
          </div>
        ) : (
          filteredEmployees.map((employee) => (
            <Link
              key={employee.id}
              to={`/employees/${employee.id}`}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 group"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600">
                    {employee.fullName}
                  </h3>
                  <p className="text-gray-600 text-sm">{employee.position}</p>
                </div>
                <button className="text-gray-400 hover:text-gray-600">
                  <MoreVertical size={18} />
                </button>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail size={16} />
                  {employee.email}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone size={16} />
                  {employee.phone}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Briefcase size={16} />
                  {employee.department}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(
                    employee.role
                  )}`}
                >
                  {getRoleLabel(employee.role)}
                </span>
                <span className={`text-xs font-medium ${getStatusColor(employee.status)}`}>
                  {getStatusLabel(employee.status)}
                </span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
