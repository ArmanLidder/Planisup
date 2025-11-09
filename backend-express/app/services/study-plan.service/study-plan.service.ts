import { Service } from "typedi";
import { Logger } from "@app/services/logger.service/logger.service";
import { UserModel, IUser } from "@app/models/user.model/user.model";
import {
  ProgramModel,
  IProgram,
} from "@app/models/program.model/program.model";
import { ChatModel, IChat } from "@app/models/chat.model/chat.model";
import {
  StudyPlanModel,
  IStudyPlan,
} from "@app/models/study-plan.model/study-plan.model";
import {
  StudyPlan,
  StepValidationStatus,
  StudyPlanStep,
  StudyPlanStatus,
  StudyPlanEntry,
} from "@common/study-plan";
import { ProgramType } from "@common/program";
import { UserRole } from "@common/user";

@Service()
export class StudyPlanService {
  constructor(private logger: Logger) {}

  async handleStudentSubmission(studyPlan: Partial<StudyPlan>) {
    const studentId = studyPlan.studentId;
    this.logger.info("Handle Student Submission");
    try {
      const student = await UserModel.findById(studentId);
      return student.currentPlan
        ? await this.updateStudyPlan(studyPlan)
        : await this.saveNewStudyPlan(studyPlan);
    } catch (e) {
      this.logger.error(e);
      return null;
    }
  }

  async getStudyPlan(id: string) {
    try {
      return await StudyPlanModel.findById(id);
    } catch (e) {
      this.logger.error(e);
      return null;
    }
  }

  async getStudyPlans(id: string, isArchive: boolean = false) {
    try {
      const user = await UserModel.findById(id);
      const userId = user._id;
      const role: UserRole = user.role;
      const query: any = isArchive
        ? this.generateArchiveQuery(role, userId)
        : this.generateQuery(role, userId);
      const studyPlans: IStudyPlan[] = await StudyPlanModel.find(query).exec();
      console.log(JSON.stringify(query, null, 2));
      if (isArchive) return this.convertToStudyPlanEntries(studyPlans);
      if (role !== UserRole.Agent && role !== UserRole.Registrar)
        return this.convertToStudyPlanEntries(studyPlans);
      const plansWithProgram = await Promise.all(
        studyPlans.map(async (plan) => {
          const program = (await ProgramModel.findById(
            plan.programId
          )) as IProgram;
          return { plan, program };
        })
      );
      const filteredPlans = plansWithProgram
        .filter(
          ({ program }) => program && program.department === user.department
        )
        .map(({ plan }) => plan);
      return this.convertToStudyPlanEntries(filteredPlans);
    } catch (e) {
      this.logger.error(e);
      return [];
    }
  }

  async cancelStudyPlan(id: string) {
    this.logger.info("Cancel study plan");
    try {
      const studyPlan = await StudyPlanModel.findById(id);
      const student = await UserModel.findById(studyPlan.studentId);
      studyPlan.status = StudyPlanStatus.CANCELLED;
      student.currentPlan = "";
      await studyPlan.save();
      await student.save();
    } catch (e) {
      this.logger.error(e);
    }
  }

