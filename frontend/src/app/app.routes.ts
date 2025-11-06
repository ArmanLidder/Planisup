import { Routes } from '@angular/router';
import { Home } from '@app/pages/home/home';
import { Login } from '@app/pages/login/login';
import { AuthGuard } from '@app/guards/auth.guard';
import { Program } from '@app/pages/program/program';
import { StudyPlan } from '@app/pages/study-plan/study-plan';
import { Admin } from '@app/pages/admin/admin';
import { ViewPlan } from '@app/pages/view-plan/view-plan';
import { ProgramResolver } from './resolvers/program.resolver';
import { AddStudentPage } from './pages/add-student/add-student';
import { DirectorResolvers } from './resolvers/director.resolver';
import { Portal } from './pages/portal/portal';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'accueil', component: Home },
  { path: 'portail', component: Portal },
  { path: 'admin', component: Admin, canActivate: [AuthGuard] },
  {
    path: 'admin/:section',
    component: Admin,
    canActivate: [AuthGuard],
    resolve: { programs: ProgramResolver },
  },
  { path: 'study-plan', component: StudyPlan },
  { path: 'view-plan', component: ViewPlan, canActivate: [AuthGuard] },
  {
    path: 'add-student',
    component: AddStudentPage,
    canActivate: [AuthGuard],
    resolve: { dirAndCoor: DirectorResolvers },
  },
  { path: ':type', component: Program },
  { path: '', redirectTo: 'accueil', pathMatch: 'full' },
  { path: '**', redirectTo: 'accueil' },
];
