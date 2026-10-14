// ============================================
// NGOLA WAR - Motor de Damas (Regras Brasileiras)
// ============================================

import { Board, BoardPiece, Move, PieceColor, BoardPieceType } from '@/types/database';

export const BOARD_SIZE = 10;

/** Valores economicos (conforme arte do jogo) */
export const PIECE_VALUES = {
  man: 10,   // Peao
  king: 50,  // Rei / Dama
} as const;

export const PIECE_HEARTS = {
  man: 5,
  king: 5,
} as const;

export function createInitialBoard(): Board {
  const board: Board = Array(BOARD_SIZE)
    .fill(null)
    .map(() => Array(BOARD_SIZE).fill(null));

  // Oponente (azul/preto) - topo rows 0,1,2,3  (20 pecas em 10x10)
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if ((row + col) % 2 === 1) {
        board[row][col] = makePiece('black', 'man', row, col);
      }
    }
  }

  // Jogador Angola (vermelho) - fundo rows 6,7,8,9
  for (let row = 6; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if ((row + col) % 2 === 1) {
        board[row][col] = makePiece('red', 'man', row, col);
      }
    }
  }

  return board;
}

function makePiece(
  color: PieceColor,
  type: BoardPieceType,
  row: number,
  col: number
): BoardPiece {
  const hearts = PIECE_HEARTS[type];
  return {
    id: color + '-' + row + '-' + col + '-' + Math.random().toString(36).slice(2, 6),
    color,
    type,
    row,
    col,
    health: hearts,
    maxHealth: hearts,
    valueKz: PIECE_VALUES[type],
  };
}

