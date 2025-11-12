import { Injectable } from '@angular/core';
import { ApiService } from '@app/services/api/api-service';
import { StepValidationStatus, StudyPlan, StudyPlanStatus } from '@common/study-plan';
import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';
import { AuthentificationService } from '@app/services/authentification/authentification-service';
import { CourseStateService } from '../course-state/course-state';
import { ProgramService } from '../program/program-service';
import { ProgramType } from '@common/program';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class StudyPlanService {
  constructor(
    private readonly apiService: ApiService,
    private readonly auth: AuthentificationService,
    private readonly router: Router,
    private readonly programService: ProgramService,
    private readonly courseStateService: CourseStateService,
    private readonly dialog: MatDialog,
  ) {}

  private readonly loadingSubject = new BehaviorSubject<boolean>(false);
  loading$ = this.loadingSubject.asObservable();

  private readonly studyPlanSubject = new BehaviorSubject<StudyPlan | null>(null);
  studyPlan$ = this.studyPlanSubject.asObservable();

  private readonly STORAGE_KEY = 'current_study_plan';

  get studyPlan(): StudyPlan | null {
    return this.studyPlanSubject.value;
  }

  loadStudyPlan(id: string, isStudent: boolean = false): void {
    this.loadingSubject.next(true); // Should be true when starting
    this.apiService.getStudyPlan(id).subscribe({
      next: (plan: StudyPlan) => {
        // Use the setter to also persist to localStorage
        this.studyPlan = plan;
        if (isStudent && plan._id) this.auth.addStudyPlan(plan._id);
      },
      complete: () => {
        this.loadingSubject.next(false);
        this.router.navigate(['/view-plan']);
      },
    });
  }

  set studyPlan(plan: StudyPlan | null) {
    this.studyPlanSubject.next(plan);
    if (plan) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(plan));
    } else {
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }

  restoreFromStorage(): void {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        const plan = JSON.parse(stored) as StudyPlan;
        this.studyPlanSubject.next(plan);
      } catch (error) {
        console.error('Error restoring study plan from storage:', error);
        localStorage.removeItem(this.STORAGE_KEY);
      }
    }
  }

  cancelStudyPlan(): void {
    this.loadingSubject.next(true);
    if (this.studyPlan?._id) {
      this.apiService.cancelStudyPlan(this.studyPlan._id).subscribe({
        next: () => {
          this.auth.addStudyPlan('');
          this.studyPlanSubject.next(null);
        },
        error: (err) => {
          console.error('Cancel failed:', err);
        },
        complete: () => {
          this.loadingSubject.next(false);
          this.router.navigate(['/accueil']);
        },
      });
    }
  }

  approveStudyPlan(): void {
    this.loadingSubject.next(true);
    if (this.studyPlan?._id && this.auth.currentUser?._id) {
      this.apiService.approveStudyPlan(this.studyPlan._id, this.auth.currentUser?._id).subscribe({
        complete: () => {
          this.loadingSubject.next(false);
          this.router.navigate(['/accueil']);
        },
      });
    }
  }

  refuseStudyPlan(): void {
    this.loadingSubject.next(true);
    if (this.studyPlan?._id) {
      this.apiService.refuseStudyPlan(this.studyPlan._id).subscribe({
        complete: () => {
          this.loadingSubject.next(false);
          this.router.navigate(['/accueil']);
        },
      });
    }
  }

  private async alertPopUp(text: string): Promise<boolean> {
    const { GsupDialog } = await import('@app/components/gsup-dialog/gsup-dialog');
    const dialogRef = this.dialog.open(GsupDialog, {
      data: {
        message: text,
        firstButton: 'Ok',
        hideCancel: true,
      },
    });
    const result = await firstValueFrom(dialogRef.afterClosed());
    return !!result;
  }

  updateStudyPlan(): void {
    this.loadingSubject.next(true);
    if (this.studyPlan) {
      const updatedPlan = {
        ...this.studyPlan,
        courseState: this.courseStateService.serializeCourseState(),
        coursesSelection: {
          modules: this.courseStateService.getSelectedCoursesByModule(),
        },
      };
      this.apiService.submitStudyPlan(updatedPlan).subscribe({
        next: (plan: StudyPlan) => {
          this.studyPlanSubject.next(plan);
        },
        complete: () => {
          this.loadingSubject.next(false);
          this.router.navigate(['/view-plan']);
        },
      });
    }
  }

  needsCorrectionStudyPlan(): boolean {
    return this.studyPlan?.stepValidation === StepValidationStatus.NEEDS_CORRECTION;
  }

  resetStudyPlan() {
    localStorage.removeItem(this.STORAGE_KEY);
    this.studyPlanSubject.next(null);
  }

  studyPlanStatusLive(): boolean {
    return this.studyPlan?.status === StudyPlanStatus.LIVE;
  }

  studyPlanStatusCancelled(): boolean {
    return this.studyPlan?.status === StudyPlanStatus.CANCELLED;
  }

  studyPlanStatusValidated(): boolean {
    return this.studyPlan?.status === StudyPlanStatus.VALIDATED;
  }

  isProgramMaster(): boolean {
    return this.programService?.type === ProgramType.MASTER;
  }

  isProgramDESS(): boolean {
    return this.programService?.type === ProgramType.DESS;
  }

  isProgramPHD(): boolean {
    return this.programService?.type === ProgramType.PHD;
  }
}
