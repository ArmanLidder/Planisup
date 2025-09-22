import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Login } from './pages/login/login';
import { AuthGuard } from './guards/auth.guard';
import { Program } from './pages/program/program';
import { StudyPlan } from './pages/study-plan/study-plan';
import {Admin} from '@app/pages/admin/admin';
import { ViewPlan } from './pages/view-plan/view-plan';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'accueil', component: Home, canActivate: [AuthGuard] },
  { path: 'admin', component: Admin, canActivate: [AuthGuard] }, // Add this
  { path: 'study-plan', component: StudyPlan },
  { path: 'view-plan', component: ViewPlan },
  { path: ':type', component: Program },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];
