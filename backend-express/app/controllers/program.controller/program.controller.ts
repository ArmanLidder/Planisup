import { Request, Response, Router } from "express";
import { Service } from "typedi";
import {
  ProgramModel,
  IProgram,
} from "@app/models/program.model/program.model";
import { Logger } from "@app/services/logger.service/logger.service";

// Faut ajouter les interfaces que l'on veut dans commun pour les cast plus tard.

// Exemple de route https:localhost:3000/api/program/dess/19y7w812873wIsmkhdjs

@Service()
export class ProgramController {
  public router: Router;

  constructor(private logger: Logger) {
    this.configureRouter();
  }

  private configureRouter(): void {
    this.router = Router();

    this.router.get("/:type", async (req: Request, res: Response) => {
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

    this.router.get("/:type/:department", async (req, res) => {
      try {
        const { type, department } = req.params;
        this.logger.info(
          `Fetching programs for type=${type}, departement=${department}`
        );

        const programs = await ProgramModel.find({
          type: { $in: [type]},
          department: department,
        }).exec();


        const degrees = [... (programs.map((program) => program.degree ))];
        console.log(degrees)

        return res.status(200).json(degrees);
      } catch (error) {
        this.logger.warn(error);
        return res.status(500).json({ error: "Internal Server Error" });
      }
    });

    this.router.get("/:type/:department/:degree", async (req, res) => {
      try {
        const { type, department, degree } = req.params;

        this.logger.info(
          `Fetching programs for type=${type}, departement=${department}, degree=${degree}`
        );

        const programs = await ProgramModel.find({
          type: type,
          department: department,
          degree: degree,
        }).exec();

        const options = [...new Set(programs.map((program) => program.option ))];

        return res.status(200).json(options);
      } catch (error) {
        this.logger.warn(error);
        return res.status(500).json({ error: "Internal Server Error" });
      }
    });

    this.router.get("/:type/:department/:degree/:option", async (req, res) => {
      try {
        const { type, department, degree, option } = req.params;

        this.logger.info(
          `Fetching programs for type=${type}, departement=${department}, degree=${degree}, option=${option}`
        );

        const program = await ProgramModel.find({
          type: type,
          degree: degree,
          department: department,
          option: option,
        }).exec();

        return res.status(200).json(program);
      } catch (error) {
        this.logger.warn(error);
        return res.status(500).json({ error: "Internal Server Error" });
      }
    });
  }
}
