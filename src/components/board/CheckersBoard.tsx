'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Board, Move, PieceColor } from '@/types/database';
import {
  createInitialBoard,
  getPossibleMoves,
  applyMove,
  getAllPossibleMoves,
  checkWinner,
  getComputerMove,
  calculateCaptureValue,
  getArmyValue,
  getArmyHearts,
  BOARD_SIZE,
} from '@/lib/checkers-engine';
import {
  soundMove,
  soundCapture,
  soundKing,
  soundWin,
  soundLose,
} from '@/lib/sounds';
import { IconHeart, IconCrown } from '@/components/ui/Icons';

interface CombatFx {
  id: string;
  row: number;
  col: number;
  kind: 'burst' | 'float' | 'flash' | 'crown' | 'dest';
  text?: string;
}

interface CheckersBoardProps {
  playerColor?: PieceColor;
  vsComputer?: boolean;
  onGameEnd?: (winner: PieceColor | 'draw') => void;
  disabled?: boolean;
}

export default function CheckersBoard({
  playerColor = 'red',
  vsComputer = true,
  onGameEnd,
  disabled = false,
}: CheckersBoardProps) {
  const [board, setBoard] = useState<Board>(() => createInitialBoard());
  const [themeColors, setThemeColors] = useState({ dark: '#8B5E34', light: '#E8D5A8' });

  useEffect(() => {
    try {
      const t = localStorage.getItem('nw_board_theme') || 'classic';
      const themes: Record<string, { dark: string; light: string }> = {
        classic: { dark: '#8B5E34', light: '#E8D5A8' },
        night: { dark: '#1e293b', light: '#334155' },
        royal: { dark: '#78350f', light: '#fbbf24' },
        emerald: { dark: '#064e3b', light: '#a7f3d0' },
      };
      setThemeColors(themes[t] || themes.classic);
    } catch {}
  }, []);
  const [currentTurn, setCurrentTurn] = useState<PieceColor>('red');
  const [selected, setSelected] = useState<{ row: number; col: number } | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<Move[]>([]);
  const [winner, setWinner] = useState<PieceColor | 'draw' | null>(null);
  const [message, setMessage] = useState('A tua vez — Angola');
  const [combatLog, setCombatLog] = useState<string | null>(null);
  const [playerScore, setPlayerScore] = useState(0);
  const [enemyScore, setEnemyScore] = useState(0);
  const [fx, setFx] = useState<CombatFx[]>([]);
  const [shaking, setShaking] = useState(false);
  const [hitPiece, setHitPiece] = useState<string | null>(null);
  const [slidePiece, setSlidePiece] = useState<string | null>(null);
  const [crownPiece, setCrownPiece] = useState<string | null>(null);
  const fxId = useRef(0);

  const computerColor: PieceColor = playerColor === 'red' ? 'black' : 'red';
  const playerHearts = getArmyHearts(board, playerColor);
  const enemyHearts = getArmyHearts(board, computerColor);
  const playerValue = getArmyValue(board, playerColor);
  const enemyValue = getArmyValue(board, computerColor);

  const spawnFx = useCallback((items: Omit<CombatFx, 'id'>[]) => {
    const stamped = items.map((item) => {
      fxId.current += 1;
      return { ...item, id: 'fx-' + fxId.current };
    });
    setFx((prev) => [...prev, ...stamped]);
    setTimeout(() => {
      setFx((prev) => prev.filter((f) => !stamped.find((s) => s.id === f.id)));
    }, 1000);
  }, []);

  const playMove = useCallback(
    (currentBoard: Board, move: Move, color: PieceColor): Board => {
      const economy = calculateCaptureValue(currentBoard, move);
      const isCapture = economy.totalKz > 0;

      // Som
      if (isCapture) soundCapture();
      else soundMove();

      // Destino a brilhar
      spawnFx([{ row: move.to.row, col: move.to.col, kind: 'dest' }]);

      if (isCapture && move.captures) {
        setShaking(true);
        setTimeout(() => setShaking(false), 350);

        const effects: Omit<CombatFx, 'id'>[] = [];
        for (const cap of move.captures) {
          effects.push({ row: cap.row, col: cap.col, kind: 'flash' });
          effects.push({ row: cap.row, col: cap.col, kind: 'burst' });
        }
        effects.push({
          row: move.to.row,
          col: move.to.col,
          kind: 'float',
          text: '+' + economy.totalKz + ' Kz',
        });
        spawnFx(effects);

        const attacker = currentBoard[move.from.row][move.from.col];
        if (attacker) {
          setHitPiece(attacker.id);
          setTimeout(() => setHitPiece(null), 400);
        }

        setCombatLog('Combate! +' + economy.totalKz + ' Kz');
        setTimeout(() => setCombatLog(null), 1600);

        if (color === playerColor) setPlayerScore((s) => s + economy.totalKz);
        else setEnemyScore((s) => s + economy.totalKz);
      }

      const newBoard = applyMove(currentBoard, move);
      const moved = newBoard[move.to.row][move.to.col];

      // Animacao de deslize
      if (moved) {
        setSlidePiece(moved.id);
        setTimeout(() => setSlidePiece(null), 300);
      }

      // Coroacao de dama
      if (move.becameKing && moved) {
        soundKing();
        setCrownPiece(moved.id);
        spawnFx([
          { row: move.to.row, col: move.to.col, kind: 'crown', text: 'REI!' },
        ]);
        setCombatLog('Coroacao! A peca tornou-se Rei');
        setTimeout(() => {
          setCrownPiece(null);
          setCombatLog(null);
        }, 1200);
      }

      return newBoard;
    },
    [playerColor, spawnFx]
  );

  const finishIfNeeded = useCallback(
    (b: Board, colorJustMoved: PieceColor) => {
      const result = checkWinner(b, colorJustMoved);
      if (result) {
        setWinner(result);
        if (result === playerColor) {
          setMessage('Vitoria de Angola!');
          soundWin();
        } else if (result === 'draw') {
          setMessage('Empate!');
        } else {
          setMessage('Derrota...');
          soundLose();
        }
        onGameEnd?.(result);
        return true;
      }
      return false;
    },
    [playerColor, onGameEnd]
  );

  const handleSquareClick = useCallback(
    (row: number, col: number) => {
      if (disabled || winner || currentTurn !== playerColor) return;
      const piece = board[row][col];

      if (piece && piece.color === playerColor) {
        const moves = getPossibleMoves(board, row, col);
        const allMoves = getAllPossibleMoves(board, playerColor);
        const hasCaptures = allMoves.some((m) => m.captures && m.captures.length > 0);
        setSelected({ row, col });
        setPossibleMoves(
          hasCaptures ? moves.filter((m) => m.captures && m.captures.length > 0) : moves
        );
        return;
      }

      if (!selected) return;

      const move = possibleMoves.find((m) => m.to.row === row && m.to.col === col);
      if (!move) {
        setSelected(null);
        setPossibleMoves([]);
        return;
      }

      const newBoard = playMove(board, move, playerColor);
      setBoard(newBoard);
      setSelected(null);
      setPossibleMoves([]);

      if (finishIfNeeded(newBoard, playerColor)) return;

      setCurrentTurn(computerColor);
      setMessage('Oponente a pensar...');

      setTimeout(() => {
        const cm = getComputerMove(newBoard, computerColor);
        if (!cm) {
          setWinner(playerColor);
          setMessage('Vitoria de Angola!');
          soundWin();
          onGameEnd?.(playerColor);
          return;
        }
        const after = playMove(newBoard, cm, computerColor);
        setBoard(after);
        if (!finishIfNeeded(after, computerColor)) {
          setCurrentTurn(playerColor);
          setMessage('A tua vez — Angola');
        }
      }, 800);
    },
    [
      board, selected, possibleMoves, currentTurn, playerColor, computerColor,
      winner, disabled, playMove, finishIfNeeded, onGameEnd,
    ]
  );

  const isPossibleTarget = (r: number, c: number) =>
    possibleMoves.some((m) => m.to.row === r && m.to.col === c);

  const resetGame = () => {
    setBoard(createInitialBoard());
    setCurrentTurn('red');
    setSelected(null);
    setPossibleMoves([]);
    setWinner(null);
    setMessage('A tua vez — Angola');
    setCombatLog(null);
    setPlayerScore(0);
    setEnemyScore(0);
    setFx([]);
  };

  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-md">
      {/* Painel */}
      <div className="w-full grid grid-cols-2 gap-2 text-xs">
        <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-700/50">
          <p className="text-red-300 font-semibold">Angola (Tu)</p>
          <p className="text-white text-[11px]">
            {'❤️'.repeat(Math.min(Math.ceil(playerHearts / 5), 6))}
            <span className="text-slate-400 ml-1">{playerHearts} HP</span>
          </p>
          <p className="text-amber-400 mt-0.5">Exercito {playerValue} Kz</p>
          <p className="text-green-400">Capturado +{playerScore} Kz</p>
        </div>
        <div className="p-2.5 rounded-xl bg-blue-950/50 border border-blue-800/50">
          <p className="text-blue-300 font-semibold">Oponente</p>
          <p className="text-white text-[11px]">
            {'💙'.repeat(Math.min(Math.ceil(enemyHearts / 5), 6))}
            <span className="text-slate-400 ml-1">{enemyHearts} HP</span>
          </p>
          <p className="text-amber-400 mt-0.5">Exercito {enemyValue} Kz</p>
          <p className="text-red-400">Capturado +{enemyScore} Kz</p>
        </div>
      </div>

      <div className="text-sm text-slate-300 font-medium h-5">
        {combatLog ? (
          <span className="text-amber-300 font-bold">{combatLog}</span>
        ) : (
          message
        )}
      </div>

      {/* Tabuleiro estilo madeira / Mandeita */}
      <div
        className={
          'relative grid gap-0 rounded-xl overflow-hidden shadow-2xl border-4 border-amber-800/80' +
          (shaking ? ' nw-shake' : '')
        }
        style={{
          gridTemplateColumns: 'repeat(' + BOARD_SIZE + ', minmax(0, 1fr))',
          width: 'min(92vw, 400px)',
          aspectRatio: '1',
          background: 'linear-gradient(145deg, #5c3d1e 0%, #3d2810 100%)',
        }}
      >
        {board.map((row, rowIdx) =>
          row.map((cell, colIdx) => {
            const isDark = (rowIdx + colIdx) % 2 === 1;
            const isSelected = selected?.row === rowIdx && selected?.col === colIdx;
            const isTarget = isPossibleTarget(rowIdx, colIdx);
            const cellFx = fx.filter((f) => f.row === rowIdx && f.col === colIdx);

            return (
              <button
                key={rowIdx + '-' + colIdx}
                onClick={() => handleSquareClick(rowIdx, colIdx)}
                disabled={disabled || !!winner}
                style={{ backgroundColor: isDark ? themeColors.dark : themeColors.light }}
                className={
                  'relative flex items-center justify-center overflow-visible ' +
                  (isSelected ? 'ring-2 ring-inset ring-yellow-400 ' : '') +
                  (isTarget ? 'ring-2 ring-inset ring-emerald-400 ' : '') +
                  (!disabled && !winner ? 'cursor-pointer' : 'cursor-default')
                }
              >
                {cellFx.some((f) => f.kind === 'flash' || f.kind === 'dest') && (
                  <span className="absolute inset-0 nw-flash z-10" />
                )}
                {cellFx.some((f) => f.kind === 'burst') && (
                  <span className="absolute z-20 w-6 h-6 rounded-full bg-orange-400/80 nw-burst" />
                )}
                {cellFx
                  .filter((f) => (f.kind === 'float' || f.kind === 'crown') && f.text)
                  .map((f) => (
                    <span
                      key={f.id}
                      className={
                        'absolute z-30 text-[11px] font-bold whitespace-nowrap drop-shadow-lg ' +
                        (f.kind === 'crown'
                          ? 'text-yellow-300 nw-crown'
                          : 'text-amber-300 nw-float-up')
                      }
                    >
                      {f.kind === 'crown' ? '👑 ' + f.text : f.text}
                    </span>
                  ))}

                {cell && (
                  <div
                    className={
                      'relative w-[78%] h-[78%] rounded-full shadow-lg z-[5] overflow-hidden border-2 ' +
                      (cell.color === 'red' ? 'border-red-400 ' : 'border-blue-400 ') +
                      (cell.type === 'king' ? 'ring-2 ring-yellow-400 ' : '') +
                      (hitPiece === cell.id ? 'nw-piece-hit ' : '') +
                      (slidePiece === cell.id ? 'nw-slide-in ' : '') +
                      (crownPiece === cell.id ? 'nw-king-glow nw-crown ' : '')
                    }
                  >
                    <Image
                      src={
                        cell.color === 'red'
                          ? (cell.type === 'king' ? '/assets/pieces/angola-rei.jpg' : '/assets/pieces/angola-peao.jpg')
                          : (cell.type === 'king' ? '/assets/pieces/enemy-rei.jpg' : '/assets/pieces/enemy-peao.jpg')
                      }
                      alt={cell.type}
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                    <span className="absolute bottom-0 inset-x-0 text-center text-[6px] leading-none bg-black/50 py-0.5">
                      <span className="flex gap-0.5 justify-center mt-0.5">
                        {Array.from({ length: Math.min(cell.health, 5) }).map((_, i) => (
                          <IconHeart key={i} size={8} className={cell.color === 'red' ? 'text-red-400' : 'text-blue-400'} />
                        ))}
                      </span>
                    </span>
                  </div>
                )}
              </button>
            );
          })
        )}
      </div>

      <p className="text-[10px] text-slate-500 text-center leading-relaxed">
        Peao 10 Kz · Rei 50 Kz · 5 coracoes · Captura obrigatoria · Dama voadora
        <br />
        Regras brasileiras · Captura para tras permitida
      </p>

      {winner && (
        <button
          onClick={resetGame}
          className="px-6 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold"
        >
          Jogar novamente
        </button>
      )}
    </div>
  );
}
