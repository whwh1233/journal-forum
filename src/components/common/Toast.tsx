import React, { useState } from 'react';
import { useToastContext, Toast as ToastType } from '@/contexts/ToastContext';
import './Toast.css';

const ToastIcon: React.FC<{ type: ToastType['type'] }> = ({ type }) => {
  const icons = {
    success: '✓',
    error: '✕',
    warning: '!',
    info: 'i',
  };
  return <span>{icons[type]}</span>;
};

interface ToastItemProps {
  toast: ToastType;
  onRemove: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onRemove }) => {
  const [isExiting, setIsExiting] = useState(false);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onRemove(toast.id);
    }, 300);
  };

  return (
    <div
      className={`toast toast--${toast.type} ${isExiting ? 'exiting' : ''}`}
      role="alert"
      aria-live="polite"
    >
      <div className="toast-icon">
        <ToastIcon type={toast.type} />
      </div>
      <div className="toast-content">
        <p className="toast-message">{toast.message}</p>
      </div>
      <button
        className="toast-close"
        onClick={handleClose}
        aria-label="关闭通知"
      >
        ×
      </button>
      {toast.duration && toast.duration > 0 && (
        <div
          className="toast-progress"
          style={{ animationDuration: `${toast.duration}ms` }}
        />
      )}
    </div>
  );
};

const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastContext();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="toast-container" aria-label="通知区域">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
};

export default ToastContainer;
