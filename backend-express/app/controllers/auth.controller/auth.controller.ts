import { Request, Response, Router } from "express";
import { Service } from "typedi";
import { LoginRequest } from "@common/user";
import { Logger } from "@app/services/logger.service/logger.service";
import { AuthService } from "@app/services/auth.service/auth.service";

@Service()
export class AuthController {
  public router: Router;

  constructor(
    private logger: Logger,
    private authService: AuthService
  ) {
    this.configureRouter();
  }

  private configureRouter(): void {
    this.router = Router();
    this.router.post("/login", this.login.bind(this));
  }

  private async login(req: Request, res: Response): Promise<void> {
    try {
      const loginData: LoginRequest = req.body;

      if (!loginData.usercode) {
        res.status(400).json({
          success: false,
          message: 'Usercode is required'
        });
        return;
      }

      const user = await this.authService.authenticateUser(loginData);

      if (!user) {
        this.logger.info(`Failed login ${loginData.usercode}: Attempt to login as student with no registered account`);
        res.status(401).redirect('/connexion-denied');
        return;
      }

      this.logger.info(`Successful login for ${user.usercode} with role ${user.role}`);

      res.status(200).json({
        success: true,
        user
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Login failed: ${errorMessage}`);

      res.status(500).json({
        success: false,
        message: 'Authentication failed'
      });
    }
  }
}