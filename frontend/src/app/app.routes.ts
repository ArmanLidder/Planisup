import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Login } from './pages/login/login';
import { AuthGuard } from './guards/auth.guard';
import { Program } from './pages/program/program';
import { VerifyPlans } from './pages/verify-plans/verify-plans';
import { StudyPlan } from './pages/study-plan/study-plan';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'accueil', component: Home, canActivate: [AuthGuard] },
  { path: 'study-plan', component: StudyPlan },
  { path: 'verify-plans', component: VerifyPlans, canActivate: [AuthGuard] },
  { path: ':type', component: Program },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];
