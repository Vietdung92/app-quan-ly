/**
 * Funds Page - Thu Chi Quỹ
 * Path: src/pages/funds/FundsPage.jsx
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet,
  Plus,
  BarChart3,
  Search,
  Calendar,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import fundService from '../../services/fundService';
import toast from 'react-hot-toast';

export default function FundsPage() {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [meta, setMeta] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: '',
    groupId: '',
    month: '',
    search: '',
  });

  useEffect(() => {
    fundService.getMeta().then((res) => setMeta(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(fetchData, filters.search ? 400 : 0);
    return () => clearTimeout(t);
  }, [filters]);

  const buildParams = () => {
    const params = {};
    if (filters.type) params.type = filters.type;
    if (filters.groupId) params.groupId = filters.groupId;
    if (filters.search) params.search = filters.search;
    if (filters.month) {
      params.from = `${filters.month}-01`;
      const [y, m] = filters.month.split('-').map(Number);
      params.to = `${y}-${String(m).padStart(2, '0')}-${new Date(y, m, 0).getDate()}`;
    }
    return params;
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const params = buildParams();
      const [txRes, sumRes] = await Promise.all([
        fundService.getTransactions(params),
        fundService.getSummary(params),
      ]);
      setTransactions(txRes.data);
      setSummary(sumRes.data);
    } catch (error) {
      toast.error('Không thể tải dữ liệu quỹ');
    } finally {
      setIsLoading(false);
    }
  };

  const money = (n) => Number(n).toLocaleString('vi-VN');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Thu Chi Quỹ</h1>
          <p className="text-gray-600 mt-1">Theo dõi các khoản thu chi của công ty</p>
        </div>
        <div className="flex gap-2">
          <Link to="/funds/report" className="btn-secondary flex items-center gap-2">
            <BarChart3 size={18} />
            Báo Cáo Lãi/Lỗ
          </Link>
          <Link to="/funds/new" className="btn-primary flex items-center gap-2">
            <Plus size={18} />
            Thêm Giao Dịch
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
              <TrendingUp size={16} className="text-green-600" />
              Tổng Thu
            </div>
            <p className="text-2xl font-bold text-green-600">{money(summary.thu)} đ</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
              <TrendingDown size={16} className="text-red-600" />
              Tổng Chi
            </div>
            <p className="text-2xl font-bold text-red-600">{money(summary.chi)} đ</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
              <Wallet size={16} className="text-blue-600" />
              Số Dư
            </div>
            <p className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {money(summary.balance)} đ
            </p>
          </div>
        </div>
      )}

      {/* Breakdown theo nhóm */}
      {summary && summary.byGroup.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold text-gray-900 mb-3 text-sm">Theo Nhóm</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {summary.byGroup.map((g) => (
              <div key={g.name} className="border border-gray-200 rounded-lg p-3">
                <p className="text-xs text-gray-600 mb-1 truncate" title={g.name}>{g.name}</p>
                {g.thu > 0 && <p className="text-sm font-semibold text-green-600">+{money(g.thu)}</p>}
                {g.chi > 0 && <p className="text-sm font-semibold text-red-600">-{money(g.chi)}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Tìm theo ghi chú, người chi, hạng mục, căn hộ..."
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              className="input-field pl-10 w-full"
            />
          </div>

          <select
            value={filters.type}
            onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}
            className="input-field"
          >
            <option value="">Thu + Chi</option>
            <option value="Thu">Chỉ Thu</option>
            <option value="Chi">Chỉ Chi</option>
          </select>

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
              value={filters.month}
              onChange={(e) => setFilters((f) => ({ ...f, month: e.target.value }))}
              className="input-field"
            />
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-2">Đang tải giao dịch...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center">
            <Wallet className="mx-auto text-gray-400 mb-3" size={32} />
            <p className="text-gray-600">Không có giao dịch nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Ngày</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Nhóm</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Đối Tượng</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Hạng Mục</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">Số Tiền</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Người Chi/Nộp</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Ghi Chú</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {new Date(tx.date).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{tx.groupName}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{tx.objectName || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{tx.categoryName || '—'}</td>
                    <td className={`px-4 py-3 text-sm font-bold text-right whitespace-nowrap ${
                      tx.type === 'Thu' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {tx.type === 'Thu' ? '+' : '-'}{money(tx.amount)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{tx.person || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate" title={tx.notes}>
                      {tx.notes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="px-4 py-3 text-xs text-gray-500 border-t border-gray-200">
              Hiển thị {transactions.length} giao dịch{summary ? ` / tổng ${summary.count}` : ''}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
