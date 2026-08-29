/**
 * Forgot Password Page
 * Path: src/pages/auth/ForgotPasswordPage.jsx
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Loader, ArrowLeft, CheckCircle } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setEmail(e.target.value);
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      setError('Email không được để trống');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Email không hợp lệ');
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setIsSubmitted(true);
      toast.success('Hướng dẫn đặt lại mật khẩu đã được gửi đến email của bạn');
    } catch (err) {
      const message = err.response?.data?.error || 'Yêu cầu không thành công';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="bg-white rounded-lg shadow-xl p-8 w-full">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircle className="text-green-600" size={32} />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Email đã được gửi</h2>
          <p className="text-gray-600 mb-4">
            Hướng dẫn đặt lại mật khẩu đã được gửi đến{' '}
            <span className="font-medium text-gray-900">{email}</span>
          </p>
          <p className="text-gray-600 text-sm mb-8">
            Vui lòng kiểm tra email của bạn và làm theo hướng dẫn để đặt lại mật khẩu.
            Nếu bạn không nhận được email trong vài phút, hãy kiểm tra thư mục Spam.
          </p>

          <div className="space-y-3">
            <button
              onClick={() => navigate('/login')}
              className="w-full btn-primary"
            >
              Quay lại đăng nhập
            </button>
            <button
              onClick={() => {
                setIsSubmitted(false);
                setEmail('');
              }}
              className="w-full btn-secondary"
            >
              Thử email khác
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-xl p-8 w-full">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Quản Lý Công Ty</h2>
        <p className="text-gray-600 mt-2">Đặt lại mật khẩu</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <p className="text-gray-600 text-sm">
          Nhập địa chỉ email của bạn và chúng tôi sẽ gửi cho bạn liên kết để đặt lại mật khẩu.
        </p>

        {/* Email */}
        <div>
          <label className="label-field">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="email"
              value={email}
              onChange={handleChange}
              className={`input-field pl-10 ${error ? 'border-red-500' : ''}`}
              placeholder="your@email.com"
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader size={18} className="animate-spin" />
              Đang gửi...
            </>
          ) : (
            'Gửi hướng dẫn'
          )}
        </button>
      </form>

      {/* Back to login link */}
      <div className="text-center mt-6">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
        >
          <ArrowLeft size={18} />
          Quay lại đăng nhập
        </Link>
      </div>
    </div>
  );
}
