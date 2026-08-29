/**
 * Advance Detail Page
 * Path: src/pages/advances/AdvanceDetailPage.jsx
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  DollarSign,
  User,
  Calendar,
  FileText,
  TrendingDown,
} from 'lucide-react';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import advanceService from '../../services/advanceService';
import toast from 'react-hot-toast';

export default function AdvanceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [advance, setAdvance] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchAdvance();
  }, [id]);

  const fetchAdvance = async () => {
    try {
      setIsLoading(true);
      const response = await advanceService.getById(id);
      setAdvance(response.data);
    } catch (error) {
      toast.error('Không thể tải khoản vay');
      // Mock data
      setAdvance({
        id: parseInt(id),
        employeeId: 1,
        employeeName: 'Nguyễn Văn A',
        amount: 5000000,
        reason: 'Nhu cầu cá nhân',
        status: 'approved',
        approvedBy: 'Quản lý',
        remainingBalance: 2000000,
        notes: 'Sẽ trả dần từ lương hàng tháng',
        monthlyDeduction: 1000000,
        createdAt: '2024-08-15',
        approvedAt: '2024-08-16',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      await advanceService.approve(id);
      toast.success('Đơn xin vay lương đã được phê duyệt');
      setAdvance((prev) => ({ ...prev, status: 'approved' }));
      setShowActionModal(false);
    } catch (error) {
      toast.error('Không thể phê duyệt đơn xin vay');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Vui lòng nhập lý do từ chối');
      return;
    }
    setIsProcessing(true);
    try {
      await advanceService.reject(id, rejectionReason);
      toast.success('Đơn xin vay lương đã được từ chối');
      setAdvance((prev) => ({ ...prev, status: 'rejected' }));
      setShowActionModal(false);
      setRejectionReason('');
    } catch (error) {
      toast.error('Không thể từ chối đơn xin vay');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Chờ duyệt' },
      approved: { bg: 'bg-green-100', text: 'text-green-800', label: 'Đã duyệt' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Từ chối' },
      completed: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Hoàn thành' },
    };
    return badges[status] || badges.pending;
  };

  const payoffPercentage = advance
    ? ((advance.amount - advance.remainingBalance) / advance.amount) * 100
    : 0;

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

  if (!advance) {
    return <div className="text-center py-12">Không tìm thấy khoản vay</div>;
  }

  const statusBadge = getStatusBadge(advance.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <button
        onClick={() => navigate('/advances')}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
      >
        <ArrowLeft size={20} />
        Quay lại
      </button>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Advance Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {(advance.amount / 1000000).toFixed(1)}M đ
                </h1>
                <p className="text-gray-600 mt-1">{advance.reason}</p>
              </div>
              <div
                className={`px-4 py-2 rounded-full text-sm font-medium ${statusBadge.bg} ${statusBadge.text}`}
              >
                {statusBadge.label}
              </div>
            </div>

            {/* Progress Bar */}
            {advance.status === 'approved' && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-600">Tiến độ hoàn trả</p>
                  <p className="text-sm font-semibold text-gray-900">{Math.round(payoffPercentage)}%</p>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all"
                    style={{ width: `${payoffPercentage}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Employee & Amount Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-6 border-t border-b border-gray-200 my-6">
              <div>
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <User size={16} />
                  Nhân Viên
                </div>
                <p className="font-semibold text-gray-900">{advance.employeeName}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <Calendar size={16} />
                  Ngày Xin
                </div>
                <p className="font-semibold text-gray-900">
                  {new Date(advance.createdAt).toLocaleDateString('vi-VN')}
                </p>
              </div>
            </div>

            {/* Remaining Balance */}
            <div className="py-4 border-b border-gray-200">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2 text-gray-600">
                  <TrendingDown size={16} />
                  <span>Còn Lại</span>
                </div>
                <p className="font-bold text-2xl text-orange-600">
                  {(advance.remainingBalance / 1000000).toFixed(1)}M đ
                </p>
              </div>
            </div>

            {/* Monthly Deduction */}
            {advance.monthlyDeduction && (
              <div className="py-4 border-b border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Khấu Trừ Hàng Tháng</p>
                <p className="font-semibold text-gray-900">
                  {(advance.monthlyDeduction / 1000000).toFixed(1)}M đ/tháng
                </p>
              </div>
            )}

            {/* Approval Info */}
            {advance.approvedBy && (
              <div className="py-4">
                <p className="text-sm text-gray-600 mb-2">Phê Duyệt Bởi</p>
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-600" />
                  <div>
                    <p className="font-semibold text-gray-900">{advance.approvedBy}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(advance.approvedAt).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            {advance.notes && (
              <div className="py-4">
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <FileText size={16} />
                  Ghi Chú
                </div>
                <p className="text-gray-900 bg-gray-50 p-3 rounded">
                  {advance.notes}
                </p>
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">
              Tạo vào{' '}
              <span className="font-medium">
                {new Date(advance.createdAt).toLocaleDateString('vi-VN')}
              </span>
            </p>
          </div>
        </div>

        {/* Right Column - Actions */}
        <div className="space-y-6">
          {advance.status === 'pending' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-bold text-gray-900 mb-4">Hành Động Phê Duyệt</h3>
              <div className="space-y-3">
                <Button
                  variant="success"
                  fullWidth
                  icon={CheckCircle}
                  onClick={() => {
                    setActionType('approve');
                    setShowActionModal(true);
                  }}
                >
                  Phê Duyệt
                </Button>
                <Button
                  variant="danger"
                  fullWidth
                  icon={XCircle}
                  onClick={() => {
                    setActionType('reject');
                    setShowActionModal(true);
                  }}
                >
                  Từ Chối
                </Button>
              </div>
            </div>
          )}

          {advance.status !== 'pending' && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-center">
                <div className="text-4xl mb-2">
                  {advance.status === 'approved' && '✓'}
                  {advance.status === 'rejected' && '✗'}
                  {advance.status === 'completed' && '✓'}
                </div>
                <p className="text-sm text-gray-600">
                  {advance.status === 'approved' && 'Đơn xin vay đã được phê duyệt'}
                  {advance.status === 'rejected' && 'Đơn xin vay đã bị từ chối'}
                  {advance.status === 'completed' && 'Khoản vay đã hoàn thành'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Modal */}
      <Modal
        isOpen={showActionModal}
        title={
          actionType === 'approve'
            ? 'Phê Duyệt Đơn Xin Vay'
            : 'Từ Chối Đơn Xin Vay'
        }
        onClose={() => {
          setShowActionModal(false);
          setRejectionReason('');
        }}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setShowActionModal(false);
                setRejectionReason('');
              }}
            >
              Hủy
            </Button>
            <Button
              variant={actionType === 'reject' ? 'danger' : 'success'}
              loading={isProcessing}
              onClick={actionType === 'approve' ? handleApprove : handleReject}
            >
              {actionType === 'approve' ? 'Phê Duyệt' : 'Từ Chối'}
            </Button>
          </>
        }
      >
        {actionType === 'reject' ? (
          <div className="space-y-4">
            <p className="text-gray-600">
              Vui lòng nhập lý do từ chối để thông báo cho nhân viên:
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Nhập lý do từ chối..."
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
        ) : (
          <p className="text-gray-600">
            Bạn có chắc chắn muốn phê duyệt đơn xin vay lương này? Nhân viên sẽ có thể nhận tiền ngay.
          </p>
        )}
      </Modal>
    </div>
  );
}
