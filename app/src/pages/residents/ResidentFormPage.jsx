/**
 * Resident Form Page - Thêm / Sửa khách tạm trú
 * Path: src/pages/residents/ResidentFormPage.jsx
 *
 * Dùng chung cho cả tạo mới (/residents/new) và sửa (/residents/:id/edit).
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Globe, Trash2 } from 'lucide-react';
import FormInput from '../../components/common/FormInput';
import FormSelect from '../../components/common/FormSelect';
import FormTextarea from '../../components/common/FormTextarea';
import Button from '../../components/common/Button';
import apartmentService from '../../services/apartmentService';
import residentService from '../../services/residentService';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';

const EMPTY = {
  objectId: '',
  fullName: '',
  passportNo: '',
  nationality: '',
  birthDate: '',
  residenceStart: '',
  residenceExpiry: '',
  petNotes: '',
  passportLink: '',
  trcLink: '',
};

export default function ResidentFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { user } = useAuthStore();
  const isQL = user?.role === 'QL';

  const [form, setForm] = useState(EMPTY);
  const [apartments, setApartments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Danh sách căn hộ cho dropdown (tất cả căn, kể cả chưa có hồ sơ)
    apartmentService
      .getAllRaw()
      .then((res) => setApartments(res.data.apartments || []))
      .catch(() => toast.error('Không thể tải danh sách căn hộ'));

    if (isEdit) {
      residentService
        .getById(id)
        .then((res) => {
          const r = res.data;
          setForm({
            objectId: String(r.objectId),
            fullName: r.fullName || '',
            passportNo: r.passportNo || '',
            nationality: r.nationality || '',
            birthDate: r.birthDate ? r.birthDate.slice(0, 10) : '',
            residenceStart: r.residenceStart ? r.residenceStart.slice(0, 10) : '',
            residenceExpiry: r.residenceExpiry ? r.residenceExpiry.slice(0, 10) : '',
            petNotes: r.petNotes || '',
            passportLink: r.passportLink || '',
            trcLink: r.trcLink || '',
          });
        })
        .catch(() => {
          toast.error('Không tìm thấy khách tạm trú');
          navigate('/residents');
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
    if (!form.objectId) er.objectId = 'Vui lòng chọn căn hộ';
    if (!form.fullName.trim()) er.fullName = 'Vui lòng nhập họ tên';
    if (form.residenceStart && form.residenceExpiry && form.residenceExpiry < form.residenceStart) {
      er.residenceExpiry = 'Hạn tạm trú phải sau ngày bắt đầu';
    }
    setErrors(er);
    return Object.keys(er).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    try {
      if (isEdit) {
        await residentService.update(id, form);
        toast.success('Đã cập nhật khách tạm trú');
      } else {
        await residentService.create(form);
        toast.success('Đã thêm khách tạm trú');
      }
      navigate('/residents');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Không thể lưu, vui lòng thử lại');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Xóa khách tạm trú này? Hành động không thể hoàn tác.')) return;
    setIsLoading(true);
    try {
      await residentService.delete(id);
      toast.success('Đã xóa khách tạm trú');
      navigate('/residents');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Không thể xóa');
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/residents')}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
      >
        <ArrowLeft size={20} />
        Quay lại
      </button>

      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-blue-100 p-3 rounded-lg">
            <Globe className="text-blue-600" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEdit ? 'Sửa Khách Tạm Trú' : 'Thêm Khách Tạm Trú'}
            </h1>
            <p className="text-gray-600 text-sm">
              Thông tin khách nước ngoài đăng ký tạm trú
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <FormSelect
            label="Căn Hộ"
            name="objectId"
            value={form.objectId}
            onChange={handleChange}
            error={errors.objectId}
            options={apartments.map((a) => ({ label: a.name, value: String(a.id) }))}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              label="Họ Tên (theo passport)"
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              error={errors.fullName}
              placeholder="VD: KIM MIN JUN"
              required
            />
            <FormInput
              label="Số Passport"
              name="passportNo"
              value={form.passportNo}
              onChange={handleChange}
              placeholder="VD: M1234567"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              label="Quốc Tịch"
              name="nationality"
              value={form.nationality}
              onChange={handleChange}
              placeholder="VD: Hàn Quốc / US / Taiwan"
            />
            <FormInput
              label="Ngày Sinh"
              name="birthDate"
              type="date"
              value={form.birthDate}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              label="Ngày Bắt Đầu Tạm Trú"
              name="residenceStart"
              type="date"
              value={form.residenceStart}
              onChange={handleChange}
            />
            <FormInput
              label="Hạn Đăng Ký Tạm Trú"
              name="residenceExpiry"
              type="date"
              value={form.residenceExpiry}
              onChange={handleChange}
              error={errors.residenceExpiry}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              label="Link Ảnh Passport"
              name="passportLink"
              value={form.passportLink}
              onChange={handleChange}
              placeholder="Dán link Google Drive"
            />
            <FormInput
              label="Link Thẻ Tạm Trú (TRC)"
              name="trcLink"
              value={form.trcLink}
              onChange={handleChange}
              placeholder="Dán link Google Drive"
            />
          </div>

          <FormTextarea
            label="Ghi Chú (thú cưng, lưu ý...)"
            name="petNotes"
            value={form.petNotes}
            onChange={handleChange}
            rows={2}
            maxLength={500}
          />

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button type="submit" variant="primary" loading={isLoading} fullWidth>
              {isEdit ? 'Lưu Thay Đổi' : 'Thêm Khách'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/residents')}
              fullWidth
            >
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
              Xóa khách tạm trú này
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
