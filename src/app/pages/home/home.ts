import { Component, computed, inject, signal } from '@angular/core';
import { LedgerService } from '../../services/ledger.service';
import { WagerCard } from '../../components/wager-card';
import { CreateWager } from '../../components/create-wager';

type Tab = 'live' | 'open' | 'settled' | 'mine';

@Component({
  selector: 'app-home',
  imports: [WagerCard, CreateWager],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private readonly ledger = inject(LedgerService);

  readonly me = this.ledger.me;
  readonly stats = this.ledger.stats;
  readonly currency = this.ledger.currency;

  readonly tab = signal<Tab>('live');
  readonly composing = signal(false);

  readonly counts = computed(() => {
    const me = this.me();
    return {
      live: this.ledger.live().length,
      open: this.ledger.open().length,
      settled: this.ledger.settled().length,
      mine: this.ledger.wagers().filter(
        (w) => w.creator.handle === me || w.taker?.handle === me,
      ).length,
    };
  });

  readonly list = computed(() => {
    switch (this.tab()) {
      case 'live': return this.ledger.live();
      case 'open': return this.ledger.open();
      case 'settled': return this.ledger.settled();
      case 'mine': {
        const me = this.me();
        return this.ledger.wagers().filter(
          (w) => w.creator.handle === me || w.taker?.handle === me,
        );
      }
    }
  });

  setTab(t: Tab) { this.tab.set(t); }
  openCompose() { this.composing.set(true); }
  closeCompose() { this.composing.set(false); }

  fmtStake(n: number): string {
    return this.currency + n.toLocaleString('en-NG');
  }
}
