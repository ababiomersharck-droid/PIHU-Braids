import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';

type Tone = 'success' | 'error';

interface ToastItem {
  id: number;
  text: string;
  tone: Tone;
}

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** red button, for things that delete or cancel */
  danger?: boolean;
}

interface FeedbackContextValue {
  notify: (text: string, tone?: Tone) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

/** Small messages ("Saved") and a branded replacement for the plain browser confirm box. */
export function AdminFeedbackProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [pending, setPending] = useState<{ options: ConfirmOptions; resolve: (answer: boolean) => void } | null>(null);
  const nextId = useRef(1);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const active = timers.current;
    return () => active.forEach((t) => window.clearTimeout(t));
  }, []);

  const notify = useCallback((text: string, tone: Tone = 'success') => {
    const id = nextId.current++;
    setToasts((prev) => [...prev.slice(-2), { id, text, tone }]);
    timers.current.push(
      window.setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), tone === 'error' ? 6000 : 3500),
    );
  }, []);

  const confirm = useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        setPending((current) => {
          current?.resolve(false);
          return { options, resolve };
        });
      }),
    [],
  );

  const answer = (value: boolean) => {
    pending?.resolve(value);
    setPending(null);
  };

  const value = useMemo(() => ({ notify, confirm }), [notify, confirm]);
  const options = pending?.options;

  return (
    <FeedbackContext.Provider value={value}>
      {children}

      <div className="toast-zone pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 px-4 lg:items-end lg:pr-8">
        {toasts.map((toast) => (
          <p
            key={toast.id}
            role={toast.tone === 'error' ? 'alert' : 'status'}
            className="pointer-events-auto flex max-w-md animate-slide-up items-center gap-3 rounded-2xl bg-espresso-900 px-4 py-3 text-sm font-semibold text-cream-50 shadow-2xl ring-1 ring-white/10"
          >
            {toast.tone === 'error' ? (
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-300" />
            ) : (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-bronze-300" />
            )}
            {toast.text}
          </p>
        ))}
      </div>

      <Modal open={pending !== null} onClose={() => answer(false)} label={options?.title ?? 'Please confirm'}>
        {options && (
          <div className="space-y-6 p-6 sm:p-8">
            <div className="pr-10">
              <h3 className="text-3xl">{options.title}</h3>
              <p className="mt-3 text-sm leading-[1.5] text-taupe-700">{options.message}</p>
            </div>
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => answer(false)}
                className="inline-flex min-h-[3rem] items-center justify-center rounded-full border border-taupe-300 px-6 text-sm font-semibold text-espresso-800 transition hover:border-bronze-500 hover:text-bronze-700"
              >
                {options.cancelLabel ?? 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => answer(true)}
                className={`inline-flex min-h-[3rem] items-center justify-center rounded-full px-6 text-sm font-bold text-white transition hover:-translate-y-0.5 ${
                  options.danger ? 'bg-red-600 hover:bg-red-700' : 'bg-espresso-800 hover:bg-espresso-900'
                }`}
              >
                {options.confirmLabel ?? 'Confirm'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </FeedbackContext.Provider>
  );
}

function useFeedback(): FeedbackContextValue {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error('Admin feedback hooks must be used inside AdminFeedbackProvider');
  return ctx;
}

export const useToast = () => useFeedback().notify;
export const useConfirm = () => useFeedback().confirm;
