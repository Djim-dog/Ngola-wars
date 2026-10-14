'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      setReferralCode(ref.toUpperCase().trim());
    }
  }, [searchParams]);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (cleanUsername.length < 3) {
      setError('O nome de utilizador deve ter pelo menos 3 caracteres (a-z, 0-9, _)');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('A palavra-passe deve ter pelo menos 6 caracteres');
      setLoading(false);
      return;
    }

    const supabase = createClient();

    const meta: Record<string, string> = {
      username: cleanUsername,
      display_name: username.trim(),
    };

    const cleanRef = referralCode.trim().toUpperCase();
    if (cleanRef.length >= 6) {
      meta.referral_code = cleanRef;
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: meta,
      },
    });

    setLoading(false);

    if (signUpError) {
      setError(
        signUpError.message.includes('already registered')
          ? 'Este email já está registado'
          : signUpError.message
      );
      return;
    }

    if (data.session) {
      router.push('/map');
      router.refresh();
      return;
    }

    setSuccess(true);
  }

  if (success) {
    return (
      <main className="nw-bg flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm text-center space-y-4">
          <div className="text-4xl">✉️</div>
          <h1 className="text-xl font-bold text-amber-400">Conta criada</h1>
          <p className="text-slate-300 text-sm">
            Verifica o teu email para confirmar a conta (se a confirmação estiver ativa).
            Depois podes entrar normalmente.
          </p>
          <Link
            href="/auth/login"
            className="inline-block mt-4 px-6 py-2 rounded-lg bg-amber-500 text-slate-950 font-semibold"
          >
            Ir para Entrar
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="nw-bg flex-1 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="text-4xl">♟️👑</div>
          <h1 className="text-2xl font-bold text-amber-400">Criar conta</h1>
          <p className="text-sm text-slate-400">Entrada gratuita · Sem cartão</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">Nome de utilizador</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-stone-900/80 border border-amber-800/40 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              placeholder="ex: rei_do_norte"
              autoComplete="username"
              minLength={3}
            />
          </div>

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
              placeholder="Mínimo 6 caracteres"
              autoComplete="new-password"
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">
              Código de convite <span className="text-slate-500">(opcional)</span>
            </label>
            <input
              type="text"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
              className="w-full px-4 py-3 rounded-lg bg-stone-900/80 border border-amber-800/40 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              placeholder="Ex: A1B2C3D4"
              maxLength={12}
            />
            <p className="text-xs text-slate-500 mt-1">
              Se alguém te convidou, coloca o código aqui. O convidante recebe 1.000 Kz de bónus para a loja.
            </p>
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
            {loading ? 'A criar conta...' : 'Criar conta gratuita'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-400">
          Já tens conta?{' '}
          <Link href="/auth/login" className="text-amber-400 hover:underline">
            Entrar
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


export default function RegisterPage() {
  return (
    <Suspense fallback={<main className="nw-bg flex-1 flex items-center justify-center"><p className="text-slate-400">A carregar...</p></main>}>
      <RegisterForm />
    </Suspense>
  );
}
