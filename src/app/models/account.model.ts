export interface Profile {
  handle: string;
  displayName: string;
  email: string;
  bio: string;
  joinedAt: number;
  // Public reputation — settled record.
  wins: number;
  losses: number;
}

export type TxnType = 'deposit' | 'withdrawal' | 'stake' | 'payout' | 'refund';

export interface Transaction {
  id: string;
  type: TxnType;
  amount: number; // positive = credit, negative = debit
  memo: string;
  at: number;
  // running balance is derived, not stored
}

export interface Wallet {
  available: number; // spendable
  locked: number;    // tied up in live wagers
  currency: string;
}

export function settledCount(p: Profile): number {
  return p.wins + p.losses;
}

export function winRate(p: Profile): number {
  const total = settledCount(p);
  if (total === 0) return 0;
  return Math.round((p.wins / total) * 100);
}
