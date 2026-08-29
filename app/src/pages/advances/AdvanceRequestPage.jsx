/**
 * Advance Request Page
 * Path: src/pages/advances/AdvanceRequestPage.jsx
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, DollarSign } from 'lucide-react';
import FormInput from '../../components/common/FormInput';
import FormTextarea from '../../components/common/FormTextarea';
import Button from '../../components/common/Button';
import useForm, { rules } from '../../hooks/useForm';
import advanceService from '../../services/advanceService';
import toast from 'react-hot-toast';

export default function AdvanceRequestPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [salary, setSalary] = useState(null);
  const [currentBalance, setCurrentBalance] = useState(null);

  useEffect(() => {
    // In real app, get current user ID from auth store
    loadAdvanceInfo(1);
  }, []);

  const loadAdvanceInfo = async (employeeId) => {
    try {
      // Load current balance
      const balanceResponse = await advanceService.getBalance(employeeId);
      setCurrentBalance(balanceResponse.data.balance);
      setSalary(balanceResponse.data.salary);
    } catch (error) {
      console.error('Error loading advance info:', error);
      // Mock data
      setCurrentBalance(5000000);
      setSalary(10000000);
    }
  };

  const { formData, errors, handleChange, handleBlur, handleSubmit } = useForm(
    {
      amount: '',
      reason: '',
      notes: '',
    },
    async (data) => {
      setIsLoading(true);
      try {
        await advanceService.request({
          ...data,
          amount: parseInt(data.amount) * 1000000,
        });
        toast.success('Đơn xin vay lương đã được gửi');
        navigate('/advances');
      } catch (error) {
        toast.error(error.response?.data?.error || 'Không thể gửi đơn xin vay lương');
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    {
      amount: rules.combine(
        rules.required('Số tiền xin vay'),
        rules.positiveNumber('Số tiền xin vay'),
        (value) =>
          currentBalance !== null && parseInt(value) * 1000000 > currentBalance
            ? `Số tiền xin vay vượt quá hạn mức (tối đa ${(currentBalance / 1000000).toFixed(1)}M đ)`
            : ''
      ),
      reason: rules.required('Lý do xin vay'),
    }
  );

  const maxAdvanceAmount = currentBalance ? (currentBalance / 1000000).toFixed(1) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <button
        onClick={() => navigate('/advances')}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
      >
        <ArrowLeft size={20} />
        Quay lại
      </button>

      {/* Form */}
      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-green-100 p-3 rounded-lg">
            <DollarSign className="text-green-600" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Xin Vay Lương</h1>
            <p className="text-gray-600 text-sm">Yêu cầu vay lương từ công ty</p>
          </div>
        </div>

        {/* Balance Info */}
        {salary && currentBalance !== null && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-green-900 mb-3">Thông Tin Vay Lương</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-green-600 font-medium">{(salary / 1000000).toFixed(1)}M đ</p>
                <p className="text-green-700">Lương hàng tháng</p>
              </div>
              <div>
                <p className="text-green-600 font-medium">{maxAdvanceAmount}M đ</p>
                <p className="text-green-700">Có thể vay tối đa</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Amount */}
          <div>
            <FormInput
              label="Số Tiền Xin Vay (Triệu đ)"
              name="amount"
              type="number"
              value={formData.amount}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.amount}
              placeholder="0"
              required
            />
            <p className="text-xs text-gray-500 mt-2">
              Tối đa có thể vay: {maxAdvanceAmount}M đ
            </p>
          </div>

          {/* Reason */}
          <FormTextarea
            label="Lý Do Xin Vay"
            name="reason"
            value={formData.reason}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.reason}
            placeholder="Nhập lý do xin vay lương"
            rows={4}
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

          {/* Repayment Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              💡 <span className="font-semibold">Lưu ý:</span> Số tiền vay sẽ được khấu trừ từ lương hàng tháng của bạn theo lịch trình được phê duyệt.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button
              type="submit"
              variant="primary"
              loading={isLoading}
              fullWidth
            >
              Gửi Đơn Xin Vay
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/advances')}
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
