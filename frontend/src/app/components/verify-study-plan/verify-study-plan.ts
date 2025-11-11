import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { ApiService } from '@app/services/api/api-service';
import { ProgramService } from '@app/services/program/program-service';
import { SerializedCourseState, StudyPlan } from '@common/study-plan';
import { User, UserRole } from '@common/user';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTable, MatHeaderCell, MatCell, MatHeaderRow, MatRow } from '@angular/material/table';
import { MatTableModule } from '@angular/material/table';

@Component({
  selector: 'app-verify-study-plan',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatTable,
    MatHeaderCell,
    MatCell,
    MatHeaderRow,
    MatRow,
    MatTableModule,
  ],
  templateUrl: './verify-study-plan.html',
  styleUrl: './verify-study-plan.scss',
})
export class VerifyStudyPlan implements OnInit {
  @Input() studyPlan!: StudyPlan;
  public displayedColumns: string[] = [
    'sigle',
    'name',
    'module',
    'subModule',
    'trimester',
    'avantagePoly',
    'grade',
    'credits',
  ];
  public filteredCourses: SerializedCourseState[] = [];
  protected student: User | null = null;
  protected director: User | null = null;
  protected coordinator: User | null = null;
  protected codirectors: string = '';

  constructor(
    private readonly apiService: ApiService,
    protected readonly programService: ProgramService
  ) {}

  ngOnInit(): void {
    if (this.studyPlan?._id) {
      console.log(this.studyPlan);
      this.getProcessMembers(this.studyPlan._id);
      this.getCordirectorsMembers(this.studyPlan._id);
      this.getCoursesStudent();
    }
  }

  getProcessMembers(studyPlanId: string): void {
    this.apiService.getProcessMembersByIdStudyPlan(studyPlanId).subscribe({
      next: (members) => {
        members.forEach((member) => {
          if (member.role === UserRole.Etudiant) {
            this.student = member;
          } else if (member.role === UserRole.Directeur) {
            this.director = member;
          } else if (member.role === UserRole.Coordonnateur) {
            this.coordinator = member;
          }
        });
      },
    });
  }

  getCordirectorsMembers(studyPlanId: string): void {
    this.apiService.getProcessCodirectorsByIdStudyPlan(studyPlanId).subscribe({
      next: (codirectors) => {
        this.codirectors = codirectors
          .map((codirector) => `${codirector.firstName} ${codirector.lastName}`)
          .join(', ');
      },
    });
  }

  getCoursesStudent(): void {
    this.filteredCourses = Object.entries(this.studyPlan.courseState)
      .map(([key, value]) => ({
        sigle: key,
        ...value,
      }))
      .filter((course) => course.selected);
    console.log(this.filteredCourses);
  }
}
