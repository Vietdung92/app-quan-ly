/**
 * Apartment Detail Page - Hồ sơ đầy đủ: thông tin căn + 2 hợp đồng + lịch sử thu/trả
 * Path: src/pages/apartments/ApartmentDetailPage.jsx
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, Save, User, Home, ExternalLink,
  Trash2,
} from 'lucide-react';
import FormInput from '../../components/common/FormInput';
import FormSelect from '../../components/common/FormSelect';
import FormTextarea from '../../components/common/FormTextarea';
import Button from '../../components/common/Button';
import apartmentService from '../../services/apartmentService';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';

const EMPTY_FORM = {
  name: '',
  bedrooms: '', area: '', electricCode: '', waterCode: '',
  imageLink: '', zaloLink: '', contractLink: '', qrLink: '',
  ownerName: '', ownerPhone: '', ownerPassport: '', ownerBank: '',
  ownerRent: '', ownerDeposit: '', ownerContractStart: '', ownerContractEnd: '', ownerPaymentNote: '',
  tenantName: '', tenantPhone: '', rentAmount: '', deposit: '',
  contractStart: '', contractEnd: '', paymentDay: '', paymentNote: '',
  rentalForm: '', buildingFee: '', managementType: 'sublease', companyFee: '',
  aptStatus: '', address: '', notes: '',
  projectName: '', mapLink: '',
};

export default function ApartmentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isManager = ['QL', 'VP'].includes(user?.role);

  const [apartment, setApartment] = useState(null);
  const [isFetching, setIsFetching] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    fetchApartment();
  }, [id]);

  const fetchApartment = async () => {
    try {
      setIsFetching(true);
      const response = await apartmentService.getById(id);
      const a = response.data;
      setApartment(a);
      const f = { ...EMPTY_FORM };
      const dateKeys = ['ownerContractStart', 'ownerContractEnd', 'contractStart', 'contractEnd'];
      for (const key of Object.keys(EMPTY_FORM)) {
        let v = a[key];
        if (v === null || v === undefined) continue;
        if (dateKeys.includes(key)) v = String(v).split('T')[0];
        f[key] = String(v);
      }
      setForm(f);
    } catch (error) {
      toast.error('Không thể tải thông tin căn hộ');
    } finally {
      setIsFetching(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const numKeys = ['bedrooms', 'area', 'ownerRent', 'ownerDeposit', 'rentAmount',
        'deposit', 'paymentDay', 'buildingFee', 'companyFee'];
      const payload = {};
      for (const [k, v] of Object.entries(form)) {
        payload[k] = numKeys.includes(k) && v !== '' ? Number(v) : v;
      }
      await apartmentService.update(id, payload);
      toast.success('Đã lưu hồ sơ căn hộ');
      fetchApartment();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Không thể lưu');
    } finally {
      setIsSaving(false);
    }
  };

  const money = (n) => Number(n).toLocaleString('vi-VN');

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

  if (!apartment) {
    return <div className="text-center py-12">Không tìm thấy căn hộ</div>;
  }

  const payHistoryBadge = (status) => {
    const badges = {
      paid: 'bg-green-100 text-green-800',
      partial: 'bg-yellow-100 text-yellow-800',
      unpaid: 'bg-red-100 text-red-800',
    };
    const labels = { paid: 'Xong', partial: '1 phần', unpaid: 'Chưa' };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badges[status] || badges.unpaid}`}>
        {labels[status] || status}
      </span>
    );
  };

  const historyList = (items) => (
    <div className="space-y-2 max-h-64 overflow-y-auto">
      {items.map((p) => (
        <div key={p.id} className="flex items-center justify-between pb-2 border-b border-gray-100 last:border-0 text-sm">
          <span className="text-gray-700">T{parseInt(p.month.split('-')[1])}/{p.month.split('-')[0]}</span>
          <span className="font-semibold text-gray-900">{money(p.amountPaid)} đ</span>
          {payHistoryBadge(p.status)}
        </div>
      ))}
    </div>
  );

  const disabled = !isManager;

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/apartments')}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
      >
        <ArrowLeft size={20} />
        Quay lại danh sách căn hộ
      </button>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-3 rounded-lg">
            <Building2 className="text-blue-600" size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{apartment.name}</h1>
            <p className="text-gray-600 mt-1">
              {apartment.bedrooms ? `${apartment.bedrooms}PN` : ''}
              {apartment.area ? ` · ${apartment.area}m²` : ''}
              {apartment.rentalForm ? ` · ${apartment.rentalForm}` : ''}
              {apartment.managementType === 'manage' ? ' · Quản lý hộ' : ' · Thuê lại'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {apartment.zaloLink?.startsWith('http') && (
            <a href={apartment.zaloLink} target="_blank" rel="noreferrer"
              className="btn-secondary flex items-center gap-1 text-sm">
              <ExternalLink size={14} /> Zalo nhóm
            </a>
          )}
          {apartment.qrLink?.startsWith('http') && (
            <a href={apartment.qrLink} target="_blank" rel="noreferrer"
              className="btn-secondary flex items-center gap-1 text-sm">
              <ExternalLink size={14} /> QR thanh toán
            </a>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form hồ sơ */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSave} className="space-y-6">
            {/* Thông tin căn */}
            <div className="bg-white rounded-lg shadow p-6 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 pb-3 border-b border-gray-200 flex items-center gap-2">
                <Home size={18} className="text-blue-600" /> Thông Tin Căn
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <FormInput label="Phòng Ngủ" name="bedrooms" type="number" value={form.bedrooms}
                  onChange={handleChange} disabled={disabled} />
                <FormInput label="Diện Tích (m²)" name="area" type="number" value={form.area}
                  onChange={handleChange} disabled={disabled} />
                <FormInput label="Mã Điện" name="electricCode" value={form.electricCode}
                  onChange={handleChange} disabled={disabled} />
                <FormInput label="Mã Nước" name="waterCode" value={form.waterCode}
                  onChange={handleChange} disabled={disabled} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormInput label="Mã Căn (đổi tên sẽ áp dụng toàn hệ thống)" name="name" value={form.name}

                  onChange={handleChange} required />
                <FormSelect label="Trạng Thái" name="aptStatus" value={form.aptStatus}
                  onChange={handleChange} disabled={disabled}
                  options={[
                    { label: '— Chưa đặt —', value: '' },
                    { label: 'Đang thuê', value: 'Đang thuê' },
                    { label: 'Đang trống', value: 'Đang trống' },
                    { label: 'Sắp hết hạn', value: 'Sắp hết hạn' },
                    { label: 'Ngưng quản lý', value: 'Ngưng quản lý' },
                  ]} />
                <FormSelect label="Mô Hình" name="managementType" value={form.managementType}
                  onChange={handleChange} disabled={disabled}
                  options={[
                    { label: 'Thuê lại (ăn chênh lệch)', value: 'sublease' },
                    { label: 'Quản lý hộ (ăn phí)', value: 'manage' },
                  ]} />
              </div>
              <FormInput label="Dự Án (VD: Masteri Thảo Điền)" name="projectName" value={form.projectName}
                onChange={handleChange} />
              <FormInput label="Link Bản Đồ (Google Maps)" name="mapLink" value={form.mapLink}
                onChange={handleChange} placeholder="Dán link chia sẻ vị trí từ Google Maps" />
              <FormInput label="Địa Chỉ" name="address" value={form.address}
                onChange={handleChange} disabled={disabled} />
            </div>

            {/* HĐ Chủ Nhà */}
            <div className="bg-white rounded-lg shadow p-6 space-y-4 border-l-4 border-orange-400">
              <h2 className="text-lg font-semibold text-gray-900 pb-3 border-b border-gray-200 flex items-center gap-2">
                <User size={18} className="text-orange-600" /> Hợp Đồng Với Chủ Nhà
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormInput label="Tên Chủ Nhà" name="ownerName" value={form.ownerName}
                  onChange={handleChange} disabled={disabled} />
                <FormInput label="SĐT Chủ Nhà" name="ownerPhone" value={form.ownerPhone}
                  onChange={handleChange} disabled={disabled} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormInput label="Passport / Giấy Tờ" name="ownerPassport" value={form.ownerPassport}
                  onChange={handleChange} disabled={disabled} />
                <FormInput label="Tài Khoản Ngân Hàng" name="ownerBank" value={form.ownerBank}
                  onChange={handleChange} disabled={disabled} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormInput label="Tiền Trả Chủ / Tháng (đ)" name="ownerRent" type="number"
                  value={form.ownerRent} onChange={handleChange} disabled={disabled} />
                <FormInput label="Cọc Cho Chủ (đ)" name="ownerDeposit" type="number"
                  value={form.ownerDeposit} onChange={handleChange} disabled={disabled} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormInput label="HĐ Từ" name="ownerContractStart" type="date"
                  value={form.ownerContractStart} onChange={handleChange} disabled={disabled} />
                <FormInput label="HĐ Đến" name="ownerContractEnd" type="date"
                  value={form.ownerContractEnd} onChange={handleChange} disabled={disabled} />
                <FormInput label="Ghi Chú Kỳ Trả" name="ownerPaymentNote" value={form.ownerPaymentNote}
                  onChange={handleChange} disabled={disabled} placeholder="VD: 3 tháng/lần" />
              </div>
            </div>

            {/* HĐ Khách Thuê */}
            <div className="bg-white rounded-lg shadow p-6 space-y-4 border-l-4 border-green-400">
              <h2 className="text-lg font-semibold text-gray-900 pb-3 border-b border-gray-200 flex items-center gap-2">
                <User size={18} className="text-green-600" /> Hợp Đồng Với Khách Thuê
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormInput label="Tên Khách Thuê" name="tenantName" value={form.tenantName}
                  onChange={handleChange} disabled={disabled} />
                <FormInput label="SĐT Khách" name="tenantPhone" value={form.tenantPhone}
                  onChange={handleChange} disabled={disabled} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormInput label="Giá Thuê Khách / Tháng (đ)" name="rentAmount" type="number"
                  value={form.rentAmount} onChange={handleChange} disabled={disabled} />
                <FormInput label="Cọc Của Khách (đ)" name="deposit" type="number"
                  value={form.deposit} onChange={handleChange} disabled={disabled} />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <FormInput label="HĐ Từ" name="contractStart" type="date"
                  value={form.contractStart} onChange={handleChange} disabled={disabled} />
                <FormInput label="HĐ Đến" name="contractEnd" type="date"
                  value={form.contractEnd} onChange={handleChange} disabled={disabled} />
                <FormInput label="Ngày Thu (1-28)" name="paymentDay" type="number"
                  value={form.paymentDay} onChange={handleChange} disabled={disabled} />
                <FormInput label="Ghi Chú Thu" name="paymentNote" value={form.paymentNote}
                  onChange={handleChange} disabled={disabled} placeholder="VD: 1-5 (trễ)" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormSelect label="Hình Thức Thuê" name="rentalForm" value={form.rentalForm}
                  onChange={handleChange} disabled={disabled}
                  options={[
                    { label: '— Chưa đặt —', value: '' },
                    { label: 'Net (khách tự đóng PQL)', value: 'Net' },
                    { label: 'Bao phí quản lý (chủ đóng)', value: 'Bao phí quản lý' },
                  ]} />
                <FormInput label="Phí QL Chung Cư (đ)" name="buildingFee" type="number"
                  value={form.buildingFee} onChange={handleChange} disabled={disabled} />
                <FormInput label="Phí Cty Hưởng (đ, căn QL hộ)" name="companyFee" type="number"
                  value={form.companyFee} onChange={handleChange} disabled={disabled} />
              </div>
            </div>

            {/* Links + ghi chú */}
            <div className="bg-white rounded-lg shadow p-6 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 pb-3 border-b border-gray-200">
                Liên Kết & Ghi Chú
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormInput label="Link Ảnh Căn" name="imageLink" value={form.imageLink}
                  onChange={handleChange} disabled={disabled} />
                <FormInput label="Link Zalo Nhóm" name="zaloLink" value={form.zaloLink}
                  onChange={handleChange} disabled={disabled} />
                <FormInput label="Link Hợp Đồng" name="contractLink" value={form.contractLink}
                  onChange={handleChange} disabled={disabled} />
                <FormInput label="Link QR Thanh Toán" name="qrLink" value={form.qrLink}
                  onChange={handleChange} disabled={disabled} />
              </div>
              <FormTextarea label="Ghi Chú" name="notes" value={form.notes}
                onChange={handleChange} rows={2} disabled={disabled} />
            </div>

            {isManager && (
              <Button type="submit" variant="primary" icon={Save} loading={isSaving}>
                Lưu Hồ Sơ
              </Button>
            )}

            {isManager && (
              <button
                type="button"
                onClick={async () => {
                  if (!window.confirm(`Xóa căn ${apartment.name}? Toàn bộ hồ sơ, kỳ thu, tạm trú của căn sẽ bị xóa. Không thể hoàn tác.`)) return;
                  try {
                    await apartmentService.remove(id);
                    toast.success('Đã xóa căn hộ');
                    navigate('/apartments');
                  } catch (error) {
                    toast.error(error.response?.data?.error || 'Không thể xóa');
                  }
                }}
                className="w-full flex items-center justify-center gap-2 text-red-600 text-sm py-2 hover:bg-red-50 rounded-lg border border-red-100"
              >
                <Trash2 size={16} />
                Xóa căn hộ này
              </button>
            )}
          </form>
        </div>

        {/* Sidebar: tóm tắt + lịch sử */}
        <div className="space-y-4">
          {/* Tóm tắt tài chính */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-3 text-sm">Tài Chính / Tháng</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-700">Thu khách:</span>
                <span className="font-semibold text-green-700">+{money(apartment.rentAmount || 0)} đ</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Trả chủ:</span>
                <span className="font-semibold text-orange-700">-{money(apartment.ownerRent || 0)} đ</span>
              </div>
              {apartment.companyFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-blue-700">Phí cty hưởng:</span>
                  <span className="font-semibold text-green-700">+{money(apartment.companyFee)} đ</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-blue-200">
                <span className="text-blue-900 font-semibold">Chênh lệch:</span>
                <span className={`font-bold ${(apartment.grossMargin || 0) >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                  {money((apartment.grossMargin || 0) + (apartment.companyFee || 0))} đ
                </span>
              </div>
            </div>
          </div>

          {/* Lịch sử thu khách */}
          <div className="bg-white rounded-lg shadow p-5">
            <h3 className="font-bold text-gray-900 mb-3 text-sm">🟢 Lịch Sử Thu Khách</h3>
            {apartment.payments.length === 0
              ? <p className="text-sm text-gray-500">Chưa có kỳ thu nào.</p>
              : historyList(apartment.payments)}
          </div>

          {/* Lịch sử trả chủ */}
          <div className="bg-white rounded-lg shadow p-5">
            <h3 className="font-bold text-gray-900 mb-3 text-sm">🟠 Lịch Sử Trả Chủ Nhà</h3>
            {(apartment.ownerPayments || []).length === 0
              ? <p className="text-sm text-gray-500">Chưa có kỳ trả nào.</p>
              : historyList(apartment.ownerPayments)}
          </div>
        </div>
      </div>
    </div>
  );
}
