/**
 * SuccessOverlay.jsx
 * Full-screen blurred success/error modal that sits above ALL app content.
 * - Blurs the entire background (sidebar, topbar, content) via `backdrop-filter`
 * - Locks interaction with a full-viewport fixed overlay
 * - Auto-closes after `autoCloseDuration` ms (default 2500)
 * - Unique animated icon per `variant`
 *
 * Props:
 *   open          – boolean
 *   onClose       – () => void
 *   variant       – 'profile' | 'password' | 'rename' | 'delete' | 'move' | 'generic' | 'error'
 *   title         – string
 *   message       – string
 *   autoClose     – boolean (default true)
 *   autoCloseDuration – ms (default 2500)
 */
import { useEffect } from 'react';
import { createPortal } from 'react-dom';

// ── Variant configurations ───────────────────────────────────────────────────
const VARIANTS = {
  profile: {
    bg: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
    glow: 'rgba(124,58,237,0.45)',
    icon: '👤',
    iconAnimation: 'profileSuccessAnim 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards',
  },
  password: {
    bg: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
    glow: 'rgba(14,165,233,0.4)',
    icon: '🔐',
    iconAnimation: 'passwordSuccessAnim 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards',
  },
  rename: {
    bg: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
    glow: 'rgba(245,158,11,0.4)',
    icon: '✏️',
    iconAnimation: 'renameSuccessAnim 0.55s cubic-bezier(0.34,1.56,0.64,1) forwards',
  },
  delete: {
    bg: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    glow: 'rgba(239,68,68,0.4)',
    icon: '🗑️',
    iconAnimation: 'deleteSuccessAnim 0.55s cubic-bezier(0.34,1.56,0.64,1) forwards',
  },
  move: {
    bg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    glow: 'rgba(16,185,129,0.4)',
    icon: '📁',
    iconAnimation: 'moveSuccessAnim 0.55s cubic-bezier(0.34,1.56,0.64,1) forwards',
  },
  favorite: {
    bg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    glow: 'rgba(245,158,11,0.4)',
    icon: '⭐',
    iconAnimation: 'profileSuccessAnim 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards',
  },
  generic: {
    bg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    glow: 'rgba(16,185,129,0.4)',
    icon: '✅',
    iconAnimation: 'profileSuccessAnim 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards',
  },
  error: {
    bg: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
    glow: 'rgba(239,68,68,0.4)',
    icon: '⚠️',
    iconAnimation: 'profileSuccessAnim 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards',
  },
};

export default function SuccessOverlay({
  open,
  onClose,
  variant = 'generic',
  title = 'Success',
  message = '',
  autoClose = true,
  autoCloseDuration = 2500,
}) {
  const cfg = VARIANTS[variant] || VARIANTS.generic;

  // Auto-close timer
  useEffect(() => {
    if (!open || !autoClose) return;
    const t = setTimeout(onClose, autoCloseDuration);
    return () => clearTimeout(t);
  }, [open, autoClose, autoCloseDuration, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <>
      {/* ── Styles injected once ── */}
      <style>{`
        @keyframes profileSuccessAnim {
          0%   { transform: scale(0.4) translateY(20px); opacity: 0; }
          60%  { transform: scale(1.15) translateY(-4px); opacity: 1; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes passwordSuccessAnim {
          0%   { transform: scale(0.3) rotate(-20deg); opacity: 0; }
          60%  { transform: scale(1.12) rotate(5deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes renameSuccessAnim {
          0%   { transform: scale(0.4) rotate(15deg); opacity: 0; }
          60%  { transform: scale(1.12) rotate(-5deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes deleteSuccessAnim {
          0%   { transform: scale(0.4) translateY(-20px); opacity: 0; }
          60%  { transform: scale(1.1) translateY(4px); opacity: 1; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes moveSuccessAnim {
          0%   { transform: scale(0.4) translateX(-20px); opacity: 0; }
          60%  { transform: scale(1.1) translateX(4px); opacity: 1; }
          100% { transform: scale(1) translateX(0); opacity: 1; }
        }
        @keyframes overlayBackdropIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes overlayCardIn {
          0%   { opacity: 0; transform: translate(-50%, -50%) scale(0.88); }
          70%  { transform: translate(-50%, -50%) scale(1.02); }
          100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes overlayGlowPulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50%       { opacity: 0.9; transform: scale(1.1); }
        }
        @keyframes progressBar {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>

      {/* ── Full-screen backdrop — blurs entire app ── */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 2147483646,
          background: 'rgba(2, 4, 18, 0.75)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          animation: 'overlayBackdropIn 0.25s ease forwards',
          cursor: 'pointer',
        }}
      />

      {/* ── Card (No container background, floating text/icon) ── */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 2147483647,
          width: 'min(92vw, 420px)',
          padding: '40px 32px 32px',
          textAlign: 'center',
          animation: 'overlayCardIn 0.38s cubic-bezier(0.34,1.56,0.64,1) forwards',
          cursor: 'default',
        }}
      >
        {/* Ambient glow blob */}
        <div style={{
          position: 'absolute',
          top: '-30px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '200px',
          height: '120px',
          borderRadius: '50%',
          background: cfg.glow,
          filter: 'blur(45px)',
          animation: 'overlayGlowPulse 2s ease-in-out infinite',
          pointerEvents: 'none',
        }} />

        {/* Icon circle */}
        <div style={{
          width: '96px',
          height: '96px',
          borderRadius: '50%',
          background: cfg.bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 28px',
          boxShadow: `0 0 0 12px ${cfg.glow.replace('0.4', '0.12')}, 0 20px 50px ${cfg.glow}`,
          position: 'relative',
          zIndex: 1,
        }}>
          <span style={{
            fontSize: '44px',
            display: 'block',
            animation: cfg.iconAnimation,
          }}>
            {cfg.icon}
          </span>
        </div>

        {/* Text */}
        <h2 style={{
          fontSize: '25px',
          fontWeight: 800,
          color: '#ffffff',
          margin: '0 0 12px',
          letterSpacing: '-0.02em',
          lineHeight: 1.25,
          textShadow: '0 2px 10px rgba(0,0,0,0.2)',
        }}>
          {title}
        </h2>
        <p style={{
          fontSize: '14px',
          color: 'rgba(255, 255, 255, 0.72)',
          margin: '0 0 32px',
          lineHeight: 1.65,
          textShadow: '0 1px 4px rgba(0,0,0,0.15)',
        }}>
          {message}
        </p>

        {/* OK button */}
        <button
          onClick={onClose}
          autoFocus
          style={{
            background: cfg.bg,
            color: '#ffffff',
            border: 'none',
            borderRadius: '14px',
            padding: '12px 48px',
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'transform 0.15s, opacity 0.15s',
            boxShadow: `0 8px 24px ${cfg.glow}`,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.04)'; e.currentTarget.style.opacity = '0.92'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.opacity = '1'; }}
        >
          OK
        </button>
      </div>
    </>,
    document.body
  );
}
