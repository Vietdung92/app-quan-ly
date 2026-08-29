/**
 * Task Edit Page
 * Path: src/pages/tasks/TaskEditPage.jsx
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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

export default function TaskEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);

  const { formData, errors, handleChange, handleBlur, handleSubmit, setValues } = useForm(
    {
      title: '',
      description: '',
      priority: 'medium',
      status: 'pending',
      assignedTo: '',
      dueDate: '',
      projectId: '',
    },
    async (data) => {
      setIsLoading(true);
      try {
        await taskService.update(id, {
          ...data,
          assignedTo: data.assignedTo ? parseInt(data.assignedTo) : null,
          projectId: data.projectId ? parseInt(data.projectId) : null,
        });
        toast.success('Cập nhật công việc thành công');
        navigate(`/tasks/${id}`);
      } catch (error) {
        toast.error(error.response?.data?.error || 'Không thể cập nhật công việc');
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    {
      title: rules.required('Tiêu đề'),
      description: rules.required('Mô tả'),
      assignedTo: rules.required('Người thực hiện'),
      dueDate: rules.required('Hạn hoàn thành'),
    }
  );

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setIsFetching(true);

    // Load employees
    try {
      const empResponse = await employeeService.getAll();
      setEmployees(empResponse.data || []);
    } catch (error) {
      setEmployees([
        { id: 1, fullName: 'Nguyễn Văn A' },
        { id: 2, fullName: 'Trần Thị B' },
        { id: 3, fullName: 'Lê Văn C' },
      ]);
    }

    // Load projects
    try {
      const projResponse = await projectService.getAll();
      setProjects(projResponse.data || []);
    } catch (error) {
      setProjects([
        { id: 1, name: 'Thi công nội thất quận 2' },
        { id: 2, name: 'Quản lý homestay Đà Lạt' },
      ]);
    }

    // Load task
    try {
      const response = await taskService.getById(id);
      const task = response.data;
      setValues({
        title: task.title || '',
        description: task.description || '',
        priority: task.priority || 'medium',
        status: task.status || 'pending',
        assignedTo: task.assignedTo ? String(task.assignedTo) : '',
        dueDate: task.dueDate?.split('T')[0] || '',
        projectId: task.projectId ? String(task.projectId) : '',
      });
    } catch (error) {
      toast.error('Không thể tải thông tin công việc');
      // Mock data for development
      setValues({
        title: 'Kiểm tra căn hộ 101',
        description: 'Kiểm tra tình trạng căn hộ trước khi bàn giao',
        priority: 'high',
        status: 'in_progress',
        assignedTo: '1',
        dueDate: '2024-09-05',
        projectId: '1',
      });
    } finally {
      setIsFetching(false);
    }
  };

  const priorityOptions = [
    { label: 'Cao', value: 'high' },
    { label: 'Trung bình', value: 'medium' },
    { label: 'Thấp', value: 'low' },
  ];

  const statusOptions = [
    { label: 'Chưa bắt đầu', value: 'pending' },
    { label: 'Đang thực hiện', value: 'in_progress' },
    { label: 'Hoàn thành', value: 'completed' },
    { label: 'Hủy bỏ', value: 'cancelled' },
  ];

  const employeeOptions = employees.map((e) => ({
    label: e.fullName,
    value: String(e.id),
  }));

  const projectOptions = [
    { label: 'Không thuộc dự án', value: '' },
    ...projects.map((p) => ({
      label: p.name,
      value: String(p.id),
    })),
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
        onClick={() => navigate(`/tasks/${id}`)}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
      >
        <ArrowLeft size={20} />
        Quay lại
      </button>

      {/* Form */}
      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-green-100 p-3 rounded-lg">
            <CheckSquare className="text-green-600" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Chỉnh Sửa Công Việc</h1>
            <p className="text-gray-600 text-sm">Cập nhật thông tin công việc #{id}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
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

          <FormTextarea
            label="Mô Tả"
            name="description"
            value={formData.description}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.description}
            placeholder="Mô tả chi tiết công việc"
            rows={3}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <FormSelect
              label="Độ Ưu Tiên"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              error={errors.priority}
              options={priorityOptions}
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

          <div className="grid grid-cols-2 gap-4">
            <FormSelect
              label="Người Thực Hiện"
              name="assignedTo"
              value={formData.assignedTo}
              onChange={handleChange}
              error={errors.assignedTo}
              options={employeeOptions}
              required
            />

            <FormInput
              label="Hạn Hoàn Thành"
              name="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.dueDate}
              required
            />
          </div>

          <FormSelect
            label="Dự Án"
            name="projectId"
            value={formData.projectId}
            onChange={handleChange}
            error={errors.projectId}
            options={projectOptions}
          />

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
              onClick={() => navigate(`/tasks/${id}`)}
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
