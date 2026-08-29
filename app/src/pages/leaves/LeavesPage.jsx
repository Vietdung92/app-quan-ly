/**
 * Leaves Page
 * Path: src/pages/leaves/LeavesPage.jsx
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Plus,
  Search,
  MoreVertical,
  CheckCircle,
  Clock,
  AlertCircle,
  User,
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function LeavesPage() {
  const [leaves, setLeaves] = useState([]);
  const [filteredLeaves, setFilteredLeaves] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchLeaves();
  }, []);

  useEffect(() => {
    filterLeaves();
  }, [leaves, searchTerm, statusFilter]);

  const fetchLeaves = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/leaves');
      if (response.data.success) {
        setLeaves(response.data.data);
      }
    } catch (error) {
      console.error('Fetch leaves error:', error);
      toast.error('Không thể tải đơn nghỉ phép');
      // Mock data for development
      setLeaves([
        {
          id: 1,
          employeeId: 1,
          employeeName: 'Nguyễn Văn A',
          type: 'annual',
          reason: 'Nghỉ phép hàng năm',
          startDate: '2024-09-10',
          endDate: '2024-09-12',
          days: 3,
          status: 'pending',
          createdAt: '2024-08-28',
        },
        {
          id: 2,
          employeeId: 2,
          employeeName: 'Trần Thị B',
          type: 'sick',
          reason: 'Nghỉ ốm',
          startDate: '2024-08-27',
          endDate: '2024-08-28',
          days: 2,
          status: 'approved',
          createdAt: '2024-08-27',
        },
        {
          id: 3,
          employeeId: 3,
          employeeName: 'Lê Văn C',
          type: 'unpaid',
          reason: 'Nghỉ không hưởng lương',
          startDate: '2024-09-20',
          endDate: '2024-09-25',
          days: 6,
          status: 'rejected',
          createdAt: '2024-08-25',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const filterLeaves = () => {
    let filtered = leaves;

    if (searchTerm) {
      filtered = filtered.filter((l) =>
        l.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.reason.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((l) => l.status === statusFilter);
    }

    setFilteredLeaves(filtered);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle size={18} className="text-green-600" />;
      case 'pending':
        return <Clock size={18} className="text-blue-600" />;
      case 'rejected':
        return <AlertCircle size={18} className="text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      approved: 'Đã duyệt',
      pending: 'Chờ duyệt',
      rejected: 'Từ chối',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getLeaveTypeLabel = (type) => {
    const labels = {
      annual: 'Phép hàng năm',
      sick: 'Nghỉ ốm',
      personal: 'Nghỉ cá nhân',
      unpaid: 'Nghỉ không lương',
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Đơn Nghỉ Phép</h1>
          <p className="text-gray-600 mt-1">Quản lý đơn nghỉ phép của nhân viên</p>
        </div>
        <Link to="/leaves/request" className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          Xin Nghỉ Phép
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm mb-1">Tổng Đơn</p>
          <p className="text-2xl font-bold text-gray-900">{leaves.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm mb-1">Chờ Duyệt</p>
          <p className="text-2xl font-bold text-blue-600">
            {leaves.filter((l) => l.status === 'pending').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm mb-1">Đã Duyệt</p>
          <p className="text-2xl font-bold text-green-600">
            {leaves.filter((l) => l.status === 'approved').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm mb-1">Từ Chối</p>
          <p className="text-2xl font-bold text-red-600">
            {leaves.filter((l) => l.status === 'rejected').length}
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
              placeholder="Tìm kiếm đơn nghỉ phép..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10 w-full"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="pending">Chờ duyệt</option>
            <option value="approved">Đã duyệt</option>
            <option value="rejected">Từ chối</option>
          </select>
        </div>
      </div>

      {/* Leaves Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-2">Đang tải đơn nghỉ phép...</p>
          </div>
        ) : filteredLeaves.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="mx-auto text-gray-400 mb-3" size={32} />
            <p className="text-gray-600">Không tìm thấy đơn nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Nhân Viên
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Loại Phép
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Ngày Từ - Đến
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Số Ngày
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Lý Do
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Trạng Thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Hành Động
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredLeaves.map((leave) => (
                  <tr key={leave.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600">
                          {leave.employeeName.charAt(0)}
                        </div>
                        <span className="font-medium text-gray-900">
                          {leave.employeeName}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {getLeaveTypeLabel(leave.type)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(leave.startDate).toLocaleDateString('vi-VN')} -{' '}
                      {new Date(leave.endDate).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      {leave.days} ngày
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {leave.reason}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(leave.status)}
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            leave.status
                          )}`}
                        >
                          {getStatusLabel(leave.status)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-gray-400 hover:text-gray-600">
                        <MoreVertical size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
