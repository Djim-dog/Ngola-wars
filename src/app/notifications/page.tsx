'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { IconBell, IconMap, IconSword, IconWallet } from '@/components/ui/Icons';

interface Notif {
  id: string;
  type: string;
  title: string;
  body: string | null;
  read: boolean;
  created_at: string;
  data?: Record<string, unknown>;
}

export default function NotificationsPage() {
  const [items, setItems] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

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

    const { data, error } = await supabase.rpc('get_notifications', { p_limit: 40 });
    if (!error && data?.success) {
      setItems(data.notifications || []);
      setUnread(data.unread || 0);
    } else {
      // Fallback: query direta
      const { data: rows } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(40);
      setItems((rows as Notif[]) || []);
      setUnread((rows || []).filter((r: Notif) => !r.read).length);
    }
    setLoading(false);
  }

  async function markAllRead() {
    const supabase = createClient();
    await supabase.rpc('mark_notifications_read');
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnread(0);
  }

  if (!userId && !loading) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center px-4">
        <p className="text-slate-400 mb-4">Entra na conta para ver notificacoes</p>
        <Link href="/auth/login" className="text-amber-400 underline">Entrar</Link>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col px-4 py-6 max-w-lg mx-auto w-full pb-24">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-amber-400 flex items-center gap-2">
            <IconBell size={22} /> Notificacoes
          </h1>
          <p className="text-xs text-slate-400">
            {unread > 0 ? `${unread} por ler` : 'Tudo em dia'}
          </p>
        </div>
        {unread > 0 && (
          <button
            onClick={markAllRead}
            className="text-xs px-3 py-1.5 rounded-lg border border-amber-700/50 text-amber-300"
          >
            Marcar todas
          </button>
        )}
      </header>

      {loading && <p className="text-center text-slate-400 py-8">A carregar...</p>}

      {!loading && items.length === 0 && (
        <p className="text-center text-slate-500 py-12 text-sm">
          Sem notificacoes ainda.
        </p>
      )}

      <ul className="space-y-2">
        {items.map((n) => (
          <li
            key={n.id}
            className={
              'p-3 rounded-xl border text-sm ' +
              (n.read
                ? 'bg-slate-900/50 border-slate-800 text-slate-400'
                : 'bg-amber-950/30 border-amber-800/40 text-slate-200')
            }
          >
            <p className="font-medium">{n.title}</p>
            {n.body && <p className="text-xs text-slate-400 mt-0.5">{n.body}</p>}
            <p className="text-[10px] text-slate-500 mt-1">
              {new Date(n.created_at).toLocaleString('pt-AO')}
            </p>
          </li>
        ))}
      </ul>

      <nav className="fixed bottom-0 left-0 right-0 bg-slate-950/95 border-t border-slate-800 px-4 py-3 flex justify-around text-xs max-w-lg mx-auto">
        <Link href="/map/" className="flex flex-col items-center gap-0.5 text-slate-400">
          <IconMap size={18} />Mapa
        </Link>
        <Link href="/challenges" className="flex flex-col items-center gap-0.5 text-slate-400">
          <IconSword size={18} />Desafios
        </Link>
        <Link href="/notifications" className="flex flex-col items-center gap-0.5 text-amber-400 font-medium">
          <IconBell size={18} />Alertas
        </Link>
        <Link href="/wallet" className="flex flex-col items-center gap-0.5 text-slate-400">
          <IconWallet size={18} />Carteira
        </Link>
      </nav>
    </main>
  );
}
