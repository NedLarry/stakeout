import { Component, computed, inject, input, output } from '@angular/core';
import { Wager, impliedOdds, pot, Side } from '../models/wager.model';
import { LedgerService } from '../services/ledger.service';

@Component({
  selector: 'app-wager-card',
  templateUrl: './wager-card.html',
  styleUrl: './wager-card.scss',
})
export class WagerCard {
  private readonly ledger = inject(LedgerService);

  readonly wager = input.required<Wager>();
  readonly settled = output<Side>();
  readonly matched = output<void>();
  readonly watched = output<void>();

  readonly me = this.ledger.me;

  readonly odds = computed(() => impliedOdds(this.wager()));
  readonly pot = computed(() => pot(this.wager()));

  readonly isSecret = computed(() => this.wager().visibility === 'secret');
  readonly isMine = computed(() => {
    const w = this.wager();
    const me = this.me();
    return w.creator.handle === me || w.taker?.handle === me;
  });

  readonly mySide = computed(() => {
    const w = this.wager();
    const me = this.me();
    if (w.creator.handle === me) return w.creator.side;
    if (w.taker?.handle === me) return w.taker.side;
    return null;
  });

  readonly countdown = computed(() => {
    const ms = this.wager().deadline - Date.now();
    if (ms <= 0) return 'closed';
    const days = Math.floor(ms / 86_400_000);
    const hrs = Math.floor((ms % 86_400_000) / 3_600_000);
    if (days > 0) return `${days}d ${hrs}h left`;
    const mins = Math.floor((ms % 3_600_000) / 60_000);
    return `${hrs}h ${mins}m left`;
  });

  fmt(n: number): string {
    return this.wager().currency + n.toLocaleString('en-NG');
  }

  onSettle(outcome: Side): void {
    this.ledger.settle(this.wager().id, outcome);
    this.settled.emit(outcome);
  }

  onMatch(): void {
    const w = this.wager();
    // Counter-party matches the creator's stake by default.
    this.ledger.match(w.id, this.me(), w.creator.stake);
    this.matched.emit();
  }

  onWatch(): void {
    this.ledger.spectate(this.wager().id);
    this.watched.emit();
  }
}
