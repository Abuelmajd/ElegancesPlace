import React, { useState } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import { Bell, Check, Trash2, Search, Filter, AlertCircle } from 'lucide-react';
import { AppNotification } from '../types';

export const NotificationManagement: React.FC = () => {
  const { 
    userNotifications, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
  } = useNotifications();

  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredNotifications = userNotifications.filter(n => {
    if (filterType === 'UNREAD' && n.is_read) return false;
    if (filterType !== 'ALL' && filterType !== 'UNREAD' && n.entity_type !== filterType) return false;
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q);
    }
    return true;
  });

  const getPriorityBadge = (priority: string) => {
    switch(priority) {
      case 'URGENT': return <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded font-bold">عاجل جداً</span>;
      case 'HIGH': return <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded font-bold">هام</span>;
      case 'NORMAL': return <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded font-bold">عادي</span>;
      default: return <span className="bg-stone-100 text-stone-800 text-xs px-2 py-1 rounded font-bold">منخفض</span>;
    }
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleString('ar-SA', { 
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-stone-100 text-stone-800 rounded-lg">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-stone-800">مركز الإشعارات والتنبيهات</h2>
            <p className="text-sm text-stone-500">إدارة ومتابعة كافة الإشعارات الواردة للنظام</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={markAllAsRead}
            className="flex items-center gap-2 bg-stone-100 text-stone-700 hover:bg-stone-200 px-4 py-2 rounded-lg font-medium transition-colors text-sm"
          >
            <Check className="w-4 h-4" /> تحديد الكل كمقروء
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-stone-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-stone-50/50">
          <div className="relative w-full sm:w-96">
            <Search className="absolute right-3 top-2.5 h-5 w-5 text-stone-400" />
            <input
              type="text"
              placeholder="ابحث في الإشعارات..."
              className="w-full pl-4 pr-10 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
            <Filter className="w-4 h-4 text-stone-400 flex-shrink-0" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="ALL">كل الإشعارات</option>
              <option value="UNREAD">غير المقروءة فقط</option>
              <option value="ORDER">الطلبات</option>
              <option value="PRODUCT">المخزون والمنتجات</option>
              <option value="SUPPLIER">الموردين</option>
              <option value="SYSTEM">تنبيهات النظام</option>
            </select>
          </div>
        </div>

        <div className="divide-y divide-stone-100">
          {filteredNotifications.length === 0 ? (
            <div className="p-12 text-center text-stone-500 flex flex-col items-center justify-center">
              <Bell className="w-12 h-12 text-stone-200 mb-4" />
              <p className="text-lg font-medium">لا توجد إشعارات مطابقة</p>
              <p className="text-sm">لم يتم العثور على أي إشعارات تطابق معايير البحث الحالية.</p>
            </div>
          ) : (
            filteredNotifications.map(notif => (
              <div 
                key={notif.notification_id} 
                className={`p-4 sm:p-5 flex flex-col sm:flex-row gap-4 hover:bg-stone-50 transition-colors border-l-4 ${notif.is_read ? 'border-l-transparent' : 'border-l-emerald-500 bg-emerald-50/30'}`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className={`text-base ${notif.is_read ? 'font-medium text-stone-700' : 'font-bold text-stone-900'}`}>
                      {notif.title}
                    </h3>
                    {getPriorityBadge(notif.priority)}
                    {!notif.is_read && (
                      <span className="bg-emerald-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">جديد</span>
                    )}
                  </div>
                  <p className="text-sm text-stone-600 mt-1 leading-relaxed max-w-4xl">
                    {notif.message}
                  </p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-stone-500">
                    <span>{formatDate(notif.created_at)}</span>
                    <span className="bg-stone-100 px-2 py-0.5 rounded text-stone-600 font-medium">
                      {notif.entity_type}
                    </span>
                  </div>
                </div>
                
                <div className="flex sm:flex-col items-center justify-end sm:justify-start gap-2 border-t border-stone-100 sm:border-t-0 pt-3 sm:pt-0 mt-3 sm:mt-0">
                  {!notif.is_read && (
                    <button
                      onClick={() => markAsRead(notif.notification_id)}
                      className="flex-1 sm:flex-none text-center px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded transition-colors whitespace-nowrap"
                    >
                      تحديد كمقروء
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(notif.notification_id)}
                    className="flex-1 sm:flex-none text-center px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded transition-colors whitespace-nowrap"
                  >
                    حذف الإشعار
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
