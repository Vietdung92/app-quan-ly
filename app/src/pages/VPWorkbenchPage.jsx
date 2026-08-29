/**
 * VP Workbench - Bàn làm việc Văn phòng
 * Path: src/pages/VPWorkbenchPage.jsx
 *
 * Trả lời "hôm nay tôi phải xử lý gì?": chấm công → chờ duyệt →
 * báo hỏng → tiền tháng này → sắp đến hạn → số dư quỹ.
 */

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock, LogIn, LogOut, DollarSign, Calendar, TrendingUp,
  Wrench, AlertTriangle, Building2, Receipt, Globe, Wallet,
} from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';

function money(v) { return Number(v || 0).toLocaleString('vi-VN'); }

export default function VPWorkbenchPage() {
  const { user } = useAuthStore();
  const [data, setData] = useState(null);
  const [att, setAtt] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [wbRes, myRes] = await Promise.all([
        api.get('/dashboard/workbench'),
        api.get('/dashboard/my'),
      ]);
      setData(wbRes.data.data);
      setAtt(myRes.data.data.attendanceToday);
    } catch {
      toast.error('Không thể tải bàn làm việc');
    }
  }, []);

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

  const Tile = ({ to, icon: Icon, label, value, danger, sub }) => (
    <Link to={to} className={`block rounded-lg p-4 border ${danger && value > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-100 shadow-sm'}`}>
      <div className="flex items-center gap-2 text-sm text-gray-500"><Icon size={15} /> {label}</div>
      <div className={`text-2xl font-bold mt-1 ${danger && value > 0 ? 'text-red-600' : 'text-gray-900'}`}>{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </Link>
  );

  const totalPending = data.pendingExpenses + data.pendingLeaves + data.pendingAdvances;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Bàn Làm Việc</h1>
        <p className="text-gray-600 mt-1">
          Xin chào {user?.full_name} — {totalPending > 0 ? `có ${totalPending} việc đang chờ xử lý` : 'không có gì tồn đọng 🎉'}
        </p>
      </div>

      {/* Chấm công */}
      <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between flex-wrap gap-3">
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
          <button onClick={checkIn} disabled={busy} className="btn-success flex items-center gap-1.5 disabled:opacity-60"><LogIn size={16} /> Chấm Công Vào</button>
        ) : !att?.checkOut ? (
          <button onClick={checkOut} disabled={busy} className="btn-secondary flex items-center gap-1.5 disabled:opacity-60"><LogOut size={16} /> Chấm Công Ra</button>
        ) : (
          <span className="badge-success">✓ Đủ công</span>
        )}
      </div>

      {/* Chờ duyệt */}
      <div>
        <h2 className="font-bold text-gray-900 mb-2">Chờ Duyệt</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Tile to="/expenses" icon={DollarSign} label="Chi phí" value={data.pendingExpenses} danger />
          <Tile to="/leaves" icon={Calendar} label="Nghỉ phép" value={data.pendingLeaves} danger />
          <Tile to="/advances" icon={TrendingUp} label="Ứng lương" value={data.pendingAdvances} danger />
          <Tile to="/expenses" icon={Wallet} label="Cần hoàn tiền" value={data.toReimburse} danger />
        </div>
      </div>

      {/* Báo hỏng */}
      <div>
        <h2 className="font-bold text-gray-900 mb-2">Báo Hỏng</h2>
        <div className="grid grid-cols-2 gap-3">
          <Tile to="/repairs" icon={Wrench} label="Mới chưa tiếp nhận" value={data.newRepairs} danger />
          <Tile to="/repairs" icon={AlertTriangle} label="Tồn quá 3 ngày" value={data.staleRepairs} danger />
        </div>
      </div>

      {/* Tiền tháng này */}
      <div>
        <h2 className="font-bold text-gray-900 mb-2">Tiền Tháng {parseInt(data.month.split('-')[1])}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Tile to="/apartments" icon={Building2} label="Thu khách còn thiếu" value={data.rentUnpaid}
            sub={data.rentUnpaidAmount > 0 ? `${money(data.rentUnpaidAmount)} đ` : ''} danger />
          <Tile to="/apartments" icon={Building2} label="Trả chủ còn thiếu" value={data.ownerUnpaid}
            sub={data.ownerUnpaidAmount > 0 ? `${money(data.ownerUnpaidAmount)} đ` : ''} danger />
          <Tile to="/taxes" icon={Receipt} label="Kỳ thuế tới hạn" value={data.taxDue} danger />
        </div>
      </div>

      {/* Sắp đến hạn 30 ngày */}
      <div>
        <h2 className="font-bold text-gray-900 mb-2">Sắp Đến Hạn (30 ngày)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Tile to="/apartments" icon={Building2} label="HĐ khách thuê" value={data.tenantContractsExpiring} danger />
          <Tile to="/apartments" icon={Building2} label="HĐ chủ nhà" value={data.ownerContractsExpiring} danger />
          <Tile to="/residents" icon={Globe} label="Tạm trú hết hạn" value={data.residentsExpiring} danger />
        </div>
      </div>

      {/* Số liệu quỹ */}
      <div className="bg-white rounded-lg shadow p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
        <Link to="/funds" className="block">
          <div className="text-sm text-gray-500">Số dư quỹ</div>
          <div className="text-xl font-bold text-blue-600">{money(data.fundBalance)} đ</div>
        </Link>
        <Link to={`/funds?type=Thu&month=${data.month}`} className="block">
          <div className="text-sm text-gray-500">Thu tháng này</div>
          <div className="text-xl font-bold text-green-600">+{money(data.monthIncome)} đ</div>
        </Link>
        <Link to={`/funds?type=Chi&month=${data.month}`} className="block">
          <div className="text-sm text-gray-500">Chi tháng này</div>
          <div className="text-xl font-bold text-red-600">-{money(data.monthExpense)} đ</div>
        </Link>
      </div>
    </div>
  );
}
