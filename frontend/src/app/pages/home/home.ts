import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GsupButton } from '@app/components/gsup-button/gsup-button';
import { Router } from '@angular/router';
import { Degree } from '@app/shared/enums/degree';
import { AuthentificationService } from '@app/services/authentification/authentification-service';
import { VerifyPlans } from '@app/components/verify-plans/verify-plans';
import { ProgramService } from '@app/services/program/program-service';
import { UserRole } from '@common/user';
import { CourseService } from '@app/services/course/course-service';
import { MatIconModule } from '@angular/material/icon'; // Add this import
import { StudyPlanStatus } from '@common/study-plan';
import { StudyPlanService } from '@app/services/study-plan/study-plan-service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    GsupButton,
    VerifyPlans,
    MatIconModule // Add this to imports
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {
  protected degree = Object.values(Degree);
  protected role = Object.values(UserRole);

  constructor(
    private router: Router,
    private pS: ProgramService,
    private sPS: StudyPlanService,
    private courseService: CourseService,
    public auth: AuthentificationService
  ) {}

  ngOnInit(): void {
    this.courseService.getCourses();
    console.log("Ng Onit")
    this.pS.reset();
    this.sPS.resetPlan();
  }

  navigateTo(degree: string): void {
    this.router.navigate([`/${degree.toLowerCase()}`]);
  }

  protected readonly UserRole = UserRole;
}
