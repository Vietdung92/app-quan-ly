/**
 * Apartments Page - Quản Lý Căn Hộ (2 chiều: thu khách + trả chủ nhà)
 * Path: src/pages/apartments/ApartmentsPage.jsx
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Calendar,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  RefreshCw,
  ArrowDownCircle,
  ArrowUpCircle,
} from 'lucide-react';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import apartmentService from '../../services/apartmentService';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';

export default function ApartmentsPage() {
  const { user } = useAuthStore();
  const isManager = ['QL', 'VP'].includes(user?.role);
  const [apartments, setApartments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  // payTarget: { apartment, kind: 'rent' | 'owner' }
  const [payTarget, setPayTarget] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchData();
  }, [month]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await apartmentService.getAll(month);
      setApartments(response.data.apartments);
      setSummary(response.data.summary);
    } catch (error) {
      toast.error('Không thể tải danh sách căn hộ');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async () => {
    try {
      const [rents, dues] = await Promise.all([
        apartmentService.generateRents(month),
        apartmentService.generateOwnerDues(month),
      ]);
      toast.success(`${rents.data.message}. ${dues.data.message}`);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Không thể tạo kỳ thu/trả');
    }
  };

  const handlePay = async () => {
    if (!payTarget) return;
    setIsProcessing(true);
    const { apartment, kind } = payTarget;
    try {
      if (kind === 'rent') {
        await apartmentService.payRent(apartment.rent.id, { person: user?.fullName || user?.name });
        toast.success(`Đã thu tiền khách căn ${apartment.name}`);
      } else {
        await apartmentService.payOwnerDue(apartment.ownerPay.id, { person: user?.fullName || user?.name });
        toast.success(`Đã trả chủ nhà căn ${apartment.name}`);
      }
      setPayTarget(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Không thể ghi nhận');
    } finally {
      setIsProcessing(false);
    }
  };

  const money = (n) => Number(n).toLocaleString('vi-VN');

  const statusBadge = (a) => {
    const map = {
      'Đang thuê': 'bg-green-100 text-green-800',
      'Đang trống': 'bg-gray-100 text-gray-700',
      'Sắp hết hạn': 'bg-yellow-100 text-yellow-800',
    };
    if (!a.aptStatus) return null;
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[a.aptStatus] || 'bg-gray-100 text-gray-700'}`}>
        {a.aptStatus}
      </span>
    );
  };

  const payBadge = (p, labels) => {
    if (!p) return <span className="text-xs text-gray-400">—</span>;
    const badges = {
      paid: { cls: 'bg-green-100 text-green-800', label: labels[0] },
      partial: { cls: 'bg-yellow-100 text-yellow-800', label: '1 phần' },
      unpaid: { cls: 'bg-red-100 text-red-800', label: labels[1] },
    };
    const b = badges[p.status];
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${b.cls}`}>{b.label}</span>;
  };

  const contractWarn = (a) => {
    if (a.contractExpired || a.ownerContractExpired)
      return <AlertTriangle size={14} className="text-red-600 inline ml-1" title="Có hợp đồng hết hạn" />;
    if (a.contractExpiringSoon || a.ownerContractExpiringSoon)
      return <AlertTriangle size={14} className="text-yellow-600 inline ml-1" title="Có hợp đồng sắp hết hạn" />;
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản Lý Căn Hộ</h1>
          <p className="text-gray-600 mt-1">Hợp đồng 2 chiều: thu tiền khách — trả tiền chủ nhà</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-gray-400" />
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="input-field"
          />
          {isManager && (
            <Button variant="outline" icon={RefreshCw} onClick={handleGenerate}>
              Tạo Kỳ Tháng
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
              <Building2 size={16} className="text-blue-600" />
              Căn Hộ
            </div>
            <p className="text-2xl font-bold text-gray-900">{summary.total}</p>
            <p className="text-xs text-gray-500">{summary.renting} đang thuê · {summary.vacant} trống</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
              <ArrowDownCircle size={16} className="text-green-600" />
              Thu Khách
            </div>
            <p className="text-2xl font-bold text-green-600">{summary.paid}/{summary.paid + summary.unpaid}</p>
            <p className="text-xs text-gray-500">Còn {money(summary.totalDue - summary.totalPaid)} đ</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
              <ArrowUpCircle size={16} className="text-orange-600" />
              Trả Chủ Nhà
            </div>
            <p className="text-2xl font-bold text-orange-600">{summary.ownerPaid}/{summary.ownerPaid + summary.ownerUnpaid}</p>
            <p className="text-xs text-gray-500">Còn {money(summary.ownerTotalDue - summary.ownerTotalPaid)} đ</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
              <AlertTriangle size={16} className="text-red-600" />
              HĐ Cần Chú Ý
            </div>
            <p className="text-2xl font-bold text-red-600">{summary.expiringSoon + summary.expired}</p>
            <p className="text-xs text-gray-500">{summary.expired} đã hết hạn</p>
          </div>
        </div>
      )}

      {/* Apartments Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-2">Đang tải danh sách căn hộ...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Căn Hộ</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Khách Thuê</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">Thu Khách</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">Trả Chủ</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">Chênh Lệch</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">
                    Tháng {parseInt(month.split('-')[1])}
                  </th>
                  {isManager && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Hành Động</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {apartments.map((a) => (
                  <tr key={a.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link
                        to={`/apartments/${a.id}`}
                        className="font-medium text-blue-600 hover:text-blue-700"
                      >
                        {a.name}
                      </Link>
                      {contractWarn(a)}
                      <div className="mt-0.5">{statusBadge(a)}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {a.tenantName || <span className="text-gray-400">Trống</span>}
                      {a.managementType === 'manage' && (
                        <p className="text-xs text-purple-600 font-medium">Quản lý hộ</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-green-700 whitespace-nowrap">
                      {a.rentAmount > 0 ? money(a.rentAmount) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-orange-700 whitespace-nowrap">
                      {a.ownerRent > 0 ? money(a.ownerRent) : '—'}
                    </td>
                    <td className={`px-4 py-3 text-right text-sm font-bold whitespace-nowrap ${
                      a.grossMargin > 0 ? 'text-green-600' : a.grossMargin < 0 ? 'text-red-600' : 'text-gray-400'
                    }`}>
                      {a.rentAmount > 0 || a.ownerRent > 0 ? money(a.grossMargin) : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-400 w-8 text-right">Thu:</span>
                          {payBadge(a.rent, ['Đã thu', 'Chưa thu'])}
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-400 w-8 text-right">Trả:</span>
                          {payBadge(a.ownerPay, ['Đã trả', 'Chưa trả'])}
                        </div>
                      </div>
                    </td>
                    {isManager && (
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          {a.rent && a.rent.status !== 'paid' && (
                            <button
                              onClick={() => setPayTarget({ apartment: a, kind: 'rent' })}
                              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg whitespace-nowrap"
                            >
                              Thu Khách
                            </button>
                          )}
                          {a.ownerPay && a.ownerPay.status !== 'paid' && (
                            <button
                              onClick={() => setPayTarget({ apartment: a, kind: 'owner' })}
                              className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-lg whitespace-nowrap"
                            >
                              Trả Chủ
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Ghi chú */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
        💡 Đầu tháng bấm "Tạo Kỳ Tháng" để sinh cả danh sách thu khách lẫn trả chủ nhà.
        Mỗi lần Thu Khách / Trả Chủ đều tự ghi vào Quỹ gắn đúng căn — báo cáo lãi/lỗ từng căn luôn chính xác.
        Bấm tên căn để xem/sửa hồ sơ đầy đủ 2 hợp đồng.
      </div>

      {/* Pay Modal */}
      <Modal
        isOpen={!!payTarget}
        title={payTarget?.kind === 'rent' ? 'Xác Nhận Thu Tiền Khách' : 'Xác Nhận Trả Chủ Nhà'}
        onClose={() => setPayTarget(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setPayTarget(null)}>
              Hủy
            </Button>
            <Button
              variant={payTarget?.kind === 'rent' ? 'success' : 'primary'}
              loading={isProcessing}
              onClick={handlePay}
            >
              {payTarget?.kind === 'rent' ? 'Xác Nhận Đã Thu' : 'Xác Nhận Đã Trả'}
            </Button>
          </>
        }
      >
        {payTarget && (
          <div className="space-y-2">
            {payTarget.kind === 'rent' ? (
              <>
                <p className="text-gray-600">
                  Thu tiền thuê tháng {parseInt(month.split('-')[1])}/{month.split('-')[0]} căn{' '}
                  <strong>{payTarget.apartment.name}</strong>
                  {payTarget.apartment.tenantName && <> (khách: {payTarget.apartment.tenantName})</>}
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {money(payTarget.apartment.rent.amountDue - payTarget.apartment.rent.amountPaid)} đ
                </p>
              </>
            ) : (
              <>
                <p className="text-gray-600">
                  Trả tiền chủ nhà tháng {parseInt(month.split('-')[1])}/{month.split('-')[0]} căn{' '}
                  <strong>{payTarget.apartment.name}</strong>
                  {payTarget.apartment.ownerName && <> (chủ: {payTarget.apartment.ownerName})</>}
                </p>
                <p className="text-2xl font-bold text-orange-600">
                  {money(payTarget.apartment.ownerPay.amountDue - payTarget.apartment.ownerPay.amountPaid)} đ
                </p>
                {payTarget.apartment.ownerBank && (
                  <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded whitespace-pre-line">
                    🏦 {payTarget.apartment.ownerBank}
                  </p>
                )}
              </>
            )}
            <p className="text-sm text-gray-500">
              Khoản này sẽ tự động được ghi vào Quỹ, gắn với căn hộ.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
