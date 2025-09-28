import { Injectable } from '@angular/core';
import { ApiService } from '@app/services/api/api-service';
import { StudyPlan } from '@common/study-plan';
import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';
import { AuthentificationService } from '@app/services/authentification/authentification-service';

@Injectable({
  providedIn: 'root'
})
export class StudyPlanService {
  constructor(
    private apiService: ApiService,
    private auth: AuthentificationService,
    private router: Router,
  ) {}
  public studyPlan: StudyPlan | null = null;

  private loadingSubject = new BehaviorSubject<boolean>(false);
  loading$ = this.loadingSubject.asObservable();

  loadStudyPlan(id: string, isStudent: boolean = false) {
    this.loadingSubject.next(false);
    this.apiService.getStudyPlan(id).subscribe({
      next: (plan: StudyPlan) => {
        this.studyPlan = plan;
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
          this.studyPlan = null;
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

  refuseStudyPlan(id: string) {
  }

  resetPlan() {
    this.studyPlan = null;
  }
}
