/**
 * Expense Create v2 - Nhập chi phí phát sinh (KT/VP/QL)
 * Path: src/pages/expenses/ExpenseCreatePage.jsx
 *
 * Dự án chọn bằng ô gõ gợi ý (hoặc Văn phòng), hạng mục theo danh mục Chi của Quỹ,
 * chụp/tải ảnh chuyển khoản → gửi Telegram [CHỜ DUYỆT] ngay khi lưu.
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, DollarSign, Camera, X } from 'lucide-react';
import ProjectPicker from '../../components/common/ProjectPicker';
import Button from '../../components/common/Button';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function ExpenseCreatePage() {
  const navigate = useNavigate();
  const [meta, setMeta] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    name: '',
    projectId: '',
    fundCategoryId: '',
    amount: '',
    needReimburse: false,
    notes: '',
  });
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    api.get('/expenses/meta')
      .then((res) => setMeta(res.data.data))
      .catch(() => toast.error('Không thể tải danh mục'));
  }, []);

  const groupId = form.projectId === 'office' ? meta?.officeGroupId : meta?.projectGroupId;
  const categories = (meta?.categories || []).filter((c) => c.groupId === groupId);

  const pickPhoto = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) { toast.error('Ảnh tối đa 10MB'); return; }
    setPhoto(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Vui lòng nhập nội dung chi'); return; }
    if (!form.amount || Number(form.amount) <= 0) { toast.error('Vui lòng nhập số tiền hợp lệ'); return; }
    if (!form.projectId) { toast.error('Vui lòng chọn dự án hoặc Văn phòng'); return; }

    setIsLoading(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name.trim());
      fd.append('amount', form.amount);
      fd.append('date', form.date);
      if (form.projectId !== 'office') fd.append('projectId', form.projectId);
      if (form.fundCategoryId) fd.append('fundCategoryId', form.fundCategoryId);
      fd.append('needReimburse', form.needReimburse ? 'true' : 'false');
      if (form.notes) fd.append('notes', form.notes);
      if (photo) fd.append('photo', photo);

      await api.post('/expenses', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Đã gửi chi phí — chờ Văn phòng/Quản lý duyệt');
      navigate('/expenses');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Không thể lưu chi phí');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/expenses')} className="flex items-center gap-2 text-blue-600 hover:text-blue-700">
        <ArrowLeft size={20} /> Quay lại
      </button>

      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-blue-100 p-3 rounded-lg"><DollarSign className="text-blue-600" size={24} /></div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Nhập Chi Phí</h1>
            <p className="text-gray-600 text-sm">Ảnh + thông tin gửi Telegram ngay, duyệt xong tự vào sổ Quỹ</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label-field">Ngày Chi <span className="text-red-500">*</span></label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="input-field" required />
            </div>
            <div>
              <label className="label-field">Số Tiền (đ) <span className="text-red-500">*</span></label>
              <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="input-field" placeholder="VD: 850000" required />
            </div>
          </div>

          <div>
            <label className="label-field">Nội Dung Chi <span className="text-red-500">*</span></label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" placeholder="VD: Mua sơn nước Dulux 5L" required />
          </div>

          <ProjectPicker
            value={form.projectId}
            onChange={(id) => setForm({ ...form, projectId: id, fundCategoryId: '' })}
            allowOffice
            required
            label="Dự Án / Văn Phòng"
            placeholder="Gõ tên dự án để tìm..."
          />

          <div>
            <label className="label-field">Hạng Mục</label>
            <select
              value={form.fundCategoryId}
              onChange={(e) => setForm({ ...form, fundCategoryId: e.target.value })}
              className="select-field"
              disabled={!form.projectId}
            >
              <option value="">— Chọn hạng mục —</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <label className="flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-lg p-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.needReimburse}
              onChange={(e) => setForm({ ...form, needReimburse: e.target.checked })}
              className="w-5 h-5 accent-orange-500"
            />
            <span className="text-sm text-orange-900">
              <b>Chi tiền túi</b> — công ty cần hoàn trả lại cho tôi
            </span>
          </label>

          <div>
            <label className="label-field">Ảnh Chuyển Khoản / Hóa Đơn</label>
            <input ref={inputRef} type="file" accept="image/*" capture="environment" onChange={pickPhoto} className="hidden" id="expense-photo" />
            {!preview ? (
              <label htmlFor="expense-photo"
                className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg py-6 text-gray-500 cursor-pointer hover:border-blue-400 hover:text-blue-600">
                <Camera size={20} /> Chụp / Chọn Ảnh
              </label>
            ) : (
              <div className="relative">
                <img src={preview} alt="preview" className="w-full max-h-64 object-contain rounded-lg bg-gray-50" />
                <button type="button"
                  onClick={() => { setPhoto(null); setPreview(null); if (inputRef.current) inputRef.current.value = ''; }}
                  className="absolute top-2 right-2 bg-white rounded-full p-1.5 shadow text-gray-500 hover:text-red-500">
                  <X size={16} />
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="label-field">Ghi Chú</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input-field" rows={2} maxLength={500} />
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button type="submit" variant="primary" loading={isLoading} fullWidth>Gửi Chi Phí</Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/expenses')} fullWidth>Hủy</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
