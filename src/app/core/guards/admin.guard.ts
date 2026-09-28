import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toast = inject(ToastService);

  if (authService.isAdmin()) {
    return true;
  }

  if (authService.isUser()) {
    toast.warning('Access restricted. Admin privileges required.', 'Unauthorized');
    router.navigate(['/user/dashboard']);
    return false;
  }

  toast.warning('Please log in as an Admin to access this page.', 'Authentication Required');
  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};
