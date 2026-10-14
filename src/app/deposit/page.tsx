'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

const BANKS = [
  {
    code: 'millennium',
    name: 'Millennium Atlântico',
    iban: '0055 0000 18127040101 24',
    holder: 'Albertino Ramos Manuel',
  },
  {
    code: 'yetu',
    name: 'YETU',
    iban: '0066 0000 06000662101 48',
    holder: 'Albertino Ramos Manuel',
  },
] as const;

type BankCode = (typeof BANKS)[number]['code'];

interface DepositRequest {
  id: string;
  bank_code: string;
  amount: number;
  status: string;
  created_at: string;
}

export default function DepositPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [bank, setBank] = useState<BankCode>('millennium');
  const [amount, setAmount] = useState('500');
  const [step, setStep] = useState<'form' | 'instructions' | 'done'>('form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<DepositRequest[]>([]);
  const [requestId, setRequestId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data } = await supabase
        .from('deposit_requests')
        .select('id, bank_code, amount, status, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      setHistory(data || []);
    }
    init();
  }, [step]);

  const selectedBank = BANKS.find((b) => b.code === bank)!;

  async function handleRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) {
      setError('Entra na conta primeiro');
      return;
    }

    const value = Number(amount);
    if (isNaN(value) || value < 500) {
      setError('Valor mínimo: 500 Kz');
      return;
    }

    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error: insErr } = await supabase
      .from('deposit_requests')
      .insert({
        user_id: userId,
        bank_code: bank,
        amount: value,
        status: 'pending',
      })
      .select('id')
      .single();

    setLoading(false);

    if (insErr) {
      setError(insErr.message);
      return;
    }

    setRequestId(data.id);
    setStep('instructions');
  }

  function statusLabel(s: string) {
    const map: Record<string, string> = {
      pending: 'Pendente',
      under_review: 'Em verificação',
      confirmed: 'Confirmado',
      rejected: 'Rejeitado',
    };
    return map[s] || s;
  }

  function statusColor(s: string) {
    if (s === 'confirmed') return 'text-green-400';
    if (s === 'rejected') return 'text-red-400';
    if (s === 'under_review') return 'text-yellow-400';
    return 'text-slate-300';
  }

  return (
    <main className="flex-1 flex flex-col px-4 py-6 max-w-lg mx-auto w-full pb-20">
      <header className="mb-6">
        <Link href="/wallet" className="text-sm text-slate-400 hover:text-amber-400">
          ← Carteira
        </Link>
        <h1 className="text-xl font-bold text-amber-400 mt-2">Depositar</h1>
        <p className="text-xs text-slate-400">
          Transferência bancária manual · Mínimo 500 Kz
        </p>
      </header>

      {step === 'form' && (
        <form onSubmit={handleRequest} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-2">Banco</label>
            <div className="space-y-2">
              {BANKS.map((b) => (
                <label
                  key={b.code}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer ${
                    bank === b.code
                      ? 'border-amber-500 bg-amber-950/30'
                      : 'border-slate-700 bg-slate-900'
                  }`}
                >
                  <input
                    type="radio"
                    name="bank"
                    value={b.code}
                    checked={bank === b.code}
                    onChange={() => setBank(b.code)}
                    className="accent-amber-500"
                  />
                  <div>
                    <p className="font-medium text-slate-100">{b.name}</p>
                    <p className="text-xs text-slate-400">{b.iban}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">Valor (Kz)</label>
            <input
              type="number"
              min={500}
              step={100}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-amber-500"
              required
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-950/40 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !userId}
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold"
          >
            {loading ? 'A criar pedido...' : 'Continuar'}
          </button>

          {!userId && (
            <p className="text-center text-sm text-slate-400">
              <Link href="/auth/login" className="text-amber-400 underline">
                Entra na conta
              </Link>{' '}
              para depositar.
            </p>
          )}
        </form>
      )}

      {step === 'instructions' && (
        <div className="space-y-5">
          <div className="p-4 rounded-xl bg-slate-900 border border-amber-500/30 space-y-3">
            <p className="text-sm text-slate-400">Transfere exactamente:</p>
            <p className="text-3xl font-bold text-amber-400">
              {Number(amount).toLocaleString('pt-AO')} Kz
            </p>
            <div className="text-sm space-y-1 pt-2 border-t border-slate-800">
              <p>
                <span className="text-slate-400">Titular:</span>{' '}
                <span className="text-white">{selectedBank.holder}</span>
              </p>
              <p>
                <span className="text-slate-400">Banco:</span>{' '}
                <span className="text-white">{selectedBank.name}</span>
              </p>
              <p>
                <span className="text-slate-400">IBAN:</span>{' '}
                <span className="text-amber-200 font-mono text-xs">
                  {selectedBank.iban}
                </span>
              </p>
            </div>
          </div>

          <div className="text-sm text-slate-300 space-y-2">
            <p className="font-semibold text-amber-300">Próximos passos:</p>
            <ol className="list-decimal list-inside space-y-1 text-slate-400">
              <li>Faz a transferência no teu banco / app</li>
              <li>Guarda o comprovativo</li>
              <li>
                Envia o comprovativo ao admin (WhatsApp / suporte) com a
                referência do pedido
              </li>
              <li>Aguarda a confirmação (o saldo será creditado)</li>
            </ol>
            {requestId && (
              <p className="mt-3 p-2 rounded bg-slate-800 text-xs">
                ID do pedido:{' '}
                <span className="text-amber-300 font-mono">{requestId.slice(0, 8)}…</span>
              </p>
            )}
          </div>

          <p className="text-xs text-slate-500">
            O comprovativo será eliminado automaticamente após a confirmação.
            O histórico financeiro permanece.
          </p>

          <button
            onClick={() => setStep('done')}
            className="w-full py-3 rounded-xl bg-slate-700 text-white font-semibold"
          >
            Já transferi — ver pedidos
          </button>
        </div>
      )}

      {(step === 'done' || step === 'form') && history.length > 0 && (
        <div className={step === 'form' ? 'mt-8' : 'mt-2'}>
          <h2 className="text-sm font-semibold text-slate-300 mb-3">
            Os teus pedidos
          </h2>
          <ul className="space-y-2">
            {history.map((d) => (
              <li
                key={d.id}
                className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-sm flex justify-between"
              >
                <div>
                  <p className="text-slate-200">
                    {Number(d.amount).toLocaleString('pt-AO')} Kz
                  </p>
                  <p className="text-xs text-slate-500">
                    {d.bank_code} ·{' '}
                    {new Date(d.created_at).toLocaleDateString('pt-AO')}
                  </p>
                </div>
                <span className={`text-xs font-medium ${statusColor(d.status)}`}>
                  {statusLabel(d.status)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 bg-slate-950/95 border-t border-slate-800 px-4 py-3 flex justify-around text-xs max-w-lg mx-auto">
        <Link href="/map/" className="text-slate-400">
          Mapa
        </Link>
        <Link href="/shop" className="text-slate-400">
          Loja
        </Link>
        <Link href="/wallet" className="text-slate-400">
          Carteira
        </Link>
        <Link href="/deposit" className="text-amber-400 font-medium">
          Depositar
        </Link>
      </nav>
    </main>
  );
}
