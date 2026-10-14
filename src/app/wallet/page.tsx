'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { Wallet, WalletTransaction, Profile } from '@/types/database';

export default function WalletPage() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [claimMsg, setClaimMsg] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Precisas de entrar na conta');
        setLoading(false);
        return;
      }
      setUserId(user.id);

      const { data: w, error: wErr } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (wErr) {
        setError(wErr.message);
        setLoading(false);
        return;
      }
      setWallet(w);

      const { data: p } = await supabase
        .from('profiles')
        .select('id, username, referral_code, total_referred, display_name')
        .eq('id', user.id)
        .single();

      if (p) setProfile(p as Profile);

      const { data: tx } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      setTransactions(tx || []);
      setLoading(false);
    }

    load();
  }, []);

  function formatKz(value: number) {
    return Number(value).toLocaleString('pt-AO', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }) + ' Kz';
  }

  function copyInvite() {
    if (!profile?.referral_code) return;
    const link = typeof window !== 'undefined'
      ? `${window.location.origin}/auth/register/?ref=${profile.referral_code}`
      : profile.referral_code;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function claimIncome() {
    setClaiming(true);
    setClaimMsg(null);
    const supabase = createClient();
    const { data, error } = await supabase.rpc('claim_kingdom_income');
    setClaiming(false);
    if (error) {
      setClaimMsg(error.message);
      return;
    }
    if (data && !data.success) {
      setClaimMsg(data.error || 'Nada a reivindicar');
      return;
    }
    setClaimMsg('Recebeste ' + Number(data.amount).toLocaleString('pt-AO') + ' Kz de rendimento!');
    // reload wallet
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: w } = await supabase.from('wallets').select('*').eq('user_id', user.id).single();
      if (w) setWallet(w);
    }
  }

  return (
    <main className="flex-1 flex flex-col px-4 py-6 max-w-lg mx-auto w-full pb-20">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-amber-400">Carteira</h1>
          <p className="text-xs text-slate-400">Os teus saldos virtuais</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/deposit"
            className="px-3 py-2 rounded-lg bg-amber-500 text-slate-950 text-sm font-semibold"
          >
            Depositar
          </Link>
          <Link
            href="/withdraw"
            className="px-3 py-2 rounded-lg border border-amber-500/50 text-amber-400 text-sm font-semibold"
          >
            Sacar
          </Link>
        </div>
      </header>

      {loading && (
        <p className="text-center text-slate-400 py-12">A carregar...</p>
      )}

      {error && (
        <div className="bg-red-950/40 border border-red-800 rounded-xl p-4 text-sm text-red-300 mb-4">
          {error}
          {!userId && (
            <Link href="/auth/login" className="block mt-2 text-amber-400 underline">
              Entrar na conta
            </Link>
          )}
        </div>
      )}

      {wallet && (
        <div className="space-y-3 mb-6">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <p className="text-xs text-slate-400">Capital do reino</p>
            <p className="text-2xl font-bold text-amber-300">
              {formatKz(wallet.kingdom_capital)}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Necessário para desafiar outros jogadores (mín. 500 Kz)
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <p className="text-xs text-slate-400">Saldo de compras (loja)</p>
            <p className="text-2xl font-bold text-green-400">
              {formatKz(wallet.purchase_balance)}
            </p>
            <p className="text-xs text-slate-500 mt-1">Usado na loja</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <p className="text-xs text-slate-400">Saldo de recompensas</p>
            <p className="text-2xl font-bold text-blue-400">
              {formatKz(wallet.reward_balance)}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Elegivel para saque · Minimo 2.000 Kz
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <p className="text-xs text-slate-400">Saldo reservado</p>
            <p className="text-xl font-semibold text-slate-300">
              {formatKz(wallet.reserved_balance)}
            </p>
            <p className="text-xs text-slate-500 mt-1">Em transações pendentes</p>
          </div>
        </div>
      )}

      {/* Rendimento passivo */}
      {wallet && (
        <div className="mb-4 p-4 rounded-xl bg-emerald-950/30 border border-emerald-700/50">
          <h2 className="text-sm font-semibold text-emerald-300 mb-2">
            Rendimento dos reinos
          </h2>
          <p className="text-xs text-slate-400 mb-3">
            Os reinos que controlas geram capital automaticamente (até 24h acumuladas).
          </p>
          {claimMsg && <p className="text-sm text-emerald-200 mb-2">{claimMsg}</p>}
          <button
            onClick={claimIncome}
            disabled={claiming}
            className="w-full py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold disabled:opacity-50"
          >
            {claiming ? 'A reivindicar...' : 'Reivindicar rendimento'}
          </button>
        </div>
      )}

      {/* Sistema de convite */}
      {profile && (
        <div className="mb-8 p-4 rounded-xl bg-amber-950/30 border border-amber-700/50">
          <h2 className="text-sm font-semibold text-amber-300 mb-2">
            Convida amigos · Ganha 1.000 Kz
          </h2>
          <p className="text-xs text-slate-400 mb-3">
            Cada pessoa que se registar com o teu código dá-te 1.000 Kz de bónus (só para gastar na loja).
          </p>
          <div className="flex items-center gap-2 mb-2">
            <code className="flex-1 px-3 py-2 rounded-lg bg-slate-900 text-amber-300 font-mono text-sm tracking-wider">
              {profile.referral_code || '—'}
            </code>
            <button
              onClick={copyInvite}
              className="px-3 py-2 rounded-lg bg-amber-500 text-slate-950 text-sm font-semibold"
            >
              {copied ? 'Copiado!' : 'Copiar link'}
            </button>
          </div>
          <p className="text-xs text-slate-500">
            Indicados: {profile.total_referred ?? 0}
          </p>
        </div>
      )}

      {wallet && (
        <div>
          <h2 className="text-sm font-semibold text-slate-300 mb-3">
            Histórico recente
          </h2>
          {transactions.length === 0 ? (
            <p className="text-sm text-slate-500">Ainda sem movimentos.</p>
          ) : (
            <ul className="space-y-2">
              {transactions.map((tx) => (
                <li
                  key={tx.id}
                  className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-sm"
                >
                  <div className="flex justify-between">
                    <span className="text-slate-300">{tx.type}</span>
                    <span
                      className={
                        Number(tx.amount) >= 0 ? 'text-green-400' : 'text-red-400'
                      }
                    >
                      {Number(tx.amount) >= 0 ? '+' : ''}
                      {formatKz(tx.amount)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {tx.component} ·{' '}
                    {new Date(tx.created_at).toLocaleString('pt-AO')}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 bg-slate-950/95 border-t border-slate-800 px-4 py-3 flex justify-around text-xs max-w-lg mx-auto">
        <Link href="/map/" className="text-slate-400">
          Mapa
        </Link>
        <Link href="/shop" className="text-slate-400">
          Loja
        </Link>
        <Link href="/wallet" className="text-amber-400 font-medium">
          Carteira
        </Link>
        <Link href="/game" className="text-slate-400">
          Treinar
        </Link>
      </nav>
    </main>
  );
}
