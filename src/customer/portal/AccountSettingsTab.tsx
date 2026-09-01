import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Settings, Lock, Bell, Shield, KeyRound, CheckCircle2, Globe, Save } from 'lucide-react';

export const AccountSettingsTab: React.FC = () => {
  const { currentUser } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdSubmitting, setPwdSubmitting] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [pwdError, setPwdError] = useState('');

  // Preferences state
  const [notifyOrderUpdates, setNotifyOrderUpdates] = useState(true);
  const [notifyPromotions, setNotifyPromotions] = useState(true);

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess('');

    if (newPassword.length < 6) {
      setPwdError('يجب أن تتكون كلمة المرور الجديدة من 6 خانات على الأقل.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwdError('كلمة المرور الجديدة وغير متطابقتين.');
      return;
    }

    setPwdSubmitting(true);
    setTimeout(() => {
      setPwdSubmitting(false);
      setPwdSuccess('تم تحديث كلمة المرور لحسابك بنجاح!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPwdSuccess(''), 4000);
    }, 500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs">
        <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
          <Settings className="w-5 h-5 text-emerald-600" /> إعدادات الحساب والأمان
        </h3>
        <p className="text-xs text-stone-500 mt-1">تعديل كلمة المرور وتفضيلات الإشعارات والأمان لحسابك</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Change Password Card */}
        <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs space-y-4">
          <h4 className="font-bold text-stone-900 text-sm flex items-center gap-2 border-b border-stone-100 pb-3">
            <KeyRound className="w-4 h-4 text-emerald-600" /> تغيير كلمة المرور
          </h4>

          {pwdSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              {pwdSuccess}
            </div>
          )}

          {pwdError && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-xl text-xs font-bold">
              {pwdError}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">كلمة المرور الحالية:</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">كلمة المرور الجديدة:</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">تأكيد كلمة المرور الجديدة:</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={pwdSubmitting}
              className="w-full bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs py-2.5 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {pwdSubmitting ? 'جاري التحديث...' : 'تحديث كلمة المرور'}
            </button>
          </form>
        </div>

        {/* Preferences & Security Card */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs space-y-4">
            <h4 className="font-bold text-stone-900 text-sm flex items-center gap-2 border-b border-stone-100 pb-3">
              <Bell className="w-4 h-4 text-emerald-600" /> تفضيلات الإشعارات والتنبيهات
            </h4>

            <div className="space-y-3 text-xs">
              <label className="flex items-center justify-between bg-stone-50 p-3 rounded-xl border border-stone-200 cursor-pointer">
                <div>
                  <span className="font-bold text-stone-900 block">إشعارات تتبع الشحنات والطلبات</span>
                  <span className="text-[11px] text-stone-500">تنبيهات فورية عند تغير حالة الطلب</span>
                </div>
                <input
                  type="checkbox"
                  checked={notifyOrderUpdates}
                  onChange={(e) => setNotifyOrderUpdates(e.target.checked)}
                  className="rounded-md text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between bg-stone-50 p-3 rounded-xl border border-stone-200 cursor-pointer">
                <div>
                  <span className="font-bold text-stone-900 block">إشعارات العروض والتخفيضات الحصرية</span>
                  <span className="text-[11px] text-stone-500">استلام إشعارات الأكواد الموسمية والمجانية</span>
                </div>
                <input
                  type="checkbox"
                  checked={notifyPromotions}
                  onChange={(e) => setNotifyPromotions(e.target.checked)}
                  className="rounded-md text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
              </label>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs space-y-3 text-xs">
            <h4 className="font-bold text-stone-900 text-sm flex items-center gap-2 border-b border-stone-100 pb-3">
              <Globe className="w-4 h-4 text-emerald-600" /> اللغة والعملة
            </h4>
            <div className="space-y-2">
              <p className="flex justify-between text-stone-700">
                <span>اللغة الافتراضية:</span>
                <span className="font-bold text-stone-900">العربية (RTL)</span>
              </p>
              <p className="flex justify-between text-stone-700">
                <span>العملة المعتمدة:</span>
                <span className="font-bold text-emerald-700">الشيقل / SAR (₪)</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
