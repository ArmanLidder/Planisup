import { Injectable } from '@angular/core';
import { ApiService } from '@app/services/api/api-service';
import { StudyPlan } from '@common/study-plan';
import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';
import { AuthentificationService } from '@app/services/authentification/authentification-service';
import { CourseStateService } from '../course-state/course-state';

@Injectable({
  providedIn: 'root'
})
export class StudyPlanService {
  constructor(
    private apiService: ApiService,
    private auth: AuthentificationService,
    private router: Router,
    private courseStateService: CourseStateService,
  ) {}

  private loadingSubject = new BehaviorSubject<boolean>(false);
  loading$ = this.loadingSubject.asObservable();

  private studyPlanSubject = new BehaviorSubject<StudyPlan|null>(null);
  studyPlan$ = this.studyPlanSubject.asObservable();

  get studyPlan(): StudyPlan | null {
    return this.studyPlanSubject.value;
  }

  loadStudyPlan(id: string, isStudent: boolean = false) {
    this.loadingSubject.next(false);
    this.apiService.getStudyPlan(id).subscribe({
      next: (plan: StudyPlan) => {
        this.studyPlanSubject.next(plan);
        if (isStudent && plan._id) this.auth.addStudyPlan(plan._id)
      },
      complete: () => {
        this.loadingSubject.next(false);
        this.router.navigate(['/view-plan']);
      }
    });
  }

  cancelStudyPlan() {
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
        }
      });
    }
  }

  approveStudyPlan() {
    this.loadingSubject.next(true);
    if (this.studyPlan?._id) {
      this.apiService.approveStudyPlan(this.studyPlan._id).subscribe({
        complete: () => {
          this.loadingSubject.next(false);
          this.router.navigate(['/accueil']);
        }
      });
    }
  }

  refuseStudyPlan() {
    this.loadingSubject.next(true);
    if (this.studyPlan?._id) {
      this.apiService.refuseStudyPlan(this.studyPlan._id).subscribe({
        complete: () => {
          this.loadingSubject.next(false);
          this.router.navigate(['/accueil']);
        }
      });
    }
  }

  updateStudyPlan() {
    this.loadingSubject.next(true);
    if (this.studyPlan) {
      const updatedPlan = {
        ...this.studyPlan,
        courseState: this.courseStateService.serializeCourseState(),
        coursesSelection: {
          modules: this.courseStateService.getSelectedCoursesByModule(),
        }
      };
      this.apiService.submitStudyPlan(this.studyPlan).subscribe({
        next: (plan: StudyPlan) => {
          this.studyPlanSubject.next(plan);
        },
        complete: () => {
          this.loadingSubject.next(false);
          this.router.navigate(['/view-plan']);
        }
      });
    }
  }

  resetPlan() {
    this.studyPlanSubject.next(null);
  }
}
