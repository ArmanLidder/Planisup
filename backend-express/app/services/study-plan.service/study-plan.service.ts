import { Service } from 'typedi';
import { Logger } from '@app/services/logger.service/logger.service';
import { UserModel, IUser } from '@app/models/user.model/user.model';
import { StudyPlanModel } from  '@app/models/study-plan.model/study-plan.model';
import { StudyPlan, StepValidationStatus, StudyPlanStep, StudyPlanStatus } from '@common/study-plan';
import { ProgramType } from '@common/program';

@Service()
export class StudyPlanService {

    constructor(private logger: Logger) {}

    async handleStudentSubmission(studyPlan: Partial<StudyPlan>) {
        const studentId = studyPlan.studentId;
        this.logger.info("Handle Student Submission");
        try {
            const student = await UserModel.findById(studentId);
            return student.currentPlan ? await this.updateStudyPlan(studyPlan): await this.saveNewStudyPlan(studyPlan)
        } catch(e) {
            this.logger.error(e)
            return null
        }
    }

    private async saveNewStudyPlan(studyPlan: Partial<StudyPlan>) {
        this.logger.info("Saving new study plan");
        try {
            if (studyPlan.programType === ProgramType.DESS) // Will have to add validation for master professional
            studyPlan.studyPlanStep = StudyPlanStep.ADMIN_AGENT;
            else studyPlan.studyPlanStep = StudyPlanStep.DIRECTOR;

            studyPlan.status = StudyPlanStatus.LIVE;
            studyPlan.stepValidation = StepValidationStatus.IN_PROGRESS;

            const savedPlan =  await StudyPlanModel.create(studyPlan);
            const student: IUser = await UserModel.findById(studyPlan.studentId);

            student.currentPlan = savedPlan._id as string;
            student.plans.push(savedPlan._id as string)
            await student.save()

            return studyPlan;
        } catch (e) {
            this.logger.error(e);
            return null;
        }
    }

    private async updateStudyPlan(studyPlan: Partial<StudyPlan>) {
        this.logger.info("Update study plan");
        try {
            studyPlan.stepValidation = StepValidationStatus.IN_PROGRESS;
            const savedPlan =  await StudyPlanModel.findOneAndUpdate(studyPlan);
            return savedPlan
        } catch (e) {
            this.logger.error(e);
            return null;
        }
    }

    async cancelStudyPlan(id: string) {
        this.logger.info("Cancel study plan");
        try {
            const studyPlan =  await StudyPlanModel.findById(id);
            const student = await UserModel.findById(studyPlan.studentId);
            studyPlan.status = StudyPlanStatus.CANCELLED;
            student.currentPlan = "";
        } catch (e) {
            this.logger.error(e);
        }
    }

    async validateStudyPlan(id: string) {
        this.logger.info("Validate study plan");
         try {
            const studyPlan =  await StudyPlanModel.findById(id);
            // Increment Step
            if (studyPlan.studyPlanStep === StudyPlanStep.DIRECTOR) studyPlan.studyPlanStep = StudyPlanStep.ADMIN_AGENT;
            else if (studyPlan.studyPlanStep === StudyPlanStep.ADMIN_AGENT) studyPlan.studyPlanStep = StudyPlanStep.COORDONATOR;
            else if (studyPlan.studyPlanStep === StudyPlanStep.COORDONATOR) studyPlan.studyPlanStep = StudyPlanStep.REGISTRAR;

            // Update States
            if (studyPlan.studyPlanStep === StudyPlanStep.REGISTRAR) {
                studyPlan.status = StudyPlanStatus.VALIDATED;
                studyPlan.stepValidation = StepValidationStatus.APPROVED;
            } else {
                studyPlan.stepValidation = StepValidationStatus.IN_PROGRESS
            }
            await studyPlan.save();
        } catch (e) {
            this.logger.error(e);
        }
    }

    async refuseStudyPlan(id: string) {
        this.logger.info("Refuse study plan");
         try {
            const studyPlan =  await StudyPlanModel.findById(id);
            studyPlan.stepValidation = StepValidationStatus.NEEDS_CORRECTION;
            await studyPlan.save();
        } catch (e) {
            this.logger.error(e);
        }
    }
}