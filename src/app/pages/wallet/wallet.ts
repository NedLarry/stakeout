import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AccountService } from '../../services/account.service';
import { TxnType } from '../../models/account.model';

@Component({
  selector: 'app-wallet',
  imports: [FormsModule],
  templateUrl: './wallet.html',
  styleUrl: './wallet.scss',
})
export class WalletPage {
  private readonly account = inject(AccountService);

  readonly wallet = this.account.wallet;
  readonly balance = this.account.balance;
  readonly statement = this.account.statement;
  readonly currency = this.account.currency;

  readonly mode = signal<'deposit' | 'withdraw'>('deposit');
  readonly amount = signal<number>(5000);
  readonly note = signal('');

  readonly lockedPct = computed(() => {
    const total = this.balance();
    if (total === 0) return 0;
    return Math.round((this.wallet().locked / total) * 100);
  });

  fmt(n: number): string {
    const sign = n < 0 ? '-' : '';
    return sign + this.currency + Math.abs(n).toLocaleString('en-NG');
  }

  setMode(m: 'deposit' | 'withdraw') {
    this.mode.set(m);
    this.note.set('');
  }

  label(t: TxnType): string {
    return {
      deposit: 'Deposit',
      withdrawal: 'Withdrawal',
      stake: 'Stake',
      payout: 'Payout',
      refund: 'Refund',
    }[t];
  }

  submit(): void {
    const amt = Number(this.amount());
    if (this.mode() === 'deposit') {
      const ok = this.account.deposit(amt);
      this.note.set(ok ? `Added ${this.fmt(amt)} to your balance.` : 'Enter an amount above zero.');
    } else {
      const ok = this.account.withdraw(amt);
      this.note.set(
        ok
          ? `Sent ${this.fmt(amt)} to your bank.`
          : "That's more than your available balance.",
      );
    }
  }

  quick(v: number) { this.amount.set(v); }
}
