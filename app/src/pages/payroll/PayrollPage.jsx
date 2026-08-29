/**
 * Payroll Page
 * Path: src/pages/payroll/PayrollPage.jsx
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Search,
  MoreVertical,
  CheckCircle,
  Clock,
  Download,
  Calendar,
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function PayrollPage() {
  const [payrolls, setPayrolls] = useState([]);
  const [filteredPayrolls, setFilteredPayrolls] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [monthFilter, setMonthFilter] = useState(getCurrentMonth());
  const [totalPaid, setTotalPaid] = useState(0);

  function getCurrentMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  useEffect(() => {
    fetchPayrolls();
  }, [monthFilter]);

  useEffect(() => {
    filterPayrolls();
  }, [payrolls, searchTerm]);

  const fetchPayrolls = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/payroll?month=${monthFilter}`);
      if (response.data.success) {
        setPayrolls(response.data.data);
      }
    } catch (error) {
      console.error('Fetch payrolls error:', error);
      toast.error('Không thể tải bảng lương');
      // Mock data for development
      setPayrolls([
        {
          id: 1,
          employeeId: 1,
          employeeName: 'Nguyễn Văn A',
          position: 'Quản lý',
          baseSalary: 10000000,
          allowances: 1000000,
          deductions: 500000,
          netSalary: 10500000,
          status: 'paid',
          paidDate: '2024-08-28',
          month: '2024-08',
        },
        {
          id: 2,
          employeeId: 2,
          employeeName: 'Trần Thị B',
          position: 'Phó quản lý',
          baseSalary: 8000000,
          allowances: 800000,
          deductions: 400000,
          netSalary: 8400000,
          status: 'processing',
          paidDate: null,
          month: '2024-08',
        },
        {
          id: 3,
          employeeId: 3,
          employeeName: 'Lê Văn C',
          position: 'Kỹ thuật viên',
          baseSalary: 6000000,
          allowances: 500000,
          deductions: 300000,
          netSalary: 6200000,
          status: 'paid',
          paidDate: '2024-08-28',
          month: '2024-08',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const filterPayrolls = () => {
    let filtered = payrolls;

    if (searchTerm) {
      filtered = filtered.filter((p) =>
        p.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.position.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredPayrolls(filtered);

    const total = filtered
      .filter((p) => p.status === 'paid')
      .reduce((sum, p) => sum + p.netSalary, 0);
    setTotalPaid(total);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid':
        return <CheckCircle size={18} className="text-green-600" />;
      case 'processing':
        return <Clock size={18} className="text-blue-600" />;
      case 'pending':
        return <Clock size={18} className="text-yellow-600" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      paid: 'Đã thanh toán',
      processing: 'Đang xử lý',
      pending: 'Chờ xử lý',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bảng Lương</h1>
          <p className="text-gray-600 mt-1">Quản lý bảng lương nhân viên</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Download size={18} />
          Xuất Excel
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm mb-1">Tổng Nhân Viên</p>
          <p className="text-2xl font-bold text-gray-900">{payrolls.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm mb-1">Đã Thanh Toán</p>
          <p className="text-2xl font-bold text-green-600">
            {(totalPaid / 1000000).toFixed(1)}M đ
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm mb-1">Trạng Thái Xử Lý</p>
          <p className="text-2xl font-bold text-blue-600">
            {payrolls.filter((p) => p.status !== 'paid').length}/{payrolls.length}
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

          <input
            type="month"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="input-field"
          />
        </div>
      </div>

      {/* Payroll Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-2">Đang tải bảng lương...</p>
          </div>
        ) : filteredPayrolls.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="mx-auto text-gray-400 mb-3" size={32} />
            <p className="text-gray-600">Không tìm thấy dữ liệu bảng lương</p>
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
                    Chức Vụ
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase">
                    Lương Cơ Bản
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase">
                    Phụ Cấp
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase">
                    Giảm Trừ
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase">
                    Lương Ròng
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
                {filteredPayrolls.map((payroll) => (
                  <tr key={payroll.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Link
                        to={`/payroll/${payroll.id}`}
                        className="font-medium text-blue-600 hover:text-blue-700"
                      >
                        {payroll.employeeName}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {payroll.position}
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-medium text-gray-900">
                      {(payroll.baseSalary / 1000000).toFixed(1)}M đ
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-medium text-green-600">
                      +{(payroll.allowances / 1000000).toFixed(1)}M đ
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-medium text-red-600">
                      -{(payroll.deductions / 1000000).toFixed(1)}M đ
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-bold text-gray-900">
                      {(payroll.netSalary / 1000000).toFixed(1)}M đ
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(payroll.status)}
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            payroll.status
                          )}`}
                        >
                          {getStatusLabel(payroll.status)}
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
