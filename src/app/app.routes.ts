import { Routes } from '@angular/router';

/** Application routes with lazy loading for best performance. */
export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/home/home').then(m => m.HomeComponent),
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./features/survey-create/survey-create').then(m => m.SurveyCreateComponent),
  },
  {
    path: 'survey/:id',
    loadComponent: () =>
      import('./features/survey-detail/survey-detail').then(m => m.SurveyDetailComponent),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./auth/login/login').then(m => m.LoginComponent),
  },
  {
    path: 'signup',
    loadComponent: () =>
      import('./auth/signup/signup').then(m => m.SignupComponent),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
