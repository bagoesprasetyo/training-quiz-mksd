import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle2, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
}

interface ToastContextValue {
  toasts: Toast[];
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
};

/* ─── Confirm Dialog ─── */
interface ConfirmState extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const timerRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    clearTimeout(timerRef.current[id]);
    delete timerRef.current[id];
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info', duration = 3500) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, type, message, duration }]);

    timerRef.current[id] = setTimeout(() => {
      removeToast(id);
    }, duration);
  }, [removeToast]);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise(resolve => {
      setConfirmState({ ...options, resolve });
    });
  }, []);

  const handleConfirmChoice = (choice: boolean) => {
    if (confirmState) {
      confirmState.resolve(choice);
      setConfirmState(null);
    }
  };

  const iconMap: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
    info: <Info className="w-5 h-5 text-[#0000FF] shrink-0" />,
  };

  const bgMap: Record<ToastType, string> = {
    success: 'bg-white border-emerald-200 shadow-emerald-100/50',
    error:   'bg-white border-red-200 shadow-red-100/50',
    warning: 'bg-white border-amber-200 shadow-amber-100/50',
    info:    'bg-white border-blue-200 shadow-blue-100/50',
  };

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast, confirm }}>
      {children}

      {/* TOAST CONTAINER */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`
              flex items-start gap-3 px-4 py-3.5 rounded-2xl border shadow-xl
              min-w-[280px] max-w-sm pointer-events-auto
              animate-slide-in
              ${bgMap[toast.type]}
            `}
          >
            {iconMap[toast.type]}
            <p className="flex-1 text-sm font-semibold text-slate-800 leading-snug pt-0.5">
              {toast.message}
            </p>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* CUSTOM CONFIRM DIALOG */}
      {confirmState && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl border-2 border-blue-100 shadow-elevated p-6 w-full max-w-sm space-y-4">
            <div className="space-y-1.5">
              <h3 className="text-base font-black text-slate-900">
                {confirmState.title}
              </h3>
              <p className="text-sm text-slate-500 font-medium leading-snug">
                {confirmState.message}
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => handleConfirmChoice(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border-2 border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors cursor-pointer"
              >
                {confirmState.cancelLabel || 'Batal'}
              </button>
              <button
                onClick={() => handleConfirmChoice(true)}
                className={`
                  flex-1 py-2.5 px-4 rounded-xl font-bold text-sm text-white transition-colors cursor-pointer
                  ${confirmState.variant === 'danger'
                    ? 'bg-red-600 hover:bg-red-700 border-2 border-red-600'
                    : 'bg-[#0000FF] hover:bg-[#0000cc] border-2 border-[#0000FF]'
                  }
                `}
              >
                {confirmState.confirmLabel || 'Ya, Lanjutkan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
};
