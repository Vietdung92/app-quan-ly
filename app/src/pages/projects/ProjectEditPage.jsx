/**
 * Project Edit Page
 * Path: src/pages/projects/ProjectEditPage.jsx
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FolderOpen } from 'lucide-react';
import FormInput from '../../components/common/FormInput';
import FormSelect from '../../components/common/FormSelect';
import FormTextarea from '../../components/common/FormTextarea';
import Button from '../../components/common/Button';
import useForm, { rules } from '../../hooks/useForm';
import projectService from '../../services/projectService';
import toast from 'react-hot-toast';

export default function ProjectEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const { formData, errors, handleChange, handleBlur, handleSubmit, setValues } = useForm(
    {
      name: '',
      description: '',
      budget: '',
      status: 'pending',
      startDate: '',
      endDate: '',
    },
    async (data) => {
      setIsLoading(true);
      try {
        await projectService.update(id, {
          ...data,
          budget: parseInt(data.budget) * 1000000,
        });
        toast.success('Cập nhật dự án thành công');
        navigate(`/projects/${id}`);
      } catch (error) {
        toast.error(error.response?.data?.error || 'Không thể cập nhật dự án');
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    {
      name: rules.required('Tên dự án'),
      description: rules.required('Mô tả'),
      budget: rules.combine(
        rules.required('Ngân sách'),
        rules.positiveNumber('Ngân sách')
      ),
      startDate: rules.required('Ngày bắt đầu'),
      endDate: rules.combine(
        rules.required('Ngày kết thúc'),
        rules.dateAfter('Ngày kết thúc', 'startDate', 'ngày bắt đầu')
      ),
    }
  );

  useEffect(() => {
    fetchProject();
  }, [id]);

  const fetchProject = async () => {
    try {
      setIsFetching(true);
      const response = await projectService.getById(id);
      const project = response.data;
      setValues({
        name: project.name || '',
        description: project.description || '',
        budget: project.budget ? String(project.budget / 1000000) : '',
        status: project.status || 'pending',
        startDate: project.startDate?.split('T')[0] || '',
        endDate: project.endDate?.split('T')[0] || '',
      });
    } catch (error) {
      toast.error('Không thể tải thông tin dự án');
      // Mock data for development
      setValues({
        name: 'Thi công nội thất quận 2',
        description: 'Dự án thiết kế và thi công nội thất căn hộ',
        budget: '50',
        status: 'in_progress',
        startDate: '2024-08-01',
        endDate: '2024-09-30',
      });
    } finally {
      setIsFetching(false);
    }
  };

  const statusOptions = [
    { label: 'Chưa bắt đầu', value: 'pending' },
    { label: 'Đang thực hiện', value: 'in_progress' },
    { label: 'Tạm dừng', value: 'on_hold' },
    { label: 'Hoàn thành', value: 'completed' },
  ];

  if (isFetching) {
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
        onClick={() => navigate(`/projects/${id}`)}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
      >
        <ArrowLeft size={20} />
        Quay lại
      </button>

      {/* Form */}
      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-blue-100 p-3 rounded-lg">
            <FolderOpen className="text-blue-600" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Chỉnh Sửa Dự Án</h1>
            <p className="text-gray-600 text-sm">Cập nhật thông tin dự án #{id}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <FormInput
            label="Tên Dự Án"
            name="name"
            value={formData.name}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.name}
            placeholder="VD: Thi công nội thất quận 2"
            required
          />

          <FormTextarea
            label="Mô Tả"
            name="description"
            value={formData.description}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.description}
            placeholder="Mô tả chi tiết dự án"
            rows={3}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              label="Ngân Sách (Triệu đ)"
              name="budget"
              type="number"
              value={formData.budget}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.budget}
              placeholder="0"
              required
            />

            <FormSelect
              label="Trạng Thái"
              name="status"
              value={formData.status}
              onChange={handleChange}
              error={errors.status}
              options={statusOptions}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              label="Ngày Bắt Đầu"
              name="startDate"
              type="date"
              value={formData.startDate}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.startDate}
              required
            />

            <FormInput
              label="Ngày Kết Thúc"
              name="endDate"
              type="date"
              value={formData.endDate}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.endDate}
              required
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button
              type="submit"
              variant="primary"
              loading={isLoading}
              fullWidth
            >
              Lưu Thay Đổi
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate(`/projects/${id}`)}
              fullWidth
            >
              Hủy
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
