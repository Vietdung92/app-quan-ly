/**
 * Project Detail Page
 * Path: src/pages/projects/ProjectDetailPage.jsx
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit2,
  Trash2,
  FolderOpen,
  Calendar,
  DollarSign,
  User,
} from 'lucide-react';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import projectService from '../../services/projectService';
import toast from 'react-hot-toast';

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchProject();
  }, [id]);

  const fetchProject = async () => {
    try {
      setIsLoading(true);
      const response = await projectService.getById(id);
      setProject(response.data);
    } catch (error) {
      toast.error('Không thể tải chi tiết dự án');
      // Mock data for development
      setProject({
        id: parseInt(id),
        name: 'Thi công nội thất quận 2',
        description: 'Dự án thiết kế và thi công nội thất căn hộ',
        status: 'in_progress',
        budget: 50000000,
        spent: 35000000,
        startDate: '2024-08-01',
        endDate: '2024-09-30',
        manager: 'Nguyễn Văn A',
        team: ['Nguyễn Văn A', 'Trần Thị B'],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsProcessing(true);
    try {
      await projectService.delete(id);
      toast.success('Dự án đã được xóa');
      navigate('/projects');
    } catch (error) {
      toast.error('Không thể xóa dự án');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    setIsProcessing(true);
    try {
      await projectService.updateStatus(id, newStatus);
      toast.success('Cập nhật trạng thái dự án thành công');
      setProject((prev) => ({ ...prev, status: newStatus }));
      setShowActionModal(false);
    } catch (error) {
      toast.error('Không thể cập nhật trạng thái');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Chưa bắt đầu' },
      in_progress: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Đang thực hiện' },
      on_hold: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Tạm dừng' },
      completed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Hoàn thành' },
    };
    return badges[status] || badges.pending;
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

  if (!project) {
    return <div className="text-center py-12">Không tìm thấy dự án</div>;
  }

  const statusBadge = getStatusBadge(project.status);
  const progress = (project.spent / project.budget) * 100;
  const remaining = project.budget - project.spent;

  return (
    <div className="space-y-6">
      {/* Header */}
      <button
        onClick={() => navigate('/projects')}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
      >
        <ArrowLeft size={20} />
        Quay lại
      </button>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Project Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
                <p className="text-gray-600 mt-1">{project.description}</p>
              </div>
              <div
                className={`px-4 py-2 rounded-full text-sm font-medium ${statusBadge.bg} ${statusBadge.text}`}
              >
                {statusBadge.label}
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4 py-6 border-t border-b border-gray-200 my-6">
              <div>
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <Calendar size={16} />
                  Ngày Bắt Đầu
                </div>
                <p className="font-semibold text-gray-900">
                  {new Date(project.startDate).toLocaleDateString('vi-VN')}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <Calendar size={16} />
                  Ngày Kết Thúc
                </div>
                <p className="font-semibold text-gray-900">
                  {new Date(project.endDate).toLocaleDateString('vi-VN')}
                </p>
              </div>
            </div>
          </div>

          {/* Budget Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-200">
              <DollarSign size={20} className="text-orange-600" />
              <h2 className="text-lg font-semibold text-gray-900">Ngân Sách</h2>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Tổng Ngân Sách</span>
                <span className="font-semibold text-gray-900">
                  {(project.budget / 1000000).toFixed(1)}M đ
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Đã Chi</span>
                <span className="font-semibold text-orange-600">
                  {(project.spent / 1000000).toFixed(1)}M đ
                </span>
              </div>
              <div className="flex justify-between pb-3 border-t border-b border-gray-200">
                <span className="font-semibold text-gray-900">Còn Lại</span>
                <span className="font-bold text-green-600">
                  {(remaining / 1000000).toFixed(1)}M đ
                </span>
              </div>

              <div>
                <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      progress > 90 ? 'bg-red-600' : 'bg-blue-600'
                    }`}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Sử dụng {progress.toFixed(0)}% ngân sách
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Actions */}
        <div className="space-y-6">
          {/* Actions Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-bold text-gray-900 mb-4">Hành Động</h3>
            <div className="space-y-3">
              <Button
                variant="outline"
                fullWidth
                icon={Edit2}
                onClick={() => navigate(`/projects/${project.id}/edit`)}
              >
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

          {/* Manager Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-200">
              <User size={20} className="text-blue-600" />
              <h3 className="font-bold text-gray-900">Quản Lý Dự Án</h3>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                {project.manager.charAt(0)}
              </div>
              <p className="font-medium text-gray-900">{project.manager}</p>
            </div>
          </div>

          {/* Team Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-200">
              <FolderOpen size={20} className="text-blue-600" />
              <h3 className="font-bold text-gray-900">Thành Viên</h3>
            </div>
            <div className="space-y-3">
              {project.team && project.team.length > 0 ? (
                project.team.map((member, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 text-xs font-bold">
                      {member.charAt(0)}
                    </div>
                    <span className="text-gray-600 text-sm">{member}</span>
                  </div>
                ))
              ) : (
                <p className="text-gray-600 text-sm">Chưa có thành viên</p>
              )}
            </div>
          </div>

          {/* Status Card */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p className="text-sm text-blue-900 mb-3 font-semibold">Thông Tin Dự Án</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-700">Mã Dự Án:</span>
                <span className="font-semibold text-blue-900">#{project.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Trạng Thái:</span>
                <span className="font-semibold text-blue-900">{statusBadge.label}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      <Modal
        isOpen={showActionModal}
        title="Xóa Dự Án"
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
              variant="danger"
              loading={isProcessing}
              onClick={handleDelete}
            >
              Xóa
            </Button>
          </>
        }
      >
        <p className="text-gray-600">
          Hành động này không thể hoàn tác. Bạn có chắc chắn muốn xóa dự án <strong>{project.name}</strong> này không?
        </p>
      </Modal>
    </div>
  );
}
