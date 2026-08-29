/**
 * Tenant Portal - Home (English-first, mobile-first)
 * Path: src/pages/portal/PortalHomePage.jsx
 *
 * Khách thuê: thông tin căn, nhắc tiền thuê + hạn tạm trú,
 * báo hỏng + theo dõi, tự khai tạm trú, xem căn trống.
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, LogOut, AlertTriangle, Wrench, Plus, FileText,
  MessageCircle, QrCode, UserPlus, Home, ChevronDown, ChevronUp,
} from 'lucide-react';
import portalApi from '../../services/portalApi';

const CATEGORIES = [
  { value: 'electric', label: 'Electricity' },
  { value: 'water', label: 'Water / Plumbing' },
  { value: 'aircon', label: 'Air Conditioner' },
  { value: 'lock', label: 'Door / Lock' },
  { value: 'furniture', label: 'Furniture' },
  { value: 'other', label: 'Other' },
];

const STATUS_LABEL = {
  new: { text: 'Submitted', cls: 'bg-blue-100 text-blue-700' },
  received: { text: 'Received', cls: 'bg-indigo-100 text-indigo-700' },
  in_progress: { text: 'In progress', cls: 'bg-yellow-100 text-yellow-800' },
  done: { text: 'Completed', cls: 'bg-green-100 text-green-700' },
  cancelled: { text: 'Cancelled', cls: 'bg-gray-100 text-gray-600' },
};

function money(v) {
  return Number(v || 0).toLocaleString('en-US');
}

function fmtDate(d) {
  return d ? new Date(d).toLocaleDateString('en-GB') : '—';
}

export default function PortalHomePage() {
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [repairs, setRepairs] = useState([]);
  const [vacant, setVacant] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form báo hỏng
  const [showReport, setShowReport] = useState(false);
  const [category, setCategory] = useState('other');
  const [description, setDescription] = useState('');
  const [imageLink, setImageLink] = useState('');
  const [sending, setSending] = useState(false);
  const [flash, setFlash] = useState('');

  // Form tự khai tạm trú
  const [showGuest, setShowGuest] = useState(false);
  const [guest, setGuest] = useState({ fullName: '', passportNo: '', nationality: '', birthDate: '', passportLink: '' });

  const load = useCallback(async () => {
    try {
      const [meRes, repRes, vacRes] = await Promise.all([
        portalApi.get('/me'),
        portalApi.get('/repairs'),
        portalApi.get('/vacant'),
      ]);
      setMe(meRes.data.data);
      setRepairs(repRes.data.data);
      setVacant(vacRes.data.data);
    } catch { /* interceptor handles 401 */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const signOut = () => {
    try { localStorage.removeItem('tenant_token'); } catch { /* ignore */ }
    navigate('/portal/login');
  };

  const submitRepair = async (e) => {
    e.preventDefault();
    if (!description.trim()) return;
    setSending(true);
    try {
      await portalApi.post('/repairs', { category, description, imageLink: imageLink || null });
      setDescription(''); setImageLink(''); setCategory('other'); setShowReport(false);
      setFlash('Your request has been sent. We will contact you soon.');
      setTimeout(() => setFlash(''), 5000);
      const res = await portalApi.get('/repairs');
      setRepairs(res.data.data);
    } catch {
      setFlash('Could not send request, please try again.');
    } finally {
      setSending(false);
    }
  };

  const submitGuest = async (e) => {
    e.preventDefault();
    if (!guest.fullName.trim()) return;
    setSending(true);
    try {
      await portalApi.post('/residents', guest);
      setGuest({ fullName: '', passportNo: '', nationality: '', birthDate: '', passportLink: '' });
      setShowGuest(false);
      setFlash('Guest information sent. Hcare will complete the residence registration.');
      setTimeout(() => setFlash(''), 5000);
    } catch {
      setFlash('Could not send, please try again.');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 space-y-3">
        {[1, 2, 3].map((i) => <div key={i} className="skeleton h-28 w-full rounded-2xl" />)}
      </div>
    );
  }
  if (!me) return null;

  const { apartment: apt, rentThisMonth: rent, residents } = me;
  const expiringResidents = residents.filter((r) => r.daysLeft != null && r.daysLeft <= 14);
  const contractDaysLeft = apt.contractEnd
    ? Math.ceil((new Date(apt.contractEnd) - new Date()) / 86400000)
    : null;

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Header */}
      <div className="bg-blue-600 text-white px-4 pt-6 pb-8">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2.5 rounded-xl"><Building2 size={22} /></div>
            <div>
              <div className="text-blue-100 text-xs">Hcare Resident Portal</div>
              <div className="font-bold text-lg leading-tight">Apt {apt.name}</div>
            </div>
          </div>
          <button onClick={signOut} className="flex items-center gap-1.5 text-blue-100 text-sm">
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-4 space-y-4">
        {flash && (
          <div className="bg-green-50 border border-green-200 text-green-800 text-sm rounded-xl p-3">
            {flash}
          </div>
        )}

        {/* Nhắc tiền thuê */}
        {rent && rent.status !== 'paid' && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={20} />
              <div className="text-sm text-amber-900 min-w-0">
                <b>Rent for {rent.month}: {money(rent.amountDue - rent.amountPaid)} ₫</b> is due
                {apt.paymentDay && <> (payment day: {apt.paymentDay} of the month)</>}.
                {apt.qrLink && (
                  <a href={apt.qrLink} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-700 font-medium mt-1">
                    <QrCode size={15} /> Payment QR code
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Nhắc hạn tạm trú */}
        {expiringResidents.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-red-600 shrink-0 mt-0.5" size={20} />
              <div>
                <b>Residence registration attention needed:</b>
                {expiringResidents.map((r) => (
                  <div key={r.id}>
                    {r.fullName} — {r.daysLeft < 0 ? `expired ${Math.abs(r.daysLeft)} days ago` : `expires in ${r.daysLeft} days`}
                  </div>
                ))}
                <div className="mt-1 text-red-700">Please contact Hcare to renew.</div>
              </div>
            </div>
          </div>
        )}

        {/* HĐ sắp hết hạn */}
        {contractDaysLeft != null && contractDaysLeft <= 60 && contractDaysLeft > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-900">
            Your lease ends on <b>{fmtDate(apt.contractEnd)}</b> ({contractDaysLeft} days left).
            Contact Hcare to renew, or see other apartments below.
          </div>
        )}

        {/* Báo hỏng */}
        <div className="bg-white rounded-2xl shadow p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <Wrench size={18} className="text-blue-600" /> Report an Issue
            </h2>
            <button
              onClick={() => setShowReport(!showReport)}
              className="flex items-center gap-1 bg-blue-600 text-white text-sm font-medium px-3 py-2 rounded-lg"
            >
              <Plus size={16} /> New Request
            </button>
          </div>

          {showReport && (
            <form onSubmit={submitRepair} className="space-y-3 mb-4 bg-gray-50 rounded-xl p-3">
              <div>
                <label className="label-field">What is the problem with?</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="select-field">
                  {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="label-field">Describe the issue *</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input-field"
                  rows={3}
                  placeholder="e.g. The air conditioner in the bedroom is leaking water"
                  required
                />
              </div>
              <div>
                <label className="label-field">Photo link (optional)</label>
                <input
                  type="text"
                  value={imageLink}
                  onChange={(e) => setImageLink(e.target.value)}
                  className="input-field"
                  placeholder="Paste a Google Drive / photo link"
                />
              </div>
              <button type="submit" disabled={sending} className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-lg disabled:opacity-60">
                {sending ? 'Sending...' : 'Send Request'}
              </button>
            </form>
          )}

          {repairs.length === 0 ? (
            <p className="text-sm text-gray-400">No requests yet.</p>
          ) : (
            <div className="space-y-2">
              {repairs.map((r) => (
                <div key={r.id} className="border border-gray-100 rounded-xl p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-sm text-gray-800 min-w-0">{r.description}</div>
                    <span className={`shrink-0 text-xs font-medium px-2 py-1 rounded-full ${STATUS_LABEL[r.status]?.cls}`}>
                      {STATUS_LABEL[r.status]?.text || r.status}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {fmtDate(r.createdAt)}
                    {r.staffNotes && r.status === 'done' && <> · {r.staffNotes}</>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Thông tin căn hộ */}
        <div className="bg-white rounded-2xl shadow p-4">
          <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-3">
            <Home size={18} className="text-blue-600" /> My Apartment
          </h2>
          <div className="text-sm text-gray-700 space-y-1.5">
            <div className="flex justify-between"><span className="text-gray-500">Monthly rent</span><b>{money(apt.rentAmount)} ₫</b></div>
            {apt.deposit > 0 && <div className="flex justify-between"><span className="text-gray-500">Deposit</span><b>{money(apt.deposit)} ₫</b></div>}
            <div className="flex justify-between"><span className="text-gray-500">Lease period</span><b>{fmtDate(apt.contractStart)} → {fmtDate(apt.contractEnd)}</b></div>
            {apt.paymentDay && <div className="flex justify-between"><span className="text-gray-500">Payment day</span><b>Day {apt.paymentDay}</b></div>}
            {apt.rentalForm && <div className="flex justify-between"><span className="text-gray-500">Management fee</span><b>{apt.rentalForm === 'Net' ? 'Paid by tenant (Net)' : 'Included'}</b></div>}
          </div>
          <div className="flex gap-3 mt-3 flex-wrap">
            {apt.contractLink && (
              <a href={apt.contractLink} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-blue-600 text-sm font-medium">
                <FileText size={15} /> Lease contract
              </a>
            )}
            {apt.zaloLink && apt.zaloLink.startsWith('http') && (
              <a href={apt.zaloLink} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-blue-600 text-sm font-medium">
                <MessageCircle size={15} /> Zalo group
              </a>
            )}
          </div>
        </div>

        {/* Tự khai khách ở */}
        <div className="bg-white rounded-2xl shadow p-4">
          <button onClick={() => setShowGuest(!showGuest)} className="w-full flex items-center justify-between">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <UserPlus size={18} className="text-blue-600" /> Register a Resident
            </h2>
            {showGuest ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
          </button>
          <p className="text-xs text-gray-400 mt-1">
            Everyone staying in the apartment must be registered for temporary residence (required by Vietnamese law).
          </p>
          {showGuest && (
            <form onSubmit={submitGuest} className="space-y-3 mt-3 bg-gray-50 rounded-xl p-3">
              <input type="text" value={guest.fullName} onChange={(e) => setGuest({ ...guest, fullName: e.target.value })} className="input-field" placeholder="Full name (as in passport) *" required />
              <div className="grid grid-cols-2 gap-3">
                <input type="text" value={guest.passportNo} onChange={(e) => setGuest({ ...guest, passportNo: e.target.value })} className="input-field" placeholder="Passport No." />
                <input type="text" value={guest.nationality} onChange={(e) => setGuest({ ...guest, nationality: e.target.value })} className="input-field" placeholder="Nationality" />
              </div>
              <div>
                <label className="label-field">Date of birth</label>
                <input type="date" value={guest.birthDate} onChange={(e) => setGuest({ ...guest, birthDate: e.target.value })} className="input-field" />
              </div>
              <input type="text" value={guest.passportLink} onChange={(e) => setGuest({ ...guest, passportLink: e.target.value })} className="input-field" placeholder="Passport photo link (Google Drive...)" />
              <button type="submit" disabled={sending} className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-lg disabled:opacity-60">
                {sending ? 'Sending...' : 'Submit'}
              </button>
            </form>
          )}
        </div>

        {/* Căn trống */}
        {vacant.length > 0 && (
          <div className="bg-white rounded-2xl shadow p-4">
            <h2 className="font-bold text-gray-900 mb-1">Other Apartments by Hcare</h2>
            <p className="text-xs text-gray-400 mb-3">Moving or know someone looking? These are available now.</p>
            <div className="space-y-2">
              {vacant.map((v) => (
                <div key={v.name} className="flex items-center justify-between border border-gray-100 rounded-xl p-3 text-sm">
                  <div>
                    <b className="text-gray-900">{v.name}</b>
                    <span className="text-gray-500">
                      {v.bedrooms ? ` · ${v.bedrooms} BR` : ''}{v.area ? ` · ${v.area} m²` : ''}
                    </span>
                  </div>
                  <div className="text-right">
                    {v.rentAmount > 0
                      ? <b className="text-blue-600">{money(v.rentAmount)} ₫/mo</b>
                      : <span className="text-gray-400">Contact us</span>}
                  </div>
                </div>
              ))}
            </div>
            {apt.zaloLink && apt.zaloLink.startsWith('http') && (
              <a href={apt.zaloLink} target="_blank" rel="noreferrer" className="block text-center text-blue-600 text-sm font-medium mt-3">
                Contact Hcare on Zalo →
              </a>
            )}
          </div>
        )}

        <p className="text-center text-xs text-gray-300 pt-2">Hcare Vietnam · Resident Portal</p>
      </div>
    </div>
  );
}
