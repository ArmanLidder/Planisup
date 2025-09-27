import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Progress } from "@app/components/gsup-progress-bar/progress";
import { ProgressHelperService } from '@app/components/gsup-progress-bar/progress-helper.service';
import { ProgressStepModel } from '@app/components/gsup-progress-bar/uiHelper';
import { ChatComponent } from '@app/components/chat/chat.component';
import { StudyPlan, StudyPlanStatus, StudyPlanStep, StepValidationStatus } from '@common/study-plan';
import { ApiService } from '@app/services/api/api-service';
import { ActivatedRoute } from '@angular/router';
import { AuthentificationService } from '@app/services/authentification/authentification-service';

@Component({
  selector: 'app-view-plan',
  standalone: true,
  imports: [Progress, ChatComponent, CommonModule],
  templateUrl: './view-plan.html',
  styleUrl: './view-plan.scss',
})
export class ViewPlan implements OnInit {
  open = signal(false);
  studyPlan: StudyPlan | null = null;
  isLoading = signal(true);
  error = signal<string | null>(null);

  constructor(
    private readonly progressHelper: ProgressHelperService, 
    private readonly apiService: ApiService,
    private readonly route: ActivatedRoute,
    private readonly authService: AuthentificationService,
  ) {}

  ngOnInit(): void {
    this.loadStudyPlan();
  }

  private loadStudyPlan(): void {
    try {
      this.isLoading.set(true);
      this.error.set(null);

      const studyPlanId = this.route.snapshot.paramMap.get('id');
      
      this.apiService.getStudyPlan(this.authService.currentUser?.currentPlan || "").subscribe({
        next: (studyPlan) => {
          this.studyPlan = studyPlan;
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error loading study plan:', error);
          this.error.set('Erreur lors du chargement du plan d\'étude');
          this.isLoading.set(false);
        }
      });
    } catch (error) {
      console.error('Error loading study plan:', error);
      this.error.set('Erreur lors du chargement du plan d\'étude');
      this.isLoading.set(false);
    }
  }

  editorContent: string = '<p>Veuillez écrire votre feedback ici...</p>';
  
  nextStep() {
    this.progressHelper.eventHelper.next({ next: true, prev: false });
  }
  
  prevStep() {
    this.progressHelper.eventHelper.next({ prev: true, next: false });
  }
  
  onProgressChange(steps: ProgressStepModel[]) {
    console.log('État actuel des étapes :', steps);
  }

  getStatusLabel(status: StudyPlanStatus): string {
    const labels = {
      [StudyPlanStatus.LIVE]: 'En cours',
      [StudyPlanStatus.CANCELLED]: 'Annulé',
      [StudyPlanStatus.VALIDATED]: 'Validé'
    };
    return labels[status] || status;
  }

  getStepLabel(step: StudyPlanStep): string {
    const labels = {
      [StudyPlanStep.STUDENT]: 'Étudiant',
      [StudyPlanStep.DIRECTOR]: 'Directeur',
      [StudyPlanStep.ADMIN_AGENT]: 'Agent administratif',
      [StudyPlanStep.COORDONATOR]: 'Coordonnateur',
      [StudyPlanStep.REGISTRAR]: 'Registraire'
    };
    return labels[step] || step;
  }

  getValidationLabel(validation: StepValidationStatus): string {
    const labels = {
      [StepValidationStatus.IN_PROGRESS]: 'En cours',
      [StepValidationStatus.APPROVED]: 'Approuvé',
      [StepValidationStatus.NEEDS_CORRECTION]: 'Corrections requises'
    };
    return labels[validation] || validation;
  }

  async refreshStudyPlan(): Promise<void> {
    await this.loadStudyPlan();
  }
}