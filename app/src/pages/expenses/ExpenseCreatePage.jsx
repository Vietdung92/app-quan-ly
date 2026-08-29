/**
 * Expense Create Page
 * Path: src/pages/expenses/ExpenseCreatePage.jsx
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, DollarSign } from 'lucide-react';
import FormInput from '../../components/common/FormInput';
import FormSelect from '../../components/common/FormSelect';
import FormTextarea from '../../components/common/FormTextarea';
import Button from '../../components/common/Button';
import useForm, { rules } from '../../hooks/useForm';
import expenseService from '../../services/expenseService';
import toast from 'react-hot-toast';

export default function ExpenseCreatePage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const { formData, errors, handleChange, handleBlur, handleSubmit } = useForm(
    {
      name: '',
      description: '',
      amount: '',
      category: '',
      date: new Date().toISOString().split('T')[0],
      notes: '',
    },
    async (data) => {
      setIsLoading(true);
      try {
        await expenseService.create({
          ...data,
          amount: parseInt(data.amount) * 1000000,
        });
        toast.success('Chi phí đã được thêm');
        navigate('/expenses');
      } catch (error) {
        toast.error(error.response?.data?.error || 'Không thể thêm chi phí');
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    {
      name: rules.required('Tên chi phí'),
      description: rules.required('Mô tả'),
      amount: rules.combine(
        rules.required('Số tiền'),
        rules.positiveNumber('Số tiền')
      ),
      category: rules.required('Loại chi phí'),
      date: rules.required('Ngày chi'),
    }
  );

  const categoryOptions = [
    { label: 'Vật liệu', value: 'materials' },
    { label: 'Tiện ích', value: 'utilities' },
    { label: 'Bảo trì', value: 'maintenance' },
    { label: 'Lương', value: 'salary' },
    { label: 'Khác', value: 'other' },
  ];

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

      {/* Form */}
      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-orange-100 p-3 rounded-lg">
            <DollarSign className="text-orange-600" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Thêm Chi Phí Mới</h1>
            <p className="text-gray-600 text-sm">Nhập thông tin chi phí mới</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <FormInput
            label="Tên Chi Phí"
            name="name"
            value={formData.name}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.name}
            placeholder="VD: Vật liệu xây dựng"
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
            placeholder="Mô tả chi tiết chi phí"
            rows={3}
            required
          />

          {/* Amount & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              label="Số Tiền (Triệu đ)"
              name="amount"
              type="number"
              value={formData.amount}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.amount}
              placeholder="0"
              required
            />

            <FormSelect
              label="Loại Chi Phí"
              name="category"
              value={formData.category}
              onChange={handleChange}
              error={errors.category}
              options={categoryOptions}
              required
            />
          </div>

          {/* Date */}
          <FormInput
            label="Ngày Chi"
            name="date"
            type="date"
            value={formData.date}
            onChange={handleChange}
            error={errors.date}
            required
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
              Thêm Chi Phí
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/expenses')}
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
