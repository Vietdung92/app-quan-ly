/**
 * Task Create Page
 * Path: src/pages/tasks/TaskCreatePage.jsx
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckSquare } from 'lucide-react';
import FormInput from '../../components/common/FormInput';
import FormSelect from '../../components/common/FormSelect';
import FormTextarea from '../../components/common/FormTextarea';
import Button from '../../components/common/Button';
import useForm, { rules } from '../../hooks/useForm';
import taskService from '../../services/taskService';
import employeeService from '../../services/employeeService';
import projectService from '../../services/projectService';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../stores/authStore';

export default function TaskCreatePage() {
  const { user } = useAuthStore();
  const isManager = ['QL', 'VP'].includes(user?.role);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    loadEmployeesAndProjects();
  }, []);

  const loadEmployeesAndProjects = async () => {
    try {
      // Load employees
      const employeesResponse = await employeeService.getAll();
      if (employeesResponse.data) {
        setEmployees(
          employeesResponse.data.map((emp) => ({
            label: emp.fullName,
            value: emp.id,
          }))
        );
      }
    } catch (error) {
      console.error('Error loading employees:', error);
      // Mock employees
      setEmployees([
        { label: 'Nguyễn Văn A', value: 1 },
        { label: 'Trần Thị B', value: 2 },
        { label: 'Lê Văn C', value: 3 },
      ]);
    }

    try {
      // Load projects
      const projectsResponse = await projectService.getAll();
      if (projectsResponse.data) {
        setProjects(
          projectsResponse.data.map((proj) => ({
            label: proj.name,
            value: proj.id,
          }))
        );
      }
    } catch (error) {
      console.error('Error loading projects:', error);
      // Mock projects
      setProjects([
        { label: 'Dự án Quản Lý Căn Hộ', value: 1 },
        { label: 'Dự án Nội Thất Xuất Khẩu', value: 2 },
      ]);
    }
  };

  const { formData, errors, handleChange, handleBlur, handleSubmit } = useForm(
    {
      title: '',
      description: '',
      priority: 'medium',
      assignedTo: '',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      projectId: '',
      notes: '',
    },
    async (data) => {
      setIsLoading(true);
      try {
        await taskService.create(data);
        toast.success('Công việc đã được thêm');
        navigate('/tasks');
      } catch (error) {
        toast.error(error.response?.data?.error || 'Không thể thêm công việc');
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    {
      title: rules.required('Tiêu đề'),
      description: rules.required('Mô tả'),
      ...(isManager ? { assignedTo: rules.required('Người thực hiện') } : {}),
      dueDate: rules.required('Hạn chót'),
    }
  );

  const priorityOptions = [
    { label: 'Cao', value: 'high' },
    { label: 'Trung bình', value: 'medium' },
    { label: 'Thấp', value: 'low' },
  ];

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

      {/* Form */}
      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-blue-100 p-3 rounded-lg">
            <CheckSquare className="text-blue-600" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tạo Công Việc Mới</h1>
            <p className="text-gray-600 text-sm">Thêm công việc mới cho nhân viên</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <FormInput
            label="Tiêu Đề"
            name="title"
            value={formData.title}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.title}
            placeholder="VD: Kiểm tra căn hộ 101"
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
            placeholder="Mô tả chi tiết công việc"
            rows={4}
            required
          />

          {/* Priority & Assignee */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormSelect
              label="Mức Độ Ưu Tiên"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              error={errors.priority}
              options={priorityOptions}
              required
            />

            {isManager ? (<FormSelect
              label="Giao Cho"
              name="assignedTo"
              value={formData.assignedTo}
              onChange={handleChange}
              error={errors.assignedTo}
              options={employees}
              required
            />) : (


              <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-800">Công việc sẽ được gán cho chính bạn</div>


            )}
          </div>

          {/* Due Date */}
          <FormInput
            label="Hạn Chót"
            name="dueDate"
            type="date"
            value={formData.dueDate}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.dueDate}
            required
          />

          {/* Project */}
          <FormSelect
            label="Dự Án (Không bắt buộc)"
            name="projectId"
            value={formData.projectId}
            onChange={handleChange}
            error={errors.projectId}
            options={projects}
          />

          {/* Notes */}
          <FormTextarea
            label="Ghi Chú Thêm"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Ghi chú bổ sung (không bắt buộc)"
            rows={2}
            maxLength={500}
          />

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button
              type="submit"
              variant="primary"
              loading={isLoading}
              fullWidth
            >
              Thêm Công Việc
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/tasks')}
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