function isValidPosition(row: number, col: number): boolean {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

/** Direcoes de movimento simples (apenas frente) para peoes */
function getManMoveDirections(color: PieceColor): [number, number][] {
  return color === 'black'
    ? [[1, -1], [1, 1]]
    : [[-1, -1], [-1, 1]];
}

/** Captura de peao: frente E tras (regra brasileira) */
const MAN_CAPTURE_DIRS: [number, number][] = [
  [-1, -1], [-1, 1], [1, -1], [1, 1],
];

const KING_DIRS: [number, number][] = [
  [-1, -1], [-1, 1], [1, -1], [1, 1],
];

export function cloneBoard(board: Board): Board {
  return board.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
}

/**
 * Movimentos de captura para peao (salto curto, todas as diagonais)
 */
function getManCaptures(
  board: Board,
  row: number,
  col: number,
  piece: BoardPiece,
  captured: { row: number; col: number }[] = []
): Move[] {
  const moves: Move[] = [];

  for (const [dRow, dCol] of MAN_CAPTURE_DIRS) {
    const eRow = row + dRow;
    const eCol = col + dCol;
    const lRow = row + dRow * 2;
    const lCol = col + dCol * 2;

    if (
      !isValidPosition(eRow, eCol) ||
      !isValidPosition(lRow, lCol) ||
      !board[eRow][eCol] ||
      board[eRow][eCol]!.color === piece.color ||
      board[lRow][lCol]
    ) {
      continue;
    }

    if (captured.some((c) => c.row === eRow && c.col === eCol)) continue;

    const newCaptures = [...captured, { row: eRow, col: eCol }];
    const becameKing =
      (piece.color === 'red' && lRow === 0) ||
      (piece.color === 'black' && lRow === BOARD_SIZE - 1);

    const temp = cloneBoard(board);
    temp[lRow][lCol] = {
      ...piece,
      row: lRow,
      col: lCol,
      type: becameKing ? 'king' : piece.type,
      valueKz: becameKing ? PIECE_VALUES.king : piece.valueKz,
      health: becameKing ? PIECE_HEARTS.king : piece.health,
      maxHealth: becameKing ? PIECE_HEARTS.king : piece.maxHealth,
    };
    temp[row][col] = null;
    temp[eRow][eCol] = null;

    // Se virou dama a meio, continua com regras de dama
    if (becameKing && piece.type === 'man') {
      const further = getKingCaptures(temp, lRow, lCol, temp[lRow][lCol]!, newCaptures);
      if (further.length > 0) {
        moves.push(...further.map((m) => ({ ...m, from: { row: piece.row, col: piece.col } })));
      } else {
        moves.push({
          from: { row: piece.row, col: piece.col },
          to: { row: lRow, col: lCol },
          captures: newCaptures,
          becameKing: true,
        });
      }
    } else {
      const further = getManCaptures(temp, lRow, lCol, temp[lRow][lCol]!, newCaptures);
      if (further.length > 0) {
        moves.push(...further.map((m) => ({ ...m, from: { row: piece.row, col: piece.col } })));
      } else {
        moves.push({
          from: { row: piece.row, col: piece.col },
          to: { row: lRow, col: lCol },
          captures: newCaptures,
          becameKing: becameKing || piece.type === 'king',
        });
      }
    }
  }

  return moves;
}

/**
 * Dama voadora (movimento longo) - captura brasileira/internacional simplificada:
 * salta sobre 1 inimigo e pousa em qualquer casa vazia a seguir na mesma diagonal
 */
function getKingCaptures(
  board: Board,
  row: number,
  col: number,
  piece: BoardPiece,
  captured: { row: number; col: number }[] = []
): Move[] {
  const moves: Move[] = [];

  for (const [dRow, dCol] of KING_DIRS) {
    let r = row + dRow;
    let c = col + dCol;
    let enemy: { row: number; col: number } | null = null;

    while (isValidPosition(r, c)) {
      if (board[r][c]) {
        if (board[r][c]!.color === piece.color) break;
        if (enemy) break; // ja encontrou inimigo
        if (captured.some((x) => x.row === r && x.col === c)) break;
        enemy = { row: r, col: c };
        r += dRow;
        c += dCol;
        continue;
      }
      if (enemy) {
        // Casa vazia apos inimigo - pouso valido
        const newCaptures = [...captured, enemy];
        const temp = cloneBoard(board);
        temp[r][c] = { ...piece, row: r, col: c };
        temp[row][col] = null;
        temp[enemy.row][enemy.col] = null;

        const further = getKingCaptures(temp, r, c, temp[r][c]!, newCaptures);
        if (further.length > 0) {
          moves.push(...further.map((m) => ({ ...m, from: { row: piece.row, col: piece.col } })));
        } else {
          moves.push({
            from: { row: piece.row, col: piece.col },
            to: { row: r, col: c },
            captures: newCaptures,
            becameKing: false,
          });
        }
      }
      r += dRow;
      c += dCol;
      if (!enemy) {
        // ainda a procurar inimigo, continua
      }
    }
  }

  return moves;
}

/** Movimentos simples (sem captura) */
function getSimpleMoves(board: Board, row: number, col: number, piece: BoardPiece): Move[] {
  const moves: Move[] = [];

  if (piece.type === 'man') {
    for (const [dRow, dCol] of getManMoveDirections(piece.color)) {
      const nr = row + dRow;
      const nc = col + dCol;
      if (isValidPosition(nr, nc) && !board[nr][nc]) {
        const becameKing =
          (piece.color === 'red' && nr === 0) ||
          (piece.color === 'black' && nr === BOARD_SIZE - 1);
        moves.push({
          from: { row, col },
          to: { row: nr, col: nc },
          becameKing,
        });
      }
    }
  } else {
    // Dama: qualquer distancia na diagonal
    for (const [dRow, dCol] of KING_DIRS) {
      let nr = row + dRow;
      let nc = col + dCol;
      while (isValidPosition(nr, nc) && !board[nr][nc]) {
        moves.push({
          from: { row, col },
          to: { row: nr, col: nc },
        });
        nr += dRow;
        nc += dCol;
      }
    }
  }

  return moves;
}

export function getPossibleMoves(board: Board, row: number, col: number): Move[] {
  const piece = board[row][col];
  if (!piece) return [];

  const captures =
    piece.type === 'king'
      ? getKingCaptures(board, row, col, piece)
      : getManCaptures(board, row, col, piece);

  if (captures.length > 0) return captures;
  return getSimpleMoves(board, row, col, piece);
}

export function getAllPossibleMoves(board: Board, color: PieceColor): Move[] {
  let all: Move[] = [];
  let hasCaptures = false;

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const piece = board[row][col];
      if (piece && piece.color === color) {
        const moves = getPossibleMoves(board, row, col);
        const caps = moves.filter((m) => m.captures && m.captures.length > 0);
        if (caps.length > 0) {
          hasCaptures = true;
          all.push(...caps);
        } else if (!hasCaptures) {
          all.push(...moves);
        }
      }
    }
  }

  if (hasCaptures) {
    return all.filter((m) => m.captures && m.captures.length > 0);
  }
  return all;
}

