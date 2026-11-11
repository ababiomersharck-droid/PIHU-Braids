import { useEffect, useState } from 'react';
import { CalendarCheck2, MessageCircle } from 'lucide-react';

interface FloatingActionsProps {
  whatsappNumber: string;
  brandName: string;
  onBook: () => void;
}

/** Phone-only bar that stays within thumb reach once the visitor scrolls past the first screen. */
export function FloatingActions({ whatsappNumber, brandName, onBook }: FloatingActionsProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 520);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const digits = whatsappNumber.replace(/\D/g, '');
  const whatsappUrl = digits
    ? `https://wa.me/${digits}?text=${encodeURIComponent(`Hi ${brandName}, I would like to ask about a braiding appointment.`)}`
    : null;

  return (
    <div
      aria-hidden={!visible}
      className={`fab-safe pointer-events-none fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 px-4 transition duration-300 md:hidden ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
      }`}
    >
      <button
        type="button"
        tabIndex={visible ? 0 : -1}
        onClick={onBook}
        className="pointer-events-auto inline-flex h-14 flex-1 items-center justify-center gap-2 rounded-full bg-bronze-500 text-sm font-bold text-white shadow-xl shadow-black/25 transition hover:bg-bronze-600"
      >
        <CalendarCheck2 className="h-4 w-4" />
        Book now
      </button>
      {whatsappUrl && (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noreferrer"
          tabIndex={visible ? 0 : -1}
          aria-label="Chat on WhatsApp"
          className="pointer-events-auto flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl shadow-black/25"
        >
          <MessageCircle className="h-6 w-6" />
        </a>
      )}
    </div>
  );
}
