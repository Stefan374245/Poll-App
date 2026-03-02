import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout';
import { HomeComponent } from './features/home/home';
import { SurveyDetailComponent } from './features/survey-detail/survey-detail';
import { SurveyCreateComponent } from './features/survey-create/survey-create';
import { LoginComponent } from './auth/login/login';

/**
 * Route data interface for header and body configuration
 */
export interface RouteData {
  hideHeader?: boolean;
  showWhiteHeader?: boolean;
  bodyBgWhite?: boolean;
}

/**
 * Application Routes with MainLayout Wrapper
 * All routes wrapped in MainLayoutComponent for consistent body background control
 */
export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: '',
        component: HomeComponent,
      },
      {
        path: 'survey/:id',
        component: SurveyDetailComponent,
        data: { showWhiteHeader: true, bodyBgWhite: true } as RouteData,
      },
      {
        path: 'create',
        component: SurveyCreateComponent,
        data: { hideHeader: true, bodyBgWhite: true } as RouteData,
      },
      {
        path: 'login',
        component: LoginComponent,
        data: { hideHeader: true, bodyBgWhite: true } as RouteData,
      },
      {
        path: '**',
        redirectTo: '',
      },
    ],
  },
];