export function applyMove(board: Board, move: Move): Board {
  const newBoard = cloneBoard(board);
  const piece = newBoard[move.from.row][move.from.col];
  if (!piece) throw new Error('Sem peca na origem');

  if (move.captures) {
    for (const cap of move.captures) {
      newBoard[cap.row][cap.col] = null;
    }
  }

  const isKing = move.becameKing || piece.type === 'king';
  newBoard[move.to.row][move.to.col] = {
    ...piece,
    row: move.to.row,
    col: move.to.col,
    type: isKing ? 'king' : 'man',
    health: isKing ? PIECE_HEARTS.king : piece.health,
    maxHealth: isKing ? PIECE_HEARTS.king : piece.maxHealth,
    valueKz: isKing ? PIECE_VALUES.king : piece.valueKz,
  };
  newBoard[move.from.row][move.from.col] = null;

  return newBoard;
}

export function isValidMove(board: Board, move: Move, color: PieceColor): boolean {
  const possible = getAllPossibleMoves(board, color);
  return possible.some(
    (m) =>
      m.from.row === move.from.row &&
      m.from.col === move.from.col &&
      m.to.row === move.to.row &&
      m.to.col === move.to.col
  );
}

export function hasValidMoves(board: Board, color: PieceColor): boolean {
  return getAllPossibleMoves(board, color).length > 0;
}

export function countPieces(board: Board, color: PieceColor): number {
  let n = 0;
  for (const row of board) {
    for (const cell of row) {
      if (cell && cell.color === color) n++;
    }
  }
  return n;
}

export function checkWinner(
  board: Board,
  currentColor: PieceColor
): PieceColor | 'draw' | null {
  const opponent: PieceColor = currentColor === 'red' ? 'black' : 'red';
  if (countPieces(board, opponent) === 0) return currentColor;
  if (countPieces(board, currentColor) === 0) return opponent;
  if (!hasValidMoves(board, currentColor)) return opponent;
  return null;
}

/** Avaliacao posicional do tabuleiro (positivo = bom para "color") */
function evaluateBoard(board: Board, color: PieceColor): number {
  const opponent: PieceColor = color === 'red' ? 'black' : 'red';
  let score = 0;

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const p = board[row][col];
      if (!p) continue;
      const isMine = p.color === color;
      const sign = isMine ? 1 : -1;

      // Valor base
      let val = p.type === 'king' ? 50 : 10;

      // Posicao: peoes avancados valem mais
      if (p.type === 'man') {
        const progress = p.color === 'red' ? (BOARD_SIZE - 1 - row) : row;
        val += progress * 1.5;
        // Centro do tabuleiro
        if (col >= 2 && col <= BOARD_SIZE - 3) val += 1;
      } else {
        // Damas no centro e ativas
        if (row >= 2 && row <= BOARD_SIZE - 3 && col >= 2 && col <= BOARD_SIZE - 3) val += 4;
      }

      // Protecao: pecas na ultima fileira (base)
      if (p.type === 'man') {
        if ((p.color === 'red' && row === BOARD_SIZE - 1) || (p.color === 'black' && row === 0)) {
          val += 2;
        }
      }

      score += sign * val;
    }
  }

  // Mobilidade
  const myMoves = getAllPossibleMoves(board, color).length;
  const oppMoves = getAllPossibleMoves(board, opponent).length;
  score += (myMoves - oppMoves) * 0.8;

  // Bonus por capturas forcadas disponiveis
  const myCaps = getAllPossibleMoves(board, color).filter(m => m.captures && m.captures.length > 0);
  score += myCaps.length * 3;

  return score;
}