  async validateStudyPlan(id: string, employeeId: string) {
    this.logger.info("Validate study plan");
    try {
      const studyPlan = await StudyPlanModel.findById(id);

      // Assign Employee Ids
      if (studyPlan.studyPlanStep === StudyPlanStep.DIRECTOR) {
        studyPlan.directorValidationDate = new Date();
      } else if (studyPlan.studyPlanStep === StudyPlanStep.COORDONATOR) {
        studyPlan.coordonatorValidationDate = new Date();
      } else if (studyPlan.studyPlanStep === StudyPlanStep.ADMIN_AGENT) {
        studyPlan.agentValidationDate = new Date();
        studyPlan.agentId = employeeId;
      } else if (studyPlan.studyPlanStep === StudyPlanStep.REGISTRAR) {
        studyPlan.registrarValidationDate = new Date();
        studyPlan.registrarId = employeeId;
      }

      const originalStep = studyPlan.studyPlanStep;
      // Increment Step Eventually distinguish between master research and master professional
      if (studyPlan.programType !== ProgramType.DESS) {
        if (studyPlan.studyPlanStep === StudyPlanStep.DIRECTOR)
          studyPlan.studyPlanStep = StudyPlanStep.ADMIN_AGENT;
        else if (studyPlan.studyPlanStep === StudyPlanStep.ADMIN_AGENT)
          studyPlan.studyPlanStep = StudyPlanStep.COORDONATOR;
        else if (studyPlan.studyPlanStep === StudyPlanStep.COORDONATOR)
          studyPlan.studyPlanStep = StudyPlanStep.REGISTRAR;
      } else {
        if (studyPlan.studyPlanStep === StudyPlanStep.ADMIN_AGENT)
          studyPlan.studyPlanStep = StudyPlanStep.DIRECTOR;
        else if (studyPlan.studyPlanStep === StudyPlanStep.DIRECTOR)
          studyPlan.studyPlanStep = StudyPlanStep.COORDONATOR;
        else if (studyPlan.studyPlanStep === StudyPlanStep.COORDONATOR)
          studyPlan.studyPlanStep = StudyPlanStep.REGISTRAR;
      }

      // Update States
      if (originalStep === StudyPlanStep.REGISTRAR) {
        studyPlan.status = StudyPlanStatus.VALIDATED;
        studyPlan.stepValidation = StepValidationStatus.APPROVED;
      } else {
        studyPlan.stepValidation = StepValidationStatus.IN_PROGRESS;
      }
      await studyPlan.save();
    } catch (e) {
      this.logger.error(e);
    }
  }

  async refuseStudyPlan(id: string) {
    this.logger.info("Refuse study plan");
    try {
      const studyPlan = await StudyPlanModel.findById(id);
      studyPlan.stepValidation = StepValidationStatus.NEEDS_CORRECTION;
      await studyPlan.save();
    } catch (e) {
      this.logger.error(e);
    }
  }

  async getProcessMembers(id: string) {
    const studyPlan = await this.getStudyPlan(id);
    const members: Record<string, any>[] = [];

    const student = await UserModel.findById(studyPlan.studentId);
    const director = await UserModel.findById(studyPlan.directorId);
    const coordonator = await UserModel.findById(studyPlan.coordonatorId);
    const agent = await UserModel.findById(studyPlan.agentId);
    const registrar = await UserModel.findById(studyPlan.registrarId);

    members.push(student, director, coordonator, agent, registrar);
    return members;
  }

  async getProcessCodirectors(id: string) {
    const studyPlan = await this.getStudyPlan(id);
    const codirectors: Record<string, any>[] = [];

    for (const codirectorId of studyPlan.codirectorsIds) {
      const codirector = await UserModel.findById(codirectorId);
      codirectors.push(codirector);
    }

    return codirectors;
  }

  private async convertToStudyPlanEntries(plans: IStudyPlan[]) {
    const entries: StudyPlanEntry[] = [];
    for (const plan of plans) {
      const student = await UserModel.findById(plan.studentId);
      const program = await ProgramModel.findById(plan.programId);
      entries.push({
        studyPlanId: plan._id as string,
        firstName: student.firstName,
        lastName: student.lastName,
        degree: program.degree,
        date: plan.modifiedDate as Date,
      });
    }
    return entries;
  }

