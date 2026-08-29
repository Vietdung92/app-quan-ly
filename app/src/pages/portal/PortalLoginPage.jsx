/**
 * Tenant Portal - Login (English-first)
 * Path: src/pages/portal/PortalLoginPage.jsx
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import portalApi from '../../services/portalApi';

export default function PortalLoginPage() {
  const navigate = useNavigate();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await portalApi.post('/login', { login, password });
      try { localStorage.setItem('tenant_token', res.data.data.token); } catch { /* ignore */ }
      navigate('/portal');
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to sign in, please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex bg-blue-600 p-4 rounded-2xl mb-3">
            <Building2 className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Hcare Resident Portal</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Sign in with the account provided by Hcare
            <br />
            <span className="text-gray-400">Đăng nhập bằng tài khoản do Hcare cung cấp</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
              {error}
            </div>
          )}
          <div>
            <label className="label-field">Email or Phone</label>
            <input
              type="text"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              className="input-field"
              placeholder="your@email.com"
              autoComplete="username"
              required
            />
          </div>
          <div>
            <label className="label-field">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              autoComplete="current-password"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
          <p className="text-xs text-gray-400 text-center">
            Forgot your password? Contact Hcare via Zalo.
          </p>
        </form>
      </div>
    </div>
  );
}
