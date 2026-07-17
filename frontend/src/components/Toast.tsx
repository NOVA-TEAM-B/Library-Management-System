import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
  duration?: number;
}

declare global {
  interface Window {
    showToast: (message: string, type?: 'success' | 'warning' | 'error' | 'info', duration?: number) => void;
  }
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handleShowToast = (e: CustomEvent<ToastMessage>) => {
      const { message, type, duration = 4000 } = e.detail;
      const id = Math.random().toString(36).substring(2, 9);
      
      setToasts((prev) => [...prev, { id, message, type, duration }]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    };

    window.addEventListener('show_toast' as any, handleShowToast);
    return () => window.removeEventListener('show_toast' as any, handleShowToast);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-rose-400" />;
      default:
        return <Info className="w-4 h-4 text-cyan-400" />;
    }
  };

  const getBorderColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-emerald-500/30 bg-emerald-950/20 shadow-emerald-500/5';
      case 'warning':
        return 'border-amber-500/30 bg-amber-950/20 shadow-amber-500/5';
      case 'error':
        return 'border-rose-500/30 bg-rose-950/20 shadow-rose-500/5';
      default:
        return 'border-cyan-500/30 bg-cyan-950/20 shadow-cyan-500/5';
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border backdrop-blur-xl shadow-2xl transition-all ${getBorderColor(
              toast.type
            )}`}
          >
            <div className="mt-0.5 shrink-0">{getIcon(toast.type)}</div>
            <div className="flex-1 min-w-0">
              <p className="m-0 text-white text-xs font-semibold leading-relaxed font-sans pr-4">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 text-white/40 hover:text-white p-0.5 rounded-lg hover:bg-white/5 transition-all cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// Global emitter function
if (typeof window !== 'undefined') {
  window.showToast = (message: string, type: 'success' | 'warning' | 'error' | 'info' = 'info', duration = 4000) => {
    const event = new CustomEvent('show_toast', {
      detail: { message, type, duration },
    });
    window.dispatchEvent(event);
  };
}
