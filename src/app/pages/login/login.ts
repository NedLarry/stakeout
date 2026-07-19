import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AccountService } from '../../services/account.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './auth.scss',
})
export class Login {
  private readonly account = inject(AccountService);
  private readonly router = inject(Router);

  email = signal('');
  password = signal('');
  readonly error = signal('');

  submit(): void {
    if (!this.email().includes('@')) {
      this.error.set('Enter the email you signed up with.');
      return;
    }
    if (this.password().length < 4) {
      this.error.set('Your password is at least 4 characters.');
      return;
    }
    // Demo: password isn't checked — accounts only live in this browser's
    // 30-minute cache, so signing in just means "found on this device".
    const ok = this.account.signIn(this.email().trim());
    if (!ok) {
      this.error.set('No account found on this device. Create one first — it stays cached for 30 minutes.');
      return;
    }
    this.router.navigate(['/']);
  }
}
