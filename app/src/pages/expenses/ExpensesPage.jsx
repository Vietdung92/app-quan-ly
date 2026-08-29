/**
 * Expenses Page
 * Path: src/pages/expenses/ExpensesPage.jsx
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  Plus,
  Search,
  Filter,
  MoreVertical,
  CheckCircle,
  Clock,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    fetchExpenses();
  }, []);

  useEffect(() => {
    filterExpenses();
  }, [expenses, searchTerm, statusFilter]);

  const fetchExpenses = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/expenses');
      if (response.data.success) {
        setExpenses(response.data.data);
      }
    } catch (error) {
      console.error('Fetch expenses error:', error);
      toast.error('Không thể tải chi phí');
      // Mock data for development
      setExpenses([
        {
          id: 1,
          name: 'Vật liệu xây dựng',
          description: 'Gạch, xi măng, cát',
          amount: 5000000,
          status: 'approved',
          category: 'materials',
          date: '2024-08-28',
          approvedBy: 'Quản lý',
        },
        {
          id: 2,
          name: 'Tiền điện tháng 8',
          description: 'Chi phí điện cho 35 căn hộ',
          amount: 3500000,
          status: 'pending',
          category: 'utilities',
          date: '2024-08-25',
          approvedBy: null,
        },
        {
          id: 3,
          name: 'Sửa chữa đồ dùng',
          description: 'Sửa chữa nước nóng, tủ lạnh',
          amount: 2000000,
          status: 'rejected',
          category: 'maintenance',
          date: '2024-08-20',
          approvedBy: 'Quản lý',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const filterExpenses = () => {
    let filtered = expenses;

    if (searchTerm) {
      filtered = filtered.filter((e) =>
        e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((e) => e.status === statusFilter);
    }

    setFilteredExpenses(filtered);

    // Calculate total
    const total = filtered.reduce((sum, expense) => sum + expense.amount, 0);
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

  const getCategoryLabel = (category) => {
    const labels = {
      materials: 'Vật liệu',
      utilities: 'Tiện ích',
      maintenance: 'Bảo trì',
      salary: 'Lương',
      other: 'Khác',
    };
    return labels[category] || category;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Chi Phí</h1>
          <p className="text-gray-600 mt-1">Quản lý và theo dõi chi phí công ty</p>
        </div>
        <Link to="/expenses/new" className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          Thêm Chi Phí
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm mb-1">Tổng Chi Phí</p>
          <p className="text-2xl font-bold text-gray-900">
            {(totalAmount / 1000000).toFixed(1)}M đ
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm mb-1">Chờ Duyệt</p>
          <p className="text-2xl font-bold text-blue-600">
            {expenses.filter((e) => e.status === 'pending').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm mb-1">Đã Duyệt</p>
          <p className="text-2xl font-bold text-green-600">
            {expenses.filter((e) => e.status === 'approved').length}
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
              placeholder="Tìm kiếm chi phí..."
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

      {/* Expenses Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-2">Đang tải chi phí...</p>
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="p-12 text-center">
            <DollarSign className="mx-auto text-gray-400 mb-3" size={32} />
            <p className="text-gray-600">Không tìm thấy chi phí nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Tên Chi Phí
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Loại
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Số Tiền
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
                {filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Link
                        to={`/expenses/${expense.id}`}
                        className="font-medium text-blue-600 hover:text-blue-700"
                      >
                        {expense.name}
                      </Link>
                      <p className="text-gray-600 text-sm">{expense.description}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {getCategoryLabel(expense.category)}
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {(expense.amount / 1000000).toFixed(1)}M đ
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 flex items-center gap-2">
                      <Calendar size={16} />
                      {new Date(expense.date).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(expense.status)}
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            expense.status
                          )}`}
                        >
                          {getStatusLabel(expense.status)}
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
