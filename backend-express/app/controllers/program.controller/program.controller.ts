import { Request, Response, Router } from "express";
import { Service } from "typedi";
import {
  ProgramModel,
  IProgram,
  convertToReduceProgram
} from "@app/models/program.model/program.model";
import { Logger } from "@app/services/logger.service/logger.service";
import { ReducedProgram } from "@common/program";


@Service()
export class ProgramController {
  public router: Router;

  constructor(private logger: Logger) {
    this.configureRouter();
  }

  private configureRouter(): void {
    this.router = Router();

    this.router.get("/query/:type", async (req: Request, res: Response) => {
      try {
        const type = req.params.type;
        this.logger.info(`Fetching ${type}' programs`);

        const programs = await ProgramModel.find({
          type: type,
        }).exec();

        const departements = [
          ...new Set(programs.map((program: IProgram) => program.department)),
        ];

        return res.status(200).json(departements);
      } catch (error) {
        this.logger.warn(error);
        return res.status(500);
      }
    });

    this.router.get("/query/:type/:department", async (req, res) => {
      try {
        const { type, department } = req.params;
        this.logger.info(
          `Fetching programs for type=${type}, departement=${department}`
        );

        const programs = await ProgramModel.find({
          type: { $in: [type]},
          department: department,
        }).exec();
        const degrees = [...(programs.map((program: IProgram) => convertToReduceProgram(program) as ReducedProgram))];

        return res.status(200).json(degrees);
      } catch (error) {
        this.logger.warn(error);
        return res.status(500).json({ error: "Internal Server Error" });
      }
    });
    
    this.router.get("/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const program = await ProgramModel.findById(id).exec();

        if (!program) {
          return res.status(404).json({ error: "Program not found" });
        }

        return res.status(200).json(program);
      } catch (error) {
        this.logger.warn(error);
        return res.status(500).json({ error: "Internal Server Error" });
      }
    });

    this.router.get("/", async (req, res) => {
      try {
        const programs = await ProgramModel.find().exec();
        return res.status(200).json(programs);
      } catch (error) {
        this.logger.warn(error);
        return res.status(500).json({ error: "Internal Server Error" });
      }
    });
  }
}
