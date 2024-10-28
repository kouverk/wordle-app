// auth.guard.ts
import { inject } from '@angular/core';
import { CanMatchFn } from '@angular/router';
import { AuthService } from './services/auth.service';
import { Router } from '@angular/router';

export const authGuard: CanMatchFn = (route, segments) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.userIsLoggedIn()) {
    return true; // Allow access if logged in
  }

  // Redirect to login if not logged in
  router.navigate(['/login']);
  return false;
};
