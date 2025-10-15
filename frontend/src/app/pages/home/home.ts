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
import { MatIconModule } from '@angular/material/icon';
import { StudyPlanService } from '@app/services/study-plan/study-plan-service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, GsupButton, VerifyPlans, MatIconModule],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {
  protected degree = Object.values(Degree);
  protected role = Object.values(UserRole);
  protected readonly UserRole = UserRole;

  constructor(
    private readonly router: Router,
    private readonly pS: ProgramService,
    private readonly sPS: StudyPlanService,
    private readonly courseService: CourseService,
    public auth: AuthentificationService
  ) {}

  ngOnInit(): void {
    this.courseService.getCourses();
    this.pS.reset();
    this.sPS.resetPlan();
  }

  navigateTo(degree: string): void {
    this.router.navigate([`/${degree.toLowerCase()}`]);
  }
}
