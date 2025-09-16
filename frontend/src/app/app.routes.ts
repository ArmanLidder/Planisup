import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Login } from './pages/login/login';
import { AuthGuard } from './guards/auth.guard';
import { Program } from './pages/program/program';
//import { StudyPlan } from './pages/study-plan/study-plan';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'accueil', component: Home, canActivate: [AuthGuard] },
  { path: ':type', component: Program }, // ex: /maitrise ---> tous les maitirse de genie appraissent
  { path: ':type/:departement', component: Program }, // ex: /maitrise/genie-info ---> tout les maitrise dans genie info apparissent
  { path: ':type/:departement/:degree', component: Program }, // ex: /maitrise/genie-info/professionnelle ---> tous les options maitrise dans genie info professionnell aparissent
  { path: ':type/:departement/:degree/:option', component: Program }, // ex: /maitrise/genie-info/professionnelle/xxx ---> study plan de ali saffiche
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];
