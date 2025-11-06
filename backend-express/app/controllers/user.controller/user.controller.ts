import { Request, Response, Router } from "express";
import { Service } from "typedi";
import { UserService } from "@app/services/user.service/user.service";
import { Logger } from "@app/services/logger.service/logger.service";
import { UserRole, User } from "@common/user";

@Service()
export class UserController {
  public router: Router;

  constructor(
    private userService: UserService,
    private logger: Logger
  ) {
    this.configureRouter();
  }

  private configureRouter(): void {
    this.router = Router();

    // Admin middleware - all routes require admin role
    //this.router.use(this.requireAdmin.bind(this));

    this.router.get("/", this.getAllUsers.bind(this));
    this.router.get("/:id", this.getUserById.bind(this));
    this.router.patch("/:id/role", this.updateUserRole.bind(this));
    this.router.delete("/:id", this.deleteUser.bind(this));
    this.router.get(
      "/employees/directors-coordinators",
      this.getDirectorsAndCoordonnateurs.bind(this)
    );
    this.router.post("/student", this.createStudentUser.bind(this));
    this.router.get(
      "/students/unsubmitted-plans",
      this.getStudentsWithUnsubmittedPlans.bind(this)
    );
  }

  // private requireAdmin(req: Request, res: Response, next: Function): void {
  //   const userRole = req.headers['user-role'] as UserRole;
  //
  //   if (userRole !== UserRole.Administrateur) {
  //     this.logger.warn(`Access denied - insufficient privileges. Role: ${userRole}`);
  //     res.status(403).json({
  //       success: false,
  //       message: 'Access denied. Admin privileges required.'
  //     });
  //     return;
  //   }
  //
  //   next();
  // }

  private async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      this.logger.info(`Requested user details for ID: ${id}`);

      const user = await this.userService.getUserById(id);

      if (!user) {
        this.logger.warn(`User not found with ID: ${id}`);
        res.status(404).json({
          success: false,
          message: "User not found",
        });
        return;
      }

      this.logger.info(`Successfully retrieved user: ${user.usercode}`);
      res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(`Get user by ID failed: ${errorMessage}`);
      res.status(500).json({
        success: false,
        message: "Failed to fetch user",
      });
    }
  }

  private async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      this.logger.info("Admin requested all users list");
      const users = await this.userService.getAllUsers();
      res.status(200).json({
        success: true,
        users,
        count: users.length,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(`Get all users failed: ${errorMessage}`);
      res.status(500).json({
        success: false,
        message: "Failed to fetch users",
      });
    }
  }

  private async updateUserRole(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { newRole, departement } = req.body;

      if (!Object.values(UserRole).includes(newRole)) {
        res.status(400).json({
          success: false,
          message: "Invalid role specified",
        });
        return;
      }

      const updatedUser = await this.userService.updateUserRole(
        id,
        newRole,
        departement
      );

      if (departement)
        this.logger.info(
          `User ${id} role updated to ${newRole} with department ${departement}`
        );
      else
        this.logger.info(
          `User ${id} role updated to ${newRole} with no department`
        );

      res.status(200).json({
        success: true,
        user: updatedUser,
        message: departement
          ? `User role updated to ${newRole} with department ${departement}`
          : `User role updated to ${newRole} with no department`,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(`Update user role failed: ${errorMessage}`);
      res.status(500).json({
        success: false,
        message: "Failed to update user role",
      });
    }
  }

  private async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await this.userService.deleteUser(id);

      res.status(200).json({
        success: true,
        message: "User deleted successfully",
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(`Delete user failed: ${errorMessage}`);
      res.status(500).json({
        success: false,
        message: "Failed to delete user",
      });
    }
  }

  private async getDirectorsAndCoordonnateurs(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      this.logger.info(`Fetching directors and coordinators list`);
      const employees = await this.userService.getEmployees([
        UserRole.Directeur,
        UserRole.Coordonnateur,
      ]);
      const directors = employees.filter(
        (emp) => emp.role === UserRole.Directeur
      );
      const coordinators = employees.filter(
        (emp) => emp.role === UserRole.Coordonnateur
      );
      this.logger.info(
        `Found ${directors.length} directors and ${coordinators.length} coordinators`
      );
      res.status(200).json({ directors, coordinators });
    } catch (error) {
      this.logger.error(`Get directors and coordinators failed: ${error}`);
      res.status(500).json({
        success: false,
        message: "Failed to fetch directors and coordinators",
      });
    }
  }

  private async createStudentUser(req: Request, res: Response): Promise<void> {
    try {
      const user = req.body as Partial<User>;
      const newStudent = await this.userService.createStudent({
        ...user,
        role: UserRole.Etudiant,
      });

      if (!newStudent) {
        res.status(409).json({
          success: false,
          message: "User already exists or invalid fields provided",
        });
        return;
      }

      res.status(201).json({
        success: true,
        user: newStudent,
      });
    } catch (error: any) {
      this.logger.error(`Create student user failed: ${error.message}`);
      res.status(500).json({
        success: false,
        message: "Failed to create student user",
      });
    }
  }

  private async getStudentsWithUnsubmittedPlans(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      this.logger.info(`Fetching students with unsubmitted study plans`);
      const students =
        await this.userService.getStudentsWithUnsubmittedStudyPlan();
      this.logger.info(
        `Found ${students.length} students with unsubmitted plans`
      );
      res.status(200).json(students);
    } catch (error: any) {
      this.logger.error(
        `Fetch students with unsubmitted plans failed: ${error.message}`
      );
      res.status(500).json({
        success: false,
        message: "Failed to fetch students with unsubmitted plans",
      });
    }
  }
}
