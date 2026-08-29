/**
 * Fund Report Page - Báo cáo lãi/lỗ theo từng đối tượng (căn hộ/dự án)
 * Path: src/pages/funds/FundReportPage.jsx
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Wallet,
  Calendar,
} from 'lucide-react';
import fundService from '../../services/fundService';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function FundReportPage() {
  const navigate = useNavigate();
  const [meta, setMeta] = useState(null);
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({ groupId: '', fromMonth: '', toMonth: '' });

  useEffect(() => {
    fundService.getMeta().then((res) => {
      setMeta(res.data);
      // Mặc định chọn nhóm Căn hộ nếu có
      const canHo = res.data.groups.find((g) => g.name.includes('Căn hộ'));
      if (canHo) setFilters((f) => ({ ...f, groupId: String(canHo.id) }));
      else setIsLoading(false);
    }).catch(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (filters.groupId || filters.fromMonth || filters.toMonth) fetchReport();
  }, [filters]);

  const fetchReport = async () => {
    try {
      setIsLoading(true);
      const params = {};
      if (filters.groupId) params.groupId = filters.groupId;
      if (filters.fromMonth) params.from = `${filters.fromMonth}-01`;
      if (filters.toMonth) {
        const [y, m] = filters.toMonth.split('-').map(Number);
        params.to = `${y}-${String(m).padStart(2, '0')}-${new Date(y, m, 0).getDate()}`;
      }
      const response = await api.get('/funds/report/objects', { params });
      setReport(response.data.data);
    } catch (error) {
      toast.error('Không thể tải báo cáo');
    } finally {
      setIsLoading(false);
    }
  };

  const money = (n) => Number(n).toLocaleString('vi-VN');
  const maxAbs = report
    ? Math.max(...report.objects.map((o) => Math.max(o.thu, o.chi)), 1)
    : 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <button
        onClick={() => navigate('/funds')}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
      >
        <ArrowLeft size={20} />
        Quay lại Thu Chi Quỹ
      </button>

      <div className="flex items-center gap-3">
        <div className="bg-blue-100 p-3 rounded-lg">
          <BarChart3 className="text-blue-600" size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Báo Cáo Lãi/Lỗ Theo Đối Tượng</h1>
          <p className="text-gray-600 mt-1">Thu chi và lãi/lỗ của từng căn hộ, dự án</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <select
            value={filters.groupId}
            onChange={(e) => setFilters((f) => ({ ...f, groupId: e.target.value }))}
            className="input-field"
          >
            <option value="">Tất cả nhóm</option>
            {meta?.groups.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-gray-400" />
            <input
              type="month"
              value={filters.fromMonth}
              onChange={(e) => setFilters((f) => ({ ...f, fromMonth: e.target.value }))}
              className="input-field"
              title="Từ tháng"
            />
            <span className="text-gray-400">→</span>
            <input
              type="month"
              value={filters.toMonth}
              onChange={(e) => setFilters((f) => ({ ...f, toMonth: e.target.value }))}
              className="input-field"
              title="Đến tháng"
            />
          </div>
        </div>
      </div>

      {/* Totals */}
      {report && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
              <TrendingUp size={16} className="text-green-600" />
              Tổng Thu
            </div>
            <p className="text-2xl font-bold text-green-600">{money(report.totals.thu)} đ</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
              <TrendingDown size={16} className="text-red-600" />
              Tổng Chi
            </div>
            <p className="text-2xl font-bold text-red-600">{money(report.totals.chi)} đ</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
              <Wallet size={16} className="text-blue-600" />
              Lãi/Lỗ
            </div>
            <p className={`text-2xl font-bold ${report.totals.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {report.totals.balance >= 0 ? '+' : ''}{money(report.totals.balance)} đ
            </p>
          </div>
        </div>
      )}

      {/* Report Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-2">Đang tổng hợp báo cáo...</p>
          </div>
        ) : !report || report.objects.length === 0 ? (
          <div className="p-12 text-center">
            <BarChart3 className="mx-auto text-gray-400 mb-3" size={32} />
            <p className="text-gray-600">Không có dữ liệu trong khoảng đã chọn</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Đối Tượng</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">Thu</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">Chi</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">Lãi/Lỗ</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase hidden md:table-cell">Tỷ Lệ</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">Số GD</th>
                </tr>
              </thead>
              <tbody>
                {report.objects.map((o) => (
                  <tr key={o.name} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{o.name}</p>
                      {!filters.groupId && <p className="text-xs text-gray-500">{o.groupName}</p>}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-green-600 whitespace-nowrap">
                      {o.thu > 0 ? `+${money(o.thu)}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-red-600 whitespace-nowrap">
                      {o.chi > 0 ? `-${money(o.chi)}` : '—'}
                    </td>
                    <td className={`px-4 py-3 text-right font-bold whitespace-nowrap ${
                      o.balance >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {o.balance >= 0 ? '+' : ''}{money(o.balance)}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell w-40">
                      {/* Thanh so sánh thu (xanh) / chi (đỏ) */}
                      <div className="flex h-3 rounded-full overflow-hidden bg-gray-100">
                        <div
                          className="bg-green-500"
                          style={{ width: `${(o.thu / maxAbs) * 100}%` }}
                        ></div>
                        <div
                          className="bg-red-400"
                          style={{ width: `${(o.chi / maxAbs) * 100}%` }}
                        ></div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-600">{o.count}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                <tr>
                  <td className="px-4 py-3 font-bold text-gray-900">TỔNG CỘNG</td>
                  <td className="px-4 py-3 text-right font-bold text-green-600">+{money(report.totals.thu)}</td>
                  <td className="px-4 py-3 text-right font-bold text-red-600">-{money(report.totals.chi)}</td>
                  <td className={`px-4 py-3 text-right font-bold ${
                    report.totals.balance >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {report.totals.balance >= 0 ? '+' : ''}{money(report.totals.balance)}
                  </td>
                  <td className="hidden md:table-cell"></td>
                  <td className="px-4 py-3 text-right font-bold text-gray-600">
                    {report.objects.reduce((s, o) => s + o.count, 0)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Ghi chú */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
        💡 Lãi/lỗ = Tổng thu − Tổng chi của từng đối tượng trong khoảng thời gian đã chọn.
        Khoản thu cần được gắn đúng đối tượng (căn hộ) khi nhập giao dịch thì báo cáo mới phản ánh đầy đủ.
      </div>
    </div>
  );
}
