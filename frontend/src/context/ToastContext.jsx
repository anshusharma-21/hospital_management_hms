import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toastOrMessage, maybeType = 'info', maybeDuration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);

    let title = null;
    let message = '';
    let type = 'info';
    let duration = 4000;

    if (typeof toastOrMessage === 'string') {
      message = toastOrMessage.trim();
      type = typeof maybeType === 'string' ? maybeType : 'info';
      duration = typeof maybeType === 'number' ? maybeType : maybeDuration;
    } else if (toastOrMessage && typeof toastOrMessage === 'object') {
      title = toastOrMessage.title ? String(toastOrMessage.title).trim() : null;
      const rawMsg = toastOrMessage.message || toastOrMessage.description || toastOrMessage.text || toastOrMessage.error || '';
      message = rawMsg ? String(rawMsg).trim() : '';
      type = toastOrMessage.type || (typeof maybeType === 'string' ? maybeType : 'info');
      duration = toastOrMessage.duration || (typeof maybeType === 'number' ? maybeType : 4000);
    } else {
      return;
    }

    // Empty-content protection: Never render an empty/blank toast box
    if (!title && !message) {
      return;
    }

    const toastObj = { id, title, message, type, duration };
    setToasts((prev) => [...prev, toastObj]);

    const dur = toastObj.duration || 4000;
    if (dur > 0) {
      setTimeout(() => {
        removeToast(id);
      }, dur);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const getToastIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />;
      default:
        return <Info className="w-5 h-5 text-teal-500 shrink-0" />;
    }
  };

  const getToastBorder = (type) => {
    switch (type) {
      case 'success':
        return 'border-l-4 border-l-emerald-500 bg-white';
      case 'error':
        return 'border-l-4 border-l-rose-500 bg-white';
      case 'warning':
        return 'border-l-4 border-l-amber-500 bg-white';
      default:
        return 'border-l-4 border-l-teal-500 bg-white';
    }
  };

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      {/* Toast Notification Container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2.5 max-w-md w-full px-3 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto shadow-lg rounded-xl p-3.5 border border-slate-200/80 flex items-start gap-3 transition-all animate-slide-up ${getToastBorder(
              toast.type
            )}`}
          >
            {getToastIcon(toast.type)}
            <div className="flex-1 min-w-0">
              {toast.title && <h4 className="text-xs font-bold text-slate-800">{toast.title}</h4>}
              {toast.message && <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{toast.message}</p>}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
