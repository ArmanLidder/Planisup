import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Progress } from "@app/components/gsup-progress-bar/progress";
import { ProgressHelperService } from '@app/components/gsup-progress-bar/progress-helper.service';
import { ProgressStepModel } from '@app/components/gsup-progress-bar/uiHelper';
import { ChatComponent } from '@app/components/chat/chat.component';
import { StudyPlan, StudyPlanStatus, StudyPlanStep, StepValidationStatus } from '@common/study-plan';
import { ApiService } from '@app/services/api/api-service';
import { ActivatedRoute } from '@angular/router';
import { AuthentificationService } from '@app/services/authentification/authentification-service';
import { StudyPlanService } from '@app/services/study-plan/study-plan-service';
import { User, UserRole } from '@common/user';
import { Loading } from "@app/components/loading/loading";

@Component({
  selector: 'app-view-plan',
  standalone: true,
  imports: [Progress, ChatComponent, CommonModule, Loading],
  templateUrl: './view-plan.html',
  styleUrl: './view-plan.scss',
})
export class ViewPlan {
  studyPlan: StudyPlan | null = null;
  currentUser: User | null;
  isLoading$: typeof this.sPS.loading$;
  studyPlan$: typeof this.sPS.studyPlan$;

  constructor(
    private readonly auth: AuthentificationService,
    private readonly sPS: StudyPlanService,
  ) {
    this.currentUser = this.auth.currentUser;
    this.studyPlan = this.sPS.studyPlan;
    this.isLoading$ = this.sPS.loading$;
    this.studyPlan$ = this.sPS.studyPlan$;
  }

  editorContent: string = '<p>Veuillez écrire votre feedback ici...</p>';

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

  needsCorrection() : boolean {
    return this.sPS.studyPlan?.stepValidation === StepValidationStatus.NEEDS_CORRECTION;
  }

  protected isStudent(): boolean {
    return this.currentUser?.role === UserRole.Etudiant;
  }

  protected onValidate() {
    this.sPS.approveStudyPlan();
  }

  protected onRefuse() {
    this.sPS.refuseStudyPlan();
  }

  protected onCancel() {
    this.sPS.cancelStudyPlan();
  }

  protected onSubmit() {
    this.sPS.updateStudyPlan();
  }
}
