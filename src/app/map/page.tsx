'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import type { Kingdom } from '@/types/database';
import { IconMap, IconSword, IconShop, IconWallet, IconBoard } from '@/components/ui/Icons';

export default function MapPage() {
  const [kingdoms, setKingdoms] = useState<Kingdom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [challengeKingdom, setChallengeKingdom] = useState<Kingdom | null>(null);
  const [stake, setStake] = useState('500');
  const [challenging, setChallenging] = useState(false);
  const [challengeMsg, setChallengeMsg] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);

      const { data, error: fetchError } = await supabase
        .from('kingdoms')
        .select('*')
        .order('map_y')
        .order('map_x');

      if (fetchError) {
        setError(fetchError.message);
        setLoading(false);
        return;
      }
      setKingdoms(data || []);
      setLoading(false);
    }
    load();
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  async function sendChallenge() {
    if (!challengeKingdom || !userId || !challengeKingdom.owner_id) return;
    const amount = Number(stake);
    if (isNaN(amount) || amount < 500) {
      setChallengeMsg('Aposta minima 500 Kz');
      return;
    }
    setChallenging(true);
    setChallengeMsg(null);
    const supabase = createClient();
    const { data, error } = await supabase.rpc('challenge_player', {
      p_defender_id: challengeKingdom.owner_id,
      p_kingdom_id: challengeKingdom.id,
      p_stake: amount,
    });
    setChallenging(false);
    if (error) {
      setChallengeMsg(error.message);
      return;
    }
    if (data && !data.success) {
      setChallengeMsg(data.error);
      return;
    }
    setChallengeMsg('Desafio enviado! Vai a Desafios para acompanhar.');
    setChallengeKingdom(null);
  }

  const statusBadge = (status: string) => {
    if (status === 'available') return 'bg-emerald-600/80 text-emerald-100';
    if (status === 'protected') return 'bg-amber-600/80 text-amber-100';
    return 'bg-red-700/80 text-red-100';
  };

  return (
    <main className="nw-bg flex-1 flex flex-col max-w-lg mx-auto w-full pb-24">
      {/* Header com arte */}
      <div className="relative h-36 w-full overflow-hidden">
        <Image
          src="/assets/ui/board-full.jpg"
          alt="Mapa"
          fill
          className="object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-[#0c0a09]" />
        <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
          <div>
            <h1 className="nw-title text-2xl">Mapa Mundial</h1>
            <p className="text-xs text-amber-200/60">Escolhe um reino e conquista</p>
          </div>
          <div className="flex gap-2">
            {userId ? (
              <button onClick={handleLogout} className="text-xs px-3 py-1.5 rounded-lg bg-stone-800/80 text-stone-300 border border-stone-700">
                Sair
              </button>
            ) : (
              <Link href="/auth/login" className="nw-btn-gold text-xs px-3 py-1.5">
                Entrar
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3">
        {loading && (
          <p className="text-center text-stone-400 py-12 animate-pulse">A carregar reinos...</p>
        )}

        {error && (
          <div className="nw-panel p-4 text-sm text-red-300">
            <p className="font-medium">Erro ao carregar</p>
            <p className="text-xs mt-1 text-stone-400">{error}</p>
          </div>
        )}

        {kingdoms.map((k) => (
          <div key={k.id} className="nw-kingdom-card p-4 flex items-center gap-3">
            <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-amber-700/40 shrink-0">
              <Image
                src="/assets/ui/board-empty.jpg"
                alt={k.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-amber-100 truncate">{k.name}</h2>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${statusBadge(k.status)}`}>
                  {k.status === 'available' ? 'Aberto' : k.status === 'protected' ? 'Escudo' : 'Batalha'}
                </span>
              </div>
              <p className="text-[11px] text-stone-400 mt-0.5">
                Nv.{k.level} · Capital {Number(k.capital).toFixed(0)} Kz · Bounty {Number(k.bounty_potential).toFixed(2)}
              </p>
              <p className="text-[10px] text-stone-500">
                {k.owner_id
                  ? k.owner_id === userId
                    ? 'O teu reino'
                    : 'Controlado por outro rei'
                  : 'Sem rei — disponível'}
              </p>
            </div>
            <div className="flex flex-col gap-1.5 shrink-0">
              <Link
                href={`/kingdom/?id=${k.id}`}
                className="px-3 py-1.5 text-[10px] text-center rounded-lg bg-stone-800 text-amber-200/90 border border-stone-700"
              >
                Ver reino
              </Link>
              {k.status === 'available' && !k.owner_id ? (
                <Link
                  href={`/game/?kingdom=${k.id}`}
                  className="nw-btn-gold px-3 py-1.5 text-[10px] text-center"
                >
                  Conquistar
                </Link>
              ) : k.owner_id && k.owner_id !== userId && k.status !== 'in_battle' && k.status !== 'protected' ? (
                <button
                  onClick={() => { setChallengeKingdom(k); setStake('500'); setChallengeMsg(null); }}
                  className="nw-btn-gold px-3 py-1.5 text-[10px] text-center"
                >
                  PvP
                </button>
              ) : (
                <span className="px-3 py-1.5 text-[10px] text-center rounded-lg bg-stone-800 text-stone-500">—</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal desafio PvP */}
      {challengeKingdom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-sm rounded-xl bg-slate-900 border border-amber-700/50 p-5 space-y-4">
            <h3 className="text-lg font-bold text-amber-400">Desafiar reino</h3>
            <p className="text-sm text-slate-300">{challengeKingdom.name}</p>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Valor da aposta (min. 500 Kz)</label>
              <input
                type="number"
                min={500}
                value={stake}
                onChange={(e) => setStake(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-stone-800 border border-stone-700 text-white"
              />
            </div>
            {challengeMsg && (
              <p className="text-sm text-amber-200">{challengeMsg}</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => setChallengeKingdom(null)}
                className="flex-1 py-2 rounded-lg border border-slate-600 text-slate-300 text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={sendChallenge}
                disabled={challenging}
                className="flex-1 py-2 rounded-lg bg-amber-500 text-slate-950 font-semibold text-sm disabled:opacity-50"
              >
                {challenging ? '...' : 'Desafiar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <nav className="nw-nav fixed bottom-0 left-0 right-0 px-2 py-2 flex justify-around text-[11px] max-w-lg mx-auto">
        <Link href="/map/" className="flex flex-col items-center gap-0.5 text-amber-400 font-semibold py-1 px-3">
          <IconMap size={20} className="mb-0.5" />Mapa
        </Link>
        <Link href="/challenges" className="flex flex-col items-center gap-0.5 text-stone-500 py-1 px-3">
          <IconSword size={20} className="mb-0.5" />Desafios
        </Link>
        <Link href="/shop" className="flex flex-col items-center gap-0.5 text-stone-500 py-1 px-3">
          <IconShop size={20} className="mb-0.5" />Loja
        </Link>
        <Link href="/wallet" className="flex flex-col items-center gap-0.5 text-stone-500 py-1 px-3">
          <IconWallet size={20} className="mb-0.5" />Carteira
        </Link>
        <Link href="/game/" className="flex flex-col items-center gap-0.5 text-stone-500 py-1 px-3">
          <IconBoard size={20} className="mb-0.5" />Batalha
        </Link>
      </nav>
    </main>
  );
}
