import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AccountService } from './services/account.service';

export const authGuard: CanActivateFn = () => {
  const account = inject(AccountService);
  const router = inject(Router);
  return account.signedIn() || router.parseUrl('/login');
};
