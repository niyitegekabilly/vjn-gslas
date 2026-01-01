
import React from 'react';
import { AlertTriangle, Loader2, Info, CheckCircle } from 'lucide-react';

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
}

export const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  isOpen,
  title,
  description,
  onConfirm,
  onCancel,
  isDeleting = false,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  variant = 'danger'
}) => {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
          btnBg: 'bg-blue-600',
          btnHover: 'hover:bg-blue-700',
          ring: 'focus:ring-blue-500',
          icon: <Info size={24} />
        };
      case 'warning':
        return {
          iconBg: 'bg-orange-100',
          iconColor: 'text-orange-600',
          btnBg: 'bg-orange-600',
          btnHover: 'hover:bg-orange-700',
          ring: 'focus:ring-orange-500',
          icon: <AlertTriangle size={24} />
        };
      case 'danger':
      default:
        return {
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          btnBg: 'bg-red-600',
          btnHover: 'hover:bg-red-700',
          ring: 'focus:ring-red-500',
          icon: <AlertTriangle size={24} />
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-xl max-w-sm w-full overflow-hidden border border-gray-200 transform transition-all scale-100">
        <div className="p-6">
          <div className={`flex items-center justify-center w-12 h-12 mx-auto rounded-full mb-4 ${styles.iconBg} ${styles.iconColor}`}>
            {styles.icon}
          </div>
          <h3 className="text-lg font-bold text-center text-gray-900 mb-2">
            {title}
          </h3>
          <div className="text-sm text-center text-gray-500 mb-6">
            {description}
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={isDeleting}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-gray-200"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className={`flex-1 px-4 py-2 text-white rounded-lg font-medium transition-colors flex items-center justify-center disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-sm ${styles.btnBg} ${styles.btnHover} ${styles.ring}`}
            >
              {isDeleting ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
