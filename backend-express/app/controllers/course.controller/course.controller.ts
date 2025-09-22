import { Request, Response, Router } from "express";
import { Service } from "typedi";
import { Logger } from "@app/services/logger.service/logger.service";

@Service()
export class CourseController {
  public router: Router;

  constructor(private logger: Logger) {
    this.configureRouter();
  }

  private configureRouter(): void {
    this.router = Router();
    this.router.get("/search", async (req: Request, res: Response) => {
      try {
        const { value } = req.query;
        this.logger.info(`Fetching course: ${value}`);

        return res.status(200).json();
      } catch (error) {
        this.logger.warn(error);
        return res.status(500);
      }
    });
  }
}
