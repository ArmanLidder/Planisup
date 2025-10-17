import { expect } from 'chai';
import { describe, it, beforeEach, afterEach } from 'mocha';
import * as sinon from 'sinon';
import { Request, Response, NextFunction } from 'express';
import { AuthController } from './auth.controller';
import { Logger } from '@app/services/logger.service/logger.service';
import { AuthService } from '@app/services/auth.service/auth.service';
import { LoginRequest, User, UserRole } from '@common/user';

describe('AuthController', () => {
  let authController: AuthController;
  let mockLogger: sinon.SinonStubbedInstance<Logger>;
  let mockAuthService: sinon.SinonStubbedInstance<AuthService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: sinon.SinonStub;
  let responseJson: sinon.SinonStub;
  let responseStatus: sinon.SinonStub;

  beforeEach(() => {
    mockLogger = sinon.createStubInstance(Logger);
    mockAuthService = sinon.createStubInstance(AuthService);
    
    responseJson = sinon.stub();
    responseStatus = sinon.stub().returns({ json: responseJson });
    mockNext = sinon.stub() as sinon.SinonStub & NextFunction;
    
    mockRequest = {
      body: {}
    };
    
    mockResponse = {
      status: responseStatus,
      json: responseJson
    };

    authController = new AuthController(mockLogger, mockAuthService);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('constructor', () => {
    it('should initialize router with login route', () => {
      expect(authController.router).to.exist;
      expect(authController.router.stack).to.have.lengthOf(1);
      expect(authController.router.stack[0].route.path).to.equal('/login');
    });
  });

  describe('POST /login', () => {
    it('should successfully authenticate user and return 200', async () => {
      const loginData: Partial<LoginRequest> = { usercode: 'testuser' };
      const expectedUser: User = { 
        _id: 'user123',
        usercode: 'testuser', 
        firstName: 'Test',
        lastName: 'User',
        role: 'admin' as UserRole,
        currentPlan: undefined,
        plans: ['plan1']
      };
      
      mockRequest.body = loginData;
      mockAuthService.authenticateUser.resolves(expectedUser);

      await authController.router.stack[0].route.stack[0].handle(
        mockRequest as Request, 
        mockResponse as Response, 
        mockNext
      );

      expect(mockAuthService.authenticateUser.calledOnce).to.be.true;
      expect(mockLogger.info.calledOnceWith('Successful login for testuser with role admin')).to.be.true;
      expect(responseStatus.calledOnceWith(200)).to.be.true;
      expect(responseJson.calledOnceWith({
        success: true,
        user: expectedUser
      })).to.be.true;
    });

    it('should return 400 when usercode is missing', async () => {
      mockRequest.body = {};

      await authController.router.stack[0].route.stack[0].handle(
        mockRequest as Request, 
        mockResponse as Response, 
        mockNext
      );

      expect(mockAuthService.authenticateUser.called).to.be.false;
      expect(responseStatus.calledOnceWith(400)).to.be.true;
      expect(responseJson.calledOnceWith({
        success: false,
        message: 'Usercode is required'
      })).to.be.true;
    });

    it('should return 400 when usercode is empty string', async () => {
      mockRequest.body = { usercode: '' };

      await authController.router.stack[0].route.stack[0].handle(
        mockRequest as Request, 
        mockResponse as Response, 
        mockNext
      );

      expect(mockAuthService.authenticateUser.called).to.be.false;
      expect(responseStatus.calledOnceWith(400)).to.be.true;
      expect(responseJson.calledOnceWith({
        success: false,
        message: 'Usercode is required'
      })).to.be.true;
    });

    it('should return 500 when AuthService throws an Error', async () => {
      const loginData: Partial<LoginRequest> = { usercode: 'testuser' };
      const error = new Error('Authentication failed');
      
      mockRequest.body = loginData;
      mockAuthService.authenticateUser.rejects(error);

      await authController.router.stack[0].route.stack[0].handle(
        mockRequest as Request, 
        mockResponse as Response, 
        mockNext
      );

      expect(mockAuthService.authenticateUser.calledOnce).to.be.true;
      expect(mockLogger.error.calledOnceWith('Login failed: Authentication failed')).to.be.true;
      expect(responseStatus.calledOnceWith(500)).to.be.true;
      expect(responseJson.calledOnceWith({
        success: false,
        message: 'Authentication failed'
      })).to.be.true;
    });

    it('should return 500 when AuthService throws a non-Error object', async () => {
      const loginData = { usercode: 'testuser' };
      
      mockRequest.body = loginData;
      mockAuthService.authenticateUser.rejects('String error');

      await authController.router.stack[0].route.stack[0].handle(
        mockRequest as Request, 
        mockResponse as Response, 
        mockNext
      );

      expect(mockAuthService.authenticateUser.calledOnce).to.be.true;
      expect(mockLogger.error.calledOnceWith('Login failed: Unknown error')).to.be.true;
      expect(responseStatus.calledOnceWith(500)).to.be.true;
      expect(responseJson.calledOnceWith({
        success: false,
        message: 'Authentication failed'
      })).to.be.true;
    });

    it('should handle usercode with whitespace as valid', async () => {
      const loginData: Partial<LoginRequest> = { usercode: 'test user' };
      const expectedUser: User = { 
        _id: 'user456',
        usercode: 'test user', 
        firstName: 'Test',
        lastName: 'User',
        role: 'user' as UserRole,
        currentPlan: undefined,
        plans: ['plan2']
      };
      
      mockRequest.body = loginData;
      mockAuthService.authenticateUser.resolves(expectedUser);

      await authController.router.stack[0].route.stack[0].handle(
        mockRequest as Request, 
        mockResponse as Response, 
        mockNext
      );

      expect(mockAuthService.authenticateUser.calledOnce).to.be.true;
      expect(responseStatus.calledOnceWith(200)).to.be.true;
      expect(responseJson.calledOnceWith({
        success: true,
        user: expectedUser
      })).to.be.true;
    });
  });
});
