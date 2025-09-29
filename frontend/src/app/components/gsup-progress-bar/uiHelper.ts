import { StudyPlanStep } from '@common/study-plan';
import { ProgressHelperService } from './progress-helper.service';
import { ProgramType } from '@common/program';

export interface ProgressStepModel {
  stepIndex: number;
  label: string;
  displayLabel: string;
  businessStep?: StudyPlanStep;
}

export enum UiState {
    ACTIVE = 'active',
    COMPLETE = 'complete',
}

export const getStepOrderForProgram = (programType: ProgramType): StudyPlanStep[] => {
  switch (programType) {
    case ProgramType.DESS:
    case ProgramType.MASTER:
      return [
        // StudyPlanStep.STUDENT,
        StudyPlanStep.ADMIN_AGENT,
        StudyPlanStep.DIRECTOR,
        StudyPlanStep.COORDONATOR,
        StudyPlanStep.REGISTRAR
      ];
    case ProgramType.PHD:
      return [
        // StudyPlanStep.STUDENT,
        StudyPlanStep.DIRECTOR,
        StudyPlanStep.COORDONATOR,
        StudyPlanStep.ADMIN_AGENT,
        StudyPlanStep.REGISTRAR
      ];
  }
};


export class UiHelper {
    public itemProgressList: ProgressStepModel[] = [];
    public activeIndex: number = 0;
    
    constructor(protected progressHelper: ProgressHelperService) {}

    // Hook pour les classes enfants
    protected onStatusChange(): void {}
}