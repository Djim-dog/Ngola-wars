'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface RankRow {
  id: string;
  username: string;
  display_name: string | null;
  total_wins: number;
  total_kingdoms_conquered: number;
  ranking_points: number;
}

export default function RankingPage() {
  const [rows, setRows] = useState<RankRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    async function load() {
      const { data } = await supabase
        .from('profiles')
        .select('id, username, display_name, total_wins, total_kingdoms_conquered, ranking_points')
        .order('ranking_points', { ascending: false })
        .order('total_wins', { ascending: false })
        .limit(50);
      setRows(data || []);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <main className="nw-bg flex-1 flex flex-col px-4 py-6 max-w-lg mx-auto w-full pb-24">
      <header className="mb-6">
        <h1 className="nw-title text-2xl">Ranking</h1>
        <p className="text-xs text-stone-400">Os maiores conquistadores de Ngola War</p>
      </header>

      {loading && <p className="text-center text-stone-400 py-8">A carregar...</p>}

      {!loading && rows.length === 0 && (
        <p className="text-center text-stone-500 text-sm">Ainda sem classificacao.</p>
      )}

      <ol className="space-y-2">
        {rows.map((r, i) => (
          <li
            key={r.id}
            className="nw-panel p-3 flex items-center gap-3"
          >
            <span
              className={
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ' +
                (i === 0
                  ? 'bg-amber-500 text-stone-950'
                  : i === 1
                  ? 'bg-stone-400 text-stone-950'
                  : i === 2
                  ? 'bg-amber-800 text-amber-100'
                  : 'bg-stone-800 text-stone-400')
              }
            >
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-stone-100 truncate">
                {r.display_name || r.username}
              </p>
              <p className="text-[10px] text-stone-500">
                {r.total_wins} vitorias · {r.total_kingdoms_conquered} reinos
              </p>
            </div>
            <span className="text-amber-400 font-bold text-sm">
              {r.ranking_points} pts
            </span>
          </li>
        ))}
      </ol>

      <nav className="nw-nav fixed bottom-0 left-0 right-0 px-2 py-2 flex justify-around text-[11px] max-w-lg mx-auto">
        <Link href="/map/" className="flex flex-col items-center gap-0.5 text-stone-500 py-1 px-3">
          <span className="text-lg">🗺️</span>Mapa
        </Link>
        <Link href="/ranking" className="flex flex-col items-center gap-0.5 text-amber-400 font-semibold py-1 px-3">
          <span className="text-lg">🏆</span>Ranking
        </Link>
        <Link href="/shop" className="flex flex-col items-center gap-0.5 text-stone-500 py-1 px-3">
          <span className="text-lg">🏪</span>Loja
        </Link>
        <Link href="/wallet" className="flex flex-col items-center gap-0.5 text-stone-500 py-1 px-3">
          <span className="text-lg">💰</span>Carteira
        </Link>
      </nav>
    </main>
  );
}
