/**
 * Project Create Page
 * Path: src/pages/projects/ProjectCreatePage.jsx
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FolderPlus } from 'lucide-react';
import FormInput from '../../components/common/FormInput';
import FormSelect from '../../components/common/FormSelect';
import FormTextarea from '../../components/common/FormTextarea';
import Button from '../../components/common/Button';
import useForm, { rules } from '../../hooks/useForm';
import projectService from '../../services/projectService';
import toast from 'react-hot-toast';

export default function ProjectCreatePage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  // Calculate default dates
  const today = new Date().toISOString().split('T')[0];
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 30);
  const defaultEndDate = endDate.toISOString().split('T')[0];

  const { formData, errors, handleChange, handleBlur, handleSubmit } = useForm(
    {
      name: '',
      description: '',
      budget: '',
      status: 'pending',
      startDate: today,
      endDate: defaultEndDate,
    },
    async (data) => {
      setIsLoading(true);
      try {
        await projectService.create({
          ...data,
          budget: parseInt(data.budget) * 1000000,
        });
        toast.success('Tạo dự án thành công');
        navigate('/projects');
      } catch (error) {
        toast.error(error.response?.data?.error || 'Không thể tạo dự án');
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

  const statusOptions = [
    { label: 'Chưa bắt đầu', value: 'pending' },
    { label: 'Đang thực hiện', value: 'in_progress' },
    { label: 'Tạm dừng', value: 'on_hold' },
    { label: 'Hoàn thành', value: 'completed' },
  ];

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

      {/* Form */}
      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-blue-100 p-3 rounded-lg">
            <FolderPlus className="text-blue-600" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tạo Dự Án Mới</h1>
            <p className="text-gray-600 text-sm">Thêm dự án mới vào hệ thống</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
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

          {/* Description */}
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

          {/* Budget & Status */}
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

          {/* Dates */}
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

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button
              type="submit"
              variant="primary"
              loading={isLoading}
              fullWidth
            >
              Tạo Dự Án
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/projects')}
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
