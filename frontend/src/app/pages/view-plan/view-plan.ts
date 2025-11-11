import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Progress } from '@app/components/gsup-progress-bar/progress';
import {
  getStepOrderForProgram as originalGetStepOrder,
  ProgressStepModel,
} from '@app/components/gsup-progress-bar/uiHelper';
import { ChatComponent } from '@app/components/chat/chat.component';
import {
  StudyPlan,
  StudyPlanStatus,
  StudyPlanStep,
  StepValidationStatus,
} from '@common/study-plan';
import { AuthentificationService } from '@app/services/authentification/authentification-service';
import { StudyPlanService } from '@app/services/study-plan/study-plan-service';
import { User } from '@common/user';
import { Loading } from '@app/components/loading/loading';
import { ProgramType } from '@common/program';
import { PdfService } from '@app/services/pdf-service/pdf-service';
import { StudyPlan as StudyPlanComponent } from '@app/pages/study-plan/study-plan';
import { ProgramService } from '@app/services/program/program-service';
import { CourseStateService } from '@app/services/course-state/course-state';
import { ApiService } from '@app/services/api/api-service';
import { Subscription } from 'rxjs';
import { UserRole } from '@common/user';
import { VerifyStudyPlan } from "@app/components/verify-study-plan/verify-study-plan";

@Component({
  selector: 'app-view-plan',
  standalone: true,
  imports: [Progress, ChatComponent, CommonModule, Loading, StudyPlanComponent, VerifyStudyPlan],
  templateUrl: './view-plan.html',
  styleUrl: './view-plan.scss',
})
export class ViewPlan implements OnInit, OnDestroy {
  studyPlan: StudyPlan | null = null;
  currentUser: User | null;
  isLoading$: typeof this.sPS.loading$;
  studyPlan$: typeof this.sPS.studyPlan$;
  editorContent: string = '<p>Veuillez écrire votre feedback ici...</p>';
  isStudyPlanLoaded = false;
  private studyPlanSubscription: Subscription | null = null;

  constructor(
    protected readonly authentificationService: AuthentificationService,
    protected readonly sPS: StudyPlanService,
    private readonly pdfService: PdfService,
    private readonly programService: ProgramService,
    private readonly courseStateService: CourseStateService,
    private readonly apiService: ApiService
  ) {
    this.currentUser = this.authentificationService.currentUser;
    this.studyPlan = this.sPS.studyPlan;
    this.isLoading$ = this.sPS.loading$;
    this.studyPlan$ = this.sPS.studyPlan$;
  }

  get progressSteps(): ProgressStepModel[] {
    return this.getProgressSteps();
  }

 ngOnInit() {
    
    if (!this.sPS.studyPlan) {
      this.sPS.restoreFromStorage();
    }

    this.studyPlanSubscription = this.studyPlan$.subscribe((plan) => {
      console.log('Study plan subscription triggered:', plan);
      if (plan && plan.programId) {
        this.studyPlan = plan;
        this.loadProgramAndRestoreState(plan);
      }
    });

    if (this.sPS.studyPlan && this.sPS.studyPlan.programId) {
      this.loadProgramAndRestoreState(this.sPS.studyPlan);
    }
  }

  ngOnDestroy() {
    if (this.studyPlanSubscription) {
      this.studyPlanSubscription.unsubscribe();
    }
  }

  protected exportPDF() {
    if (this.sPS.studyPlan && this.authentificationService.currentUser) {
      this.pdfService.generateAndDownloadPdf(this.sPS.studyPlan);
    }
  }

  private getCurrentStepOrder(): StudyPlanStep[] {
    const studyPlan = this.studyPlan;
    return this.getStepOrderForProgram(studyPlan!.programType);
  }

  private getStepOrderForProgram(programType: ProgramType): StudyPlanStep[] {
    return originalGetStepOrder(programType);
  }

  private getValidationLabel(validation: StepValidationStatus): string {
    const labels = {
      [StepValidationStatus.IN_PROGRESS]: 'En cours',
      [StepValidationStatus.APPROVED]: 'Approuvé',
      [StepValidationStatus.NEEDS_CORRECTION]: 'Corrections requises',
    };
    return labels[validation] || validation;
  }

  private getStepLabel(step: StudyPlanStep): string {
    const labels = {
      [StudyPlanStep.STUDENT]: 'Étudiant',
      [StudyPlanStep.DIRECTOR]: 'Directeur',
      [StudyPlanStep.ADMIN_AGENT]: 'Agent administratif',
      [StudyPlanStep.COORDONATOR]: 'Coordonnateur',
      [StudyPlanStep.REGISTRAR]: 'Registraire',
    };
    return labels[step] || step;
  }

  private loadProgramAndRestoreState(plan: StudyPlan) {
    // Charger le programme associé
    this.apiService.getProgram(plan.programId).subscribe({
      next: (program) => {
        // Définir le programme dans le service
        this.programService.program = program;
        this.programService.type = plan.programType;

        // Initialiser le courseStateService avec les modules du programme
        this.courseStateService.initializeCourseStates(program.modules);

        // Restaurer le courseState depuis le plan d'études
        if (plan.courseState) {
          this.courseStateService.restoreCourseState(plan.courseState);
        }

        // Indiquer que le plan est chargé
        this.isStudyPlanLoaded = true;
      },
      error: (error) => {
        console.error('Erreur lors du chargement du programme:', error);
      },
    });
  }

  private getProgressSteps(): ProgressStepModel[] {
    const studyPlan = this.studyPlan;
    if (!studyPlan) return [];

    const stepOrder = this.getCurrentStepOrder();
    const currentStep = this.sPS.studyPlan?.studyPlanStep;

    return stepOrder.map((step, index) => {
      let displayLabel = '';

      const stepIndex = stepOrder.indexOf(step);
      const currentStepIndex = stepOrder.indexOf(currentStep!);

      if (stepIndex < currentStepIndex) {
        displayLabel = 'Approuvé';
      } else if (stepIndex === currentStepIndex) {
        displayLabel = this.getValidationLabel(this.sPS.studyPlan?.stepValidation!);
      } else {
        displayLabel = 'En attente';
      }

      return {
        stepIndex: index,
        label: this.getStepLabel(step),
        displayLabel,
        businessStep: step,
      };
    });
  }

  protected isArchivedStudyPlan(): boolean {
    const isCancelled = this.sPS.studyPlan?.status === StudyPlanStatus.CANCELLED;
    if (
      this.authentificationService.currentUser?.role === UserRole.Agent &&
      this.sPS.studyPlan?.agentValidationDate
    )
      return !isCancelled;
    if (
      this.authentificationService.currentUser?.role === UserRole.Directeur &&
      this.sPS.studyPlan?.directorValidationDate
    )
      return !isCancelled;
    if (
      this.authentificationService.currentUser?.role === UserRole.Coordonnateur &&
      this.sPS.studyPlan?.coordonatorValidationDate
    )
      return !isCancelled;
    if (
      this.authentificationService.currentUser?.role === UserRole.Registrar &&
      this.sPS.studyPlan?.registrarValidationDate
    )
      return !isCancelled;
    if (
      this.authentificationService.currentUser?.role === UserRole.Etudiant &&
      this.sPS.studyPlan?.registrarValidationDate
    )
      return !isCancelled;
    return false;
  }

  get isDisplayCorrection(): boolean {
    return (this.studyPlan?.stepValidation === StepValidationStatus.NEEDS_CORRECTION) && this.authentificationService.isStudent();
  }
}
