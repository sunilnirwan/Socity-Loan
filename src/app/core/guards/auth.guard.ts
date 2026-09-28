import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAdmin()) {
    router.navigate(['/admin/dashboard']);
    return false;
  }

  if (authService.isUser()) {
    router.navigate(['/user/dashboard']);
    return false;
  }

  return true;
};
