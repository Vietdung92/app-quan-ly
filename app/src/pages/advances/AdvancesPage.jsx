/**
 * Advances Page
 * Path: src/pages/advances/AdvancesPage.jsx
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Plus,
  Search,
  MoreVertical,
  CheckCircle,
  Clock,
  AlertCircle,
  DollarSign,
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function AdvancesPage() {
  const [advances, setAdvances] = useState([]);
  const [filteredAdvances, setFilteredAdvances] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    fetchAdvances();
  }, []);

  useEffect(() => {
    filterAdvances();
  }, [advances, searchTerm, statusFilter]);

  const fetchAdvances = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/advances');
      if (response.data.success) {
        setAdvances(response.data.data);
      }
    } catch (error) {
      console.error('Fetch advances error:', error);
      toast.error('Không thể tải khoản vay');
      // Mock data for development
      setAdvances([
        {
          id: 1,
          employeeId: 1,
          employeeName: 'Nguyễn Văn A',
          amount: 5000000,
          reason: 'Nhu cầu cá nhân',
          status: 'approved',
          approvedBy: 'Quản lý',
          remainingBalance: 2000000,
          createdAt: '2024-08-15',
          approvedAt: '2024-08-16',
        },
        {
          id: 2,
          employeeId: 2,
          employeeName: 'Trần Thị B',
          amount: 3000000,
          reason: 'Mua sắm gia đình',
          status: 'pending',
          approvedBy: null,
          remainingBalance: 3000000,
          createdAt: '2024-08-28',
          approvedAt: null,
        },
        {
          id: 3,
          employeeId: 3,
          employeeName: 'Lê Văn C',
          amount: 2000000,
          reason: 'Chi phí y tế',
          status: 'completed',
          approvedBy: 'Quản lý',
          remainingBalance: 0,
          createdAt: '2024-07-01',
          approvedAt: '2024-07-02',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const filterAdvances = () => {
    let filtered = advances;

    if (searchTerm) {
      filtered = filtered.filter((a) =>
        a.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.reason.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((a) => a.status === statusFilter);
    }

    setFilteredAdvances(filtered);

    const total = filtered.reduce((sum, advance) => sum + advance.amount, 0);
    setTotalAmount(total);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle size={18} className="text-green-600" />;
      case 'pending':
        return <Clock size={18} className="text-blue-600" />;
      case 'rejected':
        return <AlertCircle size={18} className="text-red-600" />;
      case 'completed':
        return <CheckCircle size={18} className="text-gray-600" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      approved: 'Đã duyệt',
      pending: 'Chờ duyệt',
      rejected: 'Từ chối',
      completed: 'Hoàn thành',
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
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Khoản Vay Lương</h1>
          <p className="text-gray-600 mt-1">Quản lý và theo dõi khoản vay từ lương</p>
        </div>
        <Link to="/advances/request" className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          Xin Vay Lương
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm mb-1">Tổng Vay</p>
          <p className="text-2xl font-bold text-gray-900">
            {(totalAmount / 1000000).toFixed(1)}M đ
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm mb-1">Chờ Duyệt</p>
          <p className="text-2xl font-bold text-blue-600">
            {advances.filter((a) => a.status === 'pending').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm mb-1">Đã Duyệt</p>
          <p className="text-2xl font-bold text-green-600">
            {advances.filter((a) => a.status === 'approved' || a.status === 'completed').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm mb-1">Từ Chối</p>
          <p className="text-2xl font-bold text-red-600">
            {advances.filter((a) => a.status === 'rejected').length}
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
              placeholder="Tìm kiếm khoản vay..."
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
            <option value="completed">Hoàn thành</option>
            <option value="rejected">Từ chối</option>
          </select>
        </div>
      </div>

      {/* Advances Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-2">Đang tải khoản vay...</p>
          </div>
        ) : filteredAdvances.length === 0 ? (
          <div className="p-12 text-center">
            <TrendingUp className="mx-auto text-gray-400 mb-3" size={32} />
            <p className="text-gray-600">Không tìm thấy khoản vay nào</p>
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
                    Số Tiền Vay
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Còn Lại
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Lý Do
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Ngày
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
                {filteredAdvances.map((advance) => (
                  <tr key={advance.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600">
                          {advance.employeeName.charAt(0)}
                        </div>
                        <span className="font-medium text-gray-900">
                          {advance.employeeName}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {(advance.amount / 1000000).toFixed(1)}M đ
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="font-medium text-gray-900">
                          {(advance.remainingBalance / 1000000).toFixed(1)}M đ
                        </p>
                        {advance.remainingBalance > 0 && (
                          <div className="w-24 bg-gray-200 rounded-full h-1.5 mt-1">
                            <div
                              className="bg-blue-600 h-1.5 rounded-full"
                              style={{
                                width: `${
                                  (advance.remainingBalance / advance.amount) * 100
                                }%`,
                              }}
                            ></div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {advance.reason}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(advance.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(advance.status)}
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            advance.status
                          )}`}
                        >
                          {getStatusLabel(advance.status)}
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