function minimax(
  board: Board,
  depth: number,
  alpha: number,
  beta: number,
  maximizing: boolean,
  aiColor: PieceColor
): number {
  const currentColor: PieceColor = maximizing ? aiColor : (aiColor === 'red' ? 'black' : 'red');
  const winner = checkWinner(board, currentColor);

  if (winner === aiColor) return 10000 + depth;
  if (winner && winner !== 'draw' && winner !== aiColor) return -10000 - depth;
  if (winner === 'draw') return 0;
  if (depth === 0) return evaluateBoard(board, aiColor);

  const moves = getAllPossibleMoves(board, currentColor);
  if (moves.length === 0) {
    return maximizing ? -10000 : 10000;
  }

  // Ordenar movimentos: capturas e coronacoes primeiro (melhor poda)
  moves.sort((a, b) => {
    const ca = (a.captures?.length || 0) * 10 + (a.becameKing ? 5 : 0);
    const cb = (b.captures?.length || 0) * 10 + (b.becameKing ? 5 : 0);
    return cb - ca;
  });

  if (maximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      const next = applyMove(board, move);
      const ev = minimax(next, depth - 1, alpha, beta, false, aiColor);
      maxEval = Math.max(maxEval, ev);
      alpha = Math.max(alpha, ev);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      const next = applyMove(board, move);
      const ev = minimax(next, depth - 1, alpha, beta, true, aiColor);
      minEval = Math.min(minEval, ev);
      beta = Math.min(beta, ev);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

/**
 * IA premium: minimax com poda alfa-beta.
 * Profundidade 4 — prever e contornar ameacas, buscar vitoria.
 */
export function getComputerMove(board: Board, color: PieceColor): Move | null {
  const moves = getAllPossibleMoves(board, color);
  if (moves.length === 0) return null;
  if (moves.length === 1) return moves[0];

  // Ordenar para explorar melhores primeiro
  moves.sort((a, b) => {
    const ca = (a.captures?.length || 0) * 10 + (a.becameKing ? 5 : 0);
    const cb = (b.captures?.length || 0) * 10 + (b.becameKing ? 5 : 0);
    return cb - ca;
  });

  let bestMove = moves[0];
  let bestScore = -Infinity;
  const depth = moves.length > 12 ? 3 : 4;

  for (const move of moves) {
    const next = applyMove(board, move);
    // Captura imediata multipla vale muito
    let score = minimax(next, depth - 1, -Infinity, Infinity, false, color);
    if (move.captures && move.captures.length > 1) score += 15 * move.captures.length;
    if (move.becameKing) score += 20;

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}

export function calculateCaptureValue(
  board: Board,
  move: Move
): { totalKz: number; pieces: { id: string; valueKz: number; color: PieceColor }[] } {
  if (!move.captures || move.captures.length === 0) {
    return { totalKz: 0, pieces: [] };
  }
  const pieces: { id: string; valueKz: number; color: PieceColor }[] = [];
  let totalKz = 0;
  for (const cap of move.captures) {
    const p = board[cap.row][cap.col];
    if (p) {
      pieces.push({ id: p.id, valueKz: p.valueKz, color: p.color });
      totalKz += p.valueKz;
    }
  }
  return { totalKz, pieces };
}

export function getArmyValue(board: Board, color: PieceColor): number {
  let t = 0;
  for (const row of board) {
    for (const cell of row) {
      if (cell && cell.color === color) t += cell.valueKz;
    }
  }
  return t;
}

export function getArmyHearts(board: Board, color: PieceColor): number {
  let t = 0;
  for (const row of board) {
    for (const cell of row) {
      if (cell && cell.color === color) t += cell.health;
    }
  }
  return t;
}
