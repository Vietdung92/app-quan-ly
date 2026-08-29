/**
 * Tax Form Page - Thêm / Sửa hồ sơ thuế
 * Path: src/pages/taxes/TaxFormPage.jsx
 *
 * Dùng chung cho /taxes/new và /taxes/:id/edit.
 * Tạo mới có kỳ hạn → tự sinh checklist tháng.
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Receipt, Trash2 } from 'lucide-react';
import FormInput from '../../components/common/FormInput';
import FormTextarea from '../../components/common/FormTextarea';
import Button from '../../components/common/Button';
import taxService from '../../services/taxService';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';

const EMPTY = {
  label: '',
  ownerName: '',
  taxCode: '',
  startDate: '',
  endDate: '',
  declaredRent: '',
  monthlyTax: '',
  driveLink: '',
  notes: '',
};

export default function TaxFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { user } = useAuthStore();
  const isQL = user?.role === 'QL';

  const [form, setForm] = useState(EMPTY);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEdit) {
      taxService
        .getById(id)
        .then((res) => {
          const t = res.data;
          setForm({
            label: t.label || '',
            ownerName: t.ownerName || '',
            taxCode: t.taxCode || '',
            startDate: t.startDate ? t.startDate.slice(0, 10) : '',
            endDate: t.endDate ? t.endDate.slice(0, 10) : '',
            declaredRent: t.declaredRent != null ? String(t.declaredRent) : '',
            monthlyTax: t.monthlyTax != null ? String(t.monthlyTax) : '',
            driveLink: t.driveLink || '',
            notes: t.notes || '',
          });
        })
        .catch(() => {
          toast.error('Không tìm thấy hồ sơ thuế');
          navigate('/taxes');
        });
    }
  }, [id, isEdit, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: null }));
  };

  const validate = () => {
    const er = {};
    if (!form.label.trim()) er.label = 'Vui lòng nhập tên căn';
    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      er.endDate = 'Ngày kết thúc phải sau ngày bắt đầu';
    }
    setErrors(er);
    return Object.keys(er).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    try {
      const data = {
        ...form,
        declaredRent: form.declaredRent ? parseInt(form.declaredRent) : null,
        monthlyTax: form.monthlyTax ? parseInt(form.monthlyTax) : null,
      };
      if (isEdit) {
        await taxService.update(id, data);
        toast.success('Đã cập nhật hồ sơ thuế');
      } else {
        await taxService.create(data);
        toast.success('Đã thêm hồ sơ thuế' + (form.startDate && form.endDate ? ' + sinh checklist tháng' : ''));
      }
      navigate('/taxes');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Không thể lưu, vui lòng thử lại');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Xóa hồ sơ thuế này cùng toàn bộ checklist? Không thể hoàn tác.')) return;
    setIsLoading(true);
    try {
      await taxService.delete(id);
      toast.success('Đã xóa hồ sơ thuế');
      navigate('/taxes');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Không thể xóa');
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/taxes')}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
      >
        <ArrowLeft size={20} />
        Quay lại
      </button>

      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-blue-100 p-3 rounded-lg">
            <Receipt className="text-blue-600" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEdit ? 'Sửa Hồ Sơ Thuế' : 'Thêm Hồ Sơ Thuế'}
            </h1>
            <p className="text-gray-600 text-sm">Căn đóng thuế hộ chủ nhà</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <FormInput
            label="Tên Căn (Dự án_Mã căn)"
            name="label"
            value={form.label}
            onChange={handleChange}
            error={errors.label}
            placeholder="VD: Sadora_C1104"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              label="Chủ Nhà"
              name="ownerName"
              value={form.ownerName}
              onChange={handleChange}
              placeholder="VD: HUGH KI JOON"
            />
            <FormInput
              label="Mã Số Thuế (MST)"
              name="taxCode"
              value={form.taxCode}
              onChange={handleChange}
              placeholder="MST của chủ nhà"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              label="Ngày Bắt Đầu"
              name="startDate"
              type="date"
              value={form.startDate}
              onChange={handleChange}
            />
            <FormInput
              label="Ngày Kết Thúc"
              name="endDate"
              type="date"
              value={form.endDate}
              onChange={handleChange}
              error={errors.endDate}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              label="Tiền Thuê Khai Thuế (đ/tháng)"
              name="declaredRent"
              type="number"
              value={form.declaredRent}
              onChange={handleChange}
              placeholder="VD: 30000000"
            />
            <FormInput
              label="Thuế Mỗi Tháng (đ)"
              name="monthlyTax"
              type="number"
              value={form.monthlyTax}
              onChange={handleChange}
              placeholder="Bỏ trống = 10% tiền thuê"
            />
          </div>

          <FormInput
            label="Link Hồ Sơ Thuế (Google Drive)"
            name="driveLink"
            value={form.driveLink}
            onChange={handleChange}
            placeholder="Dán link thư mục Drive"
          />

          <FormTextarea
            label="Ghi Chú"
            name="notes"
            value={form.notes}
            onChange={handleChange}
            rows={2}
            maxLength={500}
          />

          {!isEdit && (
            <p className="text-sm text-gray-500 bg-blue-50 rounded-lg p-3">
              💡 Nhập đủ ngày bắt đầu + kết thúc, app sẽ tự sinh checklist các tháng cần đóng.
            </p>
          )}

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button type="submit" variant="primary" loading={isLoading} fullWidth>
              {isEdit ? 'Lưu Thay Đổi' : 'Thêm Hồ Sơ'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/taxes')} fullWidth>
              Hủy
            </Button>
          </div>

          {isEdit && isQL && (
            <button
              type="button"
              onClick={handleDelete}
              className="w-full flex items-center justify-center gap-2 text-red-600 text-sm py-2 hover:bg-red-50 rounded-lg"
            >
              <Trash2 size={16} />
              Xóa hồ sơ thuế này
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
