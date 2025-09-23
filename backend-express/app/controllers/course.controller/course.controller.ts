import { Request, Response, Router } from "express";
import { Service } from "typedi";
import { Logger } from "@app/services/logger.service/logger.service";
import { fetchCoursesFromUrl, RawCourse } from "@app/utils/load-program";

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
        const { q } = req.query;
        this.logger.info(`Searching courses: ${q}`);

        const allCourses: RawCourse[] = await fetchCoursesFromUrl();
        
        const filteredCourses = allCourses.filter(course =>
          course.sigle.toLowerCase().includes(q?.toString().toLowerCase() || '') ||
          course.titre.toLowerCase().includes(q?.toString().toLowerCase() || '')
        );

        return res.status(200).json(filteredCourses);
      } catch (error) {
        this.logger.error(`Error searching courses: ${error}`);
        return res.status(500).json({error: "Failed to search courses"});
      }
    });

    this.router.get("/all-courses", async (req: Request, res: Response) => {
      try {
        this.logger.info("Fetching all ES courses...");

        const courses: RawCourse[] = await fetchCoursesFromUrl();
        
        // Filtrer seulement les cours avec secteurEnseignement = "ES"
        const esCourses = courses.filter(course => 
          course.secteurEnseignement === "ES"
        );

        this.logger.info(`Found ${esCourses.length} ES courses from API`);
        return res.status(200).json(esCourses);
      } catch(error) {
        this.logger.error(`Error fetching courses: ${error}`);
        return res.status(500).json({error: "Failed to fetch courses"});
      }
    });
  }
}
