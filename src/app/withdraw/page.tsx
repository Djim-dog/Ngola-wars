'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { Wallet } from '@/types/database';

const MIN_WITHDRAW = 2000;

interface WithdrawRow {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  bank_name: string | null;
}

export default function WithdrawPage() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [amount, setAmount] = useState('2000');
  const [bankName, setBankName] = useState('');
  const [iban, setIban] = useState('');
  const [holder, setHolder] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [history, setHistory] = useState<WithdrawRow[]>([]);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    const { data: w } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', user.id)
      .single();
    setWallet(w);

    const { data: h } = await supabase
      .from('withdrawal_requests')
      .select('id, amount, status, created_at, bank_name')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(15);
    setHistory(h || []);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!userId || !wallet) {
      setError('Entra na conta primeiro');
      return;
    }

    const value = Number(amount);
    if (isNaN(value) || value < MIN_WITHDRAW) {
      setError('Saque minimo: 2.000 Kz');
      return;
    }

    const available = Number(wallet.reward_balance);
    if (value > available) {
      setError(
        'Saldo de recompensas insuficiente. Disponivel: ' +
          available.toLocaleString('pt-AO') +
          ' Kz'
      );
      return;
    }

    if (!bankName.trim() || !iban.trim() || !holder.trim()) {
      setError('Preenche banco, IBAN e titular');
      return;
    }

    setLoading(true);
    const supabase = createClient();

    // Reservar saldo
    const before = available;
    const after = before - value;

    const { error: wErr } = await supabase
      .from('wallets')
      .update({
        reward_balance: after,
        reserved_balance: Number(wallet.reserved_balance) + value,
      })
      .eq('user_id', userId);

    if (wErr) {
      setError('Erro ao reservar saldo: ' + wErr.message);
      setLoading(false);
      return;
    }

    const { data: wFull } = await supabase
      .from('wallets')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (wFull) {
      await supabase.from('wallet_transactions').insert({
        wallet_id: wFull.id,
        user_id: userId,
        type: 'withdrawal',
        amount: -value,
        balance_before: before,
        balance_after: after,
        component: 'reward_balance',
        description: 'Pedido de saque — pendente',
        status: 'pending',
      });
    }

    const { error: insErr } = await supabase.from('withdrawal_requests').insert({
      user_id: userId,
      amount: value,
      bank_name: bankName.trim(),
      iban: iban.trim(),
      account_holder: holder.trim(),
      status: 'pending',
    });

    setLoading(false);

    if (insErr) {
      setError(insErr.message);
      return;
    }

    setSuccess(
      'Pedido de saque de ' +
        value.toLocaleString('pt-AO') +
        ' Kz enviado. Aguarda confirmacao do admin.'
    );
    setAmount('2000');
    load();
  }

  function statusLabel(s: string) {
    const m: Record<string, string> = {
      pending: 'Pendente',
      processing: 'Em processamento',
      paid: 'Pago',
      rejected: 'Rejeitado',
    };
    return m[s] || s;
  }

  const available = wallet ? Number(wallet.reward_balance) : 0;

  return (
    <main className="nw-bg flex-1 flex flex-col px-4 py-6 max-w-lg mx-auto w-full pb-24">
      <header className="mb-6">
        <Link href="/wallet" className="text-sm text-amber-500/80">
          ← Carteira
        </Link>
        <h1 className="nw-title text-2xl mt-2">Sacar</h1>
        <p className="text-xs text-stone-400 mt-1">
          Levantamento para a tua conta bancaria
        </p>
      </header>

      {/* Aviso minimo */}
      <div className="nw-panel p-4 mb-5 border-amber-600/50">
        <p className="text-amber-300 font-bold text-sm">Saque minimo: 2.000 Kz</p>
        <p className="text-xs text-stone-400 mt-1">
          So podes sacar a partir do <strong className="text-stone-200">saldo de recompensas</strong>.
          Capital do reino e saldo de compras nao sao levantaveis.
        </p>
        <p className="text-sm text-green-400 mt-2">
          Disponivel: {available.toLocaleString('pt-AO')} Kz
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-stone-300 mb-1">Valor (Kz)</label>
          <input
            type="number"
            min={MIN_WITHDRAW}
            step={100}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-stone-900/80 border border-amber-800/40 text-white focus:outline-none focus:border-amber-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm text-stone-300 mb-1">Banco</label>
          <input
            type="text"
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            placeholder="Ex: Millennium Atlantico"
            className="w-full px-4 py-3 rounded-xl bg-stone-900/80 border border-amber-800/40 text-white focus:outline-none focus:border-amber-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm text-stone-300 mb-1">IBAN / Conta</label>
          <input
            type="text"
            value={iban}
            onChange={(e) => setIban(e.target.value)}
            placeholder="Numero da conta"
            className="w-full px-4 py-3 rounded-xl bg-stone-900/80 border border-amber-800/40 text-white focus:outline-none focus:border-amber-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm text-stone-300 mb-1">Titular</label>
          <input
            type="text"
            value={holder}
            onChange={(e) => setHolder(e.target.value)}
            placeholder="Nome completo"
            className="w-full px-4 py-3 rounded-xl bg-stone-900/80 border border-amber-800/40 text-white focus:outline-none focus:border-amber-500"
            required
          />
        </div>

        {error && (
          <p className="text-sm text-red-400 bg-red-950/40 px-3 py-2 rounded-lg">{error}</p>
        )}
        {success && (
          <p className="text-sm text-green-400 bg-green-950/40 px-3 py-2 rounded-lg">{success}</p>
        )}

        <button
          type="submit"
          disabled={loading || !userId || available < MIN_WITHDRAW}
          className="nw-btn-gold w-full py-3.5 disabled:opacity-40"
        >
          {loading ? 'A enviar...' : 'Pedir saque (min. 2.000 Kz)'}
        </button>
      </form>

      {history.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-stone-300 mb-3">Historico de saques</h2>
          <ul className="space-y-2">
            {history.map((h) => (
              <li
                key={h.id}
                className="p-3 rounded-xl bg-stone-900/60 border border-stone-800 text-sm flex justify-between"
              >
                <div>
                  <p className="text-stone-200">
                    {Number(h.amount).toLocaleString('pt-AO')} Kz
                  </p>
                  <p className="text-xs text-stone-500">
                    {h.bank_name} · {new Date(h.created_at).toLocaleDateString('pt-AO')}
                  </p>
                </div>
                <span className="text-xs text-amber-400">{statusLabel(h.status)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
