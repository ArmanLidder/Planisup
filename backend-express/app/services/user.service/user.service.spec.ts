import { expect } from 'chai';
import { describe, it, beforeEach, afterEach } from 'mocha';
import * as sinon from 'sinon';
import { UserService } from './user.service';
import { Logger } from '@app/services/logger.service/logger.service';
import { UserModel, IUser } from '@app/models/user.model/user.model';
import { User, UserRole } from '@common/user';

describe('UserService', () => {
  let userService: UserService;
  let mockLogger: sinon.SinonStubbedInstance<Logger>;
  let userModelFindStub: sinon.SinonStub;
  let userModelFindByIdStub: sinon.SinonStub;
  let userModelFindOneStub: sinon.SinonStub;
  let userModelFindByIdAndUpdateStub: sinon.SinonStub;
  let userModelFindByIdAndDeleteStub: sinon.SinonStub;
  let convertUserInterfaceStub: sinon.SinonStub;

  beforeEach(() => {
    mockLogger = sinon.createStubInstance(Logger);
    
    // Stub UserModel methods
    userModelFindStub = sinon.stub(UserModel, 'find');
    userModelFindByIdStub = sinon.stub(UserModel, 'findById');
    userModelFindOneStub = sinon.stub(UserModel, 'findOne');
    userModelFindByIdAndUpdateStub = sinon.stub(UserModel, 'findByIdAndUpdate');
    userModelFindByIdAndDeleteStub = sinon.stub(UserModel, 'findByIdAndDelete');
    
    // Stub convertUserInterface function
    convertUserInterfaceStub = sinon.stub();
    sinon.replace(require('@app/models/user.model/user.model'), 'convertUserInterface', convertUserInterfaceStub);

    userService = new UserService(mockLogger);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('getAllUsers', () => {
    it('should successfully return all users', async () => {
      const mockUserDocs: Partial<IUser>[] = [
        {
          _id: 'user1',
          usercode: 'testuser1',
          firstName: 'John',
          lastName: 'Doe',
          role: UserRole.Etudiant,
          currentPlan: '',
          plans: ['plan1'] as [string]
        },
        {
          _id: 'user2',
          usercode: 'testuser2',
          firstName: 'Jane',
          lastName: 'Smith',
          role: UserRole.Directeur,
          currentPlan: 'plan2',
          plans: ['plan2'] as [string]
        }
      ];

      const convertedUsers: User[] = [
        {
          _id: 'user1',
          usercode: 'testuser1',
          firstName: 'John',
          lastName: 'Doe',
          role: UserRole.Etudiant,
          currentPlan: undefined,
          plans: ['plan1'] as [string]
        },
        {
          _id: 'user2',
          usercode: 'testuser2',
          firstName: 'Jane',
          lastName: 'Smith',
          role: UserRole.Directeur,
          currentPlan: 'plan2',
          plans: ['plan2'] as [string]
        }
      ];

      const mockSelect = sinon.stub().returns({ lean: sinon.stub().resolves(mockUserDocs) });
      userModelFindStub.returns({ select: mockSelect });
      convertUserInterfaceStub.onFirstCall().returns(convertedUsers[0]);
      convertUserInterfaceStub.onSecondCall().returns(convertedUsers[1]);

      const result = await userService.getAllUsers();

      expect(userModelFindStub.calledOnce).to.be.true;
      expect(mockSelect.calledOnceWith('-__v')).to.be.true;
      expect(convertUserInterfaceStub.calledTwice).to.be.true;
      expect(convertUserInterfaceStub.firstCall.args[0]).to.equal(mockUserDocs[0]);
      expect(convertUserInterfaceStub.secondCall.args[0]).to.equal(mockUserDocs[1]);
      expect(result).to.deep.equal(convertedUsers);
    });

    it('should return empty array when no users found', async () => {
      const mockSelect = sinon.stub().returns({ lean: sinon.stub().resolves([]) });
      userModelFindStub.returns({ select: mockSelect });

      const result = await userService.getAllUsers();

      expect(userModelFindStub.calledOnce).to.be.true;
      expect(result).to.deep.equal([]);
      expect(convertUserInterfaceStub.called).to.be.false;
    });

    it('should throw error when database query fails', async () => {
      const error = new Error('Database connection failed');
      const mockSelect = sinon.stub().returns({ lean: sinon.stub().rejects(error) });
      userModelFindStub.returns({ select: mockSelect });

      try {
        await userService.getAllUsers();
        expect.fail('Should have thrown an error');
      } catch (thrownError) {
        expect(thrownError).to.be.instanceOf(Error);
        expect(thrownError.message).to.equal('Failed to fetch users');
        expect(mockLogger.error.calledOnce).to.be.true;
        expect(mockLogger.error.firstCall.args[0]).to.equal(`Error fetching all users: ${error}`);
      }
    });
  });

  describe('updateUserRole', () => {
    it('should successfully update user role', async () => {
      const userId = 'user123';
      const newRole = UserRole.Administrateur;
      const updatedUserDoc: Partial<IUser> = {
        _id: userId,
        usercode: 'testuser',
        firstName: 'John',
        lastName: 'Doe',
        role: newRole,
        currentPlan: '',
        plans: ['plan1']
      };

      const convertedUser: User = {
        _id: userId,
        usercode: 'testuser',
        firstName: 'John',
        lastName: 'Doe',
        role: newRole,
        currentPlan: undefined,
        plans: ['plan1'] as [string]
      };

      userModelFindByIdAndUpdateStub.resolves(updatedUserDoc);
      convertUserInterfaceStub.returns(convertedUser);

      const result = await userService.updateUserRole(userId, newRole);

      expect(userModelFindByIdAndUpdateStub.calledOnceWith(
        userId,
        { role: newRole },
        { new: true, runValidators: true }
      )).to.be.true;
      expect(mockLogger.info.calledOnceWith(`User ${updatedUserDoc.usercode} role updated to ${newRole}`)).to.be.true;
      expect(convertUserInterfaceStub.calledOnceWith(updatedUserDoc)).to.be.true;
      expect(result).to.deep.equal(convertedUser);
    });

    it('should throw error when user not found', async () => {
      const userId = 'nonexistent';
      const newRole = UserRole.Agent;

      userModelFindByIdAndUpdateStub.resolves(null);

      try {
        await userService.updateUserRole(userId, newRole);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.instanceOf(Error);
        expect(error.message).to.equal('Failed to update user role');
        expect(mockLogger.error.calledOnce).to.be.true;
        expect(mockLogger.error.firstCall.args[0]).to.equal(`Error updating user role for ${userId}: Error: User not found`);
      }
    });

    it('should throw error when database update fails', async () => {
      const userId = 'user123';
      const newRole = UserRole.Coordonnateur;
      const dbError = new Error('Database update failed');

      userModelFindByIdAndUpdateStub.rejects(dbError);

      try {
        await userService.updateUserRole(userId, newRole);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.instanceOf(Error);
        expect(error.message).to.equal('Failed to update user role');
        expect(mockLogger.error.calledOnce).to.be.true;
        expect(mockLogger.error.firstCall.args[0]).to.equal(`Error updating user role for ${userId}: ${dbError}`);
      }
    });

    it('should handle all valid UserRole values', async () => {
      const userId = 'user123';
      const validRoles = [
        UserRole.Etudiant,
        UserRole.Directeur,
        UserRole.Agent,
        UserRole.Coordonnateur,
        UserRole.Administrateur,
        UserRole.Employe,
        UserRole.Registrar
      ];

      for (const role of validRoles) {
        const updatedUserDoc: Partial<IUser> = {
          _id: userId,
          usercode: 'testuser',
          role: role
        };

        const convertedUser: User = {
          _id: userId,
          usercode: 'testuser',
          firstName: 'Test',
          lastName: 'User',
          role: role,
          currentPlan: undefined,
          plans: ['plan1'] as [string]
        };

        userModelFindByIdAndUpdateStub.resolves(updatedUserDoc);
        convertUserInterfaceStub.returns(convertedUser);

        const result = await userService.updateUserRole(userId, role);

        expect(result.role).to.equal(role);
        expect(userModelFindByIdAndUpdateStub.calledWith(
          userId,
          { role: role },
          { new: true, runValidators: true }
        )).to.be.true;
      }
    });
  });

  describe('deleteUser', () => {
    it('should successfully delete user', async () => {
      const userId = 'user123';
      const deletedUserDoc: Partial<IUser> = {
        _id: userId,
        usercode: 'testuser',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.Etudiant
      };

      userModelFindByIdAndDeleteStub.resolves(deletedUserDoc);

      await userService.deleteUser(userId);

      expect(userModelFindByIdAndDeleteStub.calledOnceWith(userId)).to.be.true;
      expect(mockLogger.info.calledOnceWith(`User ${deletedUserDoc.usercode} deleted`)).to.be.true;
    });

    it('should throw error when user not found for deletion', async () => {
      const userId = 'nonexistent';

      userModelFindByIdAndDeleteStub.resolves(null);

      try {
        await userService.deleteUser(userId);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.instanceOf(Error);
        expect(error.message).to.equal('Failed to delete user');
        expect(mockLogger.error.calledOnce).to.be.true;
        expect(mockLogger.error.firstCall.args[0]).to.equal(`Error deleting user ${userId}: Error: User not found`);
      }
    });

    it('should throw error when database deletion fails', async () => {
      const userId = 'user123';
      const dbError = new Error('Database deletion failed');

      userModelFindByIdAndDeleteStub.rejects(dbError);

      try {
        await userService.deleteUser(userId);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.instanceOf(Error);
        expect(error.message).to.equal('Failed to delete user');
        expect(mockLogger.error.calledOnce).to.be.true;
        expect(mockLogger.error.firstCall.args[0]).to.equal(`Error deleting user ${userId}: ${dbError}`);
      }
    });
  });

  describe('getUserById', () => {
    it('should successfully return user by id', async () => {
      const userId = 'user123';
      const userDoc: Partial<IUser> = {
        _id: userId,
        usercode: 'testuser',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.Etudiant,
        currentPlan: 'plan1',
        plans: ['plan1']
      };

      const convertedUser: User = {
        _id: userId,
        usercode: 'testuser',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.Etudiant,
        currentPlan: 'plan1',
        plans: ['plan1']
      };

      const mockSelect = sinon.stub().resolves(userDoc);
      userModelFindByIdStub.returns({ select: mockSelect });
      convertUserInterfaceStub.returns(convertedUser);

      const result = await userService.getUserById(userId);

      expect(userModelFindByIdStub.calledOnceWith(userId)).to.be.true;
      expect(mockSelect.calledOnceWith('-__v')).to.be.true;
      expect(convertUserInterfaceStub.calledOnceWith(userDoc)).to.be.true;
      expect(result).to.deep.equal(convertedUser);
    });

    it('should return null when user not found', async () => {
      const userId = 'nonexistent';

      const mockSelect = sinon.stub().resolves(null);
      userModelFindByIdStub.returns({ select: mockSelect });

      const result = await userService.getUserById(userId);

      expect(userModelFindByIdStub.calledOnceWith(userId)).to.be.true;
      expect(convertUserInterfaceStub.called).to.be.false;
      expect(result).to.be.null;
    });

    it('should throw error when database query fails', async () => {
      const userId = 'user123';
      const dbError = new Error('Database query failed');

      const mockSelect = sinon.stub().rejects(dbError);
      userModelFindByIdStub.returns({ select: mockSelect });

      try {
        await userService.getUserById(userId);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.instanceOf(Error);
        expect(error.message).to.equal('Failed to fetch user');
        expect(mockLogger.error.calledOnce).to.be.true;
        expect(mockLogger.error.firstCall.args[0]).to.equal(`Error fetching user by ID ${userId}: ${dbError}`);
      }
    });

    it('should handle invalid ObjectId format', async () => {
      const invalidId = 'invalid-id';
      const dbError = new Error('Cast to ObjectId failed');

      const mockSelect = sinon.stub().rejects(dbError);
      userModelFindByIdStub.returns({ select: mockSelect });

      try {
        await userService.getUserById(invalidId);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.instanceOf(Error);
        expect(error.message).to.equal('Failed to fetch user');
        expect(mockLogger.error.calledOnce).to.be.true;
        expect(mockLogger.error.firstCall.args[0]).to.equal(`Error fetching user by ID ${invalidId}: ${dbError}`);
      }
    });
  });

  describe('getUserByUsercode', () => {
    it('should successfully return user by usercode', async () => {
      const usercode = 'testuser123';
      const userDoc: Partial<IUser> = {
        _id: 'user123',
        usercode: usercode,
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.Etudiant,
        currentPlan: '',
        plans: ['plan1']
      };

      const convertedUser: User = {
        _id: 'user123',
        usercode: usercode,
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.Etudiant,
        currentPlan: undefined,
        plans: ['plan1'] as [string]
      };

      const mockSelect = sinon.stub().resolves(userDoc);
      userModelFindOneStub.returns({ select: mockSelect });
      convertUserInterfaceStub.returns(convertedUser);

      const result = await userService.getUserByUsercode(usercode);

      expect(userModelFindOneStub.calledOnceWith({ usercode })).to.be.true;
      expect(mockSelect.calledOnceWith('-__v')).to.be.true;
      expect(convertUserInterfaceStub.calledOnceWith(userDoc)).to.be.true;
      expect(result).to.deep.equal(convertedUser);
    });

    it('should return null when user not found by usercode', async () => {
      const usercode = 'nonexistent';

      const mockSelect = sinon.stub().resolves(null);
      userModelFindOneStub.returns({ select: mockSelect });

      const result = await userService.getUserByUsercode(usercode);

      expect(userModelFindOneStub.calledOnceWith({ usercode })).to.be.true;
      expect(convertUserInterfaceStub.called).to.be.false;
      expect(result).to.be.null;
    });

    it('should throw error when database query fails', async () => {
      const usercode = 'testuser123';
      const dbError = new Error('Database connection lost');

      const mockSelect = sinon.stub().rejects(dbError);
      userModelFindOneStub.returns({ select: mockSelect });

      try {
        await userService.getUserByUsercode(usercode);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.instanceOf(Error);
        expect(error.message).to.equal('Failed to fetch user');
        expect(mockLogger.error.calledOnce).to.be.true;
        expect(mockLogger.error.firstCall.args[0]).to.equal(`Error fetching user by usercode ${usercode}: ${dbError}`);
      }
    });

    it('should handle special characters in usercode', async () => {
      const usercode = 'test@user.123';
      const userDoc: Partial<IUser> = {
        _id: 'user123',
        usercode: usercode,
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.Etudiant
      };

      const convertedUser: User = {
        _id: 'user123',
        usercode: usercode,
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.Etudiant,
        currentPlan: undefined,
        plans: ['plan1'] as [string]
      };

      const mockSelect = sinon.stub().resolves(userDoc);
      userModelFindOneStub.returns({ select: mockSelect });
      convertUserInterfaceStub.returns(convertedUser);

      const result = await userService.getUserByUsercode(usercode);

      expect(userModelFindOneStub.calledOnceWith({ usercode })).to.be.true;
      expect(result).to.deep.equal(convertedUser);
    });

    it('should handle empty string usercode', async () => {
      const usercode = '';

      const mockSelect = sinon.stub().resolves(null);
      userModelFindOneStub.returns({ select: mockSelect });

      const result = await userService.getUserByUsercode(usercode);

      expect(userModelFindOneStub.calledOnceWith({ usercode: '' })).to.be.true;
      expect(result).to.be.null;
    });
  });

  describe('error handling edge cases', () => {
    it('should handle convertUserInterface throwing error', async () => {
      const userDoc: Partial<IUser> = {
        _id: 'user123',
        usercode: 'testuser'
      };

      const mockSelect = sinon.stub().returns({ lean: sinon.stub().resolves([userDoc]) });
      userModelFindStub.returns({ select: mockSelect });
      convertUserInterfaceStub.throws(new Error('Conversion failed'));

      try {
        await userService.getAllUsers();
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.instanceOf(Error);
        expect(error.message).to.equal('Failed to fetch users');
        expect(mockLogger.error.calledOnce).to.be.true;
      }
    });

    it('should handle non-Error exceptions', async () => {
      const userId = 'user123';
      const stringError = 'String error';

      userModelFindByIdAndDeleteStub.rejects(stringError);

      try {
        await userService.deleteUser(userId);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.instanceOf(Error);
        expect(error.message).to.equal('Failed to delete user');
        expect(mockLogger.error.calledOnce).to.be.true;
        expect(mockLogger.error.firstCall.args[0]).to.equal(`Error deleting user ${userId}: ${stringError}`);
      }
    });
  });
});
