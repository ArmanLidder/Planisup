import { Service } from 'typedi';
import { UserModel, IUser, convertUserInterface } from '@app/models/user.model/user.model';
import { LoginRequest, User, UserRole } from '@common/user';
import { Logger } from '@app/services/logger.service/logger.service';

@Service()
export class AuthService {
  constructor(private logger: Logger) {}

  async authenticateUser(loginData: LoginRequest): Promise<User> {
    const { usercode } = loginData;
    this.logger.info(`Login attempt for usercode: ${usercode}`);

    const existingUser = await UserModel.findOne({ usercode });

    if (existingUser) {
      this.logger.info(`${usercode} already exists`);
      return convertUserInterface(existingUser);
    }

    const userData = this.prepareUserData(loginData);

    try {
      const newUser = await UserModel.create(userData);
      this.logger.info(`${usercode} account newly created with role: ${userData.role}`);
      return convertUserInterface(newUser);
    } catch (error) {
      this.logger.error(`Failed to create user account for ${usercode}: ${error}`);
      throw new Error('Failed to create user account');
    }
  }

  private prepareUserData(loginData: LoginRequest): Partial<IUser> {
    const { usercode, firstName, lastName } = loginData;

    // Determine role based on usercode
    const role = this.determineUserRole(usercode);

    return {
      usercode,
      firstName: firstName || '',
      lastName: lastName || '',
      role,
      currentPlan: {},
      plans: null,
    };
  }

  private determineUserRole(usercode: string): UserRole {
    const normalizedCode = usercode.toLowerCase().trim();
    const employeePattern = /^p\d+$/;

    // If it matches the employee pattern (p followed by digits only)
    if (employeePattern.test(normalizedCode)) {
      return UserRole.Employe;
    }
    return UserRole.Etudiant;
  }
}