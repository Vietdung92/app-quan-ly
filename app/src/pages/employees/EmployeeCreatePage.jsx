/**
 * Employee Create Page
 * Path: src/pages/employees/EmployeeCreatePage.jsx
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus } from 'lucide-react';
import FormInput from '../../components/common/FormInput';
import FormSelect from '../../components/common/FormSelect';
import Button from '../../components/common/Button';
import useForm, { rules } from '../../hooks/useForm';
import employeeService from '../../services/employeeService';
import toast from 'react-hot-toast';

export default function EmployeeCreatePage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const { formData, errors, handleChange, handleBlur, handleSubmit } = useForm(
    {
      fullName: '',
      email: '',
      phone: '',
      role: 'KT',
      position: '',
      department: '',
      salary: '',
      joinDate: new Date().toISOString().split('T')[0],
      address: '',
    },
    async (data) => {
      setIsLoading(true);
      try {
        await employeeService.create({
          ...data,
          salary: parseFloat(data.salary) * 1000000,
        });
        toast.success('Thêm nhân viên thành công');
        navigate('/employees');
      } catch (error) {
        toast.error(error.response?.data?.error || 'Không thể thêm nhân viên');
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    {
      fullName: rules.required('Họ tên'),
      email: rules.combine(rules.required('Email'), rules.email()),
      phone: rules.combine(rules.required('Số điện thoại'), rules.phone()),
      position: rules.required('Chức vụ'),
      salary: rules.combine(
        rules.required('Lương cơ bản'),
        rules.positiveNumber('Lương cơ bản')
      ),
      joinDate: rules.required('Ngày vào làm'),
    }
  );

  const roleOptions = [
    { label: 'Quản Lý (QL)', value: 'QL' },
    { label: 'Phó Quản Lý (VP)', value: 'VP' },
    { label: 'Kỹ Thuật (KT)', value: 'KT' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <button
        onClick={() => navigate('/employees')}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
      >
        <ArrowLeft size={20} />
        Quay lại
      </button>

      {/* Form */}
      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-purple-100 p-3 rounded-lg">
            <UserPlus className="text-purple-600" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Thêm Nhân Viên Mới</h1>
            <p className="text-gray-600 text-sm">Nhập thông tin nhân viên mới</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <FormInput
            label="Họ Tên"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.fullName}
            placeholder="VD: Nguyễn Văn A"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.email}
              placeholder="email@example.com"
              required
            />

            <FormInput
              label="Số Điện Thoại"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.phone}
              placeholder="0912345678"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormSelect
              label="Vai Trò"
              name="role"
              value={formData.role}
              onChange={handleChange}
              error={errors.role}
              options={roleOptions}
            />

            <FormInput
              label="Chức Vụ"
              name="position"
              value={formData.position}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.position}
              placeholder="VD: Nhân viên kỹ thuật"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              label="Phòng Ban"
              name="department"
              value={formData.department}
              onChange={handleChange}
              error={errors.department}
              placeholder="VD: Kỹ thuật"
            />

            <FormInput
              label="Lương Cơ Bản (Triệu đ)"
              name="salary"
              type="number"
              value={formData.salary}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.salary}
              placeholder="0"
              required
            />
          </div>

          <FormInput
            label="Ngày Vào Làm"
            name="joinDate"
            type="date"
            value={formData.joinDate}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.joinDate}
            required
          />

          <FormInput
            label="Địa Chỉ"
            name="address"
            value={formData.address}
            onChange={handleChange}
            error={errors.address}
            placeholder="Địa chỉ nơi ở"
          />

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button
              type="submit"
              variant="primary"
              loading={isLoading}
              fullWidth
            >
              Thêm Nhân Viên
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/employees')}
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
