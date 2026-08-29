/**
 * Task Detail Page
 * Path: src/pages/tasks/TaskDetailPage.jsx
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit2,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  User,
  Calendar,
  Flag,
  FileText,
} from 'lucide-react';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import taskService from '../../services/taskService';
import toast from 'react-hot-toast';

export default function TaskDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchTask();
  }, [id]);

  const fetchTask = async () => {
    try {
      setIsLoading(true);
      const response = await taskService.getById(id);
      setTask(response.data);
    } catch (error) {
      toast.error('Không thể tải công việc');
      // Mock data
      setTask({
        id: parseInt(id),
        title: 'Kiểm tra căn hộ 101',
        description: 'Kiểm tra và báo cáo tình trạng căn hộ',
        priority: 'high',
        status: 'in_progress',
        assignedTo: 'Nguyễn Văn A',
        dueDate: '2024-08-30',
        projectId: 1,
        projectName: 'Dự án Quản Lý Căn Hộ',
        createdBy: 'Quản lý',
        createdAt: '2024-08-28',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteTask = async () => {
    setIsProcessing(true);
    try {
      await taskService.updateStatus(id, 'completed');
      toast.success('Công việc đã được đánh dấu hoàn thành');
      setTask((prev) => ({ ...prev, status: 'completed' }));
      setShowActionModal(false);
    } catch (error) {
      toast.error('Không thể cập nhật công việc');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartTask = async () => {
    setIsProcessing(true);
    try {
      await taskService.updateStatus(id, 'in_progress');
      toast.success('Công việc đã bắt đầu');
      setTask((prev) => ({ ...prev, status: 'in_progress' }));
      setShowActionModal(false);
    } catch (error) {
      toast.error('Không thể cập nhật công việc');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    setIsProcessing(true);
    try {
      await taskService.delete(id);
      toast.success('Công việc đã được xóa');
      navigate('/tasks');
    } catch (error) {
      toast.error('Không thể xóa công việc');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Chưa bắt đầu', icon: AlertCircle },
      in_progress: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Đang thực hiện', icon: Clock },
      completed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Hoàn thành', icon: CheckCircle },
    };
    return badges[status] || badges.pending;
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      high: { bg: 'bg-red-100', text: 'text-red-800', label: 'Cao' },
      medium: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Trung bình' },
      low: { bg: 'bg-green-100', text: 'text-green-800', label: 'Thấp' },
    };
    return badges[priority] || badges.medium;
  };

  const isOverdue = (dueDate) => {
    return new Date(dueDate) < new Date() && task?.status !== 'completed';
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

  if (!task) {
    return <div className="text-center py-12">Không tìm thấy công việc</div>;
  }

  const statusBadge = getStatusBadge(task.status);
  const priorityBadge = getPriorityBadge(task.priority);

  return (
    <div className="space-y-6">
      {/* Header */}
      <button
        onClick={() => navigate('/tasks')}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
      >
        <ArrowLeft size={20} />
        Quay lại
      </button>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Task Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900">{task.title}</h1>
                <p className="text-gray-600 mt-1">{task.description}</p>
              </div>
              <div
                className={`px-4 py-2 rounded-full text-sm font-medium ${statusBadge.bg} ${statusBadge.text}`}
              >
                {statusBadge.label}
              </div>
            </div>

            {/* Status and Priority */}
            <div className="grid grid-cols-2 gap-4 py-6 border-t border-b border-gray-200 my-6">
              <div>
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <Flag size={16} />
                  Mức Độ Ưu Tiên
                </div>
                <p className={`font-semibold px-3 py-1 rounded-full text-sm w-fit ${priorityBadge.bg} ${priorityBadge.text}`}>
                  {priorityBadge.label}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <Calendar size={16} />
                  Hạn Chót
                </div>
                <p className={`font-semibold text-gray-900 ${isOverdue(task.dueDate) ? 'text-red-600' : ''}`}>
                  {new Date(task.dueDate).toLocaleDateString('vi-VN')}
                  {isOverdue(task.dueDate) && <span className="text-red-600 ml-2">(Quá hạn)</span>}
                </p>
              </div>
            </div>

            {/* Assignee Info */}
            <div className="flex items-center gap-3 py-4 border-b border-gray-200">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <User size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Giao cho</p>
                <p className="font-semibold text-gray-900">{task.assignedTo}</p>
              </div>
            </div>

            {/* Project Info */}
            {task.projectName && (
              <div className="py-4 border-b border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Dự Án</p>
                <p className="font-semibold text-gray-900">{task.projectName}</p>
              </div>
            )}

            {/* Notes if present */}
            {task.notes && (
              <div className="py-4">
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <FileText size={16} />
                  Ghi Chú
                </div>
                <p className="text-gray-900 bg-gray-50 p-3 rounded">
                  {task.notes}
                </p>
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">
              Tạo bởi <span className="font-medium">{task.createdBy}</span> vào{' '}
              <span className="font-medium">
                {new Date(task.createdAt).toLocaleDateString('vi-VN')}
              </span>
            </p>
          </div>
        </div>

        {/* Right Column - Actions */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-bold text-gray-900 mb-4">Hành Động</h3>
            <div className="space-y-3">
              {task.status === 'pending' && (
                <Button
                  variant="primary"
                  fullWidth
                  icon={Clock}
                  onClick={() => {
                    setActionType('start');
                    setShowActionModal(true);
                  }}
                >
                  Bắt Đầu Công Việc
                </Button>
              )}
              {task.status === 'in_progress' && (
                <Button
                  variant="success"
                  fullWidth
                  icon={CheckCircle}
                  onClick={() => {
                    setActionType('complete');
                    setShowActionModal(true);
                  }}
                >
                  Đánh Dấu Hoàn Thành
                </Button>
              )}
              {task.status !== 'completed' && (
                <>
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
                </>
              )}
              {task.status === 'completed' && (
                <p className="text-sm text-gray-600 text-center py-2">
                  ✓ Công việc đã hoàn thành
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Modal */}
      <Modal
        isOpen={showActionModal}
        title={
          actionType === 'complete'
            ? 'Đánh Dấu Hoàn Thành'
            : actionType === 'start'
              ? 'Bắt Đầu Công Việc'
              : 'Xóa Công Việc'
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
                actionType === 'complete'
                  ? handleCompleteTask
                  : actionType === 'start'
                    ? handleStartTask
                    : handleDelete
              }
            >
              {actionType === 'complete'
                ? 'Hoàn Thành'
                : actionType === 'start'
                  ? 'Bắt Đầu'
                  : 'Xóa'}
            </Button>
          </>
        }
      >
        <p className="text-gray-600">
          {actionType === 'complete'
            ? 'Bạn có chắc chắn muốn đánh dấu công việc này hoàn thành?'
            : actionType === 'start'
              ? 'Bạn có chắc chắn muốn bắt đầu công việc này?'
              : 'Hành động này không thể hoàn tác. Bạn có chắc chắn muốn xóa công việc này?'}
        </p>
      </Modal>
    </div>
  );
}
