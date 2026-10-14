'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

const ADMIN_UID = '174a8d75-9353-4559-b9af-97f4b1f5676e';

interface Stats {
  players: number;
  kingdoms: number;
  matches: number;
  depositsPending: number;
  depositsConfirmed: number;
  withdrawalsPending: number;
}

interface DepositRow {
  id: string;
  user_id: string;
  bank_code: string;
  amount: number;
  status: string;
  created_at: string;
}

interface WithdrawRow {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  bank_name: string | null;
  iban: string | null;
  account_holder: string | null;
  created_at: string;
}

export default function AdminPage() {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [deposits, setDeposits] = useState<DepositRow[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [tab, setTab] = useState<'deposits' | 'withdrawals'>('deposits');

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || user.id !== ADMIN_UID) {
      setAuthorized(false);
      setLoading(false);
      return;
    }
    setAuthorized(true);

    const [players, kingdoms, matches, pending, confirmed, deps, wPending, wRows] =
      await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('kingdoms').select('id', { count: 'exact', head: true }),
        supabase.from('matches').select('id', { count: 'exact', head: true }),
        supabase.from('deposit_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('deposit_requests').select('id', { count: 'exact', head: true }).eq('status', 'confirmed'),
        supabase
          .from('deposit_requests')
          .select('id, user_id, bank_code, amount, status, created_at')
          .in('status', ['pending', 'under_review'])
          .order('created_at', { ascending: true })
          .limit(50),
        supabase.from('withdrawal_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase
          .from('withdrawal_requests')
          .select('id, user_id, amount, status, bank_name, iban, account_holder, created_at')
          .in('status', ['pending', 'processing'])
          .order('created_at', { ascending: true })
          .limit(50),
      ]);

    setStats({
      players: players.count ?? 0,
      kingdoms: kingdoms.count ?? 0,
      matches: matches.count ?? 0,
      depositsPending: pending.count ?? 0,
      depositsConfirmed: confirmed.count ?? 0,
      withdrawalsPending: wPending.count ?? 0,
    });
    setDeposits(deps.data || []);
    setWithdrawals(wRows.data || []);
    setLoading(false);
  }

  async function confirmDeposit(dep: DepositRow) {
    if (processing) return;
    setProcessing(dep.id);
    setActionMsg(null);
    const supabase = createClient();

    const { data: wallet } = await supabase
      .from('wallets')
      .select('id, purchase_balance')
      .eq('user_id', dep.user_id)
      .single();

    if (!wallet) {
      setActionMsg('Carteira nao encontrada');
      setProcessing(null);
      return;
    }

    const before = Number(wallet.purchase_balance);
    const after = before + Number(dep.amount);

    const { error: wErr } = await supabase
      .from('wallets')
      .update({ purchase_balance: after })
      .eq('user_id', dep.user_id);

    if (wErr) {
      setActionMsg('Erro ao creditar: ' + wErr.message);
      setProcessing(null);
      return;
    }

    await supabase.from('wallet_transactions').insert({
      wallet_id: wallet.id,
      user_id: dep.user_id,
      type: 'deposit_confirmed',
      amount: Number(dep.amount),
      balance_before: before,
      balance_after: after,
      component: 'purchase_balance',
      reference_id: dep.id,
      reference_type: 'deposit_request',
      description: 'Deposito confirmado — ' + dep.bank_code,
      status: 'completed',
    });

    await supabase
      .from('deposit_requests')
      .update({
        status: 'confirmed',
        admin_id: ADMIN_UID,
        confirmed_at: new Date().toISOString(),
        proof_deleted: true,
      })
      .eq('id', dep.id)
      .eq('status', 'pending');

    setActionMsg('Deposito confirmado: ' + Number(dep.amount).toLocaleString('pt-AO') + ' Kz');
    setProcessing(null);
    load();
  }

  async function rejectDeposit(dep: DepositRow) {
    if (processing) return;
    setProcessing(dep.id);
    const supabase = createClient();
    await supabase
      .from('deposit_requests')
      .update({
        status: 'rejected',
        admin_id: ADMIN_UID,
        rejected_at: new Date().toISOString(),
      })
      .eq('id', dep.id);
    setActionMsg('Deposito rejeitado');
    setProcessing(null);
    load();
  }

  /** Pagar saque: marca paid e liberta reserved_balance (ja foi debitado de reward) */
  async function payWithdrawal(w: WithdrawRow) {
    if (processing) return;
    setProcessing(w.id);
    setActionMsg(null);
    const supabase = createClient();

    const { data: wallet } = await supabase
      .from('wallets')
      .select('id, reserved_balance')
      .eq('user_id', w.user_id)
      .single();

    if (wallet) {
      const reserved = Math.max(0, Number(wallet.reserved_balance) - Number(w.amount));
      await supabase
        .from('wallets')
        .update({ reserved_balance: reserved })
        .eq('user_id', w.user_id);
    }

    const { error } = await supabase
      .from('withdrawal_requests')
      .update({
        status: 'paid',
        admin_id: ADMIN_UID,
        paid_at: new Date().toISOString(),
      })
      .eq('id', w.id)
      .in('status', ['pending', 'processing']);

    if (error) {
      setActionMsg('Erro: ' + error.message);
    } else {
      setActionMsg(
        'Saque pago: ' + Number(w.amount).toLocaleString('pt-AO') + ' Kz → ' + (w.iban || '')
      );
    }
    setProcessing(null);
    load();
  }

  async function rejectWithdrawal(w: WithdrawRow) {
    if (processing) return;
    setProcessing(w.id);
    const supabase = createClient();

    // Devolver ao reward_balance
    const { data: wallet } = await supabase
      .from('wallets')
      .select('id, reward_balance, reserved_balance')
      .eq('user_id', w.user_id)
      .single();

    if (wallet) {
      const reward = Number(wallet.reward_balance) + Number(w.amount);
      const reserved = Math.max(0, Number(wallet.reserved_balance) - Number(w.amount));
      await supabase
        .from('wallets')
        .update({ reward_balance: reward, reserved_balance: reserved })
        .eq('user_id', w.user_id);

      await supabase.from('wallet_transactions').insert({
        wallet_id: wallet.id,
        user_id: w.user_id,
        type: 'refund',
        amount: Number(w.amount),
        balance_before: Number(wallet.reward_balance),
        balance_after: reward,
        component: 'reward_balance',
        reference_id: w.id,
        description: 'Saque rejeitado — reembolso',
        status: 'completed',
      });
    }

    await supabase
      .from('withdrawal_requests')
      .update({
        status: 'rejected',
        admin_id: ADMIN_UID,
        rejected_at: new Date().toISOString(),
      })
      .eq('id', w.id);

    setActionMsg('Saque rejeitado e saldo devolvido');
    setProcessing(null);
    load();
  }

  if (loading) {
    return (
      <main className="nw-bg flex-1 flex items-center justify-center">
        <p className="text-stone-400">A verificar acesso...</p>
      </main>
    );
  }

  if (!authorized) {
    return (
      <main className="nw-bg flex-1 flex flex-col items-center justify-center px-4 gap-4">
        <p className="text-red-400">Acesso restrito ao administrador.</p>
        <Link href="/auth/login" className="text-amber-400 underline text-sm">
          Entrar com conta admin
        </Link>
        <Link href="/" className="text-stone-500 text-sm">
          Voltar
        </Link>
      </main>
    );
  }

  return (
    <main className="nw-bg flex-1 flex flex-col px-4 py-6 max-w-lg mx-auto w-full pb-12">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="nw-title text-xl">Painel Admin</h1>
          <p className="text-xs text-stone-400">Ngola War</p>
        </div>
        <Link href="/" className="text-sm text-stone-400">
          Sair
        </Link>
      </header>

      {actionMsg && (
        <div className="mb-4 p-3 rounded-xl bg-amber-950/50 border border-amber-800 text-sm text-amber-200">
          {actionMsg}
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="nw-panel p-3">
            <p className="text-[10px] text-stone-400">Jogadores</p>
            <p className="text-xl font-bold">{stats.players}</p>
          </div>
          <div className="nw-panel p-3">
            <p className="text-[10px] text-stone-400">Reinos</p>
            <p className="text-xl font-bold">{stats.kingdoms}</p>
          </div>
          <div className="nw-panel p-3">
            <p className="text-[10px] text-stone-400">Batalhas</p>
            <p className="text-xl font-bold">{stats.matches}</p>
          </div>
          <div className="nw-panel p-3">
            <p className="text-[10px] text-stone-400">Depositos pendentes</p>
            <p className="text-xl font-bold text-amber-400">{stats.depositsPending}</p>
          </div>
          <div className="nw-panel p-3 col-span-2">
            <p className="text-[10px] text-stone-400">Saques pendentes</p>
            <p className="text-xl font-bold text-red-400">{stats.withdrawalsPending}</p>
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab('deposits')}
          className={
            'flex-1 py-2 rounded-lg text-sm font-semibold ' +
            (tab === 'deposits' ? 'nw-btn-gold' : 'bg-stone-800 text-stone-400')
          }
        >
          Depositos
        </button>
        <button
          onClick={() => setTab('withdrawals')}
          className={
            'flex-1 py-2 rounded-lg text-sm font-semibold ' +
            (tab === 'withdrawals' ? 'nw-btn-gold' : 'bg-stone-800 text-stone-400')
          }
        >
          Saques
        </button>
      </div>

      {tab === 'deposits' && (
        <>
          <h2 className="text-sm font-semibold text-stone-300 mb-3">Depositos a confirmar</h2>
          {deposits.length === 0 ? (
            <p className="text-sm text-stone-500">Nenhum pedido pendente.</p>
          ) : (
            <ul className="space-y-3">
              {deposits.map((d) => (
                <li key={d.id} className="nw-panel p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-amber-300 font-semibold">
                      {Number(d.amount).toLocaleString('pt-AO')} Kz
                    </span>
                    <span className="text-stone-400">{d.bank_code}</span>
                  </div>
                  <p className="text-xs text-stone-500">
                    User: {d.user_id.slice(0, 8)}… ·{' '}
                    {new Date(d.created_at).toLocaleString('pt-AO')}
                  </p>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => confirmDeposit(d)}
                      disabled={!!processing}
                      className="flex-1 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold disabled:opacity-40"
                    >
                      {processing === d.id ? '...' : 'Confirmar'}
                    </button>
                    <button
                      onClick={() => rejectDeposit(d)}
                      disabled={!!processing}
                      className="flex-1 py-2 rounded-lg bg-red-900/80 text-red-100 text-sm font-semibold disabled:opacity-40"
                    >
                      Rejeitar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {tab === 'withdrawals' && (
        <>
          <h2 className="text-sm font-semibold text-stone-300 mb-3">
            Saques a pagar (min. 2.000 Kz)
          </h2>
          {withdrawals.length === 0 ? (
            <p className="text-sm text-stone-500">Nenhum saque pendente.</p>
          ) : (
            <ul className="space-y-3">
              {withdrawals.map((w) => (
                <li key={w.id} className="nw-panel p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-red-300 font-semibold">
                      {Number(w.amount).toLocaleString('pt-AO')} Kz
                    </span>
                    <span className="text-stone-400">{w.bank_name}</span>
                  </div>
                  <p className="text-xs text-stone-400">
                    {w.account_holder} · {w.iban}
                  </p>
                  <p className="text-xs text-stone-500">
                    User: {w.user_id.slice(0, 8)}… ·{' '}
                    {new Date(w.created_at).toLocaleString('pt-AO')}
                  </p>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => payWithdrawal(w)}
                      disabled={!!processing}
                      className="flex-1 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold disabled:opacity-40"
                    >
                      {processing === w.id ? '...' : 'Marcar pago'}
                    </button>
                    <button
                      onClick={() => rejectWithdrawal(w)}
                      disabled={!!processing}
                      className="flex-1 py-2 rounded-lg bg-red-900/80 text-red-100 text-sm font-semibold disabled:opacity-40"
                    >
                      Rejeitar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </main>
  );
}
