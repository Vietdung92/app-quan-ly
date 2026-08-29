/**
 * Fund Create Page - Thêm giao dịch thu chi
 * Path: src/pages/funds/FundCreatePage.jsx
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Wallet } from 'lucide-react';
import FormInput from '../../components/common/FormInput';
import FormSelect from '../../components/common/FormSelect';
import FormTextarea from '../../components/common/FormTextarea';
import Button from '../../components/common/Button';
import ProjectPicker from '../../components/common/ProjectPicker';
import useForm, { rules } from '../../hooks/useForm';
import fundService from '../../services/fundService';
import toast from 'react-hot-toast';

export default function FundCreatePage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [meta, setMeta] = useState({ groups: [], objects: [], categories: [], people: [] });
  const [pickedProjectId, setPickedProjectId] = useState('');

  useEffect(() => {
    fundService.getMeta()
      .then((res) => setMeta(res.data))
      .catch(() => toast.error('Không thể tải danh mục'));
  }, []);

  const { formData, errors, handleChange, handleBlur, handleSubmit, setFieldValue } = useForm(
    {
      type: 'Chi',
      date: new Date().toISOString().split('T')[0],
      groupId: '',
      objectId: '',
      categoryId: '',
      amount: '',
      person: '',
      reimburse: '',
      notes: '',
    },
    async (data) => {
      setIsLoading(true);
      try {
        await fundService.create({
          ...data,
          groupId: parseInt(data.groupId),
          objectId: data.objectId ? parseInt(data.objectId) : null,
          categoryId: data.categoryId ? parseInt(data.categoryId) : null,
          amount: parseInt(data.amount),
          reimburse: data.reimburse || null,
        });
        toast.success('Đã thêm giao dịch');
        navigate('/funds');
      } catch (error) {
        toast.error(error.response?.data?.error || 'Không thể thêm giao dịch');
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    {
      groupId: rules.required('Nhóm'),
      amount: rules.combine(
        rules.required('Số tiền'),
        rules.positiveNumber('Số tiền')
      ),
      date: rules.required('Ngày'),
    }
  );

  const isProjectGroup = meta.groups.find((g) => String(g.id) === String(formData.groupId))?.name === 'Dự án';

  // Đối tượng và hạng mục lọc theo nhóm + loại đã chọn
  const groupObjects = meta.objects.filter((o) => String(o.groupId) === String(formData.groupId));
  const groupCategories = meta.categories.filter(
    (c) => String(c.groupId) === String(formData.groupId) && c.type === formData.type
  );

  const handleGroupChange = (e) => {
    handleChange(e);
    setFieldValue('objectId', '');
    setFieldValue('categoryId', '');
  };

  const handleTypeChange = (e) => {
    handleChange(e);
    setFieldValue('categoryId', '');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <button
        onClick={() => navigate('/funds')}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
      >
        <ArrowLeft size={20} />
        Quay lại
      </button>

      {/* Form */}
      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-blue-100 p-3 rounded-lg">
            <Wallet className="text-blue-600" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Thêm Giao Dịch</h1>
            <p className="text-gray-600 text-sm">Ghi nhận khoản thu hoặc chi mới</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Loại Thu/Chi - nút lớn dễ bấm trên điện thoại */}
          <div>
            <label className="label-field">Loại Giao Dịch</label>
            <div className="grid grid-cols-2 gap-3 mt-1">
              {['Chi', 'Thu'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleTypeChange({ target: { name: 'type', value: t } })}
                  className={`py-3 rounded-lg font-semibold border-2 transition ${
                    formData.type === t
                      ? t === 'Thu'
                        ? 'border-green-600 bg-green-50 text-green-700'
                        : 'border-red-600 bg-red-50 text-red-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {t === 'Thu' ? '↑ Khoản Thu' : '↓ Khoản Chi'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              label="Số Tiền (đ)"
              name="amount"
              type="number"
              value={formData.amount}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.amount}
              placeholder="VD: 500000"
              required
            />

            <FormInput
              label="Ngày"
              name="date"
              type="date"
              value={formData.date}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.date}
              required
            />
          </div>

          <FormSelect
            label="Nhóm"
            name="groupId"
            value={formData.groupId}
            onChange={handleGroupChange}
            error={errors.groupId}
            options={meta.groups.map((g) => ({ label: g.name, value: String(g.id) }))}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {isProjectGroup ? (
              <ProjectPicker
                value={pickedProjectId}
                onChange={(id, project) => {
                  setPickedProjectId(id);
                  // Đồng bộ: chọn dự án → đối tượng Quỹ trùng tên
                  const obj = project
                    ? meta.objects.find((o) => String(o.groupId) === String(formData.groupId) && o.name === project.name)
                    : null;
                  setFieldValue('objectId', obj ? String(obj.id) : '');
                  if (project && !obj) {
                    // Đối tượng Quỹ vừa được backend tạo kèm dự án — tải lại danh mục
                    fundService.getMeta().then((res) => {
                      setMeta(res.data);
                      const o2 = res.data.objects.find((o) => String(o.groupId) === String(formData.groupId) && o.name === project.name);
                      if (o2) setFieldValue('objectId', String(o2.id));
                    }).catch(() => {});
                  }
                }}
                label="Dự Án"
                placeholder="Gõ tên dự án..."
              />
            ) : (
            <FormSelect
              label="Đối Tượng (căn hộ/dự án)"
              name="objectId"
              value={formData.objectId}
              onChange={handleChange}
              options={[
                { label: '— Không chọn —', value: '' },
                ...groupObjects.map((o) => ({ label: o.name, value: String(o.id) })),
              ]}
              disabled={!formData.groupId}
            />
            )}

            <FormSelect
              label="Hạng Mục"
              name="categoryId"
              value={formData.categoryId}
              onChange={handleChange}
              options={[
                { label: '— Không chọn —', value: '' },
                ...groupCategories.map((c) => ({ label: c.name, value: String(c.id) })),
              ]}
              disabled={!formData.groupId}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormSelect
              label="Người Chi/Nộp"
              name="person"
              value={formData.person}
              onChange={handleChange}
              options={[
                { label: '— Chọn người —', value: '' },
                ...meta.people.map((p) => ({ label: p, value: p })),
              ]}
            />

            <FormSelect
              label="Hoàn Trả"
              name="reimburse"
              value={formData.reimburse}
              onChange={handleChange}
              options={[
                { label: 'Không áp dụng', value: '' },
                { label: 'Đã hoàn', value: 'Đã hoàn' },
                { label: 'Chưa hoàn', value: 'Chưa hoàn' },
              ]}
            />
          </div>

          <FormTextarea
            label="Ghi Chú"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="VD: Bill điện The Sóng tháng 8"
            rows={2}
            maxLength={500}
          />

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button type="submit" variant="primary" loading={isLoading} fullWidth>
              Lưu Giao Dịch
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/funds')}
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
