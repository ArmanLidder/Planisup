import { Service } from 'typedi';
import { UserModel, IUser, convertUserInterface } from '@app/models/user.model/user.model';
import { User, UserRole } from '@common/user';
import { Logger } from '@app/services/logger.service/logger.service';

export interface UpdateUserRoleRequest {
  userId: string;
  newRole: UserRole;
}

@Service()
export class UserService {
  constructor(private logger: Logger) {}

  async getAllUsers(): Promise<User[]> {
    try {
      const users = await UserModel.find().select('-__v').lean<IUser[]>();
      return users.map(user => convertUserInterface(user));
    } catch (error) {
      this.logger.error(`Error fetching all users: ${error}`);
      throw new Error('Failed to fetch users');
    }
  }

  async getEmployees(userRoles: UserRole[]): Promise<User[]> {
    try {
      const users = await UserModel.find({ role: { $in: userRoles } }).select('-__v').lean<IUser[]>();
      return users.map(user => convertUserInterface(user));
    } catch (error) {
      this.logger.error(`Error fetching all ${userRoles.join(', ')} users: ${error}`);
      throw new Error(`Failed to fetch ${userRoles.join(', ')} users`);
    }
  }

  async updateUserRole(userId: string, newRole: UserRole, departement?: string[]): Promise<User> {
    try {
      const query = departement ? { role: newRole, department: departement } : { role: newRole };
      const updatedUser = await UserModel.findByIdAndUpdate(
        userId,
        query,
        { new: true }
      );

      if (!updatedUser) {
        throw new Error('User not found');
      }

      this.logger.info(`User ${updatedUser.usercode} role updated to ${newRole}`);
      return convertUserInterface(updatedUser);
    } catch (error) {
      this.logger.error(`Error updating user role for ${userId}: ${error}`);
      throw new Error('Failed to update user role');
    }
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      const deletedUser = await UserModel.findByIdAndDelete(userId);
      if (!deletedUser) {
        throw new Error('User not found');
      }
      this.logger.info(`User ${deletedUser.usercode} deleted`);
    } catch (error) {
      this.logger.error(`Error deleting user ${userId}: ${error}`);
      throw new Error('Failed to delete user');
    }
  }

  async getUserById(userId: string): Promise<User | null> {
    try {
      const user = await UserModel.findById(userId).select('-__v');
      return user ? convertUserInterface(user) : null;
    } catch (error) {
      this.logger.error(`Error fetching user by ID ${userId}: ${error}`);
      throw new Error('Failed to fetch user');
    }
  }

  async getUserByUsercode(usercode: string): Promise<User | null> {
    try {
      const user = await UserModel.findOne({ usercode }).select('-__v');
      return user ? convertUserInterface(user) : null;
    } catch (error) {
      this.logger.error(`Error fetching user by usercode ${usercode}: ${error}`);
      throw new Error('Failed to fetch user');
    }
  }
}