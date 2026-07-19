export type WagerKind = 'event' | 'challenge';
// 'event': betting on whether some external action/event happens.
// 'challenge': one user dares another to perform (or not perform) an action.

export type Visibility = 'open' | 'private' | 'secret';
// 'open'    : anyone can spectate and see both parties.
// 'private' : only the two parties can see it; no spectators.
// 'secret'  : private AND the target may not even know they're being bet on
//             (rendered redacted in the public ledger).

export type Side = 'yes' | 'no';
// 'yes' = the action/event WILL happen. 'no' = it will NOT.

export type Status = 'open' | 'matched' | 'live' | 'settled' | 'void';

export interface Party {
  handle: string;
  side: Side;
  stake: number; // in the wager's currency units
}

export interface Wager {
  id: string;
  kind: WagerKind;
  title: string;         // the action/event, phrased as a resolvable statement
  detail: string;        // resolution criteria — how we know yes vs no
  subject?: string;      // for challenges: who must perform the action
  creator: Party;        // the side the creator took
  taker?: Party;         // the counter-party, once matched
  visibility: Visibility;
  spectators: number;    // count of watchers (open wagers only)
  currency: string;      // e.g. '₦'
  deadline: number;      // epoch ms — when it resolves
  createdAt: number;
  status: Status;
  resolvedTo?: Side;     // filled once settled
}

export function impliedOdds(w: Wager): { yes: number; no: number } {
  // Belief split derived from staked capital on each side.
  const yesStake =
    (w.creator.side === 'yes' ? w.creator.stake : 0) +
    (w.taker?.side === 'yes' ? w.taker.stake : 0);
  const noStake =
    (w.creator.side === 'no' ? w.creator.stake : 0) +
    (w.taker?.side === 'no' ? w.taker.stake : 0);
  const total = yesStake + noStake;
  if (total === 0) return { yes: 50, no: 50 };
  return {
    yes: Math.round((yesStake / total) * 100),
    no: Math.round((noStake / total) * 100),
  };
}

export function pot(w: Wager): number {
  return w.creator.stake + (w.taker?.stake ?? 0);
}