  private generateQuery(role: UserRole, userId: string) {
    const query: any = {};
    query["status"] = StudyPlanStatus.LIVE;
    if (role === UserRole.Directeur) {
      query["directorId"] = userId;
      query["studyPlanStep"] = StudyPlanStep.DIRECTOR;
      query["stepValidation"] = StepValidationStatus.IN_PROGRESS;
    } else if (role === UserRole.Coordonnateur) {
      query["coordonatorId"] = userId;
      query["studyPlanStep"] = StudyPlanStep.COORDONATOR;
      query["stepValidation"] = StepValidationStatus.IN_PROGRESS;
    } else if (role === UserRole.Agent) {
      query["studyPlanStep"] = StudyPlanStep.ADMIN_AGENT;
      query["stepValidation"] = StepValidationStatus.IN_PROGRESS;
    } else if (role === UserRole.Registrar) {
      query["studyPlanStep"] = StudyPlanStep.REGISTRAR;
      query["stepValidation"] = StepValidationStatus.IN_PROGRESS;
    }
    return query;
  }

  private generateArchiveQuery(role: UserRole, userId: string) {
    const query: any = {};
    query["status"] = {
      $in: [StudyPlanStatus.LIVE, StudyPlanStatus.VALIDATED],
    };
    if (role === UserRole.Directeur) {
      query["directorId"] = userId;
      query["directorValidationDate"] = { $exists: true, $ne: null };
    } else if (role === UserRole.Coordonnateur) {
      query["coordonatorId"] = userId;
      query["coordonatorValidationDate"] = { $exists: true, $ne: null };
    } else if (role === UserRole.Agent) {
      query["agentId"] = userId;
    } else if (role === UserRole.Registrar) {
      query["registrarId"] = userId;
    }
    return query;
  }

  private async saveNewStudyPlan(studyPlan: Partial<StudyPlan>) {
    this.logger.info("Saving new study plan: " + JSON.stringify(studyPlan));
    try {
      // Will have to add ProgramType.MatrisePro
      if (studyPlan.programType === ProgramType.DESS)
        studyPlan.studyPlanStep = StudyPlanStep.ADMIN_AGENT;
      else studyPlan.studyPlanStep = StudyPlanStep.DIRECTOR;

      // console.log(studyPlan.status)
      // studyPlan.status = StudyPlanStatus.LIVE;
      // console.log(studyPlan.status)

      studyPlan.stepValidation = StepValidationStatus.IN_PROGRESS;

      const savedPlan = await StudyPlanModel.create(studyPlan);
      const student: IUser = await UserModel.findById(studyPlan.studentId);
      const chat: Partial<IChat> = {
        studyPlanId: savedPlan._id as string,
        messages: [],
      };

      const createdChat: IChat = await ChatModel.create(chat);
      savedPlan.chatId = createdChat.id;
      student.currentPlan = savedPlan._id as string;
      student.plans.push(savedPlan._id as string);
      await student.save();
      await savedPlan.save();

      return savedPlan;
    } catch (e) {
      this.logger.error(e);
      return null;
    }
  }

  private async updateStudyPlan(studyPlan: Partial<StudyPlan>) {
    this.logger.info("Update study plan");
    try {
      if (studyPlan.stepValidation === StepValidationStatus.NEEDS_CORRECTION && studyPlan.status === StudyPlanStatus.LIVE) {
        const step = studyPlan.programType[0] === "dess" ? StudyPlanStep.ADMIN_AGENT : StudyPlanStep.DIRECTOR;
        studyPlan.stepValidation = StepValidationStatus.IN_PROGRESS;
        studyPlan.studyPlanStep = step;
        const savedPlan = await StudyPlanModel.findOneAndUpdate(
          { _id: studyPlan._id },
          studyPlan,
          { new: true }
        );

        savedPlan.directorValidationDate = undefined;
        savedPlan.coordonatorValidationDate = undefined;
        savedPlan.agentValidationDate = undefined;
        savedPlan.agentId = undefined;
        savedPlan.registrarValidationDate = undefined;
        savedPlan.registrarId = undefined;

        await savedPlan.save();

        return savedPlan;
      }

      console.log("je suis la")
      const savedPlan = await StudyPlanModel.findOneAndUpdate(
        { _id: studyPlan._id },
        studyPlan,
        { new: true }
      );
      console.log("je suis la 2")
      return savedPlan;
    } catch (e) {
      this.logger.error(e);
      return null;
    }
  }
}
