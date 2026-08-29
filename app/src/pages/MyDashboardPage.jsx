/**
 * My Dashboard v2 - Tổng quan CÁ NHÂN (Kỹ thuật)
 * Path: src/pages/MyDashboardPage.jsx
 *
 * Chấm công tại chỗ → số việc giao/xong/quá hạn + việc hôm nay
 * → bộ lọc thời gian (tháng, mở rộng từ-đến) áp cho lịch sử:
 * chi phí, ứng lương, chấm công, nghỉ phép.
 */

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock, CheckSquare, DollarSign, TrendingUp, Calendar,
  LogIn, LogOut, ChevronDown, ChevronUp, SlidersHorizontal,
} from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';

function money(v) { return Number(v || 0).toLocaleString('vi-VN'); }
function fmtD(d) { return d ? new Date(d).toLocaleDateString('vi-VN') : '—'; }

const LEAVE_STATUS = { pending: ['Chờ duyệt', 'badge-warning'], approved: ['Đã duyệt', 'badge-success'], rejected: ['Từ chối', 'badge-danger'] };
const EXP_STATUS = { pending: ['Chờ duyệt', 'badge-warning'], approved: ['Đã duyệt', 'badge-success'], rejected: ['Từ chối', 'badge-danger'] };

function monthRange(monthStr) {
  const [y, m] = monthStr.split('-').map(Number);
  const last = new Date(y, m, 0).getDate();
  return { from: `${monthStr}-01`, to: `${monthStr}-${String(last).padStart(2, '0')}` };
}

