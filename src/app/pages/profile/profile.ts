import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AccountService } from '../../services/account.service';
import { LedgerService } from '../../services/ledger.service';
import { settledCount, winRate } from '../../models/account.model';

@Component({
  selector: 'app-profile',
  imports: [FormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class ProfilePage {
  private readonly account = inject(AccountService);
  private readonly ledger = inject(LedgerService);

  readonly profile = this.account.profile;
  readonly currency = this.account.currency;

  readonly editing = signal(false);
  readonly savedNote = signal('');

  // editable buffers
  displayName = signal('');
  bio = signal('');
  email = signal('');

  readonly settled = computed(() => settledCount(this.profile()));
  readonly winRate = computed(() => winRate(this.profile()));

  readonly joined = computed(() =>
    new Date(this.profile().joinedAt).toLocaleDateString('en-NG', {
      month: 'short',
      year: 'numeric',
    }),
  );

  // Wagers this user is party to.
  readonly myWagers = computed(() =>
    this.ledger.wagers().filter(
      (w) => w.creator.handle === this.ledger.me || w.taker?.handle === this.ledger.me,
    ),
  );

  readonly activeCount = computed(
    () => this.myWagers().filter((w) => w.status === 'live' || w.status === 'matched').length,
  );

  startEdit(): void {
    const p = this.profile();
    this.displayName.set(p.displayName);
    this.bio.set(p.bio);
    this.email.set(p.email);
    this.savedNote.set('');
    this.editing.set(true);
  }

  cancel(): void {
    this.editing.set(false);
  }

  save(): void {
    this.account.updateProfile({
      displayName: this.displayName().trim() || this.profile().displayName,
      bio: this.bio().trim(),
      email: this.email().trim() || this.profile().email,
    });
    this.editing.set(false);
    this.savedNote.set('Profile updated.');
  }
}
