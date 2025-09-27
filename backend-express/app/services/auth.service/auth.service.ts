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
    // If usercode starts with 'p', it's an employee
    if (usercode.toLowerCase().startsWith('p')) {
      return UserRole.Employe;
    }

    // Default to student for other usercodes
    return UserRole.Etudiant;
  }
}