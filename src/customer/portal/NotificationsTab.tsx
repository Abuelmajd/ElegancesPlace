import React from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import { Bell, Check, CheckCheck, Trash2, Clock, AlertCircle, ShoppingBag, Truck, Info } from 'lucide-react';

export const NotificationsTab: React.FC = () => {
  const { userNotifications, unreadCount, markAsRead, markAllAsRead, clearAllUserNotifications } = useNotifications();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
            <Bell className="w-5 h-5 text-emerald-600" /> مركز الإشعارات والتنبيهات ({userNotifications.length})
          </h3>
          <p className="text-xs text-stone-500 mt-1">تحديثات طلباتك وإشعارات التغيير في حالات الشحن والعروض الحصرية</p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={() => markAllAsRead()}
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-2 rounded-xl border border-emerald-200 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <CheckCheck className="w-4 h-4 text-emerald-600" /> تحديد الكل كتمت القراءة
            </button>
          )}

          {userNotifications.length > 0 && (
            <button
              onClick={() => clearAllUserNotifications()}
              className="bg-stone-100 hover:bg-red-50 hover:text-red-600 text-stone-700 text-xs font-bold px-3 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" /> مسح الإشعارات
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {userNotifications.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 border border-stone-200 text-center space-y-3">
            <div className="w-16 h-16 bg-stone-100 text-stone-400 rounded-full flex items-center justify-center mx-auto">
              <Bell className="w-8 h-8" />
            </div>
            <h4 className="font-bold text-stone-800 text-base">لا توجد إشعارات جديدة</h4>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">ستظهر هنا أية إشعارات فورية تتعلق بتحديثات شحناتك أو العروض الخاصة بك.</p>
          </div>
        ) : (
          userNotifications.map(notif => (
            <div
              key={notif.notification_id}
              onClick={() => !notif.is_read && markAsRead(notif.notification_id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-4 ${notif.is_read ? 'bg-white border-stone-200 opacity-90' : 'bg-emerald-50/50 border-emerald-200 shadow-xs'}`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${notif.priority === 'HIGH' || notif.priority === 'URGENT' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                  {notif.type.includes('ORDER') ? <ShoppingBag className="w-5 h-5" /> : <Info className="w-5 h-5" />}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h5 className="font-bold text-stone-900 text-sm">{notif.title}</h5>
                    {!notif.is_read && (
                      <span className="bg-emerald-600 w-2 h-2 rounded-full inline-block" title="إشعار غير مقروء" />
                    )}
                  </div>
                  <p className="text-xs text-stone-600 leading-relaxed">{notif.message}</p>
                  <p className="text-[10px] text-stone-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {notif.created_at ? new Date(notif.created_at).toLocaleString('ar-SA') : '-'}
                  </p>
                </div>
              </div>

              {!notif.is_read && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    markAsRead(notif.notification_id);
                  }}
                  className="p-1.5 text-stone-400 hover:text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer shrink-0"
                  title="تعليم كتمت القراءة"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
