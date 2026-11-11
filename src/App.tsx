import { SiteProvider } from '@/context/SiteContext';
import { AdminPage } from '@/pages/AdminPage';
import { SitePage } from '@/pages/SitePage';
import { supabaseConfigured } from '@/lib/supabase';

function SetupProblem() {
  return (
    <div className="flex min-h-screen-dvh items-center justify-center bg-cream-100 px-6 py-16">
      <div className="w-full max-w-lg rounded-3xl border border-taupe-200 bg-white p-8 shadow-sm">
        <p className="eyebrow">Setup problem</p>
        <h1 className="mt-3 text-3xl">The site cannot find its settings</h1>
        <p className="mt-4 text-sm leading-[1.5] text-taupe-700">
          The file named <strong>.env</strong> in the main project folder is missing or has a typo. It must contain these
          two names, each followed by <strong>=</strong> and its value on the same line:
        </p>
        <pre className="mt-4 overflow-x-auto rounded-2xl bg-espresso-900 p-4 text-xs leading-[1.6] text-cream-100">
{`VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...`}
        </pre>
        <p className="mt-4 text-sm leading-[1.5] text-taupe-700">
          After saving the file, stop the site (Ctrl + C) and start it again with <strong>npm run dev</strong>. On a live
          website, add the same two names in the hosting dashboard instead.
        </p>
      </div>
    </div>
  );
}

function App() {
  if (!supabaseConfigured) {
    return <SetupProblem />;
  }
  if (window.location.pathname.replace(/\/+$/, '') === '/admin') {
    return <AdminPage />;
  }
  return (
    <SiteProvider>
      <SitePage />
    </SiteProvider>
  );
}

export default App;
