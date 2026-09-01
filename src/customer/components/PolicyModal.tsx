import React from 'react';
import { X } from 'lucide-react';

interface PolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
}

export const PolicyModal: React.FC<PolicyModalProps> = ({ isOpen, onClose, title, content }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-stone-200">
        <div className="bg-stone-900 text-white p-5 flex items-center justify-between">
          <h3 className="font-bold text-base">{title}</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 text-xs text-stone-700 leading-relaxed max-h-[60vh] overflow-y-auto">
          {content || 'لا تتوفر تفاصيل حالياً.'}
        </div>
        <div className="p-4 border-t border-stone-100 flex justify-end">
          <button
            onClick={onClose}
            className="bg-stone-100 text-stone-700 px-4 py-2 rounded-xl text-xs font-bold hover:bg-stone-200 cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
