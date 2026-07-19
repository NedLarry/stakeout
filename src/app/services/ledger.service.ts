import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Wager, Side, WagerKind, Visibility, Status } from '../models/wager.model';
import { CacheService } from './cache.service';
import { AccountService } from './account.service';

const CACHE_KEY = 'stakeout:ledger';

export interface NewWagerInput {
  kind: WagerKind;
  title: string;
  detail: string;
  subject?: string;
  side: Side;
  stake: number;
  visibility: Visibility;
  deadlineMs: number;
}

@Injectable({ providedIn: 'root' })
export class LedgerService {
  private readonly cache = inject(CacheService);
  private readonly account = inject(AccountService);

  // Current user — the signed-in account's own handle.
  readonly me = computed(() => this.account.profile().handle);
  readonly currency = '₦';

  private readonly _wagers = signal<Wager[]>(this.cache.get<Wager[]>(CACHE_KEY) ?? []);
  readonly wagers = this._wagers.asReadonly();

  readonly open = computed(() =>
    this._wagers().filter((w) => w.status === 'open'),
  );
  readonly live = computed(() =>
    this._wagers().filter((w) => w.status === 'matched' || w.status === 'live'),
  );
  readonly settled = computed(() =>
    this._wagers().filter((w) => w.status === 'settled' || w.status === 'void'),
  );

  readonly stats = computed(() => {
    const all = this._wagers();
    const me = this.me();
    const mine = all.filter(
      (w) => w.creator.handle === me || w.taker?.handle === me,
    );
    const staked = mine.reduce((sum, w) => {
      if (w.creator.handle === me) return sum + w.creator.stake;
      if (w.taker?.handle === me) return sum + (w.taker?.stake ?? 0);
      return sum;
    }, 0);
    return { active: this.live().length, mine: mine.length, staked };
  });

  constructor() {
    // Persist on every change so a reload within the cache window restores
    // exactly what the signed-up user was looking at.
    effect(() => {
      this.cache.set(CACHE_KEY, this._wagers());
    });
  }

  create(input: NewWagerInput): void {
    const now = Date.now();
    const w: Wager = {
      id: cryptoId(),
      kind: input.kind,
      title: input.title.trim(),
      detail: input.detail.trim(),
      subject: input.subject?.trim() || undefined,
      creator: { handle: this.me(), side: input.side, stake: input.stake },
      visibility: input.visibility,
      spectators: input.visibility === 'open' ? 0 : 0,
      currency: this.currency,
      deadline: now + input.deadlineMs,
      createdAt: now,
      status: 'open',
    };
    this._wagers.update((list) => [w, ...list]);
  }

  /** Take the opposite side of an open wager. */
  match(id: string, handle: string, stake: number): void {
    this._wagers.update((list) =>
      list.map((w) => {
        if (w.id !== id || w.status !== 'open') return w;
        const takerSide: Side = w.creator.side === 'yes' ? 'no' : 'yes';
        return {
          ...w,
          taker: { handle, side: takerSide, stake },
          status: 'matched' as Status,
        };
      }),
    );
  }

  /** Resolve a matched wager to an outcome. */
  settle(id: string, outcome: Side): void {
    this._wagers.update((list) =>
      list.map((w) =>
        w.id === id && (w.status === 'matched' || w.status === 'live')
          ? { ...w, status: 'settled' as Status, resolvedTo: outcome }
          : w,
      ),
    );
  }

  spectate(id: string): void {
    this._wagers.update((list) =>
      list.map((w) =>
        w.id === id && w.visibility === 'open'
          ? { ...w, spectators: w.spectators + 1 }
          : w,
      ),
    );
  }
}

function cryptoId(): string {
  return 'w_' + Math.random().toString(36).slice(2, 9);
}
