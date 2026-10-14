// ============================================
// KINGDOM CHECKERS - Types
// ============================================

export type KingdomStatus = 'protected' | 'available' | 'in_battle';
export type MatchStatus = 'pending' | 'active' | 'finished' | 'cancelled' | 'abandoned';
export type MatchType = 'vs_computer' | 'vs_player' | 'tournament';
export type ShopCategory = 'pieces' | 'protection' | 'training' | 'cosmetics' | 'season_pass';
export type PieceType = 'normal' | 'premium' | 'special';
export type WalletComponent = 'kingdom_capital' | 'purchase_balance' | 'reward_balance' | 'reserved_balance';

export type WalletTransactionType =
  | 'deposit_confirmed'
  | 'shop_purchase'
  | 'marketplace_sale'
  | 'marketplace_purchase'
  | 'match_reward'
  | 'kingdom_conquest_reward'
  | 'refund'
  | 'withdrawal'
  | 'admin_adjustment'
  | 'initial_capital'
  | 'commission'
  | 'referral_bonus';

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  total_wins: number;
  total_losses: number;
  total_kingdoms_conquered: number;
  ranking_points: number;
  free_recovery_used: boolean;
  extra_life_used: boolean;
  is_banned: boolean;
  last_seen_at: string;
  referral_code: string | null;
  referred_by: string | null;
  total_referred: number;
}

export interface Wallet {
  id: string;
  user_id: string;
  kingdom_capital: number;
  purchase_balance: number;
  reward_balance: number;
  reserved_balance: number;
  created_at: string;
  updated_at: string;
}

export interface WalletTransaction {
  id: string;
  wallet_id: string;
  user_id: string;
  type: WalletTransactionType;
  amount: number;
  balance_before: number;
  balance_after: number;
  component: WalletComponent;
  reference_id: string | null;
  reference_type: string | null;
  description: string | null;
  status: string;
  created_at: string;
}

export interface Kingdom {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  map_x: number;
  map_y: number;
  owner_id: string | null;
  capital: number;
  level: number;
  status: KingdomStatus;
  protected_until: string | null;
  bounty_potential: number;
  times_conquered: number;
  last_income_claimed_at: string | null;
  income_per_hour: number;
  created_at: string;
  updated_at: string;
  // Joined
  owner?: Profile | null;
}

export interface PieceTemplate {
  id: string;
  name: string;
  description: string | null;
  type: PieceType;
  max_health: number;
  special_ability: string | null;
  is_cosmetic: boolean;
  shop_price: number | null;
  is_available_in_shop: boolean;
}

export interface PlayerPiece {
  id: string;
  user_id: string;
  template_id: string | null;
  is_alive: boolean;
  health: number;
  origin: 'purchased' | 'free_recovery' | 'initial' | 'reward';
  acquired_at: string;
  destroyed_at: string | null;
  destroyed_in_match_id: string | null;
  template?: PieceTemplate;
}

export interface Match {
  id: string;
  kingdom_id: string | null;
  match_type: MatchType;
  status: MatchStatus;
  challenger_id: string;
  defender_id: string | null;
  winner_id: string | null;
  board_state: any[];
  current_turn: string | null;
  move_history: any[];
  challenger_pieces: any[];
  defender_pieces: any[];
  stake_amount: number;
  challenger_stake: number;
  defender_stake: number;
  last_move_at: string | null;
  turn_deadline: string | null;
  commission_rate: number;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
}

export interface ShopProduct {
  id: string;
  name: string;
  description: string | null;
  category: ShopCategory;
  price: number;
  piece_quantity: number;
  duration_hours: number | null;
  effect_data: Record<string, any>;
  is_active: boolean;
  sort_order: number;
}

export interface ShopPurchase {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  total_price: number;
  transaction_id: string | null;
  status: string;
  created_at: string;
}

// Tabuleiro de damas
export type PieceColor = 'red' | 'black';
export type BoardPieceType = 'man' | 'king';

export interface BoardPiece {
  id: string;
  color: PieceColor;
  type: BoardPieceType;
  row: number;
  col: number;
  /** Coracoes / HP (1 = peao normal, 2 = dama) */
  health: number;
  maxHealth: number;
  /** Valor economico em Kz associado a esta peca */
  valueKz: number;
  playerPieceId?: string;
}

/** Resumo economico de uma captura */
export interface CaptureEconomy {
  pieceId: string;
  valueKz: number;
  color: PieceColor;
}

export type Board = (BoardPiece | null)[][];

export interface Move {
  from: { row: number; col: number };
  to: { row: number; col: number };
  captures?: { row: number; col: number }[];
  becameKing?: boolean;
}
