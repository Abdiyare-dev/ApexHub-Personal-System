'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const ToastContext = createContext(null);

const TYPE_CONFIG = {
  success: {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
    badgeBg: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.35)',
    glow: '0 8px 32px rgba(16, 185, 129, 0.15)',
  },
  error: {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    ),
    badgeBg: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.35)',
    glow: '0 8px 32px rgba(239, 68, 68, 0.15)',
  },
  warning: {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    badgeBg: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.35)',
    glow: '0 8px 32px rgba(245, 158, 11, 0.15)',
  },
  info: {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00E5FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
    badgeBg: 'rgba(0, 229, 255, 0.15)',
    borderColor: 'rgba(0, 229, 255, 0.35)',
    glow: '0 8px 32px rgba(0, 229, 255, 0.15)',
  },
};

function ToastItem({ toast, onDismiss }) {
  const config = TYPE_CONFIG[toast.type] || TYPE_CONFIG.info;

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 4200);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div
      className="custom-toast-item"
      style={{
        borderColor: config.borderColor,
        boxShadow: `0 12px 36px rgba(0,0,0,0.35), ${config.glow}`,
      }}
      role="alert"
    >
      <div className="toast-icon-wrap" style={{ background: config.badgeBg }}>
        {config.icon}
      </div>
      <p className="toast-message">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="toast-close-btn"
        aria-label="Dismiss notification"
      >
        ✕
      </button>

      <style jsx>{`
        .custom-toast-item {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 280px;
          max-width: 440px;
          width: 100%;
          padding: 12px 16px;
          border-radius: 16px;
          background: var(--surface, #131B2E);
          border: 1px solid var(--border-color, rgba(255, 255, 255, 0.12));
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          animation: toastSlideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          pointer-events: auto;
        }

        :global([data-theme="light"]) .custom-toast-item {
          background: #FFFFFF !important;
          color: #0F172A !important;
          box-shadow: 0 12px 36px rgba(0, 60, 120, 0.18), 0 2px 8px rgba(0, 0, 0, 0.06) !important;
        }

        .toast-icon-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 10px;
          flex-shrink: 0;
        }

        .toast-message {
          margin: 0;
          font-size: 0.88rem;
          font-weight: 600;
          color: var(--text-primary, #F1F5F9);
          line-height: 1.4;
          flex: 1;
          word-break: break-word;
        }

        :global([data-theme="light"]) .toast-message {
          color: #0F172A !important;
        }

        .toast-close-btn {
          background: transparent;
          border: none;
          color: var(--text-muted, #94A3B8);
          font-size: 0.8rem;
          cursor: pointer;
          width: 26px;
          height: 26px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s ease, color 0.15s ease;
          flex-shrink: 0;
        }

        .toast-close-btn:hover {
          background: var(--surface-low, rgba(255, 255, 255, 0.08));
          color: var(--text-primary, #FFFFFF);
        }

        @keyframes toastSlideDown {
          from {
            opacity: 0;
            transform: translateY(-16px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((optionsOrMessage, maybeType) => {
    let message = '';
    let type = 'info';

    if (typeof optionsOrMessage === 'object' && optionsOrMessage !== null) {
      message = optionsOrMessage.message || optionsOrMessage.title || '';
      type = optionsOrMessage.type || 'info';
    } else {
      message = optionsOrMessage || '';
      type = maybeType || 'info';
    }

    const id = Date.now() + Math.random();
    setToasts((prev) => {
      // Keep at most 3 active toasts
      const updated = [...prev, { id, message, type }];
      return updated.slice(-3);
    });
  }, []);

  const showToast = addToast;

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, addToast, toast: addToast, dismiss }}>
      {children}
      {/* Toast Floating Container */}
      <div className="global-toast-container">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </div>

      <style jsx global>{`
        .global-toast-container {
          position: fixed;
          top: 72px; /* Clears the 60px TopNav bar so it never overlaps header titles */
          right: 20px;
          z-index: 99999;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 10px;
          pointer-events: none;
          max-width: calc(100vw - 40px);
        }

        @media (max-width: 768px) {
          .global-toast-container {
            top: 64px;
            left: 16px;
            right: 16px;
            align-items: center;
            max-width: calc(100vw - 32px);
          }
          .custom-toast-item {
            max-width: 100% !important;
          }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
