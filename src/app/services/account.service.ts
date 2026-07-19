import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Profile, Transaction, TxnType, Wallet } from '../models/account.model';
import { CacheService } from './cache.service';

const CACHE_KEY = 'stakeout:account';

const EMPTY_PROFILE: Profile = {
  handle: '',
  displayName: '',
  email: '',
  bio: '',
  joinedAt: Date.now(),
  wins: 0,
  losses: 0,
};

interface CachedAccount {
  signedIn: boolean;
  profile: Profile;
  available: number;
  locked: number;
  txns: Transaction[];
}

@Injectable({ providedIn: 'root' })
export class AccountService {
  private readonly cache = inject(CacheService);

  readonly currency = '₦';

  private readonly cached = this.cache.get<CachedAccount>(CACHE_KEY);

  // ----- auth -----
  private readonly _signedIn = signal(this.cached?.signedIn ?? false);
  readonly signedIn = this._signedIn.asReadonly();

  // ----- profile -----
  private readonly _profile = signal<Profile>(this.cached?.profile ?? EMPTY_PROFILE);
  readonly profile = this._profile.asReadonly();

  // ----- wallet -----
  private readonly _available = signal(this.cached?.available ?? 0);
  private readonly _locked = signal(this.cached?.locked ?? 0);
  private readonly _txns = signal<Transaction[]>(this.cached?.txns ?? []);

  readonly wallet = computed<Wallet>(() => ({
    available: this._available(),
    locked: this._locked(),
    currency: this.currency,
  }));
  readonly transactions = this._txns.asReadonly();

  readonly balance = computed(() => this._available() + this._locked());

  /** Running balances, newest first, for the ledger table. */
  readonly statement = computed(() => {
    const list = [...this._txns()].sort((a, b) => a.at - b.at);
    let running = 0;
    const withBalance = list.map((t) => {
      running += t.amount;
      return { ...t, balance: running };
    });
    return withBalance.reverse();
  });

  constructor() {
    // Persist on every change so a reload within the cache window restores
    // exactly what the signed-up user was looking at.
    effect(() => {
      this.cache.set(CACHE_KEY, {
        signedIn: this._signedIn(),
        profile: this._profile(),
        available: this._available(),
        locked: this._locked(),
        txns: this._txns(),
      });
    });
  }

  // ----- actions -----
  /** Signs in only if this device already has a cached account for that email. */
  signIn(email: string): boolean {
    const account = this.cache.get<CachedAccount>(CACHE_KEY);
    if (!account || account.profile.email.toLowerCase() !== email.toLowerCase()) {
      return false;
    }
    this._profile.set(account.profile);
    this._available.set(account.available);
    this._locked.set(account.locked);
    this._txns.set(account.txns);
    this._signedIn.set(true);
    return true;
  }

  register(displayName: string, email: string, handle: string): void {
    this._profile.set({
      handle,
      displayName,
      email,
      bio: '',
      joinedAt: Date.now(),
      wins: 0,
      losses: 0,
    });
    this._available.set(0);
    this._locked.set(0);
    this._txns.set([]);
    this._signedIn.set(true);
  }

  signOut(): void {
    this._signedIn.set(false);
  }

  updateProfile(patch: Partial<Profile>): void {
    this._profile.update((p) => ({ ...p, ...patch }));
  }

  deposit(amount: number): boolean {
    if (amount <= 0) return false;
    this._available.update((v) => v + amount);
    this.record('deposit', amount, 'Bank transfer in');
    return true;
  }

  withdraw(amount: number): boolean {
    if (amount <= 0 || amount > this._available()) return false;
    this._available.update((v) => v - amount);
    this.record('withdrawal', -amount, 'Payout to bank');
    return true;
  }

  private record(type: TxnType, amount: number, memo: string): void {
    const t: Transaction = {
      id: 't_' + Math.random().toString(36).slice(2, 9),
      type,
      amount,
      memo,
      at: Date.now(),
    };
    this._txns.update((list) => [t, ...list]);
  }
}
