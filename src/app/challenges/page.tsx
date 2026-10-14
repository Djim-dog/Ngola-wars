'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { Match } from '@/types/database';

export default function ChallengesPage() {
  const [incoming, setIncoming] = useState<Match[]>([]);
  const [outgoing, setOutgoing] = useState<Match[]>([]);
  const [active, setActive] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    setUserId(user.id);

    const { data: pendingIn } = await supabase
      .from('matches')
      .select('*')
      .eq('match_type', 'vs_player')
      .eq('status', 'pending')
      .eq('defender_id', user.id)
      .order('created_at', { ascending: false });

    const { data: pendingOut } = await supabase
      .from('matches')
      .select('*')
      .eq('match_type', 'vs_player')
      .eq('status', 'pending')
      .eq('challenger_id', user.id)
      .order('created_at', { ascending: false });

    const { data: act } = await supabase
      .from('matches')
      .select('*')
      .eq('match_type', 'vs_player')
      .eq('status', 'active')
      .or(`challenger_id.eq.${user.id},defender_id.eq.${user.id}`)
      .order('started_at', { ascending: false });

    setIncoming(pendingIn || []);
    setOutgoing(pendingOut || []);
    setActive(act || []);
    setLoading(false);
  }

  async function accept(matchId: string) {
    setActing(matchId);
    setMsg(null);
    const supabase = createClient();
    const { data, error } = await supabase.rpc('accept_challenge', { p_match_id: matchId });
    setActing(null);
    if (error) {
      setMsg(error.message);
      return;
    }
    if (data && !data.success) {
      setMsg(data.error);
      return;
    }
    setMsg('Desafio aceite! A batalha comecou.');
    load();
  }

  async function decline(matchId: string) {
    setActing(matchId);
    setMsg(null);
    const supabase = createClient();
    const { data, error } = await supabase.rpc('decline_challenge', { p_match_id: matchId });
    setActing(null);
    if (error) {
      setMsg(error.message);
      return;
    }
    setMsg('Desafio recusado.');
    load();
  }

  function formatKz(v: number) {
    return Number(v).toLocaleString('pt-AO') + ' Kz';
  }

  if (!userId && !loading) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center px-4">
        <p className="text-slate-400 mb-4">Entra na conta para ver desafios</p>
        <Link href="/auth/login" className="text-amber-400 underline">Entrar</Link>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col px-4 py-6 max-w-lg mx-auto w-full pb-24">
      <header className="mb-6">
        <h1 className="text-xl font-bold text-amber-400">Desafios PvP</h1>
        <p className="text-xs text-slate-400">Aceita, recusa ou continua batalhas</p>
      </header>

      {msg && (
        <div className="mb-4 p-3 rounded-lg bg-amber-950/50 border border-amber-800 text-sm text-amber-200">
          {msg}
        </div>
      )}

      {loading && <p className="text-center text-slate-400 py-8">A carregar...</p>}

      {/* Ativas */}
      {active.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-green-400 mb-2">Em curso</h2>
          <ul className="space-y-2">
            {active.map((m) => (
              <li key={m.id} className="p-3 rounded-xl bg-slate-900 border border-green-800/50">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-slate-200">Aposta: {formatKz(m.stake_amount)}</p>
                    <p className="text-xs text-slate-500">
                      {m.current_turn === userId ? 'É a tua vez' : 'À espera do adversário'}
                    </p>
                  </div>
                  <Link
                    href={`/game/?match=${m.id}`}
                    className="px-3 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold"
                  >
                    Jogar
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Entrantes */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold text-amber-300 mb-2">
          Recebidos ({incoming.length})
        </h2>
        {incoming.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhum desafio pendente.</p>
        ) : (
          <ul className="space-y-2">
            {incoming.map((m) => (
              <li key={m.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <p className="text-sm text-slate-200 mb-1">
                  Aposta: <span className="text-amber-300 font-semibold">{formatKz(m.stake_amount)}</span>
                </p>
                <p className="text-xs text-slate-500 mb-3">
                  {new Date(m.created_at).toLocaleString('pt-AO')}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => accept(m.id)}
                    disabled={!!acting}
                    className="flex-1 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold disabled:opacity-40"
                  >
                    {acting === m.id ? '...' : 'Aceitar'}
                  </button>
                  <button
                    onClick={() => decline(m.id)}
                    disabled={!!acting}
                    className="flex-1 py-2 rounded-lg bg-red-900/80 text-red-100 text-sm font-semibold disabled:opacity-40"
                  >
                    Recusar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Enviados */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold text-slate-300 mb-2">
          Enviados ({outgoing.length})
        </h2>
        {outgoing.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhum desafio enviado.</p>
        ) : (
          <ul className="space-y-2">
            {outgoing.map((m) => (
              <li key={m.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
                <div>
                  <p className="text-sm text-slate-200">{formatKz(m.stake_amount)}</p>
                  <p className="text-xs text-slate-500">À espera de resposta</p>
                </div>
                <button
                  onClick={() => decline(m.id)}
                  disabled={!!acting}
                  className="px-3 py-1.5 rounded-lg border border-slate-600 text-slate-400 text-xs"
                >
                  Cancelar
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <nav className="fixed bottom-0 left-0 right-0 bg-slate-950/95 border-t border-slate-800 px-4 py-3 flex justify-around text-xs max-w-lg mx-auto">
        <Link href="/map/" className="text-slate-400">Mapa</Link>
        <Link href="/challenges" className="text-amber-400 font-medium">Desafios</Link>
        <Link href="/wallet" className="text-slate-400">Carteira</Link>
        <Link href="/game" className="text-slate-400">Batalha</Link>
      </nav>
    </main>
  );
}
