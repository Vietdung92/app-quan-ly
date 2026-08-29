/**
 * Expense Detail Page
 * Path: src/pages/expenses/ExpenseDetailPage.jsx
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  DollarSign,
  Calendar,
  Tag,
  FileText,
} from 'lucide-react';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import expenseService from '../../services/expenseService';
import toast from 'react-hot-toast';

export default function ExpenseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [expense, setExpense] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchExpense();
  }, [id]);

  const fetchExpense = async () => {
    try {
      setIsLoading(true);
      const response = await expenseService.getById(id);
      setExpense(response.data);
    } catch (error) {
      toast.error('Không thể tải chi phí');
      // Mock data
      setExpense({
        id: parseInt(id),
        name: 'Vật liệu xây dựng',
        description: 'Gạch, xi măng, cát cho dự án',
        amount: 5000000,
        category: 'materials',
        date: '2024-08-28',
        status: 'pending',
        notes: 'Ghi chú thêm về chi phí',
        createdBy: 'Quản lý',
        createdAt: '2024-08-28',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      await expenseService.approve(id);
      toast.success('Chi phí đã được phê duyệt');
      setExpense((prev) => ({ ...prev, status: 'approved' }));
      setShowActionModal(false);
    } catch (error) {
      toast.error('Không thể phê duyệt chi phí');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    setIsProcessing(true);
    try {
      await expenseService.reject(id, 'Từ chối theo yêu cầu');
      toast.success('Chi phí đã được từ chối');
      setExpense((prev) => ({ ...prev, status: 'rejected' }));
      setShowActionModal(false);
    } catch (error) {
      toast.error('Không thể từ chối chi phí');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    setIsProcessing(true);
    try {
      await expenseService.delete(id);
      toast.success('Chi phí đã được xóa');
      navigate('/expenses');
    } catch (error) {
      toast.error('Không thể xóa chi phí');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Chờ duyệt' },
      approved: { bg: 'bg-green-100', text: 'text-green-800', label: 'Đã duyệt' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Từ chối' },
    };
    const badge = badges[status] || badges.pending;
    return badge;
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

  if (!expense) {
    return <div className="text-center py-12">Không tìm thấy chi phí</div>;
  }

  const statusBadge = getStatusBadge(expense.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <button
        onClick={() => navigate('/expenses')}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
      >
        <ArrowLeft size={20} />
        Quay lại
      </button>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Expense Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {expense.name}
                </h1>
                <p className="text-gray-600 mt-1">{expense.description}</p>
              </div>
              <div
                className={`px-4 py-2 rounded-full text-sm font-medium ${statusBadge.bg} ${statusBadge.text}`}
              >
                {statusBadge.label}
              </div>
            </div>

            <div className="bg-orange-50 border-l-4 border-orange-600 p-4 rounded">
              <p className="text-sm text-orange-600 mb-1">Số Tiền</p>
              <p className="text-4xl font-bold text-orange-600">
                {(expense.amount / 1000000).toFixed(1)}M đ
              </p>
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-4 py-6 border-t border-b border-gray-200 my-6">
              <div>
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <Tag size={16} />
                  Loại Chi Phí
                </div>
                <p className="font-semibold text-gray-900">
                  {getCategoryLabel(expense.category)}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <Calendar size={16} />
                  Ngày Chi
                </div>
                <p className="font-semibold text-gray-900">
                  {new Date(expense.date).toLocaleDateString('vi-VN')}
                </p>
              </div>
            </div>

            {expense.notes && (
              <div>
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <FileText size={16} />
                  Ghi Chú
                </div>
                <p className="text-gray-900 bg-gray-50 p-3 rounded">
                  {expense.notes}
                </p>
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">
              Tạo bởi <span className="font-medium">{expense.createdBy}</span> vào{' '}
              <span className="font-medium">
                {new Date(expense.createdAt).toLocaleDateString('vi-VN')}
              </span>
            </p>
          </div>
        </div>

        {/* Right Column - Actions */}
        <div className="space-y-6">
          {expense.status === 'pending' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-bold text-gray-900 mb-4">Hành Động</h3>
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

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-bold text-gray-900 mb-4">Tùy Chọn</h3>
            <div className="space-y-3">
              <Button variant="outline" fullWidth icon={Edit2}>
                Chỉnh Sửa
              </Button>
              <Button
                variant="danger"
                fullWidth
                icon={Trash2}
                onClick={() => {
                  setActionType('delete');
                  setShowActionModal(true);
                }}
              >
                Xóa
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Action Modal */}
      <Modal
        isOpen={showActionModal}
        title={
          actionType === 'approve'
            ? 'Phê Duyệt Chi Phí'
            : actionType === 'reject'
              ? 'Từ Chối Chi Phí'
              : 'Xóa Chi Phí'
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
              variant={actionType === 'delete' ? 'danger' : 'success'}
              loading={isProcessing}
              onClick={
                actionType === 'approve'
                  ? handleApprove
                  : actionType === 'reject'
                    ? handleReject
                    : handleDelete
              }
            >
              {actionType === 'approve'
                ? 'Phê Duyệt'
                : actionType === 'reject'
                  ? 'Từ Chối'
                  : 'Xóa'}
            </Button>
          </>
        }
      >
        <p className="text-gray-600">
          {actionType === 'approve'
            ? 'Bạn có chắc chắn muốn phê duyệt chi phí này?'
            : actionType === 'reject'
              ? 'Bạn có chắc chắn muốn từ chối chi phí này?'
              : 'Hành động này không thể hoàn tác. Bạn có chắc chắn muốn xóa chi phí này?'}
        </p>
      </Modal>
    </div>
  );
}
