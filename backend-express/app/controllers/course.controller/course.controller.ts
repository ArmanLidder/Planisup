import { Request, Response, Router } from "express";
import { Service } from "typedi";
import { Logger } from "@app/services/logger.service/logger.service";
import {
  fetchCoursesFromUrl,
  planTriennal,
  RawCourse,
  fetchTriennalFromUrl,
} from "@app/utils/load-program";

@Service()
export class CourseController {
  public router: Router;

  constructor(private readonly logger: Logger) {
    this.configureRouter();
  }

  private configureRouter(): void {
    this.router = Router();
    this.router.get("/allCourses", async (req: Request, res: Response) => {
      try {
        this.logger.info("Fetching all ES courses...");

        const courses: RawCourse[] = await fetchCoursesFromUrl();

        const esCourses = courses
          .filter((course) => course.secteurEnseignement === "ES")
          .map((course) => ({
            sigle: course.sigle.trim(),
            name: course.titre,
            credits: course.nombreCredit,
            semester: {
              Automne: course.indPlanTriAut,
              Hiver: course.indPlanTriHiv,
              Été: course.indPlanTriEte,
            },
            department: course.departement,
            description: course.descriptionCours,
            language: course.sigle.trim().endsWith("E")
              ? "Anglais"
              : "Français",
          }));

        this.logger.info(`Found ${esCourses.length} ES courses from API`);
        return res.status(200).json(esCourses);
      } catch (error) {
        this.logger.error(`Error fetching courses: ${error}`);
        return res.status(500).json({ error: "Failed to fetch courses" });
      }
    });

    this.router.get("/courses", async (req: Request, res: Response) => {
      try {
        this.logger.info("Fetching all courses from triennal...");

        const courses: planTriennal[] = await fetchTriennalFromUrl();

        const fetchCourse = courses
          .filter((course) => course.codeSecteur === "ES")
          .map((course) => ({
            sigle: course.sigle.trim(),
            name: course.titre,
            credits: course.nbCredits,
            trimester: course.listPlanTriennal,
          }));

        this.logger.info(`Found ${fetchCourse.length} courses from API`);
        return res.status(200).json(fetchCourse);
      } catch (error) {
        this.logger.error(`Error fetching courses: ${error}`);
        return res.status(500).json({ error: "Failed to fetch courses" });
      }
    });
  }
}
