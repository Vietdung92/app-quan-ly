/**
 * Residents Page - Tạm trú khách nước ngoài
 * Path: src/pages/residents/ResidentsPage.jsx
 *
 * Danh sách khách nước ngoài theo căn hộ + cảnh báo hạn tạm trú.
 * Bố cục dạng thẻ — tối ưu cho điện thoại.
 */

import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Search, Globe, AlertTriangle, FileText, BookUser } from 'lucide-react';
import residentService from '../../services/residentService';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';

const TABS = [
  { key: '', label: 'Tất cả' },
  { key: 'expiring', label: 'Sắp hết hạn' },
  { key: 'expired', label: 'Đã hết hạn' },
];

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('vi-VN');
}

function ExpiryBadge({ daysLeft, expiry }) {
  if (expiry == null) return <span className="badge-info">Chưa có hạn</span>;
  if (daysLeft < 0)
    return <span className="badge-danger">Hết hạn {Math.abs(daysLeft)} ngày</span>;
  if (daysLeft <= 14)
    return <span className="badge-warning">Còn {daysLeft} ngày</span>;
  return <span className="badge-success">Còn {daysLeft} ngày</span>;
}

export default function ResidentsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  const canEdit = ['QL', 'VP'].includes(user?.role);

  const [tab, setTab] = useState('');
  const [q, setQ] = useState('');
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const objectId = searchParams.get('objectId') || '';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (tab) params.status = tab;
      if (q.trim()) params.q = q.trim();
      if (objectId) params.objectId = objectId;
      const [listRes, sumRes] = await Promise.all([
        residentService.getAll(params),
        residentService.getSummary(),
      ]);
      setRows(listRes.data);
      setSummary(sumRes.data);
    } catch {
      toast.error('Không thể tải danh sách tạm trú');
    } finally {
      setLoading(false);
    }
  }, [tab, q, objectId]);

  useEffect(() => {
    const t = setTimeout(load, q ? 350 : 0);
    return () => clearTimeout(t);
  }, [load, q]);

  const warnCount = summary ? summary.expired + summary.expiring : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Globe className="text-blue-600" size={26} />
            Tạm Trú
          </h1>
          <p className="text-gray-600 mt-1">Khách nước ngoài đăng ký tạm trú theo căn hộ</p>
        </div>
        {canEdit && (
          <Link to="/residents/new" className="btn-primary flex items-center gap-2">
            <Plus size={18} />
            Thêm Khách
          </Link>
        )}
      </div>

      {/* Cảnh báo */}
      {warnCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="text-red-600 shrink-0 mt-0.5" size={20} />
          <div className="text-sm text-red-800">
            <b>{summary.expired}</b> khách đã hết hạn tạm trú
            {summary.expiring > 0 && (
              <> · <b>{summary.expiring}</b> khách sắp hết hạn trong 14 ngày</>
            )}
            {' '}— cần đăng ký gia hạn để tránh bị phạt.
          </div>
        </div>
      )}

      {/* Tabs lọc */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium min-h-[40px] ${
              tab === t.key
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 border border-gray-300'
            }`}
          >
            {t.label}
            {t.key === 'expiring' && summary?.expiring > 0 && (
              <span className="ml-1.5 bg-yellow-400 text-yellow-900 rounded-full px-1.5 text-xs">
                {summary.expiring}
              </span>
            )}
            {t.key === 'expired' && summary?.expired > 0 && (
              <span className="ml-1.5 bg-red-500 text-white rounded-full px-1.5 text-xs">
                {summary.expired}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tìm kiếm */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm theo tên, passport, mã căn..."
          className="input-field pl-10"
        />
      </div>

      {/* Danh sách dạng thẻ */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-24 w-full rounded-lg" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          Chưa có khách tạm trú nào{tab && ' trong nhóm này'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {rows.map((r) => (
            <div
              key={r.id}
              onClick={() => canEdit && navigate(`/residents/${r.id}/edit`)}
              className={`bg-white rounded-lg shadow p-4 ${canEdit ? 'cursor-pointer active:bg-gray-50' : ''}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-semibold text-gray-900 truncate">{r.fullName}</div>
                  <div className="text-sm text-gray-500 mt-0.5">
                    Căn <b className="text-blue-600">{r.apartment}</b>
                    {r.nationality && <> · {r.nationality}</>}
                    {r.passportNo && <> · {r.passportNo}</>}
                  </div>
                </div>
                <ExpiryBadge daysLeft={r.daysLeft} expiry={r.residenceExpiry} />
              </div>
              <div className="flex items-center justify-between mt-3 text-sm">
                <span className="text-gray-500">
                  Tạm trú: {fmtDate(r.residenceStart)} → <b>{fmtDate(r.residenceExpiry)}</b>
                </span>
              </div>
              {(r.passportLink || r.trcLink) && (
                <div className="flex gap-4 mt-2 text-sm" onClick={(e) => e.stopPropagation()}>
                  {r.passportLink && (
                    <a
                      href={r.passportLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 flex items-center gap-1"
                    >
                      <BookUser size={15} /> Passport
                    </a>
                  )}
                  {r.trcLink && (
                    <a
                      href={r.trcLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 flex items-center gap-1"
                    >
                      <FileText size={15} /> Thẻ tạm trú
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
