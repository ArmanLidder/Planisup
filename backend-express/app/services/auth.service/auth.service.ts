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

    // Check if account already exists and connect
    const existingUser = await UserModel.findOne({ usercode });
    if (existingUser) {
      this.logger.info(`${usercode} already exists`);
      return convertUserInterface(existingUser);
    }
    // For employees account creation
    const isEmployee = this.determineUserRole(usercode) === UserRole.Employe;
    if (isEmployee) return this.createEmployeeAccount(loginData);
    return null;
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
      currentPlan: "",
      plans: [""],
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

  private async createEmployeeAccount(loginData: LoginRequest): Promise<User> {
    try {
      const userData = this.prepareUserData(loginData);
      const newUser = await UserModel.create(userData);
      this.logger.info(`${loginData.usercode} account newly created with role: ${userData.role}`);
      return convertUserInterface(newUser);
    } catch (error) {
      this.logger.error(`Failed to create user account for ${loginData.usercode}: ${error}`);
      throw new Error('Failed to create user account');
    }
  }
}