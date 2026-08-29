/**
 * Expenses Page v2 - Chi phí phát sinh
 * Path: src/pages/expenses/ExpensesPage.jsx
 *
 * KT: lịch sử chi phí của mình (lọc thời gian + trạng thái)
 * VP/QL: tab Chờ duyệt (duyệt/từ chối, xem ảnh) / Tất cả / Cần hoàn tiền
 */

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, DollarSign, Image as ImageIcon } from 'lucide-react';
import api from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';

function money(v) { return Number(v || 0).toLocaleString('vi-VN'); }
function fmtD(d) { return d ? new Date(d).toLocaleDateString('vi-VN') : '—'; }

const ST = {
  pending: ['Chờ duyệt', 'badge-warning'],
  approved: ['Đã duyệt', 'badge-success'],
  rejected: ['Từ chối', 'badge-danger'],
};

export default function ExpensesPage() {
  const { user } = useAuthStore();
  const isManager = ['QL', 'VP'].includes(user?.role);

  const [tab, setTab] = useState(isManager ? 'pending' : 'all');
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (tab === 'pending') params.status = 'pending';
      if (tab === 'reimburse') params.needReimburse = '1';
      if (tab === 'all' || !isManager) {
        const [y, m] = month.split('-').map(Number);
        params.from = `${month}-01`;
        params.to = `${month}-${String(new Date(y, m, 0).getDate()).padStart(2, '0')}`;
      }
      const res = await api.get('/expenses', { params });
      setRows(res.data.data.expenses);
      setSummary(res.data.data.summary);
    } catch {
      toast.error('Không thể tải chi phí');
    } finally {
      setLoading(false);
    }
  }, [tab, month, isManager]);

  useEffect(() => { load(); }, [load]);

  const act = async (id, action, body = {}) => {
    try {
      await api.post(`/expenses/${id}/${action}`, body);
      toast.success(action === 'approve' ? 'Đã duyệt — khoản chi đã ghi vào Quỹ' : action === 'reject' ? 'Đã từ chối' : 'Đã đánh dấu hoàn tiền');
      load();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Không thể thực hiện');
    }
  };

  const total = rows.reduce((s, x) => s + Number(x.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <DollarSign className="text-blue-600" size={26} /> Chi Phí
          </h1>
          <p className="text-gray-600 mt-1">
            {isManager ? 'Duyệt chi phí nhân viên — duyệt xong tự ghi vào sổ Quỹ' : 'Chi phí phát sinh của bạn'}
          </p>
        </div>
        <Link to="/expenses/new" className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Nhập Chi Phí
        </Link>
      </div>

      {isManager && (
        <div className="flex gap-2 flex-wrap">
          {[
            ['pending', `Chờ duyệt${summary?.pending ? ` (${summary.pending})` : ''}`],
            ['all', 'Tất cả'],
            ['reimburse', `Cần hoàn tiền${summary?.toReimburse ? ` (${summary.toReimburse})` : ''}`],
          ].map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)}
              className={`px-4 py-2 rounded-full text-sm font-medium ${tab === k ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-300'}`}>
              {label}
            </button>
          ))}
        </div>
      )}

      {(tab === 'all' || !isManager) && (
        <div className="flex items-center gap-3 flex-wrap">
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="input-field !w-auto" />
          <span className="text-sm text-gray-500">Tổng: <b className="text-gray-900">{money(total)} đ</b> · {rows.length} khoản</span>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="skeleton h-24 w-full rounded-lg" />)}</div>
      ) : rows.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          {tab === 'pending' ? 'Không có khoản nào chờ duyệt 🎉' : tab === 'reimburse' ? 'Không có khoản nào cần hoàn tiền' : 'Chưa có chi phí nào trong kỳ'}
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((x) => {
            const st = ST[x.status] || ST.pending;
            return (
              <div key={x.id} className="bg-white rounded-lg shadow p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900">{x.name}</div>
                    <div className="text-sm text-gray-500 mt-0.5">
                      {fmtD(x.date)} · {x.projectName || 'Văn phòng'}
                      {x.fundCategoryName && <> · {x.fundCategoryName}</>}
                      {isManager && x.createdBy && <> · <b>{x.createdBy}</b></>}
                    </div>
                    {x.rejectedReason && <div className="text-xs text-red-500 mt-1">Lý do từ chối: {x.rejectedReason}</div>}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold text-gray-900">{money(x.amount)} đ</div>
                    <span className={`${st[1]} !text-[10px] !px-2 !py-0.5`}>{st[0]}</span>
                    {x.needReimburse && (
                      <div className={`text-[10px] font-medium mt-0.5 ${x.reimbursedAt ? 'text-green-600' : 'text-orange-500'}`}>
                        {x.reimbursedAt ? '✓ Đã hoàn tiền' : '💰 Chi tiền túi'}
                      </div>
                    )}
                  </div>
                </div>

                {(x.imagePath || (isManager && x.status === 'pending') || (isManager && tab === 'reimburse')) && (
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 flex-wrap">
                    {x.imagePath && (
                      <a href={`/api/uploads/${x.imagePath}`} target="_blank" rel="noreferrer"
                        className="flex items-center gap-1.5 text-blue-600 text-sm font-medium bg-blue-50 px-3 py-1.5 rounded-lg">
                        <ImageIcon size={15} /> Xem ảnh CK
                      </a>
                    )}
                    {isManager && x.status === 'pending' && (
                      <>
                        <button onClick={() => act(x.id, 'approve')}
                          className="text-sm px-3 py-1.5 rounded-lg bg-green-600 text-white font-medium">
                          ✓ Duyệt → vào Quỹ
                        </button>
                        <button onClick={() => {
                          const reason = window.prompt('Lý do từ chối (nhân viên sẽ thấy):');
                          if (reason !== null) act(x.id, 'reject', { reason });
                        }} className="text-sm px-3 py-1.5 rounded-lg bg-red-100 text-red-600 font-medium">
                          Từ chối
                        </button>
                      </>
                    )}
                    {isManager && x.needReimburse && x.status === 'approved' && !x.reimbursedAt && (
                      <button onClick={() => act(x.id, 'reimburse')}
                        className="text-sm px-3 py-1.5 rounded-lg bg-orange-500 text-white font-medium">
                        Đã chuyển hoàn tiền
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
