import { Component, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LedgerService } from '../services/ledger.service';
import { Side, Visibility, WagerKind } from '../models/wager.model';

@Component({
  selector: 'app-create-wager',
  imports: [FormsModule],
  templateUrl: './create-wager.html',
  styleUrl: './create-wager.scss',
})
export class CreateWager {
  private readonly ledger = inject(LedgerService);
  readonly closed = output<void>();

  readonly currency = this.ledger.currency;

  kind = signal<WagerKind>('challenge');
  title = signal('');
  detail = signal('');
  subject = signal('');
  side = signal<Side>('yes');
  stake = signal<number>(1000);
  visibility = signal<Visibility>('open');
  horizon = signal<'1d' | '3d' | '7d' | '14d'>('3d');

  readonly error = signal('');

  setKind(k: WagerKind) { this.kind.set(k); }
  setSide(s: Side) { this.side.set(s); }
  setVis(v: Visibility) { this.visibility.set(v); }
  setHorizon(h: '1d' | '3d' | '7d' | '14d') { this.horizon.set(h); }

  private horizonMs(): number {
    const d = { '1d': 1, '3d': 3, '7d': 7, '14d': 14 }[this.horizon()];
    return d * 86_400_000;
  }

  submit(): void {
    if (this.title().trim().length < 6) {
      this.error.set('Describe the action or event in a full, resolvable line.');
      return;
    }
    if (!this.stake() || this.stake() < 1) {
      this.error.set('Set a stake greater than zero.');
      return;
    }
    this.ledger.create({
      kind: this.kind(),
      title: this.title(),
      detail: this.detail() || 'Resolution agreed between the parties.',
      subject: this.kind() === 'challenge' ? this.subject() : undefined,
      side: this.side(),
      stake: Number(this.stake()),
      visibility: this.visibility(),
      deadlineMs: this.horizonMs(),
    });
    this.closed.emit();
  }

  cancel(): void {
    this.closed.emit();
  }
}
