/**
 * Performance Block - Hiệu suất nhân viên (chỉ Quản lý)
 * Path: src/components/dashboard/PerformanceBlock.jsx
 */

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';
import api from '../../services/api';

const ROLE_LABEL = { QL: 'Quản lý', VP: 'Văn phòng', KT: 'Kỹ thuật' };

export default function PerformanceBlock() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [rows, setRows] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/dashboard/performance', { params: { month } });
      setRows(res.data.data.employees);
    } catch { setRows([]); }
  }, [month]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Users size={19} className="text-blue-600" /> Hiệu Suất Nhân Viên
        </h2>
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="input-field !w-auto" />
      </div>

      {!rows ? (
        <div className="skeleton h-32 w-full rounded" />
      ) : rows.length === 0 ? (
        <p className="text-sm text-gray-400">Chưa có dữ liệu</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase border-b border-gray-200">
                <th className="py-2 pr-2">Nhân viên</th>
                <th className="py-2 px-2 text-center">Đang có việc</th>
                <th className="py-2 px-2 text-center">Xong trong tháng</th>
                <th className="py-2 px-2 text-center">Quá hạn</th>
                <th className="py-2 px-2 text-center">Đúng hạn</th>
                <th className="py-2 px-2 text-center">Công</th>
                <th className="py-2 px-2 text-center">Chi phí nhập</th>
                <th className="py-2 pl-2 text-center">Ảnh gửi</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => {
                const onTimeRate = e.done > 0 ? Math.round((e.onTime / e.done) * 100) : null;
                return (
                  <tr key={e.id} className={`border-b border-gray-50 ${e.overdue > 0 ? 'bg-red-50' : ''}`}>
                    <td className="py-2.5 pr-2">
                      <Link to={`/employees/${e.id}`} className="font-medium text-blue-600 hover:underline">
                        {e.fullName}
                      </Link>
                      <span className="text-xs text-gray-400 block">{ROLE_LABEL[e.role] || e.role}</span>
                    </td>
                    <td className="py-2.5 px-2 text-center">{e.activeInMonth}</td>
                    <td className="py-2.5 px-2 text-center text-green-700 font-semibold">{e.done}</td>
                    <td className={`py-2.5 px-2 text-center font-semibold ${e.overdue > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                      {e.overdue > 0 ? `⚠ ${e.overdue}` : '0'}
                    </td>
                    <td className="py-2.5 px-2 text-center">{onTimeRate != null ? `${onTimeRate}%` : '—'}</td>
                    <td className="py-2.5 px-2 text-center">{e.workDays}</td>
                    <td className="py-2.5 px-2 text-center">{e.expensesEntered}</td>
                    <td className="py-2.5 pl-2 text-center">{e.photosSent}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
