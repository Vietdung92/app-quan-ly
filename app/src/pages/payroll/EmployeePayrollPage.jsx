/**
 * Employee Payroll History Page
 * Path: src/pages/payroll/EmployeePayrollPage.jsx
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, DollarSign, FileText, TrendingUp } from 'lucide-react';
import payrollService from '../../services/payrollService';
import employeeService from '../../services/employeeService';
import toast from 'react-hot-toast';

export default function EmployeePayrollPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [payrolls, setPayrolls] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setIsLoading(true);

    // Load employee info
    try {
      const empResponse = await employeeService.getById(id);
      setEmployee(empResponse.data);
    } catch (error) {
      setEmployee({
        id: parseInt(id),
        fullName: 'Nguyễn Văn A',
        position: 'Quản lý',
        salary: 10000000,
      });
    }

    // Load payroll history
    try {
      const response = await payrollService.getEmployeeHistory(id);
      setPayrolls(response.data || []);
    } catch (error) {
      toast.error('Không thể tải lịch sử bảng lương');
      // Mock data
      setPayrolls([
        {
          id: 1,
          month: '2024-08',
          baseSalary: 10000000,
          allowances: 1000000,
          deductions: 500000,
          advanceDeduction: 1000000,
          netSalary: 9500000,
          status: 'paid',
          paidDate: '2024-08-31',
        },
        {
          id: 2,
          month: '2024-07',
          baseSalary: 10000000,
          allowances: 1000000,
          deductions: 500000,
          advanceDeduction: 0,
          netSalary: 10500000,
          status: 'paid',
          paidDate: '2024-07-31',
        },
        {
          id: 3,
          month: '2024-06',
          baseSalary: 10000000,
          allowances: 500000,
          deductions: 500000,
          advanceDeduction: 0,
          netSalary: 10000000,
          status: 'paid',
          paidDate: '2024-06-30',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Nháp' },
      approved: { bg: 'bg-green-100', text: 'text-green-800', label: 'Đã duyệt' },
      processing: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Đang xử lý' },
      paid: { bg: 'bg-green-100', text: 'text-green-800', label: 'Đã thanh toán' },
    };
    return badges[status] || badges.draft;
  };

  const totalPaid = payrolls
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + p.netSalary, 0);
  const avgSalary = payrolls.length > 0 ? totalPaid / payrolls.filter((p) => p.status === 'paid').length : 0;

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
      <button
        onClick={() => navigate(`/employees/${id}`)}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
      >
        <ArrowLeft size={20} />
        Quay lại
      </button>

      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Lịch Sử Bảng Lương - {employee?.fullName}
        </h1>
        <p className="text-gray-600 mt-1">{employee?.position}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
            <DollarSign size={16} />
            Lương Cơ Bản Hiện Tại
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {employee?.salary ? (employee.salary / 1000000).toFixed(1) : '-'}M đ
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
            <FileText size={16} />
            Số Kỳ Lương
          </div>
          <p className="text-2xl font-bold text-blue-600">{payrolls.length} kỳ</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
            <TrendingUp size={16} />
            Lương Ròng Trung Bình
          </div>
          <p className="text-2xl font-bold text-green-600">
            {avgSalary ? (avgSalary / 1000000).toFixed(1) : '-'}M đ
          </p>
        </div>
      </div>

      {/* Payroll Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {payrolls.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="mx-auto text-gray-400 mb-3" size={32} />
            <p className="text-gray-600">Chưa có bảng lương nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Tháng
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase">
                    Lương Cơ Bản
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase">
                    Phụ Cấp
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase">
                    Khấu Trừ
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase">
                    Lương Ròng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Trạng Thái
                  </th>
                </tr>
              </thead>
              <tbody>
                {payrolls.map((payroll) => {
                  const badge = getStatusBadge(payroll.status);
                  const totalDeductions =
                    payroll.deductions + (payroll.advanceDeduction || 0);
                  return (
                    <tr
                      key={payroll.id}
                      className="border-b border-gray-200 hover:bg-gray-50"
                    >
                      <td className="px-6 py-4">
                        <Link
                          to={`/payroll/${payroll.id}`}
                          className="font-medium text-blue-600 hover:text-blue-700"
                        >
                          Tháng {payroll.month?.split('-')[1]}/{payroll.month?.split('-')[0]}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-900">
                        {(payroll.baseSalary / 1000000).toFixed(1)}M đ
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-green-600">
                        +{(payroll.allowances / 1000000).toFixed(1)}M đ
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-red-600">
                        -{(totalDeductions / 1000000).toFixed(1)}M đ
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-gray-900">
                        {(payroll.netSalary / 1000000).toFixed(1)}M đ
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
