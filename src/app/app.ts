import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { AccountService } from './services/account.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly account = inject(AccountService);
  private readonly router = inject(Router);

  readonly signedIn = this.account.signedIn;
  readonly profile = this.account.profile;

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map((e) => (e as NavigationEnd).urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  // Auth pages get a bare masthead (no nav, no account chip).
  readonly isAuthPage = computed(() => {
    const u = this.url();
    return u.includes('/login') || u.includes('/register');
  });

  signOut(): void {
    this.account.signOut();
    this.router.navigate(['/login']);
  }
}
