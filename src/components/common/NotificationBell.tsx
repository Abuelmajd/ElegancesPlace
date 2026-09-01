import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, Trash2, Settings, ExternalLink, RefreshCw } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';
import { AppNotification } from '../../types';

export const NotificationBell: React.FC = () => {
  const { 
    userNotifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    preferences,
    updatePreferences,
    requestBrowserPermission
  } = useNotifications();
  
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowSettings(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'أمس';
    if (diffDays < 7) return `منذ ${diffDays} أيام`;
    
    return date.toLocaleDateString('ar-SA');
  };

  const getPriorityColors = (priority: string, isRead: boolean) => {
    if (isRead) return 'bg-white text-stone-600 border-stone-200';
    
    switch (priority) {
      case 'URGENT': return 'bg-red-50 text-red-900 border-red-200';
      case 'HIGH': return 'bg-orange-50 text-orange-900 border-orange-200';
      case 'NORMAL': return 'bg-blue-50 text-blue-900 border-blue-200';
      default: return 'bg-stone-50 text-stone-900 border-stone-200';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
        title="الإشعارات"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-stone-200 overflow-hidden z-50 flex flex-col max-h-[85vh] origin-top-left">
          
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100 bg-stone-50/50">
            <h3 className="font-bold text-stone-800 flex items-center gap-2">
              <Bell className="w-4 h-4 text-emerald-600" />
              {showSettings ? 'إعدادات الإشعارات' : 'مركز الإشعارات'}
            </h3>
            <div className="flex items-center gap-1">
              {!showSettings && unreadCount > 0 && (
                <button 
                  onClick={markAllAsRead}
                  className="text-xs text-stone-500 hover:text-emerald-600 font-medium px-2 py-1 rounded hover:bg-emerald-50 transition-colors"
                >
                  تعيين كـ مقروء
                </button>
              )}
              <button 
                onClick={() => setShowSettings(!showSettings)}
                className={`p-1.5 rounded-lg transition-colors ${showSettings ? 'bg-stone-200 text-stone-800' : 'text-stone-500 hover:bg-stone-200'}`}
                title="الإعدادات"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Settings View */}
          {showSettings && (
            <div className="p-4 overflow-y-auto flex-1 bg-stone-50 text-sm">
              <div className="space-y-4">
                <div className="bg-white p-3 rounded-lg border border-stone-200 shadow-sm">
                  <h4 className="font-semibold text-stone-800 mb-2 border-b pb-1">تنبيهات النظام</h4>
                  <label className="flex items-center justify-between py-2 cursor-pointer">
                    <span className="text-stone-700">تفعيل الصوت (Beep)</span>
                    <input 
                      type="checkbox" 
                      className="accent-emerald-600 w-4 h-4"
                      checked={preferences.enableSound}
                      onChange={(e) => updatePreferences({ enableSound: e.target.checked })}
                    />
                  </label>
                  <label className="flex items-center justify-between py-2 cursor-pointer">
                    <span className="text-stone-700">إشعارات المتصفح</span>
                    <div className="flex items-center gap-2">
                      {!preferences.enableBrowserNotifications ? (
                        <button 
                          onClick={requestBrowserPermission}
                          className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded"
                        >
                          تفعيل
                        </button>
                      ) : (
                        <span className="text-xs text-emerald-600 font-medium">مفعلة</span>
                      )}
                      <input 
                        type="checkbox" 
                        className="accent-emerald-600 w-4 h-4"
                        checked={preferences.enableBrowserNotifications}
                        onChange={(e) => updatePreferences({ enableBrowserNotifications: e.target.checked })}
                      />
                    </div>
                  </label>
                </div>

                <div className="bg-white p-3 rounded-lg border border-stone-200 shadow-sm">
                  <h4 className="font-semibold text-stone-800 mb-2 border-b pb-1">الأحداث</h4>
                  <label className="flex items-center justify-between py-2 cursor-pointer">
                    <span className="text-stone-700">طلبات جديدة</span>
                    <input 
                      type="checkbox" 
                      className="accent-emerald-600 w-4 h-4"
                      checked={preferences.categories.newOrders}
                      onChange={(e) => updatePreferences({ categories: { ...preferences.categories, newOrders: e.target.checked } })}
                    />
                  </label>
                  <label className="flex items-center justify-between py-2 cursor-pointer">
                    <span className="text-stone-700">تحديثات الطلبات</span>
                    <input 
                      type="checkbox" 
                      className="accent-emerald-600 w-4 h-4"
                      checked={preferences.categories.orderUpdates}
                      onChange={(e) => updatePreferences({ categories: { ...preferences.categories, orderUpdates: e.target.checked } })}
                    />
                  </label>
                  <label className="flex items-center justify-between py-2 cursor-pointer">
                    <span className="text-stone-700">المخزون المنخفض / النافد</span>
                    <input 
                      type="checkbox" 
                      className="accent-emerald-600 w-4 h-4"
                      checked={preferences.categories.lowStock}
                      onChange={(e) => updatePreferences({ categories: { ...preferences.categories, lowStock: e.target.checked } })}
                    />
                  </label>
                  <label className="flex items-center justify-between py-2 cursor-pointer">
                    <span className="text-stone-700">تنبيهات الموردين</span>
                    <input 
                      type="checkbox" 
                      className="accent-emerald-600 w-4 h-4"
                      checked={preferences.categories.supplierAlerts}
                      onChange={(e) => updatePreferences({ categories: { ...preferences.categories, supplierAlerts: e.target.checked } })}
                    />
                  </label>
                  <label className="flex items-center justify-between py-2 cursor-pointer">
                    <span className="text-stone-700">أحداث المزامنة والنظام</span>
                    <input 
                      type="checkbox" 
                      className="accent-emerald-600 w-4 h-4"
                      checked={preferences.categories.systemAlerts}
                      onChange={(e) => updatePreferences({ categories: { ...preferences.categories, systemAlerts: e.target.checked } })}
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Notifications List View */}
          {!showSettings && (
            <div className="overflow-y-auto flex-1 bg-stone-50 max-h-[60vh]">
              {userNotifications.length === 0 ? (
                <div className="p-8 text-center text-stone-500 flex flex-col items-center">
                  <Check className="w-8 h-8 text-stone-300 mb-2" />
                  <p>لا توجد إشعارات جديدة</p>
                </div>
              ) : (
                <div className="flex flex-col divide-y divide-stone-100">
                  {userNotifications.map((notif) => (
                    <div 
                      key={notif.notification_id} 
                      onClick={() => {
                        if (!notif.is_read) markAsRead(notif.notification_id);
                      }}
                      className={`p-4 border-l-4 transition-colors relative group cursor-pointer ${getPriorityColors(notif.priority, notif.is_read)} ${notif.is_read ? 'border-l-transparent' : 'border-l-emerald-500 hover:bg-stone-50'} `}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <h4 className={`text-sm ${notif.is_read ? 'font-medium' : 'font-bold'}`}>
                          {notif.title}
                        </h4>
                        <span className="text-[10px] text-stone-500 whitespace-nowrap mr-2 flex-shrink-0">
                          {formatTimeAgo(notif.created_at)}
                        </span>
                      </div>
                      
                      <p className={`text-xs mt-1 leading-relaxed ${notif.is_read ? 'text-stone-500' : 'text-stone-700'}`}>
                        {notif.message}
                      </p>

                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                            notif.priority === 'URGENT' ? 'bg-red-100 text-red-700' : 
                            notif.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' : 
                            'bg-stone-100 text-stone-600'
                          }`}>
                            {notif.priority}
                          </span>
                          {notif.sync_status === 'PENDING' ? (
                            <span className="text-[10px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded flex items-center gap-1 font-semibold">
                              <RefreshCw className="w-3 h-3 animate-spin" /> قيد المزامنة...
                            </span>
                          ) : (
                            <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded flex items-center gap-1 font-semibold">
                              <Check className="w-3 h-3" /> متزامنة سحابياً
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!notif.is_read && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); markAsRead(notif.notification_id); }}
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                              title="تحديد كمقروء"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          <button 
                            onClick={(e) => { e.stopPropagation(); deleteNotification(notif.notification_id); }}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                            title="حذف السجل"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Footer Action (Optional) */}
          {!showSettings && userNotifications.length > 0 && (
            <div className="p-2 border-t border-stone-200 bg-white text-center">
              <button 
                onClick={() => { /* Navigate to full center in Admin */ setIsOpen(false); }}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold w-full py-1.5"
              >
                عرض كل الإشعارات
              </button>
            </div>
          )}

        </div>
      )}
    </div>
  );
};
