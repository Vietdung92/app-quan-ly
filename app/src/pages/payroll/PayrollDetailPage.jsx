/**
 * Payroll Detail Page
 * Path: src/pages/payroll/PayrollDetailPage.jsx
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  CheckCircle,
  Clock,
  DollarSign,
  User,
  Briefcase,
} from 'lucide-react';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import payrollService from '../../services/payrollService';
import toast from 'react-hot-toast';

export default function PayrollDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [payroll, setPayroll] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchPayroll();
  }, [id]);

  const fetchPayroll = async () => {
    try {
      setIsLoading(true);
      const response = await payrollService.getById(id);
      setPayroll(response.data);
    } catch (error) {
      toast.error('Không thể tải bảng lương');
      // Mock data
      setPayroll({
        id: parseInt(id),
        employeeId: 1,
        employeeName: 'Nguyễn Văn A',
        position: 'Quản lý',
        baseSalary: 10000000,
        allowances: 1000000,
        deductions: 500000,
        advanceDeduction: 1000000,
        netSalary: 8500000,
        status: 'processing',
        paidDate: null,
        month: '2024-08',
        createdAt: '2024-08-28',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      await payrollService.approve(id);
      toast.success('Bảng lương đã được phê duyệt');
      setPayroll((prev) => ({ ...prev, status: 'approved' }));
      setShowActionModal(false);
    } catch (error) {
      toast.error('Không thể phê duyệt bảng lương');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProcess = async () => {
    setIsProcessing(true);
    try {
      await payrollService.process(id);
      toast.success('Bảng lương đang được xử lý');
      setPayroll((prev) => ({ ...prev, status: 'processing' }));
      setShowActionModal(false);
    } catch (error) {
      toast.error('Không thể xử lý bảng lương');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePay = async () => {
    setIsProcessing(true);
    try {
      await payrollService.pay(id);
      toast.success('Bảng lương đã được thanh toán');
      setPayroll((prev) => ({ ...prev, status: 'paid', paidDate: new Date().toISOString().split('T')[0] }));
      setShowActionModal(false);
    } catch (error) {
      toast.error('Không thể thanh toán bảng lương');
    } finally {
      setIsProcessing(false);
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

  if (!payroll) {
    return <div className="text-center py-12">Không tìm thấy bảng lương</div>;
  }

  const statusBadge = getStatusBadge(payroll.status);
  const grossSalary = payroll.baseSalary + payroll.allowances;
  const totalDeductions = payroll.deductions + (payroll.advanceDeduction || 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <button
        onClick={() => navigate('/payroll')}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
      >
        <ArrowLeft size={20} />
        Quay lại
      </button>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Payroll Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Bảng Lương Tháng {payroll.month?.split('-')[1]}</h1>
                <p className="text-gray-600 mt-1">Năm {payroll.month?.split('-')[0]}</p>
              </div>
              <div
                className={`px-4 py-2 rounded-full text-sm font-medium ${statusBadge.bg} ${statusBadge.text}`}
              >
                {statusBadge.label}
              </div>
            </div>

            {/* Employee Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-6 border-b border-gray-200 mb-6">
              <div>
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <User size={16} />
                  Nhân Viên
                </div>
                <p className="font-semibold text-gray-900">{payroll.employeeName}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <Briefcase size={16} />
                  Chức Vụ
                </div>
                <p className="font-semibold text-gray-900">{payroll.position}</p>
              </div>
            </div>

            {/* Salary Breakdown */}
            <div className="space-y-4 py-6 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900 text-lg">Chi Tiết Lương</h3>

              {/* Income */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <p className="text-gray-600">Lương Cơ Bản</p>
                  <p className="font-semibold text-gray-900">
                    {(payroll.baseSalary / 1000000).toFixed(1)}M đ
                  </p>
                </div>
                <div className="flex justify-between">
                  <p className="text-gray-600">Phụ Cấp</p>
                  <p className="font-semibold text-gray-900">
                    {(payroll.allowances / 1000000).toFixed(1)}M đ
                  </p>
                </div>
                <div className="flex justify-between py-3 border-t border-b border-gray-200">
                  <p className="font-semibold text-gray-900">Lương Tính</p>
                  <p className="font-bold text-lg text-green-600">
                    {(grossSalary / 1000000).toFixed(1)}M đ
                  </p>
                </div>
              </div>

              {/* Deductions */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <p className="text-gray-600">Khấu Trừ</p>
                  <p className="font-semibold text-gray-900">
                    {(payroll.deductions / 1000000).toFixed(1)}M đ
                  </p>
                </div>
                {payroll.advanceDeduction > 0 && (
                  <div className="flex justify-between">
                    <p className="text-gray-600">Khấu Trừ Vay Lương</p>
                    <p className="font-semibold text-gray-900">
                      {(payroll.advanceDeduction / 1000000).toFixed(1)}M đ
                    </p>
                  </div>
                )}
                <div className="flex justify-between py-3 border-t border-b border-gray-200">
                  <p className="font-semibold text-gray-900">Tổng Khấu Trừ</p>
                  <p className="font-bold text-lg text-red-600">
                    -{(totalDeductions / 1000000).toFixed(1)}M đ
                  </p>
                </div>
              </div>

              {/* Net Salary */}
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <p className="font-semibold text-green-900">Lương Ròng Nhận</p>
                  <p className="font-bold text-2xl text-green-600">
                    {(payroll.netSalary / 1000000).toFixed(1)}M đ
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Info */}
            {payroll.status === 'paid' && (
              <div className="py-4">
                <div className="flex items-center gap-3">
                  <CheckCircle size={20} className="text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Đã Thanh Toán</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(payroll.paidDate).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Actions */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-bold text-gray-900 mb-4">Hành Động</h3>
            <div className="space-y-3">
              {payroll.status === 'draft' && (
                <Button
                  variant="primary"
                  fullWidth
                  icon={CheckCircle}
                  onClick={() => {
                    setActionType('approve');
                    setShowActionModal(true);
                  }}
                >
                  Phê Duyệt
                </Button>
              )}
              {payroll.status === 'approved' && (
                <Button
                  variant="primary"
                  fullWidth
                  icon={Clock}
                  onClick={() => {
                    setActionType('process');
                    setShowActionModal(true);
                  }}
                >
                  Xử Lý
                </Button>
              )}
              {payroll.status === 'processing' && (
                <Button
                  variant="success"
                  fullWidth
                  icon={DollarSign}
                  onClick={() => {
                    setActionType('pay');
                    setShowActionModal(true);
                  }}
                >
                  Thanh Toán
                </Button>
              )}
              {payroll.status === 'paid' && (
                <div className="text-center py-3">
                  <CheckCircle className="mx-auto text-green-600 mb-2" size={24} />
                  <p className="text-sm text-gray-600">Đã thanh toán</p>
                </div>
              )}
            </div>
          </div>

          {/* Summary Card */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p className="text-sm text-blue-900 mb-3 font-semibold">Tóm Tắt</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-700">Lương Tính:</span>
                <span className="font-semibold text-blue-900">
                  {(grossSalary / 1000000).toFixed(1)}M đ
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Khấu Trừ:</span>
                <span className="font-semibold text-blue-900">
                  {(totalDeductions / 1000000).toFixed(1)}M đ
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-blue-200">
                <span className="text-blue-900 font-semibold">Ròng:</span>
                <span className="font-bold text-blue-900">
                  {(payroll.netSalary / 1000000).toFixed(1)}M đ
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Modal */}
      <Modal
        isOpen={showActionModal}
        title={
          actionType === 'approve'
            ? 'Phê Duyệt Bảng Lương'
            : actionType === 'process'
              ? 'Xử Lý Bảng Lương'
              : 'Thanh Toán Bảng Lương'
        }
        onClose={() => setShowActionModal(false)}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setShowActionModal(false)}
            >
              Hủy
            </Button>
            <Button
              variant="success"
              loading={isProcessing}
              onClick={
                actionType === 'approve'
                  ? handleApprove
                  : actionType === 'process'
                    ? handleProcess
                    : handlePay
              }
            >
              {actionType === 'approve'
                ? 'Phê Duyệt'
                : actionType === 'process'
                  ? 'Xử Lý'
                  : 'Thanh Toán'}
            </Button>
          </>
        }
      >
        <p className="text-gray-600">
          {actionType === 'approve'
            ? `Bạn có chắc chắn muốn phê duyệt bảng lương của ${payroll.employeeName} với số tiền ${(payroll.netSalary / 1000000).toFixed(1)}M đ?`
            : actionType === 'process'
              ? `Bạn có chắc chắn muốn xử lý bảng lương của ${payroll.employeeName}?`
              : `Bạn có chắc chắn muốn thanh toán bảng lương cho ${payroll.employeeName} với số tiền ${(payroll.netSalary / 1000000).toFixed(1)}M đ?`}
        </p>
      </Modal>
    </div>
  );
}
