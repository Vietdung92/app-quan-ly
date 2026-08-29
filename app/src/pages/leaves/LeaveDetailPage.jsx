/**
 * Leave Detail Page
 * Path: src/pages/leaves/LeaveDetailPage.jsx
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Calendar,
  User,
  FileText,
  Trash2,
} from 'lucide-react';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import leaveService from '../../services/leaveService';
import toast from 'react-hot-toast';

export default function LeaveDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [leave, setLeave] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchLeave();
  }, [id]);

  const fetchLeave = async () => {
    try {
      setIsLoading(true);
      const response = await leaveService.getById(id);
      setLeave(response.data);
    } catch (error) {
      toast.error('Không thể tải đơn nghỉ phép');
      // Mock data
      setLeave({
        id: parseInt(id),
        employeeId: 1,
        employeeName: 'Nguyễn Văn A',
        type: 'annual',
        reason: 'Nghỉ phép hàng năm',
        startDate: '2024-09-10',
        endDate: '2024-09-12',
        days: 3,
        status: 'pending',
        notes: 'Sẽ trở về vào ngày 13',
        createdAt: '2024-08-28',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      await leaveService.approve(id);
      toast.success('Đơn xin nghỉ phép đã được phê duyệt');
      setLeave((prev) => ({ ...prev, status: 'approved' }));
      setShowActionModal(false);
    } catch (error) {
      toast.error('Không thể phê duyệt đơn xin nghỉ phép');
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
      await leaveService.reject(id, rejectionReason);
      toast.success('Đơn xin nghỉ phép đã được từ chối');
      setLeave((prev) => ({ ...prev, status: 'rejected' }));
      setShowActionModal(false);
      setRejectionReason('');
    } catch (error) {
      toast.error('Không thể từ chối đơn xin nghỉ phép');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = async () => {
    setIsProcessing(true);
    try {
      await leaveService.cancel(id);
      toast.success('Đơn xin nghỉ phép đã được hủy');
      setLeave((prev) => ({ ...prev, status: 'cancelled' }));
      setShowActionModal(false);
    } catch (error) {
      toast.error('Không thể hủy đơn xin nghỉ phép');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Chờ duyệt' },
      approved: { bg: 'bg-green-100', text: 'text-green-800', label: 'Đã duyệt' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Từ chối' },
      cancelled: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Đã hủy' },
    };
    return badges[status] || badges.pending;
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

  if (!leave) {
    return <div className="text-center py-12">Không tìm thấy đơn nghỉ phép</div>;
  }

  const statusBadge = getStatusBadge(leave.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <button
        onClick={() => navigate('/leaves')}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
      >
        <ArrowLeft size={20} />
        Quay lại
      </button>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Leave Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {getLeaveTypeLabel(leave.type)}
                </h1>
                <p className="text-gray-600 mt-1">{leave.reason}</p>
              </div>
              <div
                className={`px-4 py-2 rounded-full text-sm font-medium ${statusBadge.bg} ${statusBadge.text}`}
              >
                {statusBadge.label}
              </div>
            </div>

            {/* Employee & Type Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-6 border-t border-b border-gray-200 my-6">
              <div>
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <User size={16} />
                  Nhân Viên
                </div>
                <p className="font-semibold text-gray-900">{leave.employeeName}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <Calendar size={16} />
                  Số Ngày
                </div>
                <p className="font-semibold text-gray-900">{leave.days} ngày</p>
              </div>
            </div>

            {/* Date Range */}
            <div className="py-4 border-b border-gray-200">
              <p className="text-sm text-gray-600 mb-2">Từ - Đến</p>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-gray-900">
                  {new Date(leave.startDate).toLocaleDateString('vi-VN')}
                </p>
                <span className="text-gray-400">→</span>
                <p className="font-semibold text-gray-900">
                  {new Date(leave.endDate).toLocaleDateString('vi-VN')}
                </p>
              </div>
            </div>

            {/* Reason */}
            <div className="py-4 border-b border-gray-200">
              <p className="text-sm text-gray-600 mb-2">Lý Do</p>
              <p className="text-gray-900">{leave.reason}</p>
            </div>

            {/* Notes if present */}
            {leave.notes && (
              <div className="py-4">
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <FileText size={16} />
                  Ghi Chú
                </div>
                <p className="text-gray-900 bg-gray-50 p-3 rounded">
                  {leave.notes}
                </p>
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">
              Gửi vào{' '}
              <span className="font-medium">
                {new Date(leave.createdAt).toLocaleDateString('vi-VN')}
              </span>
            </p>
          </div>
        </div>

        {/* Right Column - Actions */}
        <div className="space-y-6">
          {leave.status === 'pending' && (
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

          {leave.status === 'pending' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-bold text-gray-900 mb-4">Tùy Chọn</h3>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  fullWidth
                  icon={Trash2}
                  onClick={() => {
                    setActionType('cancel');
                    setShowActionModal(true);
                  }}
                >
                  Hủy Đơn
                </Button>
              </div>
            </div>
          )}

          {leave.status !== 'pending' && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-center">
                <div className="text-4xl mb-2">
                  {leave.status === 'approved' && '✓'}
                  {leave.status === 'rejected' && '✗'}
                  {leave.status === 'cancelled' && '−'}
                </div>
                <p className="text-sm text-gray-600">
                  {leave.status === 'approved' && 'Đơn xin nghỉ phép đã được phê duyệt'}
                  {leave.status === 'rejected' && 'Đơn xin nghỉ phép đã bị từ chối'}
                  {leave.status === 'cancelled' && 'Đơn xin nghỉ phép đã được hủy'}
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
            ? 'Phê Duyệt Đơn Xin Nghỉ'
            : actionType === 'reject'
              ? 'Từ Chối Đơn Xin Nghỉ'
              : 'Hủy Đơn Xin Nghỉ'
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
              variant={actionType === 'reject' || actionType === 'cancel' ? 'danger' : 'success'}
              loading={isProcessing}
              onClick={
                actionType === 'approve'
                  ? handleApprove
                  : actionType === 'reject'
                    ? handleReject
                    : handleCancel
              }
            >
              {actionType === 'approve'
                ? 'Phê Duyệt'
                : actionType === 'reject'
                  ? 'Từ Chối'
                  : 'Hủy Đơn'}
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
            {actionType === 'approve'
              ? 'Bạn có chắc chắn muốn phê duyệt đơn xin nghỉ phép này?'
              : 'Bạn có chắc chắn muốn hủy đơn xin nghỉ phép này?'}
          </p>
        )}
      </Modal>
    </div>
  );
}
