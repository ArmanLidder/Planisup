import { Routes } from '@angular/router';
import { Home } from '@app/pages/home/home';
import { Login } from '@app/pages/login/login';
import { AuthGuard } from '@app/guards/auth.guard';
import { Program } from '@app/pages/program/program';
import { StudyPlan } from '@app/pages/study-plan/study-plan';
import { Admin } from '@app/pages/admin/admin';
import { ViewPlan } from '@app/pages/view-plan/view-plan';
import { Search } from '@app/pages/search/search';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'accueil', component: Home, canActivate: [AuthGuard] },
  { path: 'admin', component: Admin, canActivate: [AuthGuard] },
  { path: 'rechercher-cours', component: Search, canActivate: [AuthGuard] },
  { path: 'study-plan', component: StudyPlan },
  { path: 'view-plan', component: ViewPlan },
  { path: ':type', component: Program },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];
