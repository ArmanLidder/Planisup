import { expect } from 'chai';
import { describe, it, beforeEach, afterEach } from 'mocha';
import * as sinon from 'sinon';
import { Request, Response, NextFunction } from 'express';
import { UserController } from './user.controller';
import { Logger } from '@app/services/logger.service/logger.service';
import { UserService } from '@app/services/user.service/user.service';
import { User, UserRole } from '@common/user';

describe('UserController', () => {
  let userController: UserController;
  let mockLogger: sinon.SinonStubbedInstance<Logger>;
  let mockUserService: sinon.SinonStubbedInstance<UserService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: sinon.SinonStub;
  let responseJson: sinon.SinonStub;
  let responseStatus: sinon.SinonStub;

  beforeEach(() => {
    mockLogger = sinon.createStubInstance(Logger);
    mockUserService = sinon.createStubInstance(UserService);
    
    responseJson = sinon.stub();
    responseStatus = sinon.stub().returns({ json: responseJson });
    mockNext = sinon.stub() as sinon.SinonStub & NextFunction;
    
    mockRequest = {
      params: {},
      body: {},
      headers: {}
    };
    
    mockResponse = {
      status: responseStatus,
      json: responseJson
    };

    userController = new UserController(mockUserService, mockLogger);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('constructor', () => {
    it('should initialize router with four routes', () => {
      expect(userController.router).to.exist;
      expect(userController.router.stack).to.have.lengthOf(4);
      expect(userController.router.stack[0].route.path).to.equal('/');
      expect(userController.router.stack[1].route.path).to.equal('/:id');
      expect(userController.router.stack[2].route.path).to.equal('/:id/role');
      expect(userController.router.stack[3].route.path).to.equal('/:id');
    });
  });

  describe('GET /', () => {
    it('should successfully get all users and return 200', async () => {
      const mockUsers: User[] = [
        {
          _id: 'user1',
          usercode: 'testuser1',
          firstName: 'John',
          lastName: 'Doe',
          role: 'admin' as UserRole,
          currentPlan: undefined,
          plans: ['plan1']
        },
        {
          _id: 'user2',
          usercode: 'testuser2',
          firstName: 'Jane',
          lastName: 'Smith',
          role: 'user' as UserRole,
          currentPlan: undefined,
          plans: ['plan2']
        }
      ];
      
      mockUserService.getAllUsers.resolves(mockUsers);

      await userController.router.stack[0].route.stack[0].handle(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockLogger.info.calledOnceWith('Admin requested all users list')).to.be.true;
      expect(mockUserService.getAllUsers.calledOnce).to.be.true;
      expect(responseStatus.calledOnceWith(200)).to.be.true;
      expect(responseJson.calledOnceWith({
        success: true,
        users: mockUsers,
        count: 2
      })).to.be.true;
    });

    it('should return 500 when service throws error', async () => {
      const error = new Error('Database connection failed');
      
      mockUserService.getAllUsers.rejects(error);

      await userController.router.stack[0].route.stack[0].handle(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockLogger.info.calledOnceWith('Admin requested all users list')).to.be.true;
      expect(mockLogger.error.calledOnceWith('Get all users failed: Database connection failed')).to.be.true;
      expect(responseStatus.calledOnceWith(500)).to.be.true;
      expect(responseJson.calledOnceWith({
        success: false,
        message: 'Failed to fetch users'
      })).to.be.true;
    });

    it('should handle non-Error exceptions', async () => {
      const errorString = 'Service unavailable';
      
      mockUserService.getAllUsers.rejects(errorString);

      await userController.router.stack[0].route.stack[0].handle(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockLogger.error.calledOnceWith('Get all users failed: Unknown error')).to.be.false;
      expect(responseStatus.calledOnceWith(500)).to.be.true;
      expect(responseJson.calledOnceWith({
        success: false,
        message: 'Failed to fetch users'
      })).to.be.true;
    });
  });

  describe('GET /:id', () => {
    it('should successfully get user by id and return 200', async () => {
      const userId = 'user123';
      const mockUser: User = {
        _id: userId,
        usercode: 'testuser',
        firstName: 'John',
        lastName: 'Doe',
        role: 'admin' as UserRole,
        currentPlan: undefined,
        plans: ['plan1']
      };
      
      mockRequest.params = { id: userId };
      mockUserService.getUserById.resolves(mockUser);

      await userController.router.stack[1].route.stack[0].handle(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockLogger.info.calledOnceWith(`Requested user details for ID: ${userId}`)).to.be.false;
      expect(mockLogger.info.calledWith(`Successfully retrieved user: ${mockUser.usercode}`)).to.be.true;
      expect(mockUserService.getUserById.calledOnceWith(userId)).to.be.true;
      expect(responseStatus.calledOnceWith(200)).to.be.true;
      expect(responseJson.calledOnceWith({
        success: true,
        user: mockUser
      })).to.be.true;
    });

    it('should return 404 when user not found', async () => {
      const userId = 'nonexistent';
      
      mockRequest.params = { id: userId };
      mockUserService.getUserById.resolves(null);

      await userController.router.stack[1].route.stack[0].handle(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockLogger.info.calledOnceWith(`Requested user details for ID: ${userId}`)).to.be.true;
      expect(mockLogger.warn.calledOnceWith(`User not found with ID: ${userId}`)).to.be.true;
      expect(responseStatus.calledOnceWith(404)).to.be.true;
      expect(responseJson.calledOnceWith({
        success: false,
        message: 'User not found'
      })).to.be.true;
    });

    it('should return 500 when service throws error', async () => {
      const userId = 'user123';
      const error = new Error('Database error');
      
      mockRequest.params = { id: userId };
      mockUserService.getUserById.rejects(error);

      await userController.router.stack[1].route.stack[0].handle(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockLogger.error.calledOnceWith('Get user by ID failed: Database error')).to.be.true;
      expect(responseStatus.calledOnceWith(500)).to.be.true;
      expect(responseJson.calledOnceWith({
        success: false,
        message: 'Failed to fetch user'
      })).to.be.true;
    });
  });

  describe('PATCH /:id/role', () => {
    it('should successfully update user role and return 200', async () => {
      const userId = 'user123';
      const newRole = UserRole.Administrateur;
      const updatedUser: User = {
        _id: userId,
        usercode: 'testuser',
        firstName: 'John',
        lastName: 'Doe',
        role: newRole,
        currentPlan: undefined,
        plans: ['plan1']
      };
      
      mockRequest.params = { id: userId };
      mockRequest.body = { newRole };
      mockUserService.updateUserRole.resolves(updatedUser);

      await userController.router.stack[2].route.stack[0].handle(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockLogger.info.calledOnceWith(`User ${userId} role updated to ${newRole}`)).to.be.true;
      expect(mockUserService.updateUserRole.calledOnceWith(userId, newRole)).to.be.true;
      expect(responseStatus.calledOnceWith(200)).to.be.true;
      expect(responseJson.calledOnceWith({
        success: true,
        user: updatedUser,
        message: `User role updated to ${newRole}`
      })).to.be.true;
    });

    it('should return 400 when invalid role is provided', async () => {
      const userId = 'user123';
      const invalidRole = 'invalidRole';
      
      mockRequest.params = { id: userId };
      mockRequest.body = { newRole: invalidRole };

      await userController.router.stack[2].route.stack[0].handle(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockUserService.updateUserRole.called).to.be.false;
      expect(responseStatus.calledOnceWith(400)).to.be.true;
      expect(responseJson.calledOnceWith({
        success: false,
        message: 'Invalid role specified'
      })).to.be.true;
    });

    it('should return 500 when service throws error', async () => {
      const userId = 'user123';
      const newRole = UserRole.Etudiant;
      const error = new Error('Update failed');
      
      mockRequest.params = { id: userId };
      mockRequest.body = { newRole };
      mockUserService.updateUserRole.rejects(error);

      await userController.router.stack[2].route.stack[0].handle(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockLogger.error.calledOnceWith('Update user role failed: Update failed')).to.be.true;
      expect(responseStatus.calledOnceWith(500)).to.be.true;
      expect(responseJson.calledOnceWith({
        success: false,
        message: 'Failed to update user role'
      })).to.be.true;
    });

    it('should handle all valid UserRole values', async () => {
      const userId = 'user123';
      const validRoles = [
        UserRole.Etudiant,
        UserRole.Directeur,
        UserRole.Agent,
        UserRole.Coordonnateur,
        UserRole.Administrateur
      ];

      for (const role of validRoles) {
        const updatedUser: User = {
          _id: userId,
          usercode: 'testuser',
          firstName: 'John',
          lastName: 'Doe',
          role: role,
          currentPlan: undefined,
          plans: ['plan1']
        };

        mockRequest.params = { id: userId };
        mockRequest.body = { newRole: role };
        mockUserService.updateUserRole.resolves(updatedUser);

        await userController.router.stack[2].route.stack[0].handle(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(responseStatus.calledWith(200)).to.be.true;
      }
    });
  });

  describe('DELETE /:id', () => {
    it('should successfully delete user and return 200', async () => {
      const userId = 'user123';
      
      mockRequest.params = { id: userId };
      mockUserService.deleteUser.resolves();

      await userController.router.stack[3].route.stack[0].handle(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockUserService.deleteUser.calledOnceWith(userId)).to.be.true;
      expect(responseStatus.calledOnceWith(200)).to.be.true;
      expect(responseJson.calledOnceWith({
        success: true,
        message: 'User deleted successfully'
      })).to.be.true;
    });

    it('should return 500 when service throws error', async () => {
      const userId = 'user123';
      const error = new Error('Delete failed');
      
      mockRequest.params = { id: userId };
      mockUserService.deleteUser.rejects(error);

      await userController.router.stack[3].route.stack[0].handle(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockLogger.error.calledOnceWith('Delete user failed: Delete failed')).to.be.true;
      expect(responseStatus.calledOnceWith(500)).to.be.true;
      expect(responseJson.calledOnceWith({
        success: false,
        message: 'Failed to delete user'
      })).to.be.true;
    });

    it('should handle non-Error exceptions in delete', async () => {
      const userId = 'user123';
      const errorString = 'Database unavailable';
      
      mockRequest.params = { id: userId };
      mockUserService.deleteUser.rejects(errorString);

      await userController.router.stack[3].route.stack[0].handle(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockLogger.error.calledOnceWith('Delete user failed: Unknown error')).to.be.false;
      expect(responseStatus.calledOnceWith(500)).to.be.true;
      expect(responseJson.calledOnceWith({
        success: false,
        message: 'Failed to delete user'
      })).to.be.true;
    });
  });
});
