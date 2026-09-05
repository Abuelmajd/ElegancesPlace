import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { X, Lock, Mail, User, Shield, Sparkles } from 'lucide-react';
import { UserRole } from '../../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { emailLogin, emailRegister } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        await emailRegister(email, password, name, 'Customer');
      } else {
        await emailLogin(email, password);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء المصادقة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-md overflow-hidden relative animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-stone-900 text-white flex items-center justify-center font-bold text-xl mx-auto mb-3 shadow-md">
              نـ
            </div>
            <h3 className="text-xl font-extrabold text-stone-900">
              {isRegister ? 'إنشاء حساب جديد في ElegancesPlace' : 'تسجيل الدخول إلى حسابك'}
            </h3>
            <p className="text-xs text-stone-500 mt-1">الوصول الآمن لحسابك وطلباتك ومتابعة المشتريات</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">الاسم الكامل</label>
                <div className="relative">
                  <User className="absolute right-3.5 top-3 w-4 h-4 text-stone-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="أدخل اسمك الكامل"
                    className="w-full pr-10 pl-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-emerald-600 transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">البريد الإلكتروني</label>
              <div className="relative">
                <Mail className="absolute right-3.5 top-3 w-4 h-4 text-stone-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pr-10 pl-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-emerald-600 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">كلمة المرور</label>
              <div className="relative">
                <Lock className="absolute right-3.5 top-3 w-4 h-4 text-stone-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pr-10 pl-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-emerald-600 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-md transition-colors cursor-pointer text-sm"
            >
              {loading ? 'جاري التنفيذ...' : (isRegister ? 'إنشاء حساب جديد' : 'تسجيل الدخول')}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-stone-200 text-center">
            <button
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              className="text-xs font-semibold text-emerald-700 hover:underline cursor-pointer"
            >
              {isRegister ? 'لديك حساب بالفعل؟ تسجيل الدخول' : 'ليس لديك حساب؟ انشئ حساباً جديداً'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

