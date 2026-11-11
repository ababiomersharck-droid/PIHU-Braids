import { useState, type FormEvent } from 'react';
import { Loader2, Lock, Scissors } from 'lucide-react';
import { createOwnerAccount, signInOwner } from '@/lib/api/admin';
import { Notice, errorMessage } from '@/components/admin/AdminPrimitives';

interface AdminAuthProps {
  setupOpen: boolean;
  onSignedIn: () => void;
}

export function AdminAuth({ setupOpen, onSignedIn }: AdminAuthProps) {
  const [mode, setMode] = useState<'signin' | 'setup'>(setupOpen ? 'setup' : 'signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (!email.trim() || password.length < 8) {
      setError('Enter your email and a password of at least 8 characters.');
      return;
    }
    setBusy(true);
    try {
      if (mode === 'setup') {
        await createOwnerAccount(email.trim(), password);
      } else {
        await signInOwner(email.trim(), password);
      }
      onSignedIn();
    } catch (err) {
      setError(errorMessage(err, 'Something went wrong. Please try again.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen-dvh items-center justify-center bg-espresso-900 px-5 py-16">
      <div className="w-full max-w-md animate-scale-in rounded-3xl bg-cream-50 p-8 shadow-2xl sm:p-10">
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-espresso-800 text-bronze-300">
            <Scissors className="h-6 w-6" />
          </span>
          <div>
            <p className="eyebrow">Owner area</p>
            <h1 className="mt-2 text-4xl">{mode === 'setup' ? 'Create owner account' : 'Welcome back'}</h1>
            <p className="mt-2 text-sm text-taupe-600">
              {mode === 'setup'
                ? 'This account will manage your studio. Only the owner can access this area.'
                : 'Sign in to manage your studio, bookings and services.'}
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-5">
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-taupe-700">Email</span>
            <input className="field" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-taupe-700">Password</span>
            <input
              className="field"
              type="password"
              autoComplete={mode === 'setup' ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          {error && <Notice tone="error">{error}</Notice>}
          {info && <Notice tone="success">{info}</Notice>}

          <button
            type="submit"
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-espresso-800 px-6 py-3.5 text-sm font-bold text-cream-50 transition duration-300 hover:-translate-y-0.5 hover:bg-espresso-900 disabled:opacity-70"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
            {mode === 'setup' ? 'Create account' : 'Sign in'}
          </button>
        </form>

        {setupOpen && (
          <button
            type="button"
            onClick={() => setMode(mode === 'setup' ? 'signin' : 'setup')}
            className="mt-6 w-full text-center text-xs font-semibold text-bronze-600 transition hover:text-bronze-700"
          >
            {mode === 'setup' ? 'Already have an owner account? Sign in' : 'First time here? Create the owner account'}
          </button>
        )}
      </div>
    </div>
  );
}
