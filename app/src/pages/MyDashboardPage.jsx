/**
 * My Dashboard - Tổng quan CÁ NHÂN cho nhân viên Kỹ thuật
 * Path: src/pages/MyDashboardPage.jsx
 *
 * Chỉ hiện những gì liên quan tới chính nhân viên:
 * chấm công hôm nay, công việc (chưa xong/quá hạn), chi phí tháng
 * (đã duyệt hoàn/chờ duyệt), ứng lương còn nợ, nghỉ phép.
 */

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock, CheckSquare, DollarSign, TrendingUp, Calendar, AlertTriangle, LogIn, LogOut,
} from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';

function money(v) {
  return Number(v || 0).toLocaleString('vi-VN');
}

const PRIORITY_CLS = {
  high: 'badge-danger', medium: 'badge-warning', low: 'badge-info',
};

export default function MyDashboardPage() {
  const { user } = useAuthStore();
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/dashboard/my');
      setData(res.data.data);
    } catch {
      toast.error('Không thể tải dữ liệu');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const checkIn = async () => {
    setBusy(true);
    try {
      await api.post('/attendance/check-in');
      toast.success('Đã chấm công vào');
      load();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Không thể chấm công');
    } finally {
      setBusy(false);
    }
  };

  const checkOut = async () => {
    setBusy(true);
    try {
      await api.post('/attendance/check-out');
      toast.success('Đã chấm công ra');
      load();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Không thể chấm công');
    } finally {
      setBusy(false);
    }
  };

  if (!data) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => <div key={i} className="skeleton h-28 w-full rounded-lg" />)}
      </div>
    );
  }

  const att = data.attendanceToday;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Xin chào, {user?.fullName || user?.email}!</h1>
        <p className="text-gray-600 mt-1">Công việc và thông tin của bạn hôm nay</p>
      </div>

      {/* Chấm công */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2.5 rounded-lg"><Clock className="text-blue-600" size={22} /></div>
            <div>
              <div className="font-semibold text-gray-900">Chấm Công Hôm Nay</div>
              <div className="text-sm text-gray-500">
                {att?.checkIn ? `Vào: ${att.checkIn.slice(0, 5)}` : 'Chưa chấm công vào'}
                {att?.checkOut && ` · Ra: ${att.checkOut.slice(0, 5)}`}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {!att?.checkIn ? (
              <button onClick={checkIn} disabled={busy}
                className="btn-success flex items-center gap-1.5 disabled:opacity-60">
                <LogIn size={16} /> Chấm Công Vào
              </button>
            ) : !att?.checkOut ? (
              <button onClick={checkOut} disabled={busy}
                className="btn-secondary flex items-center gap-1.5 disabled:opacity-60">
                <LogOut size={16} /> Chấm Công Ra
              </button>
            ) : (
              <span className="badge-success">✓ Đủ công hôm nay</span>
            )}
          </div>
        </div>
      </div>

      {/* Số liệu nhanh */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Link to="/tasks" className="bg-white rounded-lg shadow p-4 block">
          <div className="flex items-center gap-2 text-gray-500 text-sm"><CheckSquare size={15} /> Việc chưa xong</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{data.tasks.pending}</div>
          {data.tasks.overdue > 0 && (
            <div className="text-xs text-red-600 font-medium mt-0.5">⚠ {data.tasks.overdue} việc quá hạn</div>
          )}
        </Link>
        <Link to="/expenses" className="bg-white rounded-lg shadow p-4 block">
          <div className="flex items-center gap-2 text-gray-500 text-sm"><DollarSign size={15} /> Chi phí tháng này</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{money(data.expenses.total)} đ</div>
          <div className="text-xs mt-0.5">
            <span className="text-green-600">Đã duyệt {money(data.expenses.approved)}</span>
            {data.expenses.pending > 0 && <span className="text-yellow-600"> · Chờ {money(data.expenses.pending)}</span>}
          </div>
        </Link>
        <Link to="/advances" className="bg-white rounded-lg shadow p-4 block">
          <div className="flex items-center gap-2 text-gray-500 text-sm"><TrendingUp size={15} /> Ứng lương còn nợ</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{money(data.advanceRemaining)} đ</div>
        </Link>
        <Link to="/leaves" className="bg-white rounded-lg shadow p-4 block">
          <div className="flex items-center gap-2 text-gray-500 text-sm"><Calendar size={15} /> Nghỉ phép</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{data.leaves.approved}</div>
          {data.leaves.pending > 0 && (
            <div className="text-xs text-yellow-600 mt-0.5">{data.leaves.pending} đơn chờ duyệt</div>
          )}
        </Link>
      </div>

      {/* Việc đang chờ */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-900">Việc Của Tôi</h2>
          <Link to="/tasks/new" className="text-blue-600 text-sm font-medium">+ Tạo việc mới</Link>
        </div>
        {data.taskList.length === 0 ? (
          <p className="text-sm text-gray-400">Không có việc nào đang chờ 🎉</p>
        ) : (
          <div className="space-y-2">
            {data.taskList.map((t) => (
              <Link key={t.id} to={`/tasks/${t.id}`}
                className={`flex items-center justify-between gap-2 border rounded-lg p-3 ${
                  t.isOverdue ? 'border-red-200 bg-red-50' : 'border-gray-100'
                }`}>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{t.title}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {t.dueDate ? `Hạn: ${new Date(t.dueDate).toLocaleDateString('vi-VN')}` : 'Không có hạn'}
                    {t.isOverdue && <span className="text-red-600 font-medium"> · QUÁ HẠN</span>}
                  </div>
                </div>
                <span className={PRIORITY_CLS[t.priority] || 'badge-info'}>
                  {t.priority === 'high' ? 'Gấp' : t.priority === 'medium' ? 'Vừa' : 'Thấp'}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
