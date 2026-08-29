/**
 * Repairs Page - Quản lý báo hỏng (NỘI BỘ) + tài khoản khách thuê
 * Path: src/pages/repairs/RepairsPage.jsx
 */

import { useState, useEffect, useCallback } from 'react';
import { Wrench, Users, Copy } from 'lucide-react';
import api from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';

const CAT_LABEL = {
  electric: 'Điện', water: 'Nước', aircon: 'Máy lạnh',
  lock: 'Khóa cửa', furniture: 'Nội thất', other: 'Khác',
};
const STATUS = [
  { value: 'new', label: 'Mới', cls: 'bg-blue-100 text-blue-700' },
  { value: 'received', label: 'Đã tiếp nhận', cls: 'bg-indigo-100 text-indigo-700' },
  { value: 'in_progress', label: 'Đang xử lý', cls: 'bg-yellow-100 text-yellow-800' },
  { value: 'done', label: 'Hoàn thành', cls: 'bg-green-100 text-green-700' },
  { value: 'cancelled', label: 'Hủy', cls: 'bg-gray-100 text-gray-600' },
];
const statusOf = (v) => STATUS.find((s) => s.value === v) || STATUS[0];

export default function RepairsPage() {
  const { user } = useAuthStore();
  const isManager = ['QL', 'VP'].includes(user?.role);

  const [tab, setTab] = useState('repairs');
  const [repairs, setRepairs] = useState([]);
  const [summary, setSummary] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/repairs');
      setRepairs(res.data.data.repairs);
      setSummary(res.data.data.summary);
      if (isManager) {
        const [empRes, tenRes] = await Promise.all([
          api.get('/employees'),
          api.get('/repairs/tenants/list'),
        ]);
        setEmployees(empRes.data.data);
        setTenants(tenRes.data.data);
      }
    } catch {
      toast.error('Không thể tải dữ liệu báo hỏng');
    } finally {
      setLoading(false);
    }
  }, [isManager]);

  useEffect(() => { load(); }, [load]);

  const updateRepair = async (id, data) => {
    try {
      await api.put(`/repairs/${id}`, data);
      toast.success('Đã cập nhật');
      load();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Không thể cập nhật');
    }
  };

  const createAccount = async (objectId, apartment) => {
    const login = window.prompt(`Tên đăng nhập cho khách căn ${apartment} (email hoặc SĐT):`);
    if (!login) return;
    const password = window.prompt('Mật khẩu tạm (tối thiểu 6 ký tự) — gửi cho khách qua Zalo:');
    if (!password) return;
    try {
      await api.post('/repairs/tenants', { objectId, login: login.trim(), password });
      toast.success('Đã cấp tài khoản');
      load();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Không thể tạo tài khoản');
    }
  };

  const resetPassword = async (accountId, login) => {
    const password = window.prompt(`Mật khẩu MỚI cho ${login}:`);
    if (!password) return;
    try {
      await api.put(`/repairs/tenants/${accountId}`, { password });
      toast.success('Đã đặt lại mật khẩu');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Không thể đặt lại');
    }
  };

  const portalUrl = `${window.location.origin}/portal/login`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Wrench className="text-blue-600" size={26} />
            Báo Hỏng
          </h1>
          <p className="text-gray-600 mt-1">Yêu cầu sửa chữa từ khách thuê qua portal</p>
        </div>
        {summary && (
          <div className="flex gap-2 text-sm">
            <span className="badge-info">Mới: {summary.new}</span>
            <span className="badge-warning">Đang xử lý: {summary.inProgress}</span>
            <span className="badge-success">Xong: {summary.done}</span>
          </div>
        )}
      </div>

      {isManager && (
        <div className="flex gap-2">
          <button onClick={() => setTab('repairs')} className={`px-4 py-2 rounded-full text-sm font-medium ${tab === 'repairs' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-300'}`}>
            Yêu cầu báo hỏng
          </button>
          <button onClick={() => setTab('accounts')} className={`px-4 py-2 rounded-full text-sm font-medium ${tab === 'accounts' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-300'}`}>
            <Users size={14} className="inline mr-1" />
            Tài khoản khách
          </button>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="skeleton h-24 w-full rounded-lg" />)}</div>
      ) : tab === 'repairs' ? (
        repairs.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            Chưa có yêu cầu báo hỏng nào. Khách gửi qua portal sẽ hiện ở đây + báo Telegram.
          </div>
        ) : (
          <div className="space-y-3">
            {repairs.map((r) => {
              const st = statusOf(r.status);
              const closed = ['done', 'cancelled'].includes(r.status);
              return (
                <div key={r.id} className={`bg-white rounded-lg shadow p-4 ${closed ? 'opacity-70' : ''}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-900">
                        Căn {r.apartment}
                        <span className="text-gray-400 font-normal text-sm"> · {CAT_LABEL[r.category] || r.category} · {new Date(r.createdAt).toLocaleDateString('vi-VN')}</span>
                      </div>
                      <div className="text-sm text-gray-700 mt-1">{r.description}</div>
                      {r.imageLink && (
                        <a href={r.imageLink} target="_blank" rel="noreferrer" className="text-blue-600 text-sm">Xem ảnh →</a>
                      )}
                      {r.staffNotes && <div className="text-xs text-gray-400 mt-1">Ghi chú: {r.staffNotes}</div>}
                    </div>
                    <span className={`shrink-0 text-xs font-medium px-2 py-1 rounded-full ${st.cls}`}>{st.label}</span>
                  </div>

                  {!closed && (
                    <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                      {isManager && (
                        <select
                          value={r.assignedTo || ''}
                          onChange={(e) => updateRepair(r.id, { assignedTo: e.target.value || null, status: r.status === 'new' ? 'received' : undefined })}
                          className="select-field !w-auto text-sm"
                        >
                          <option value="">— Giao cho —</option>
                          {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.fullName || emp.full_name}</option>)}
                        </select>
                      )}
                      {r.assignedName && <span className="text-sm text-gray-500">👷 {r.assignedName}</span>}
                      {r.status !== 'in_progress' && (
                        <button onClick={() => updateRepair(r.id, { status: 'in_progress' })} className="text-sm px-3 py-1.5 rounded-lg bg-yellow-100 text-yellow-800 font-medium">
                          Bắt đầu xử lý
                        </button>
                      )}
                      <button
                        onClick={() => {
                          const notes = window.prompt('Ghi chú hoàn thành (khách sẽ thấy):', r.staffNotes || '');
                          if (notes !== null) updateRepair(r.id, { status: 'done', staffNotes: notes });
                        }}
                        className="text-sm px-3 py-1.5 rounded-lg bg-green-100 text-green-700 font-medium"
                      >
                        ✓ Hoàn thành
                      </button>
                      {isManager && (
                        <button onClick={() => updateRepair(r.id, { status: 'cancelled' })} className="text-sm px-3 py-1.5 rounded-lg bg-gray-100 text-gray-500">
                          Hủy
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      ) : (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900 flex items-center justify-between flex-wrap gap-2">
            <span>Link portal gửi cho khách: <b>{portalUrl}</b></span>
            <button
              onClick={() => { navigator.clipboard?.writeText(portalUrl); toast.success('Đã copy link'); }}
              className="flex items-center gap-1 text-blue-700 font-medium"
            >
              <Copy size={14} /> Copy
            </button>
          </div>
          <div className="bg-white rounded-lg shadow divide-y divide-gray-100">
            {tenants.map((t) => (
              <div key={t.objectId} className="p-4 flex items-center justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <b className="text-gray-900">{t.apartment}</b>
                  <span className="text-sm text-gray-500"> · {t.tenantName || 'trống'}</span>
                  {t.login && (
                    <div className="text-sm text-gray-500">
                      {t.login}
                      {t.lastLogin
                        ? <span className="text-green-600"> · đã dùng {new Date(t.lastLogin).toLocaleDateString('vi-VN')}</span>
                        : <span className="text-gray-400"> · chưa đăng nhập lần nào</span>}
                    </div>
                  )}
                </div>
                {t.accountId ? (
                  <button onClick={() => resetPassword(t.accountId, t.login)} className="text-sm px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 font-medium">
                    Đặt lại mật khẩu
                  </button>
                ) : (
                  <button onClick={() => createAccount(t.objectId, t.apartment)} className="text-sm px-3 py-1.5 rounded-lg bg-blue-600 text-white font-medium">
                    Cấp tài khoản
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
