import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/admin.guard';
import { userGuard } from './core/guards/user.guard';
import { guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('./auth/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./layouts/admin-layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./admin/dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
      },
      {
        path: 'users',
        loadComponent: () => import('./admin/users/user-list/user-list.component').then(m => m.UserListComponent)
      },
      {
        path: 'users/:id',
        loadComponent: () => import('./admin/users/user-detail/user-detail.component').then(m => m.UserDetailComponent)
      },
      {
        path: 'loans',
        loadComponent: () => import('./admin/loans/loan-list/loan-list.component').then(m => m.LoanListComponent)
      },
      {
        path: 'loans/:id',
        loadComponent: () => import('./admin/loans/loan-detail/loan-detail.component').then(m => m.LoanDetailComponent)
      },
      {
        path: 'transactions',
        loadComponent: () => import('./admin/transactions/transactions.component').then(m => m.AdminTransactionsComponent)
      },
      {
        path: 'notifications',
        loadComponent: () => import('./admin/notifications/notifications.component').then(m => m.AdminNotificationsComponent)
      }
    ]
  },
  {
    path: 'user',
    canActivate: [userGuard],
    loadComponent: () => import('./layouts/user-layout/user-layout.component').then(m => m.UserLayoutComponent),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./user/dashboard/user-dashboard.component').then(m => m.UserDashboardComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./user/profile/profile.component').then(m => m.UserProfileComponent)
      },
      {
        path: 'take-loan',
        loadComponent: () => import('./user/take-loan/take-loan.component').then(m => m.TakeLoanComponent)
      },
      {
        path: 'loans',
        loadComponent: () => import('./user/loans/loan-list/loan-list.component').then(m => m.UserLoanListComponent)
      },
      {
        path: 'loans/:id',
        loadComponent: () => import('./user/loans/loan-detail/loan-detail.component').then(m => m.UserLoanDetailComponent)
      },
      {
        path: 'payments',
        loadComponent: () => import('./user/payments/payments.component').then(m => m.UserPaymentsComponent)
      },
      {
        path: 'transactions',
        loadComponent: () => import('./user/transactions/transactions.component').then(m => m.UserTransactionsComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
