import { Request, Response, Router } from "express";
import { StudyPlanService } from "@app/services/study-plan.service/study-plan.service";
import { StudyPlan } from "@common/study-plan";
import { Service } from "typedi";
import { Logger } from "@app/services/logger.service/logger.service";

@Service()
export class StudyPlanController {
  public router: Router;

  constructor(
    private logger: Logger,
    private sPS: StudyPlanService
  ) {
    this.configureRouter();
  }

  private configureRouter(): void {
    this.router = Router();

    this.router.get("/:id", async (req: Request, res: Response) => {
      const id = req.params.id;
      try {
        const studyPlan = await this.sPS.getStudyPlan(id);
        console.log(studyPlan);
        return studyPlan
          ? res.status(201).json(studyPlan)
          : res.sendStatus(500);
      } catch (e) {
        return res.status(500).json(e);
      }
    });

    this.router.get("/assigned/:id", async (req: Request, res: Response) => {
      const id = req.params.id;
      try {
        const entries = await this.sPS.getStudyPlans(id);
        return entries ? res.status(201).json(entries) : res.sendStatus(500);
      } catch (e) {
        return res.status(500).json(e);
      }
    });

    this.router.get("/archive/:id", async (req: Request, res: Response) => {
      const id = req.params.id;
      try {
        const entries = await this.sPS.getStudyPlans(id);
        return entries ? res.status(201).json(entries) : res.sendStatus(500);
      } catch (e) {
        return res.status(500).json(e);
      }
    });

    this.router.get("/members/:id", async (req: Request, res: Response) => {
      const id = req.params.id;
      this.logger.info(`Requête reçue pour les membres du study plan ${id}`);
      try {
        const members = await this.sPS.getProcessMembers(id);
        return members ? res.status(201).json(members) : res.sendStatus(500);
      } catch (e) {
        return res.status(500).json(e);
      }
    });

    this.router.post("/student", async (req: Request, res: Response) => {
      this.logger.info("Handle student study plan submission");
      const data = req.body as Partial<StudyPlan>;
      try {
        const studyPlan = await this.sPS.handleStudentSubmission(data);
        return studyPlan
          ? res.status(201).json(studyPlan)
          : res.sendStatus(500);
      } catch (e) {
        return res.status(500).json(e);
      }
    });

    this.router.delete("/cancel/:id", async (req: Request, res: Response) => {
      this.logger.info("Handle student study plan cancellation");
      const id = req.params.id;
      try {
        await this.sPS.cancelStudyPlan(id);
        return res.status(200).json();
      } catch (e) {
        return res.status(500).json(e);
      }
    });

    this.router.patch(
      "/approuved/:id/:employeeId",
      async (req: Request, res: Response) => {
        this.logger.info("Handle student study plan approbation");
        const id = req.params.id;
        const employeeId = req.params.employeeId;
        try {
          await this.sPS.validateStudyPlan(id, employeeId);
          return res.status(200).json();
        } catch (e) {
          return res.status(500).json(e);
        }
      }
    );

    this.router.patch("/refuse/:id", async (req: Request, res: Response) => {
      this.logger.info("Handle student study plan refusal");
      const id = req.params.id;
      try {
        await this.sPS.refuseStudyPlan(id);
        return res.status(200).json();
      } catch (e) {
        return res.status(500).json(e);
      }
    });
  }
}
