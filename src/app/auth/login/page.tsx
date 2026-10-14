'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message === 'Invalid login credentials'
        ? 'Email ou palavra-passe incorretos'
        : error.message);
      return;
    }

    router.push('/map');
    router.refresh();
  }

  return (
    <main className="nw-bg flex-1 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="text-4xl">♟️👑</div>
          <h1 className="text-2xl font-bold text-amber-400">Entrar</h1>
          <p className="text-sm text-slate-400">Acede à tua conta Kingdom Checkers</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-stone-900/80 border border-amber-800/40 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              placeholder="teu@email.com"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">Palavra-passe</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-stone-900/80 border border-amber-800/40 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-950/50 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg nw-btn-gold disabled:opacity-50"
          >
            {loading ? 'A entrar...' : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-400">
          Ainda não tens conta?{' '}
          <Link href="/auth/register" className="text-amber-400 hover:underline">
            Criar conta
          </Link>
        </p>

        <Link
          href="/"
          className="block text-center text-sm text-slate-500 hover:text-slate-300"
        >
          ← Voltar ao início
        </Link>
      </div>
    </main>
  );
}
