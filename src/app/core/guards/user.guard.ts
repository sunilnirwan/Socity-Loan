import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

export const userGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toast = inject(ToastService);

  if (authService.isUser()) {
    return true;
  }

  if (authService.isAdmin()) {
    toast.info('Redirecting to Admin Portal.', 'Admin Active');
    router.navigate(['/admin/dashboard']);
    return false;
  }

  toast.warning('Please log in as a Member to access this portal.', 'Authentication Required');
  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};
