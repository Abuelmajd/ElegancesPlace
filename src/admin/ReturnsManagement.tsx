import React, { useState } from 'react';
import { useReturnRequests } from '../contexts/ReturnContext';
import { ReturnRequest, ReturnStatus } from '../types';
import { ArrowRightLeft, CheckCircle2, Clock, XCircle, MessageSquare, User, FileText, Search, Filter } from 'lucide-react';

export const ReturnsManagement: React.FC = () => {
  const { returnRequests, updateReturnRequestStatus } = useReturnRequests();

  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED'>('ALL');
  const [search, setSearch] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<ReturnRequest | null>(null);
  const [adminNotesInput, setAdminNotesInput] = useState('');
  const [updating, setUpdating] = useState(false);

  const filteredRequests = returnRequests.filter(req => {
    if (filter !== 'ALL' && req.status !== filter) return false;
    if (search.trim()) {
      const query = search.toLowerCase();
      const matchOrder = req.order_number_snapshot.toLowerCase().includes(query);
      const matchCustomer = req.customer_name_snapshot.toLowerCase().includes(query);
      const matchReason = req.reason.toLowerCase().includes(query);
      return matchOrder || matchCustomer || matchReason;
    }
    return true;
  });

  const handleUpdateStatus = async (status: ReturnStatus) => {
    if (!selectedRequest) return;
    setUpdating(true);
    await updateReturnRequestStatus(selectedRequest.request_id, status, adminNotesInput);
    setUpdating(false);
    setSelectedRequest(null);
    setAdminNotesInput('');
  };

  const getStatusBadge = (status: ReturnStatus) => {
    switch (status) {
      case 'PENDING':
        return <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> معلق قيد المراجعة</span>;
      case 'APPROVED':
        return <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> تمت الموافقة</span>;
      case 'REJECTED':
        return <span className="bg-red-100 text-red-800 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> مرفوض</span>;
      case 'COMPLETED':
        return <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> مكتمل ومغلق</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-stone-900 flex items-center gap-2">
            <ArrowRightLeft className="w-6 h-6 text-amber-600" /> إدارة طلبات الإرجاع والاستبدال
          </h2>
          <p className="text-xs text-stone-500 mt-1">مراجعة طلبات العملاء والموافقة عليها وتوثيق الملاحظات والمزامنة السحابية</p>
        </div>

        <div className="flex items-center gap-2 bg-stone-100 p-1 rounded-xl">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${filter === 'ALL' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600'}`}
          >
            الكل ({returnRequests.length})
          </button>
          <button
            onClick={() => setFilter('PENDING')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${filter === 'PENDING' ? 'bg-amber-500 text-white shadow-xs' : 'text-stone-600'}`}
          >
            المعلقة ({returnRequests.filter(r => r.status === 'PENDING').length})
          </button>
          <button
            onClick={() => setFilter('APPROVED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${filter === 'APPROVED' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600'}`}
          >
            المقبولة
          </button>
          <button
            onClick={() => setFilter('COMPLETED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${filter === 'COMPLETED' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600'}`}
          >
            المكتملة
          </button>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
        <table className="w-full text-right text-sm">
          <thead className="bg-stone-100 text-stone-700 font-bold text-xs border-b border-stone-200">
            <tr>
              <th className="p-4">رقم الطلب / العميل</th>
              <th className="p-4">نوع الطلب</th>
              <th className="p-4">المنتجات المطلوبة</th>
              <th className="p-4">سبب الطلب</th>
              <th className="p-4">الحالة</th>
              <th className="p-4">التاريخ</th>
              <th className="p-4 text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200">
            {filteredRequests.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-stone-500 text-xs">
                  لا توجد طلبات إرجاع أو استبدال مطابقة للفلاتر الحالية.
                </td>
              </tr>
            ) : (
              filteredRequests.map(req => (
                <tr key={req.request_id} className="hover:bg-stone-50/50 transition-colors">
                  <td className="p-4">
                    <p className="font-extrabold text-stone-900">{req.order_number_snapshot}</p>
                    <p className="text-xs text-stone-500 flex items-center gap-1 mt-0.5"><User className="w-3 h-3" /> {req.customer_name_snapshot}</p>
                  </td>
                  <td className="p-4 font-bold text-xs">
                    <span className={`px-2.5 py-1 rounded-full ${req.type === 'RETURN' ? 'bg-amber-100 text-amber-900' : 'bg-blue-100 text-blue-900'}`}>
                      {req.type === 'RETURN' ? 'إرجاع واسترداد' : 'استبدال'}
                    </span>
                  </td>
                  <td className="p-4 text-xs font-medium">
                    {req.items.map(i => `${i.product_name} (x${i.quantity})`).join(', ')}
                  </td>
                  <td className="p-4 text-xs text-stone-700 max-w-xs truncate">
                    {req.reason}
                  </td>
                  <td className="p-4">
                    {getStatusBadge(req.status)}
                  </td>
                  <td className="p-4 text-xs text-stone-500">
                    {new Date(req.created_at).toLocaleDateString('ar-SA')}
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => {
                        setSelectedRequest(req);
                        setAdminNotesInput(req.admin_notes || '');
                      }}
                      className="bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      معالجة Request
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Admin Action Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-stone-200 my-8">
            <div className="bg-stone-900 text-white p-5 flex items-center justify-between">
              <h3 className="font-bold text-base">معالجة طلب {selectedRequest.type === 'RETURN' ? 'الإرجاع' : 'الاستبدال'} للطلب #{selectedRequest.order_number_snapshot}</h3>
              <button onClick={() => setSelectedRequest(null)} className="text-stone-400 hover:text-white cursor-pointer">
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 space-y-1">
                <p><span className="font-bold text-stone-800">العميل:</span> {selectedRequest.customer_name_snapshot} ({selectedRequest.customer_phone_snapshot})</p>
                <p><span className="font-bold text-stone-800">سبب الطلب:</span> {selectedRequest.reason}</p>
                {selectedRequest.notes && <p><span className="font-bold text-stone-800">ملاحظات العميل:</span> {selectedRequest.notes}</p>}
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">ملاحظات الإدارة للعميل (تظهر للعميل في الإشعار وحسابه):</label>
                <textarea
                  value={adminNotesInput}
                  onChange={(e) => setAdminNotesInput(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="مثال: تمت الموافقة، يرجى تجهيز المنتجات لتسليمها لمندوب الشحن..."
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-stone-100">
                <button
                  onClick={() => handleUpdateStatus('REJECTED')}
                  disabled={updating}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
                >
                  رفض الطلب
                </button>

                <button
                  onClick={() => handleUpdateStatus('APPROVED')}
                  disabled={updating}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
                >
                  موافقة مبدئية
                </button>

                <button
                  onClick={() => handleUpdateStatus('COMPLETED')}
                  disabled={updating}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer"
                >
                  إتمام وإغلاق الطلب
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
