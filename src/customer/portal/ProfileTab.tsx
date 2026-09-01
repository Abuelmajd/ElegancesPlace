import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { User, Phone, Mail, MapPin, Building, Shield, CheckCircle2, Save, Lock } from 'lucide-react';

export const ProfileTab: React.FC = () => {
  const { currentUser, updateUserProfile } = useAuth();

  const [name, setName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [city, setCity] = useState(currentUser?.city || 'القدس');
  const [address, setAddress] = useState(currentUser?.address || '');
  
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');

    setTimeout(() => {
      updateUserProfile({
        name,
        phone,
        email,
        city,
        address
      });
      setSaving(false);
      setSuccessMsg('تم حفظ وتحديث بيانات حسابك الشخصي بنجاح!');
      setTimeout(() => setSuccessMsg(''), 4000);
    }, 400);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-l from-stone-900 to-stone-800 text-white p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-2xl shadow-inner border border-emerald-400/30">
            {currentUser?.name ? currentUser.name.charAt(0) : 'ع'}
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white">{currentUser?.name || 'حساب العميل'}</h2>
            <p className="text-xs text-stone-300 mt-1 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-400" /> حساب موثق (عميل النخبة)
            </p>
          </div>
        </div>

        <div className="text-right sm:text-left text-xs text-stone-300 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-xs">
          <span className="text-stone-400 block text-[10px]">معرف العميل (ID)</span>
          <span className="font-mono text-emerald-300 font-bold">{currentUser?.user_id || 'cust_demo'}</span>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          {successMsg}
        </div>
      )}

      {/* Editable Form */}
      <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs">
        <h3 className="text-base font-bold text-stone-900 mb-6 flex items-center gap-2 border-b border-stone-100 pb-3">
          <User className="w-5 h-5 text-emerald-600" /> تعديل بيانات الحساب الشخصية
        </h3>

        <form onSubmit={handleSaveProfile} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Name */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-stone-400" /> الاسم الكامل
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                placeholder="أدخل اسمك الثلاثي"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-stone-400" /> رقم الهاتف / الجوال
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-left dir-ltr"
                placeholder="+970 599 000000"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-stone-400" /> البريد الإلكتروني
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-left dir-ltr"
                placeholder="customer@example.com"
              />
            </div>

            {/* City */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-stone-400" /> المدينة / المحافظة
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all cursor-pointer bg-white"
              >
                <option value="القدس">القدس</option>
                <option value="رام الله والبيرة">رام الله والبيرة</option>
                <option value="نابلس">نابلس</option>
                <option value="الخليل">الخليل</option>
                <option value="بيت لحم">بيت لحم</option>
                <option value="جنين">جنين</option>
                <option value="طولكرم">طولكرم</option>
                <option value="قلقيلية">قلقيلية</option>
                <option value="أريحا">أريحا</option>
                <option value="سلفيت">سلفيت</option>
                <option value="طوباس">طوباس</option>
                <option value="قطاع غزة">قطاع غزة</option>
              </select>
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-stone-400" /> العنوان التفصيلي للشحن والتوصيل
            </label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={3}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              placeholder="اسم الحي، اسم الشارع، البناية، الطابق، أية معالم بارزة"
            />
          </div>

          {/* System Locked Fields info */}
          <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 text-xs text-stone-600 flex items-center gap-2">
            <Lock className="w-4 h-4 text-stone-400 shrink-0" />
            <span>الحقول الأمنية الأساسية مثل (معرف العميل وسجل تاريخ الانضمام) محمية ومثبتة بحسب قواعد الأمان والنظام المحاسبي.</span>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-6 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
