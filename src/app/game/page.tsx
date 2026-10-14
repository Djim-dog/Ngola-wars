'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import CheckersBoard from '@/components/board/CheckersBoard';
import FirstBattleResult from '@/components/battle/FirstBattleResult';
import { createClient } from '@/lib/supabase/client';
import type { PieceColor } from '@/types/database';

function GameInner() {
  const searchParams = useSearchParams();
  const kingdomId = searchParams.get('kingdom');
  const matchId = searchParams.get('match');

  const [userId, setUserId] = useState<string | null>(null);
  const [isFirstBattle, setIsFirstBattle] = useState(false);
  const [result, setResult] = useState<'won' | 'lost' | null>(null);
  const [processing, setProcessing] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [kingdomName, setKingdomName] = useState<string | null>(null);
  const [blocked, setBlocked] = useState<string | null>(null);
  const [canPlay, setCanPlay] = useState(true);
  const [pvpMatch, setPvpMatch] = useState<any>(null);
  const [pvpInfo, setPvpInfo] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    async function check() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setInfo('Entra na conta para a batalha oficial');
        return;
      }
      setUserId(user.id);

      const { data: profile } = await supabase
        .from('profiles')
        .select('first_battle_done')
        .eq('id', user.id)
        .single();

      if (profile && !profile.first_battle_done) {
        setIsFirstBattle(true);
        setInfo('Primeira batalha — vence e recebe 500 Kz de capital!');
        return;
      }

      if (matchId) {
        const { data: m } = await supabase
          .from('matches')
          .select('*')
          .eq('id', matchId)
          .single();
        if (!m) {
          setBlocked('Partida nao encontrada');
          setCanPlay(false);
          return;
        }
        if (m.status !== 'active') {
          setBlocked('Partida nao esta ativa (' + m.status + ')');
          setCanPlay(false);
          return;
        }
        if (m.challenger_id !== user.id && m.defender_id !== user.id) {
          setBlocked('Nao estas nesta partida');
          setCanPlay(false);
          return;
        }
        setPvpMatch(m);
        setPvpInfo(
          m.current_turn === user.id
            ? 'PvP · É a tua vez · Aposta ' + Number(m.stake_amount).toLocaleString('pt-AO') + ' Kz'
            : 'PvP · À espera do adversário · Aposta ' + Number(m.stake_amount).toLocaleString('pt-AO') + ' Kz'
        );
        setCanPlay(m.current_turn === user.id);
        return;
      }

      if (kingdomId) {
        const { data: k } = await supabase
          .from('kingdoms')
          .select('name, status, owner_id, protected_until')
          .eq('id', kingdomId)
          .single();

        if (!k) {
          setBlocked('Reino nao encontrado');
          setCanPlay(false);
          return;
        }

        setKingdomName(k.name);

        if (k.protected_until && new Date(k.protected_until) > new Date()) {
          setBlocked('Este reino esta protegido por escudo ate ' + new Date(k.protected_until).toLocaleString('pt-AO'));
          setCanPlay(false);
          return;
        }

        if (k.status === 'protected') {
          setBlocked('Reino protegido — nao pode ser desafiado agora');
          setCanPlay(false);
          return;
        }

        if (k.owner_id === user.id) {
          setBlocked('Ja controlas este reino');
          setCanPlay(false);
          return;
        }

        // Capital minimo 500 Kz para desafiar
        const { data: wallet } = await supabase
          .from('wallets')
          .select('kingdom_capital')
          .eq('user_id', user.id)
          .single();

        if (!wallet || Number(wallet.kingdom_capital) < 500) {
          setBlocked('Precisas de pelo menos 500 Kz de capital do reino para desafiar');
          setCanPlay(false);
          return;
        }

        setInfo('Desafio: ' + k.name + ' — vence para conquistar');
      } else {
        setInfo('Modo treino');
      }
    }
    check();
  }, [kingdomId, matchId]);

  const handleGameEnd = useCallback(
    async (winner: PieceColor | 'draw') => {
      if (!userId || result || processing) return;
      const won = winner === 'red';

      // PvP: termina a partida no servidor e paga o vencedor
      if (matchId && pvpMatch) {
        setProcessing(true);
        const supabase = createClient();
        const winnerId = won ? userId : (pvpMatch.challenger_id === userId ? pvpMatch.defender_id : pvpMatch.challenger_id);
        const { data, error } = await supabase.rpc('submit_move', {
          p_match_id: matchId,
          p_board_state: [],
          p_move: { type: 'game_end', winner: winnerId },
          p_is_finished: true,
          p_winner_id: winnerId,
        });
        if (error) {
          setInfo('Erro ao finalizar: ' + error.message);
        } else {
          setInfo(won ? 'Venceste o PvP! Premio creditado.' : 'Perdeste o PvP.');
        }
        setResult(won ? 'won' : 'lost');
        setProcessing(false);
        return;
      }

      // Treino simples
      if (!isFirstBattle && !kingdomId) {
        setResult(won ? 'won' : 'lost');
        return;
      }

      setProcessing(true);
      const supabase = createClient();

      if (isFirstBattle) {
        if (won) {
          const { data: wallet } = await supabase
            .from('wallets')
            .select('id, kingdom_capital')
            .eq('user_id', userId)
            .single();
          if (wallet) {
            const before = Number(wallet.kingdom_capital);
            const after = before + 500;
            await supabase.from('wallets').update({ kingdom_capital: after }).eq('user_id', userId);
            await supabase.from('wallet_transactions').insert({
              wallet_id: wallet.id,
              user_id: userId,
              type: 'initial_capital',
              amount: 500,
              balance_before: before,
              balance_after: after,
              component: 'kingdom_capital',
              description: 'Vitoria na primeira batalha',
              status: 'completed',
            });
          }
          await supabase
            .from('profiles')
            .update({ first_battle_done: true, first_battle_won: true, total_wins: 1 })
            .eq('id', userId);
        } else {
          const freePieces = Array.from({ length: 6 }).map(() => ({
            user_id: userId,
            is_alive: true,
            health: 5,
            origin: 'free_recovery',
          }));
          await supabase.from('player_pieces').insert(freePieces);
          await supabase
            .from('profiles')
            .update({
              first_battle_done: true,
              first_battle_won: false,
              free_recovery_used: true,
              total_losses: 1,
            })
            .eq('id', userId);
        }
        setResult(won ? 'won' : 'lost');
        setProcessing(false);
        return;
      }

      // Conquista de reino
      if (kingdomId && won) {
        const { data: k } = await supabase
          .from('kingdoms')
          .select('owner_id, status, times_conquered, bounty_potential')
          .eq('id', kingdomId)
          .single();

        if (k && k.status === 'available') {
          await supabase
            .from('kingdoms')
            .update({
              owner_id: userId,
              times_conquered: (k.times_conquered || 0) + 1,
              status: 'available',
            })
            .eq('id', kingdomId);

          // Bounty pequeno para reward_balance
          const bounty = Number(k.bounty_potential) || 0.5;
          // Converter bounty ilustrativo em Kz virtuais (x100 para escala local)
          const rewardKz = Math.max(10, Math.round(bounty * 100));

          const { data: wallet } = await supabase
            .from('wallets')
            .select('id, reward_balance')
            .eq('user_id', userId)
            .single();

          if (wallet) {
            const before = Number(wallet.reward_balance);
            const after = before + rewardKz;
            await supabase
              .from('wallets')
              .update({ reward_balance: after })
              .eq('user_id', userId);
            await supabase.from('wallet_transactions').insert({
              wallet_id: wallet.id,
              user_id: userId,
              type: 'kingdom_conquest_reward',
              amount: rewardKz,
              balance_before: before,
              balance_after: after,
              component: 'reward_balance',
              reference_id: kingdomId,
              description: 'Conquista de reino',
              status: 'completed',
            });
          }

          const { data: profile } = await supabase
            .from('profiles')
            .select('total_wins, total_kingdoms_conquered, ranking_points')
            .eq('id', userId)
            .single();

          if (profile) {
            await supabase
              .from('profiles')
              .update({
                total_wins: (profile.total_wins || 0) + 1,
                total_kingdoms_conquered: (profile.total_kingdoms_conquered || 0) + 1,
                ranking_points: (profile.ranking_points || 0) + 10,
              })
              .eq('id', userId);
          }

          setInfo('Conquistaste ' + (kingdomName || 'o reino') + '! +' + rewardKz + ' Kz de recompensa');
        }
      } else if (kingdomId && !won) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('total_losses')
          .eq('id', userId)
          .single();
        if (profile) {
          await supabase
            .from('profiles')
            .update({ total_losses: (profile.total_losses || 0) + 1 })
            .eq('id', userId);
        }
      }

      setResult(won ? 'won' : 'lost');
      setProcessing(false);
    },
    [userId, isFirstBattle, kingdomId, kingdomName, result, processing, matchId, pvpMatch]
  );

  if (blocked) {
    return (
      <main className="nw-bg flex-1 flex flex-col items-center justify-center px-4 gap-4">
        <p className="text-amber-300 text-center text-sm max-w-sm">{blocked}</p>
        <Link href="/map/" className="nw-btn-gold px-6 py-2 text-sm">
          Voltar ao mapa
        </Link>
      </main>
    );
  }

  return (
    <main className="nw-bg flex-1 flex flex-col items-center px-3 py-4 gap-3 pb-6 max-w-lg mx-auto w-full">
      <div className="w-full flex items-center justify-between">
        <Link href="/map/" className="text-sm text-amber-500/80 hover:text-amber-400">
          ← Mapa
        </Link>
        <h1 className="nw-title text-lg">
          {isFirstBattle ? 'Primeira Batalha' : kingdomName || 'Campo de Guerra'}
        </h1>
        <div className="w-12" />
      </div>

      <div className="w-full flex items-center justify-center gap-4 py-2">
        <div className="flex flex-col items-center">
          <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-red-500 shadow-lg shadow-red-900/40">
            <Image src="/assets/pieces/angola-peao.jpg" alt="Angola" fill className="object-cover" />
          </div>
          <span className="text-[10px] text-red-300 mt-1 font-semibold">ANGOLA</span>
        </div>
        <span className="text-amber-500 font-black text-sm">VS</span>
        <div className="flex flex-col items-center">
          <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-blue-500 shadow-lg shadow-blue-900/40">
            <Image src="/assets/pieces/enemy-peao.jpg" alt="Inimigo" fill className="object-cover" />
          </div>
          <span className="text-[10px] text-blue-300 mt-1 font-semibold">INIMIGO</span>
        </div>
      </div>

      {(info || pvpInfo) && (
        <p className="text-xs text-center text-amber-200/90 bg-amber-950/50 border border-amber-800/40 px-4 py-2 rounded-xl max-w-md">
          {pvpInfo || info}
        </p>
      )}

      {canPlay && (
        <CheckersBoard
          vsComputer={!matchId}
          playerColor="red"
          onGameEnd={handleGameEnd}
          disabled={!!result || processing || (matchId && pvpMatch && pvpMatch.current_turn !== userId)}
        />
      )}

      {processing && (
        <p className="text-sm text-stone-400 animate-pulse">A processar resultado...</p>
      )}

      {result && (
        <FirstBattleResult
          won={result === 'won'}
          titleWin={isFirstBattle ? 'Vitoria!' : kingdomName ? 'Reino conquistado!' : 'Vitoria!'}
          messageWin={
            isFirstBattle
              ? 'Recebeste 500 Kz de capital para o teu reino!'
              : kingdomId
              ? 'O territorio e teu. Recompensa creditada no saldo de recompensas.'
              : 'Bom treino, guerreiro.'
          }
          titleLose="Derrota!"
          messageLose={
            isFirstBattle
              ? 'Recebeste 6 pecas de recuperacao. Tenta de novo quando quiseres.'
              : 'Nao conquistaste o reino desta vez.'
          }
          onClose={() => {
            setResult(null);
            if (isFirstBattle) window.location.href = '/wallet/';
            else if (kingdomId) window.location.href = '/kingdom/?id=' + kingdomId;
            else window.location.href = '/map/';
          }}
        />
      )}
    </main>
  );
}

export default function GamePage() {
  return (
    <Suspense
      fallback={
        <main className="nw-bg flex-1 flex items-center justify-center">
          <p className="text-stone-400">A carregar...</p>
        </main>
      }
    >
      <GameInner />
    </Suspense>
  );
}
