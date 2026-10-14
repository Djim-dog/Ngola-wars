'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { ShopProduct, Wallet } from '@/types/database';

const CATEGORY_LABELS: Record<string, string> = {
  pieces: 'Peças e exército',
  protection: 'Proteção do reino',
  training: 'Treino',
  cosmetics: 'Cosméticos',
  season_pass: 'Passe de temporada',
};

export default function ShopPage() {
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const supabase = createClient();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    setUserId(user?.id ?? null);

    const { data: prods, error: pErr } = await supabase
      .from('shop_products')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    if (pErr) {
      setError(pErr.message);
      setLoading(false);
      return;
    }
    setProducts(prods || []);

    if (user) {
      const { data: w } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .single();
      setWallet(w);
    }

    setLoading(false);
  }

  async function handleBuy(product: ShopProduct) {
    if (!userId || !wallet) {
      setMessage('Entra na conta para comprar');
      return;
    }

    if (Number(wallet.purchase_balance) < Number(product.price)) {
      setMessage('Saldo de compras insuficiente');
      return;
    }

    setBuying(product.id);
    setMessage(null);

    const supabase = createClient();

    // Tenta a RPC segura primeiro
    const { data, error: rpcErr } = await supabase.rpc('buy_shop_product', {
      p_product_id: product.id,
    });

    if (!rpcErr && data?.success) {
      setMessage('Compraste: ' + (data.product_name || product.name));
      setBuying(null);
      load();
      return;
    }

    if (!rpcErr && data && data.success === false) {
      setMessage(data.error || 'Erro na compra');
      setBuying(null);
      return;
    }

    // Fallback (método antigo) se a RPC ainda não estiver disponível
    const newBalance = Number(wallet.purchase_balance) - Number(product.price);

    const { error: upErr } = await supabase
      .from('wallets')
      .update({ purchase_balance: newBalance })
      .eq('user_id', userId);

    if (upErr) {
      setMessage('Erro ao debitar: ' + upErr.message);
      setBuying(null);
      return;
    }

    await supabase.from('shop_purchases').insert({
      user_id: userId,
      product_id: product.id,
      quantity: 1,
      total_price: product.price,
      status: 'completed',
    });

    if (product.category === 'pieces' && product.piece_quantity > 0) {
      const pieces = Array.from({ length: product.piece_quantity }).map(() => ({
        user_id: userId,
        is_alive: true,
        health: 5,
        origin: 'purchased',
      }));
      await supabase.from('player_pieces').insert(pieces);
    }

    if (product.category === 'protection' && product.duration_hours) {
      const until = new Date();
      until.setHours(until.getHours() + Number(product.duration_hours));
      await supabase
        .from('kingdoms')
        .update({
          protected_until: until.toISOString(),
          status: 'protected',
        })
        .eq('owner_id', userId);
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
        type: 'shop_purchase',
        amount: -Number(product.price),
        balance_before: Number(wallet.purchase_balance),
        balance_after: newBalance,
        component: 'purchase_balance',
        description: product.name,
        status: 'completed',
      });
    }

    setMessage(`Compraste: ${product.name}`);
    setBuying(null);
    load();
  }

  function formatKz(value: number) {
    return Number(value).toLocaleString('pt-AO') + ' Kz';
  }

  const grouped = products.reduce<Record<string, ShopProduct[]>>((acc, p) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {});

  return (
    <main className="flex-1 flex flex-col px-4 py-6 max-w-lg mx-auto w-full pb-20">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-amber-400">Loja</h1>
          <p className="text-xs text-slate-400">Peças, escudos e cosméticos</p>
        </div>
        {wallet && (
          <div className="text-right">
            <p className="text-xs text-slate-400">Saldo</p>
            <p className="text-sm font-semibold text-green-400">
              {formatKz(wallet.purchase_balance)}
            </p>
          </div>
        )}
      </header>

      {message && (
        <div className="mb-4 p-3 rounded-lg bg-amber-950/50 border border-amber-800 text-sm text-amber-200">
          {message}
        </div>
      )}

      {loading && (
        <p className="text-center text-slate-400 py-12">A carregar loja...</p>
      )}

      {error && (
        <div className="bg-red-950/40 border border-red-800 rounded-xl p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {!loading && !error && products.length === 0 && (
        <p className="text-center text-slate-400 py-8">
          Nenhum produto. Corre a Parte 10a do SQL (produtos da loja).
        </p>
      )}

      {Object.entries(grouped).map(([cat, items]) => (
        <section key={cat} className="mb-6">
          <h2 className="text-sm font-semibold text-slate-300 mb-2">
            {CATEGORY_LABELS[cat] || cat}
          </h2>
          <div className="space-y-2">
            {items.map((p) => (
              <div
                key={p.id}
                className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="font-medium text-slate-100 truncate">{p.name}</p>
                  <p className="text-xs text-slate-400 truncate">
                    {p.description}
                  </p>
                  <p className="text-sm text-amber-400 mt-0.5">
                    {formatKz(p.price)}
                  </p>
                </div>
                <button
                  onClick={() => handleBuy(p)}
                  disabled={!!buying || !userId}
                  className="shrink-0 px-3 py-2 rounded-lg bg-amber-500 text-slate-950 text-sm font-semibold disabled:opacity-40"
                >
                  {buying === p.id ? '...' : 'Comprar'}
                </button>
              </div>
            ))}
          </div>
        </section>
      ))}

      {!userId && !loading && (
        <p className="text-center text-sm text-slate-400 mt-4">
          <Link href="/auth/login" className="text-amber-400 underline">
            Entra na conta
          </Link>{' '}
          para comprar.
        </p>
      )}

      <nav className="fixed bottom-0 left-0 right-0 bg-slate-950/95 border-t border-slate-800 px-4 py-3 flex justify-around text-xs max-w-lg mx-auto">
        <Link href="/map/" className="text-slate-400">
          Mapa
        </Link>
        <Link href="/shop" className="text-amber-400 font-medium">
          Loja
        </Link>
        <Link href="/wallet" className="text-slate-400">
          Carteira
        </Link>
        <Link href="/game" className="text-slate-400">
          Treinar
        </Link>
      </nav>
    </main>
  );
}
