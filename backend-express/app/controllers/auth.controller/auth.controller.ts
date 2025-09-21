import { Request, Response, Router } from "express";
import { Service } from "typedi";
import {
  UserModel,
  IUser,
  convertUserInterface,
} from "@app/models/user.model/user.model";
import { LoginRequest } from "@common/user";
import { Logger } from "@app/services/logger.service/logger.service";

@Service()
export class AuthController {
  public router: Router;

  constructor(private logger: Logger) {
    this.configureRouter();
  }

  private configureRouter(): void {
    this.router = Router();

    this.router.post("/login", async (req: Request, res: Response) => {
      const loginData: Partial<IUser> = req.body as LoginRequest;
      const { usercode, role } = loginData;
      this.logger.info(`Login attempt:\nusercode: ${usercode}\nrole: ${role}`);
      const user: IUser = await UserModel.findOne({ usercode });
      if (user) {
        this.logger.info(`${usercode} already exist`);
        return res.status(200).json(convertUserInterface(user));
      } else {
        try {
          const newUser = await UserModel.create(loginData);
          this.logger.info(`${usercode} account newly crated`);
          return res.status(200).json(convertUserInterface(newUser));
        } catch (error) {
          this.logger.info(`login attempt failed: ${usercode}.`);
          return res.status(401);
        }
      }
    });
  }
}
