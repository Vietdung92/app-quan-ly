/**
 * Leave Request Page
 * Path: src/pages/leaves/LeaveRequestPage.jsx
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar } from 'lucide-react';
import FormInput from '../../components/common/FormInput';
import FormSelect from '../../components/common/FormSelect';
import FormTextarea from '../../components/common/FormTextarea';
import Button from '../../components/common/Button';
import useForm, { rules } from '../../hooks/useForm';
import leaveService from '../../services/leaveService';
import toast from 'react-hot-toast';

export default function LeaveRequestPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [leaveBalance, setLeaveBalance] = useState(null);

  useEffect(() => {
    // In real app, get current user ID from auth store
    loadLeaveBalance(1);
  }, []);

  const loadLeaveBalance = async (employeeId) => {
    try {
      const response = await leaveService.getBalance(employeeId);
      setLeaveBalance(response.data);
    } catch (error) {
      console.error('Error loading leave balance:', error);
      // Mock balance
      setLeaveBalance({
        annual: 12,
        sick: 5,
        personal: 3,
        unpaid: 0,
      });
    }
  };

  const calculateDays = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const { formData, errors, handleChange, handleBlur, handleSubmit } = useForm(
    {
      type: 'annual',
      reason: '',
      startDate: '',
      endDate: '',
      notes: '',
    },
    async (data) => {
      setIsLoading(true);
      try {
        await leaveService.request({
          ...data,
          days: calculateDays(data.startDate, data.endDate),
        });
        toast.success('Đơn xin nghỉ phép đã được gửi');
        navigate('/leaves');
      } catch (error) {
        toast.error(error.response?.data?.error || 'Không thể gửi đơn xin nghỉ phép');
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    {
      startDate: rules.required('Ngày bắt đầu'),
      endDate: rules.combine(
        rules.required('Ngày kết thúc'),
        rules.dateAfter('Ngày kết thúc', 'startDate', 'ngày bắt đầu')
      ),
      reason: rules.required('Lý do nghỉ'),
    }
  );

  const leaveTypeOptions = [
    { label: 'Phép hàng năm', value: 'annual' },
    { label: 'Nghỉ ốm', value: 'sick' },
    { label: 'Nghỉ cá nhân', value: 'personal' },
    { label: 'Nghỉ không lương', value: 'unpaid' },
  ];

  const days = calculateDays(formData.startDate, formData.endDate);
  const remainingBalance = leaveBalance ? leaveBalance[formData.type] || 0 : 0;
  const willExceedBalance = days > remainingBalance && formData.type !== 'unpaid';

  return (
    <div className="space-y-6">
      {/* Header */}
      <button
        onClick={() => navigate('/leaves')}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
      >
        <ArrowLeft size={20} />
        Quay lại
      </button>

      {/* Form */}
      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-blue-100 p-3 rounded-lg">
            <Calendar className="text-blue-600" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Xin Nghỉ Phép</h1>
            <p className="text-gray-600 text-sm">Gửi đơn xin nghỉ phép của bạn</p>
          </div>
        </div>

        {/* Leave Balance Info */}
        {leaveBalance && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-3">Số Ngày Phép Còn Lại</h3>
            <div className="grid grid-cols-4 gap-3 text-sm">
              <div>
                <p className="text-blue-600 font-medium">{leaveBalance.annual} ngày</p>
                <p className="text-blue-700">Phép hàng năm</p>
              </div>
              <div>
                <p className="text-blue-600 font-medium">{leaveBalance.sick} ngày</p>
                <p className="text-blue-700">Nghỉ ốm</p>
              </div>
              <div>
                <p className="text-blue-600 font-medium">{leaveBalance.personal} ngày</p>
                <p className="text-blue-700">Nghỉ cá nhân</p>
              </div>
              <div>
                <p className="text-blue-600 font-medium">-</p>
                <p className="text-blue-700">Không lương</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Leave Type */}
          <FormSelect
            label="Loại Phép"
            name="type"
            value={formData.type}
            onChange={handleChange}
            error={errors.type}
            options={leaveTypeOptions}
            required
          />

          {/* Date Range */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              label="Từ Ngày"
              name="startDate"
              type="date"
              value={formData.startDate}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.startDate}
              required
            />

            <FormInput
              label="Đến Ngày"
              name="endDate"
              type="date"
              value={formData.endDate}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.endDate}
              required
            />
          </div>

          {/* Days Info */}
          {days > 0 && (
            <div className={`p-4 rounded-lg ${willExceedBalance ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
              <p className={willExceedBalance ? 'text-red-700' : 'text-green-700'}>
                <span className="font-semibold">{days} ngày</span> - Phê duyệt sẽ cần {formData.type !== 'unpaid' && `${days} ngày từ ${remainingBalance} ngày còn lại`}
                {willExceedBalance && <span className="ml-2">⚠️ Vượt quá số ngày phép</span>}
              </p>
            </div>
          )}

          {/* Reason */}
          <FormTextarea
            label="Lý Do Nghỉ"
            name="reason"
            value={formData.reason}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.reason}
            placeholder="Nhập lý do xin nghỉ phép"
            rows={3}
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
              Gửi Đơn Xin Nghỉ
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/leaves')}
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
