import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { AdminAuth } from '@/components/admin/AdminAuth';
import { AdminShell } from '@/components/admin/AdminShell';
import { fetchOwnerStatus, signOutOwner } from '@/lib/api/admin';
import { supabase } from '@/lib/supabase';

type Gate =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'signedOut'; setupOpen: boolean }
  | { kind: 'notOwner' }
  | { kind: 'owner' };

export function AdminPage() {
  const [gate, setGate] = useState<Gate>({ kind: 'loading' });

  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);

  const refresh = useCallback(async () => {
    try {
      const status = await fetchOwnerStatus();
      if (!status.signedIn) setGate({ kind: 'signedOut', setupOpen: status.setupOpen });
      else if (status.isOwner) setGate({ kind: 'owner' });
      else setGate({ kind: 'notOwner' });
    } catch (err) {
      setGate({ kind: 'error', message: err instanceof Error ? err.message : 'Please refresh the page.' });
    }
  }, []);

  useEffect(() => {
    (async () => {
      await refresh();
    })();
    const { data } = supabase.auth.onAuthStateChange(() => {
      (async () => {
        await refresh();
      })();
    });
    return () => data.subscription.unsubscribe();
  }, [refresh]);

  if (gate.kind === 'loading') {
    return (
      <div className="flex min-h-screen-dvh items-center justify-center bg-cream-100">
        <Loader2 className="h-6 w-6 animate-spin text-bronze-600" />
      </div>
    );
  }

  if (gate.kind === 'error') {
    return (
      <div className="flex min-h-screen-dvh flex-col items-center justify-center gap-4 bg-cream-100 px-6 text-center">
        <AlertTriangle className="h-8 w-8 text-red-600" />
        <p className="max-w-sm text-sm text-taupe-700">We could not check your access: {gate.message}</p>
      </div>
    );
  }

  if (gate.kind === 'signedOut') {
    return <AdminAuth setupOpen={gate.setupOpen} onSignedIn={() => void refresh()} />;
  }

  if (gate.kind === 'notOwner') {
    return (
      <div className="flex min-h-screen-dvh flex-col items-center justify-center gap-5 bg-cream-100 px-6 text-center">
        <h1 className="text-4xl">Access not available</h1>
        <p className="max-w-sm text-sm text-taupe-700">This account does not manage the studio. Sign in with the owner account instead.</p>
        <button
          type="button"
          onClick={() => {
            (async () => {
              await signOutOwner();
            })();
          }}
          className="rounded-full bg-espresso-800 px-6 py-3 text-sm font-bold text-cream-50 transition hover:bg-espresso-900"
        >
          Sign out
        </button>
      </div>
    );
  }

  return <AdminShell />;
}
