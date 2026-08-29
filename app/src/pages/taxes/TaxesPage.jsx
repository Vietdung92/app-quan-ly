/**
 * Taxes Page - Thuế hộ chủ nhà
 * Path: src/pages/taxes/TaxesPage.jsx
 *
 * Danh sách hồ sơ thuế + checklist đóng thuế theo tháng.
 * Thẻ mở rộng được — tối ưu cho điện thoại.
 */

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus, Receipt, AlertTriangle, ChevronDown, ChevronUp,
  ExternalLink, Pencil, CheckCircle2,
} from 'lucide-react';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import taxService from '../../services/taxService';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';

const CUR_MONTH = new Date().toISOString().slice(0, 7);

function money(v) {
  return Number(v || 0).toLocaleString('vi-VN');
}

function fmtMonth(m) {
  const [y, mo] = m.split('-');
  return `T${parseInt(mo, 10)}/${y}`;
}

export default function TaxesPage() {
  const { user } = useAuthStore();
  const canEdit = ['QL', 'VP'].includes(user?.role);
  const isQL = user?.role === 'QL';

  const [taxes, setTaxes] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [detail, setDetail] = useState(null); // hồ sơ đang mở kèm payments
  const [modal, setModal] = useState(null); // { payment, tax }
  const [payAmount, setPayAmount] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await taxService.getAll();
      setTaxes(res.data.taxes);
      setSummary(res.data.summary);
    } catch {
      toast.error('Không thể tải danh sách thuế');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleExpand = async (tax) => {
    if (expandedId === tax.id) {
      setExpandedId(null);
      setDetail(null);
      return;
    }
    setExpandedId(tax.id);
    setDetail(null);
    try {
      const res = await taxService.getById(tax.id);
      setDetail(res.data);
    } catch {
      toast.error('Không thể tải checklist');
    }
  };

  const openPayModal = (payment, tax) => {
    if (!canEdit) return;
    setModal({ payment, tax });
    setPayAmount(String(payment.amount || tax.monthlyTax || ''));
  };

  const handlePay = async () => {
    setBusy(true);
    try {
      await taxService.pay(modal.payment.id, { amount: parseInt(payAmount) || undefined });
      toast.success(`Đã đóng thuế ${fmtMonth(modal.payment.month)}`);
      setModal(null);
      const res = await taxService.getById(modal.tax.id);
      setDetail(res.data);
      load();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Không thể đánh dấu');
    } finally {
      setBusy(false);
    }
  };

  const handleUnpay = async () => {
    if (!window.confirm('Hoàn tác kỳ thuế này? Giao dịch Chi trong Quỹ sẽ bị xóa.')) return;
    setBusy(true);
    try {
      await taxService.unpay(modal.payment.id);
      toast.success('Đã hoàn tác');
      setModal(null);
      const res = await taxService.getById(modal.tax.id);
      setDetail(res.data);
      load();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Không thể hoàn tác');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Receipt className="text-blue-600" size={26} />
            Thuế Hộ Chủ Nhà
          </h1>
          <p className="text-gray-600 mt-1">Checklist đóng thuế hàng tháng theo từng căn</p>
        </div>
        {canEdit && (
          <Link to="/taxes/new" className="btn-primary flex items-center gap-2">
            <Plus size={18} />
            Thêm Hồ Sơ
          </Link>
        )}
      </div>

      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Căn đang đóng thuế</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{summary.total}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Tổng thuế mỗi tháng</div>
            <div className="text-2xl font-bold text-blue-600 mt-1">{money(summary.monthlyTaxTotal)} đ</div>
          </div>
          <div className={`rounded-lg shadow p-4 ${summary.overdue > 0 ? 'bg-red-50 border border-red-200' : 'bg-white'}`}>
            <div className="text-sm text-gray-500">Căn có kỳ quá hạn</div>
            <div className={`text-2xl font-bold mt-1 ${summary.overdue > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {summary.overdue}
            </div>
          </div>
        </div>
      )}

      {/* Danh sách hồ sơ */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton h-24 w-full rounded-lg" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {taxes.map((t) => {
            const open = expandedId === t.id;
            const pct = t.totalMonths > 0 ? Math.round((t.paidMonths / t.totalMonths) * 100) : 0;
            return (
              <div key={t.id} className="bg-white rounded-lg shadow">
                {/* Thẻ tóm tắt */}
                <div
                  className="p-4 cursor-pointer active:bg-gray-50"
                  onClick={() => toggleExpand(t)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-900 truncate">{t.label}</div>
                      <div className="text-sm text-gray-500 mt-0.5 truncate">
                        {t.ownerName || 'Chưa có chủ nhà'}
                        {t.taxCode && <> · MST {t.taxCode}</>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {t.overdueMonths > 0 && (
                        <span className="badge-danger flex items-center gap-1">
                          <AlertTriangle size={13} /> {t.overdueMonths} kỳ
                        </span>
                      )}
                      {open ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2 text-sm text-gray-600">
                    <span>Thuế/tháng: <b className="text-gray-900">{money(t.monthlyTax)} đ</b></span>
                    <span>Đã đóng <b>{t.paidMonths}/{t.totalMonths}</b> tháng</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full mt-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${t.overdueMonths > 0 ? 'bg-red-500' : 'bg-green-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* Checklist tháng */}
                {open && (
                  <div className="border-t border-gray-100 p-4">
                    {!detail ? (
                      <div className="skeleton h-16 w-full rounded" />
                    ) : (
                      <>
                        <div className="flex items-center justify-between mb-3 text-sm text-gray-500 flex-wrap gap-2">
                          <span>
                            {detail.startDate && detail.endDate
                              ? `Kỳ hạn: ${new Date(detail.startDate).toLocaleDateString('vi-VN')} → ${new Date(detail.endDate).toLocaleDateString('vi-VN')}`
                              : 'Chưa có kỳ hạn'}
                          </span>
                          <div className="flex items-center gap-3">
                            {detail.driveLink && (
                              <a href={detail.driveLink} target="_blank" rel="noreferrer" className="text-blue-600 flex items-center gap-1">
                                <ExternalLink size={14} /> Hồ sơ
                              </a>
                            )}
                            {canEdit && (
                              <Link to={`/taxes/${t.id}/edit`} className="text-blue-600 flex items-center gap-1">
                                <Pencil size={14} /> Sửa
                              </Link>
                            )}
                          </div>
                        </div>
                        {detail.payments.length === 0 ? (
                          <div className="text-sm text-gray-500">
                            Chưa có checklist tháng.
                            {canEdit && detail.startDate && detail.endDate && (
                              <button
                                className="text-blue-600 ml-1 underline"
                                onClick={async () => {
                                  try {
                                    const r = await taxService.generate(t.id);
                                    toast.success(r.data.message);
                                    const res = await taxService.getById(t.id);
                                    setDetail(res.data);
                                    load();
                                  } catch { toast.error('Không thể sinh checklist'); }
                                }}
                              >
                                Sinh checklist từ kỳ hạn
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                            {detail.payments.map((p) => {
                              const overdue = p.status === 'pending' && p.month <= CUR_MONTH;
                              return (
                                <button
                                  key={p.id}
                                  onClick={() => openPayModal(p, t)}
                                  className={`rounded-lg px-2 py-2 text-center text-xs font-medium border min-h-[52px] ${
                                    p.status === 'paid'
                                      ? 'bg-green-50 border-green-300 text-green-700'
                                      : overdue
                                        ? 'bg-red-50 border-red-300 text-red-700'
                                        : 'bg-gray-50 border-gray-200 text-gray-500'
                                  }`}
                                >
                                  <div className="font-semibold">{fmtMonth(p.month)}</div>
                                  <div className="mt-0.5">
                                    {p.status === 'paid' ? '✓ ' + money(p.amount / 1000) + 'k' : money(p.amount / 1000) + 'k'}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal đóng thuế / hoàn tác */}
      <Modal
        isOpen={!!modal}
        onClose={() => setModal(null)}
        title={modal ? `${modal.tax.label} — ${fmtMonth(modal.payment.month)}` : ''}
      >
        {modal && modal.payment.status === 'pending' && (
          <div className="space-y-4">
            <div>
              <label className="label-field">Số Tiền Thuế (đ)</label>
              <input
                type="number"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                className="input-field"
              />
            </div>
            <p className="text-sm text-gray-500">
              Đánh dấu đã đóng sẽ tự tạo giao dịch <b>Chi</b> "Thuế &amp; phí pháp lý căn hộ" trong Quỹ.
            </p>
            <div className="flex gap-3">
              <Button variant="primary" onClick={handlePay} loading={busy} fullWidth>
                <CheckCircle2 size={16} className="mr-1" /> Đã Đóng Thuế
              </Button>
              <Button variant="secondary" onClick={() => setModal(null)} fullWidth>Hủy</Button>
            </div>
          </div>
        )}
        {modal && modal.payment.status === 'paid' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-700">
              Đã đóng <b>{money(modal.payment.amount)} đ</b>
              {modal.payment.paidDate && <> ngày {new Date(modal.payment.paidDate).toLocaleDateString('vi-VN')}</>}.
            </p>
            {isQL && (
              <Button variant="danger" onClick={handleUnpay} loading={busy} fullWidth>
                Hoàn Tác (xóa giao dịch Quỹ)
              </Button>
            )}
            <Button variant="secondary" onClick={() => setModal(null)} fullWidth>Đóng</Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
