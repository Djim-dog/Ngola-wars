'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Kingdom, PlayerPiece } from '@/types/database';

function KingdomInner() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const [kingdom, setKingdom] = useState<Kingdom | null>(null);
  const [warriors, setWarriors] = useState<PlayerPiece[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError('Reino nao especificado');
      setLoading(false);
      return;
    }
    const supabase = createClient();

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);

      const { data: k, error: kErr } = await supabase
        .from('kingdoms')
        .select('*')
        .eq('id', id)
        .single();

      if (kErr || !k) {
        setError('Reino nao encontrado');
        setLoading(false);
        return;
      }
      setKingdom(k);

      if (user) {
        const { data: pieces } = await supabase
          .from('player_pieces')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_alive', true)
          .limit(24);
        setWarriors(pieces || []);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  const isOwner = !!(userId && kingdom?.owner_id === userId);
  const aliveCount = warriors.length;

  if (loading) {
    return (
      <main className="nw-bg flex-1 flex items-center justify-center">
        <p className="text-stone-400 animate-pulse">A entrar no reino...</p>
      </main>
    );
  }

  if (error || !kingdom) {
    return (
      <main className="nw-bg flex-1 flex flex-col items-center justify-center gap-3 px-4">
        <p className="text-red-400">{error || 'Erro'}</p>
        <Link href="/map/" className="text-amber-400 text-sm">
          ← Voltar ao mapa
        </Link>
      </main>
    );
  }

  return (
    <main className="nw-bg flex-1 flex flex-col max-w-lg mx-auto w-full pb-24">
      <div className="relative h-40 w-full overflow-hidden">
        <Image
          src="/assets/ui/board-empty.jpg"
          alt={kingdom.name}
          fill
          className="object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-[#0c0a09]" />
        <div className="absolute bottom-4 left-4 right-4">
          <Link href="/map/" className="text-xs text-amber-400/80">
            ← Mapa mundial
          </Link>
          <h1 className="nw-title text-2xl mt-1">{kingdom.name}</h1>
          <p className="text-xs text-stone-400">
            Nv.{kingdom.level} · Capital {Number(kingdom.capital).toFixed(0)} Kz ·{' '}
            {isOwner ? 'O teu reino' : kingdom.owner_id ? 'Reino ocupado' : 'Sem rei'}
          </p>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-5">
        <section className="nw-panel p-4">
          <h2 className="text-sm font-bold text-amber-300 mb-1">Centro de Recruta</h2>
          <p className="text-xs text-stone-400 mb-3">
            Aqui reunem-se os guerreiros do reino. Compra mais na loja para reforcar o exercito.
          </p>
          <div className="flex gap-2">
            <Link href="/shop/" className="nw-btn-gold flex-1 py-2.5 text-center text-sm">
              Recrutar (Loja)
            </Link>
            {kingdom.status === 'available' && !isOwner && (
              <Link
                href={`/game/?kingdom=${kingdom.id}`}
                className="nw-btn-ghost flex-1 py-2.5 text-center text-sm font-semibold"
              >
                Desafiar
              </Link>
            )}
          </div>
        </section>

        <section>
          <h2 className="text-sm font-bold text-stone-300 mb-3">
            Guerreiros {userId ? `(${aliveCount} vivos)` : ''}
          </h2>
          {!userId && (
            <p className="text-sm text-stone-500">
              <Link href="/auth/login/" className="text-amber-400 underline">Entra</Link> para ver o teu exercito.
            </p>
          )}
          {userId && aliveCount === 0 && (
            <div className="nw-panel p-4 text-center">
              <p className="text-stone-400 text-sm">Ainda nao tens guerreiros vivos.</p>
              <Link href="/shop/" className="inline-block mt-3 text-amber-400 text-sm font-semibold">
                Ir a loja recrutar →
              </Link>
            </div>
          )}
          <div className="grid grid-cols-4 gap-2">
            {warriors.map((w, i) => (
              <div
                key={w.id}
                className="relative aspect-square rounded-xl overflow-hidden border border-red-800/40 bg-stone-900"
              >
                <Image
                  src={
                    i % 3 === 2
                      ? '/assets/pieces/angola-rei.jpg'
                      : i % 3 === 1
                      ? '/assets/pieces/angola-cavaleiro.jpg'
                      : '/assets/pieces/angola-peao.jpg'
                  }
                  alt="Guerreiro"
                  fill
                  className="object-cover"
                  sizes="80px"
                />
                <span className="absolute bottom-0 inset-x-0 text-center text-[8px] bg-black/60 py-0.5 text-red-300">
                  {'♥'.repeat(Math.min(w.health || 5, 5))}
                </span>
              </div>
            ))}
          </div>
        </section>

        <p className="text-[10px] text-stone-600 text-center leading-relaxed">
          Mapa individual em modo MVP — centro de recruta e lista de guerreiros.
        </p>
      </div>
    </main>
  );
}

export default function KingdomPage() {
  return (
    <Suspense
      fallback={
        <main className="nw-bg flex-1 flex items-center justify-center">
          <p className="text-stone-400">A carregar...</p>
        </main>
      }
    >
      <KingdomInner />
    </Suspense>
  );
}
