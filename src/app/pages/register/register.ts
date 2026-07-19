import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AccountService } from '../../services/account.service';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: '../login/auth.scss',
})
export class Register {
  private readonly account = inject(AccountService);
  private readonly router = inject(Router);

  name = signal('');
  handle = signal('');
  email = signal('');
  password = signal('');
  readonly error = signal('');

  submit(): void {
    if (this.name().trim().length < 2) {
      this.error.set('Tell us your name.');
      return;
    }
    if (this.handle().trim().length < 3) {
      this.error.set('Pick a handle of at least 3 characters.');
      return;
    }
    if (!this.email().includes('@')) {
      this.error.set('Enter a valid email.');
      return;
    }
    if (this.password().length < 6) {
      this.error.set('Use a password of at least 6 characters.');
      return;
    }
    this.account.register(
      this.name().trim(),
      this.email().trim(),
      this.handle().trim().replace(/^@/, ''),
    );
    this.router.navigate(['/']);
  }
}
