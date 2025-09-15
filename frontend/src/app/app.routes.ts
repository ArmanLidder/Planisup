import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Login } from './pages/login/login';
import { AuthGuard } from './guards/auth.guard';
import { Program } from './pages/program/program';
//import { StudyPlan } from './pages/study-plan/study-plan';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'accueil', component: Home, canActivate: [AuthGuard] },
  { path: ':type', component: Program }, // ex: /maitrise
  { path: ':type/:discipline', component: Program }, // ex: /maitrise/genie-info
  { path: ':type/:discipline/:module', component: Program }, // ex: /maitrise/genie-info/professionnelle
  /*{ path: 'plan', component: StudyPlan, canActivate: [AuthGuard] },
  { path: 'dess', component: StudyPlan, canActivate: [AuthGuard] },
  { path: 'maitrise', component: StudyPlan, canActivate: [AuthGuard] },
  { path: 'doctorat', component: StudyPlan, canActivate: [AuthGuard] },*/
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];
