/**
 * Expense Edit Page
 * Path: src/pages/expenses/ExpenseEditPage.jsx
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, DollarSign } from 'lucide-react';
import FormInput from '../../components/common/FormInput';
import FormSelect from '../../components/common/FormSelect';
import FormTextarea from '../../components/common/FormTextarea';
import Button from '../../components/common/Button';
import useForm, { rules } from '../../hooks/useForm';
import expenseService from '../../services/expenseService';
import toast from 'react-hot-toast';

export default function ExpenseEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const { formData, errors, handleChange, handleBlur, handleSubmit, setValues } = useForm(
    {
      name: '',
      description: '',
      amount: '',
      category: '',
      date: '',
      notes: '',
    },
    async (data) => {
      setIsLoading(true);
      try {
        await expenseService.update(id, {
          ...data,
          amount: parseInt(data.amount) * 1000000,
        });
        toast.success('Cập nhật chi phí thành công');
        navigate(`/expenses/${id}`);
      } catch (error) {
        toast.error(error.response?.data?.error || 'Không thể cập nhật chi phí');
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

  useEffect(() => {
    fetchExpense();
  }, [id]);

  const fetchExpense = async () => {
    try {
      setIsFetching(true);
      const response = await expenseService.getById(id);
      const expense = response.data;
      setValues({
        name: expense.name || '',
        description: expense.description || '',
        amount: expense.amount ? String(expense.amount / 1000000) : '',
        category: expense.category || '',
        date: expense.date?.split('T')[0] || '',
        notes: expense.notes || '',
      });
    } catch (error) {
      toast.error('Không thể tải thông tin chi phí');
      // Mock data for development
      setValues({
        name: 'Vật liệu xây dựng',
        description: 'Gạch, xi măng, cát cho dự án',
        amount: '5',
        category: 'materials',
        date: '2024-08-28',
        notes: 'Ghi chú thêm về chi phí',
      });
    } finally {
      setIsFetching(false);
    }
  };

  const categoryOptions = [
    { label: 'Vật liệu', value: 'materials' },
    { label: 'Tiện ích', value: 'utilities' },
    { label: 'Bảo trì', value: 'maintenance' },
    { label: 'Lương', value: 'salary' },
    { label: 'Khác', value: 'other' },
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
        onClick={() => navigate(`/expenses/${id}`)}
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
            <h1 className="text-2xl font-bold text-gray-900">Chỉnh Sửa Chi Phí</h1>
            <p className="text-gray-600 text-sm">Cập nhật thông tin chi phí #{id}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
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

          <FormInput
            label="Ngày Chi"
            name="date"
            type="date"
            value={formData.date}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.date}
            required
          />

          <FormTextarea
            label="Ghi Chú Thêm"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Ghi chú bổ sung (không bắt buộc)"
            rows={2}
            maxLength={500}
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
              onClick={() => navigate(`/expenses/${id}`)}
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
