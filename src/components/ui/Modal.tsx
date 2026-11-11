import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  label: string;
  children: ReactNode;
  size?: 'md' | 'lg';
}

export function Modal({ open, onClose, label, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const width = size === 'lg' ? 'sm:max-w-3xl' : 'sm:max-w-xl';

  // The popup is attached straight to <body> (a "portal"). Without this, a parent that has a
  // CSS animation or transform (like the admin tabs) traps the popup inside itself, so it
  // opens far down the page instead of centred on the screen.
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={label}>
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-espresso-900/60 backdrop-blur-sm animate-fade-in"
      />
      <div className={`modal-panel relative flex w-full ${width} animate-slide-up flex-col overflow-hidden rounded-t-3xl bg-cream-50 shadow-2xl sm:animate-scale-in sm:rounded-3xl`}>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-espresso-800 shadow transition hover:bg-white hover:text-bronze-600"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="min-h-0 overflow-y-auto overscroll-contain">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
