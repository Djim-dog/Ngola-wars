'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { IconBoard, IconMap, IconWallet } from '@/components/ui/Icons';

const BOARD_THEMES = [
  { id: 'classic', name: 'Classico madeira', dark: '#8B5E34', light: '#E8D5A8' },
  { id: 'night', name: 'Noite real', dark: '#1e293b', light: '#334155' },
  { id: 'royal', name: 'Ouro real', dark: '#78350f', light: '#fbbf24' },
  { id: 'emerald', name: 'Esmeralda', dark: '#064e3b', light: '#a7f3d0' },
];

const PIECE_SKINS = [
  { id: 'angola', name: 'Angola tradicional' },
  { id: 'gold', name: 'Ouro imperial' },
  { id: 'shadow', name: 'Sombra de guerra' },
];

export default function SettingsPage() {
  const [boardTheme, setBoardTheme] = useState('classic');
  const [pieceSkin, setPieceSkin] = useState('angola');
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data } = await supabase
        .from('profiles')
        .select('board_theme, piece_skin')
        .eq('id', user.id)
        .single();
      if (data) {
        if (data.board_theme) setBoardTheme(data.board_theme);
        if (data.piece_skin) setPieceSkin(data.piece_skin);
      }
      // local fallback
      try {
        const local = localStorage.getItem('nw_board_theme');
        if (local) setBoardTheme(local);
        const skin = localStorage.getItem('nw_piece_skin');
        if (skin) setPieceSkin(skin);
      } catch {}
    })();
  }, []);

  async function save() {
    setSaving(true);
    setMsg(null);
    try {
      localStorage.setItem('nw_board_theme', boardTheme);
      localStorage.setItem('nw_piece_skin', pieceSkin);
    } catch {}

    if (userId) {
      const supabase = createClient();
      const { error } = await supabase.rpc('update_personalization', {
        p_board_theme: boardTheme,
        p_piece_skin: pieceSkin,
      });
      if (error) {
        // fallback update
        await supabase
          .from('profiles')
          .update({ board_theme: boardTheme, piece_skin: pieceSkin })
          .eq('id', userId);
      }
    }
    setMsg('Personalizacao guardada');
    setSaving(false);
  }

  return (
    <main className="flex-1 flex flex-col px-4 py-6 max-w-lg mx-auto w-full pb-24">
      <header className="mb-6">
        <h1 className="text-xl font-bold text-amber-400">Personalizacao</h1>
        <p className="text-xs text-slate-400">Tabuleiro e pecas ao teu estilo</p>
      </header>

      <section className="mb-6">
        <h2 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
          <IconBoard size={18} /> Tema do tabuleiro
        </h2>
        <div className="space-y-2">
          {BOARD_THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => setBoardTheme(t.id)}
              className={
                'w-full flex items-center gap-3 p-3 rounded-xl border text-left ' +
                (boardTheme === t.id
                  ? 'border-amber-500 bg-amber-950/40'
                  : 'border-slate-800 bg-slate-900')
              }
            >
              <div className="flex rounded overflow-hidden w-12 h-8 border border-slate-700">
                <div className="flex-1" style={{ background: t.dark }} />
                <div className="flex-1" style={{ background: t.light }} />
              </div>
              <span className="text-sm text-slate-200">{t.name}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="mb-6">
        <h2 className="text-sm font-semibold text-slate-300 mb-3">Visual das pecas</h2>
        <div className="space-y-2">
          {PIECE_SKINS.map((s) => (
            <button
              key={s.id}
              onClick={() => setPieceSkin(s.id)}
              className={
                'w-full p-3 rounded-xl border text-left text-sm ' +
                (pieceSkin === s.id
                  ? 'border-amber-500 bg-amber-950/40 text-amber-200'
                  : 'border-slate-800 bg-slate-900 text-slate-300')
              }
            >
              {s.name}
            </button>
          ))}
        </div>
      </section>

      {msg && (
        <p className="text-sm text-emerald-300 mb-3">{msg}</p>
      )}

      <button
        onClick={save}
        disabled={saving}
        className="w-full py-3 rounded-lg bg-amber-500 text-slate-950 font-semibold disabled:opacity-50"
      >
        {saving ? 'A guardar...' : 'Guardar personalizacao'}
      </button>

      <nav className="fixed bottom-0 left-0 right-0 bg-slate-950/95 border-t border-slate-800 px-4 py-3 flex justify-around text-xs max-w-lg mx-auto">
        <Link href="/map/" className="flex flex-col items-center gap-0.5 text-slate-400">
          <IconMap size={18} />Mapa
        </Link>
        <Link href="/settings" className="flex flex-col items-center gap-0.5 text-amber-400 font-medium">
          <IconBoard size={18} />Estilo
        </Link>
        <Link href="/wallet" className="flex flex-col items-center gap-0.5 text-slate-400">
          <IconWallet size={18} />Carteira
        </Link>
      </nav>
    </main>
  );
}
