import { ProgramType, Course } from "@common/program"

export enum StudyPlanStep {
    STUDENT = 'student',
    DIRECTOR = 'director',
    ADMIN_AGENT = 'admin_agent',
    COORDONATOR = 'coordonator',
    REGISTRAR = 'registrar'
}

export enum StudyPlanStatus {
    LIVE = 'live',
    CANCELLED = 'cancelled',
    VALIDATED = 'validated',
}

export enum StepValidationStatus {
    IN_PROGRESS = 'in-progress',
    APPROVED = 'approved',
    NEEDS_CORRECTION = 'needs-correction',
}

export interface SelectedModule {
    title: string,
    courses: Course[]
}

export interface StudyPlan {
    _id?: string,
    status: StudyPlanStatus
    studentId: string,
    directorId: string,
    coordonatorId: string,
    programId: string,
    programType: ProgramType // DESS, Master and PHD for easy step modification in frontend
    studyPlanStep: StudyPlanStep,
    stepValidation: StepValidationStatus,
    coursesSelection: {
        modules: SelectedModule[]
    }
    chatId?: string,
    createdDate?: Date,
    modifiedDate?: Date,
}

export interface StudyPlanEntry {
    studyPlanId: string,
    firstName: string,
    lastName: string,
    degree: string;
    date: Date;
}