export default function MyDashboardPage() {
  const { user } = useAuthStore();
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [customRange, setCustomRange] = useState(false);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [openSection, setOpenSection] = useState('expenses');

  const range = customRange && from && to ? { from, to } : monthRange(month);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/dashboard/my', { params: range });
      setData(res.data.data);
    } catch {
      toast.error('Không thể tải dữ liệu');
    }
  }, [range.from, range.to]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const checkIn = async () => {
    setBusy(true);
    try { await api.post('/attendance/check-in'); toast.success('Đã chấm công vào'); load(); }
    catch (e) { toast.error(e.response?.data?.error || 'Không thể chấm công'); }
    finally { setBusy(false); }
  };
  const checkOut = async () => {
    setBusy(true);
    try { await api.post('/attendance/check-out'); toast.success('Đã chấm công ra'); load(); }
    catch (e) { toast.error(e.response?.data?.error || 'Không thể chấm công'); }
    finally { setBusy(false); }
  };

  if (!data) {
    return <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="skeleton h-28 w-full rounded-lg" />)}</div>;
  }

  const att = data.attendanceToday;
  const Section = ({ id, icon: Icon, title, badge, children }) => (
    <div className="bg-white rounded-lg shadow">
      <button
        onClick={() => setOpenSection(openSection === id ? '' : id)}
        className="w-full flex items-center justify-between p-4"
      >
        <span className="font-bold text-gray-900 flex items-center gap-2">
          <Icon size={17} className="text-blue-600" /> {title}
        </span>
        <span className="flex items-center gap-2">
          {badge}
          {openSection === id ? <ChevronUp size={17} className="text-gray-400" /> : <ChevronDown size={17} className="text-gray-400" />}
        </span>
      </button>
      {openSection === id && <div className="px-4 pb-4">{children}</div>}
    </div>
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Xin chào, {user?.full_name || ''}!</h1>
        <p className="text-gray-600 mt-1">Công việc và thông tin của bạn</p>
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
          {!att?.checkIn ? (
            <button onClick={checkIn} disabled={busy} className="btn-success flex items-center gap-1.5 disabled:opacity-60">
              <LogIn size={16} /> Chấm Công Vào
            </button>
          ) : !att?.checkOut ? (
            <button onClick={checkOut} disabled={busy} className="btn-secondary flex items-center gap-1.5 disabled:opacity-60">
              <LogOut size={16} /> Chấm Công Ra
            </button>
          ) : (
            <span className="badge-success">✓ Đủ công hôm nay</span>
          )}
        </div>
      </div>

      {/* Số việc + việc hôm nay */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-3 gap-2 text-center mb-3">
          <Link to="/tasks" className="rounded-lg bg-gray-50 py-2">
            <div className="text-xl font-bold text-gray-900">{data.tasks.assigned}</div>
            <div className="text-xs text-gray-500">Được giao</div>
          </Link>
          <Link to="/tasks?status=completed" className="rounded-lg bg-green-50 py-2">
            <div className="text-xl font-bold text-green-700">{data.tasks.done}</div>
            <div className="text-xs text-gray-500">Hoàn thành</div>
          </Link>
          <Link to="/tasks" className={`rounded-lg py-2 ${data.tasks.overdue > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
            <div className={`text-xl font-bold ${data.tasks.overdue > 0 ? 'text-red-600' : 'text-gray-900'}`}>{data.tasks.overdue}</div>
            <div className="text-xs text-gray-500">Quá hạn</div>
          </Link>
        </div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-bold text-gray-900 text-sm">Việc cần làm hôm nay</h2>
          <Link to="/tasks/new" className="text-blue-600 text-sm font-medium">+ Tạo việc</Link>
        </div>
        {data.todayTasks.length === 0 ? (
          <p className="text-sm text-gray-400">Không có việc nào tới hạn hôm nay 🎉</p>
        ) : (
          <div className="space-y-2">
            {data.todayTasks.map((t) => (
              <Link key={t.id} to={`/tasks/${t.id}`}
                className={`flex items-center justify-between gap-2 border rounded-lg p-3 ${t.isOverdue ? 'border-red-200 bg-red-50' : 'border-gray-100'}`}>
                <span className="text-sm font-medium text-gray-900 truncate">{t.title}</span>
                <span className="text-xs text-gray-400 shrink-0">
                  {t.isOverdue ? <b className="text-red-600">QUÁ HẠN</b> : t.dueDate ? fmtD(t.dueDate) : ''}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Bộ lọc thời gian */}
      <div className="bg-white rounded-lg shadow p-3 flex items-center gap-2 flex-wrap">
        <SlidersHorizontal size={16} className="text-gray-400" />
        {!customRange ? (
          <>
            <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="input-field !w-auto" />
            <button onClick={() => setCustomRange(true)} className="text-blue-600 text-sm font-medium">Chọn khoảng ngày</button>
          </>
        ) : (
          <>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="input-field !w-auto" />
            <span className="text-gray-400">→</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="input-field !w-auto" />
            <button onClick={() => setCustomRange(false)} className="text-blue-600 text-sm font-medium">Theo tháng</button>
          </>
        )}
      </div>

      {/* Lịch sử — mở từng mục */}
      <Section id="expenses" icon={DollarSign} title="Chi Phí"
        badge={<b className="text-gray-900 text-sm">{money(data.expenses.total)} đ</b>}>
        {data.expenses.list.length === 0 ? <p className="text-sm text-gray-400">Không có khoản chi nào trong kỳ</p> : (
          <div className="space-y-2">
            {data.expenses.list.map((x) => {
              const st = EXP_STATUS[x.status] || EXP_STATUS.pending;
              return (
                <div key={x.id} className="flex items-center justify-between gap-2 border border-gray-100 rounded-lg p-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{x.name}</div>
                    <div className="text-xs text-gray-400">{fmtD(x.date)}{x.projectName ? ` · ${x.projectName}` : ' · Văn phòng'}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-gray-900">{money(x.amount)} đ</div>
                    <span className={`${st[1]} !text-[10px] !px-2 !py-0.5`}>{st[0]}</span>
                    {x.needReimburse && x.status === 'approved' && (
                      <div className={`text-[10px] font-medium ${x.reimbursedAt ? 'text-green-600' : 'text-orange-500'}`}>
                        {x.reimbursedAt ? '✓ Đã hoàn tiền' : 'Chờ hoàn tiền'}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <Link to="/expenses/new" className="block text-center text-blue-600 text-sm font-medium mt-3">+ Nhập chi phí mới</Link>
      </Section>

      <Section id="advances" icon={TrendingUp} title="Ứng Lương"
        badge={data.advances.remaining > 0 ? <span className="text-sm text-orange-600 font-semibold">Nợ {money(data.advances.remaining)} đ</span> : null}>
        {data.advances.list.length === 0 ? <p className="text-sm text-gray-400">Không có đơn ứng trong kỳ</p> : (
          <div className="space-y-2">
            {data.advances.list.map((a) => {
              const st = EXP_STATUS[a.status] || EXP_STATUS.pending;
              return (
                <div key={a.id} className="flex items-center justify-between gap-2 border border-gray-100 rounded-lg p-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-900">{money(a.amount)} đ</div>
                    <div className="text-xs text-gray-400 truncate">{a.reason || fmtD(a.createdAt)}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`${st[1]} !text-[10px] !px-2 !py-0.5`}>{st[0]}</span>
                    {a.status === 'approved' && Number(a.remainingBalance) > 0 && (
                      <div className="text-[10px] text-gray-400">Còn nợ {money(a.remainingBalance)}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <Link to="/advances/request" className="block text-center text-blue-600 text-sm font-medium mt-3">+ Xin ứng lương</Link>
      </Section>

      <Section id="attendance" icon={Clock} title="Chấm Công"
        badge={<b className="text-gray-900 text-sm">{data.attendance.days} công</b>}>
        {data.attendance.list.length === 0 ? <p className="text-sm text-gray-400">Chưa có công nào trong kỳ</p> : (
          <div className="space-y-1.5">
            {data.attendance.list.map((a) => (
              <div key={a.date} className="flex items-center justify-between text-sm border-b border-gray-50 pb-1.5">
                <span className="text-gray-700">{fmtD(a.date)}</span>
                <span className="text-gray-500">
                  {a.checkIn ? a.checkIn.slice(0, 5) : '—'} → {a.checkOut ? a.checkOut.slice(0, 5) : '—'}
                </span>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section id="leaves" icon={Calendar} title="Nghỉ Phép"
        badge={data.leaves.some((l) => l.status === 'pending') ? <span className="badge-warning !text-[10px] !px-2 !py-0.5">Có đơn chờ</span> : null}>
        {data.leaves.length === 0 ? <p className="text-sm text-gray-400">Không có đơn nghỉ trong kỳ</p> : (
          <div className="space-y-2">
            {data.leaves.map((l) => {
              const st = LEAVE_STATUS[l.status] || LEAVE_STATUS.pending;
              return (
                <div key={l.id} className="flex items-center justify-between gap-2 border border-gray-100 rounded-lg p-3">
                  <div className="text-sm text-gray-800">{fmtD(l.startDate)} → {fmtD(l.endDate)} <span className="text-gray-400">({l.days} ngày)</span></div>
                  <span className={`${st[1]} !text-[10px] !px-2 !py-0.5 shrink-0`}>{st[0]}</span>
                </div>
              );
            })}
          </div>
        )}
        <Link to="/leaves/request" className="block text-center text-blue-600 text-sm font-medium mt-3">+ Xin nghỉ phép</Link>
      </Section>
    </div>
  );
}
