import { expect } from 'chai';
import { describe, it, beforeEach, afterEach } from 'mocha';
import * as sinon from 'sinon';
import { AuthService } from './auth.service';
import { Logger } from '@app/services/logger.service/logger.service';
import { UserModel, IUser } from '@app/models/user.model/user.model';
import { LoginRequest, User, UserRole } from '@common/user';

describe('AuthService', () => {
  let authService: AuthService;
  let mockLogger: sinon.SinonStubbedInstance<Logger>;
  let userModelFindOneStub: sinon.SinonStub;
  let userModelCreateStub: sinon.SinonStub;
  let convertUserInterfaceStub: sinon.SinonStub;

  beforeEach(() => {
    mockLogger = sinon.createStubInstance(Logger);
    
    // Stub UserModel methods
    userModelFindOneStub = sinon.stub(UserModel, 'findOne');
    userModelCreateStub = sinon.stub(UserModel, 'create');
    
    // Stub convertUserInterface function
    convertUserInterfaceStub = sinon.stub();
    sinon.replace(require('@app/models/user.model/user.model'), 'convertUserInterface', convertUserInterfaceStub);

    authService = new AuthService(mockLogger);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('authenticateUser', () => {
    describe('existing user authentication', () => {
      it('should authenticate existing user successfully', async () => {
        const loginData: LoginRequest = {
          usercode: 'existing123',
          firstName: 'John',
          lastName: 'Doe'
        };

        const existingUserDoc: Partial<IUser> = {
          usercode: 'existing123',
          firstName: 'John',
          lastName: 'Doe',
          role: UserRole.Etudiant
        };

        const convertedUser: User = {
          _id: 'user123',
          usercode: 'existing123',
          firstName: 'John',
          lastName: 'Doe',
          role: UserRole.Etudiant,
          currentPlan: undefined,
          plans: ['plan1']
        };

        userModelFindOneStub.resolves(existingUserDoc);
        convertUserInterfaceStub.returns(convertedUser);

        const result = await authService.authenticateUser(loginData);

        expect(mockLogger.info.calledWith('Login attempt for usercode: existing123')).to.be.true;
        expect(mockLogger.info.calledWith('existing123 already exists')).to.be.true;
        expect(userModelFindOneStub.calledOnceWith({ usercode: 'existing123' })).to.be.true;
        expect(convertUserInterfaceStub.calledOnceWith(existingUserDoc)).to.be.true;
        expect(userModelCreateStub.called).to.be.false;
        expect(result).to.deep.equal(convertedUser);
      });
    });

    describe('new user creation', () => {
      it('should create new student user successfully', async () => {
        const loginData: LoginRequest = {
          usercode: 'student123',
          firstName: 'Jane',
          lastName: 'Smith'
        };

        const newUserDoc: Partial<IUser> = {
          usercode: 'student123',
          firstName: 'Jane',
          lastName: 'Smith',
          role: UserRole.Etudiant,
          currentPlan: '',
          plans: ['']
        };

        const convertedUser: User = {
          _id: 'newuser123',
          usercode: 'student123',
          firstName: 'Jane',
          lastName: 'Smith',
          role: UserRole.Etudiant,
          currentPlan: undefined,
          plans: ['plan1']
        };

        userModelFindOneStub.resolves(null);
        userModelCreateStub.resolves(newUserDoc);
        convertUserInterfaceStub.returns(convertedUser);

        const result = await authService.authenticateUser(loginData);

        expect(mockLogger.info.calledWith('Login attempt for usercode: student123')).to.be.true;
        expect(mockLogger.info.calledWith('student123 account newly created with role: ETUDIANT')).to.be.true;
        expect(userModelFindOneStub.calledOnceWith({ usercode: 'student123' })).to.be.true;
        expect(userModelCreateStub.calledOnce).to.be.true;
        expect(convertUserInterfaceStub.calledOnceWith(newUserDoc)).to.be.true;
        expect(result).to.deep.equal(convertedUser);
      });

      it('should create new employee user successfully', async () => {
        const loginData: LoginRequest = {
          usercode: 'p123456',
          firstName: 'Bob',
          lastName: 'Wilson'
        };

        const newUserDoc: Partial<IUser> = {
          usercode: 'p123456',
          firstName: 'Bob',
          lastName: 'Wilson',
          role: UserRole.Employe,
          currentPlan: '',
          plans: ['']
        };

        const convertedUser: User = {
          _id: 'employee123',
          usercode: 'p123456',
          firstName: 'Bob',
          lastName: 'Wilson',
          role: UserRole.Employe,
          currentPlan: undefined,
          plans: ['plan1']
        };

        userModelFindOneStub.resolves(null);
        userModelCreateStub.resolves(newUserDoc);
        convertUserInterfaceStub.returns(convertedUser);

        const result = await authService.authenticateUser(loginData);

        expect(mockLogger.info.calledWith('p123456 account newly created with role: EMPLOYE')).to.be.true;
        expect(result.role).to.equal(UserRole.Employe);
      });

      it('should handle missing firstName and lastName', async () => {
        const loginData: LoginRequest = {
          usercode: 'test123',
          firstName: 'Test',
          lastName: 'User'
        };

        const newUserDoc: Partial<IUser> = {
          usercode: 'test123',
          firstName: '',
          lastName: '',
          role: UserRole.Etudiant,
          currentPlan: '',
          plans: ['']
        };

        const convertedUser: User = {
          _id: 'user123',
          usercode: 'test123',
          firstName: '',
          lastName: '',
          role: UserRole.Etudiant,
          currentPlan: undefined,
          plans: ['plan1']
        };

        userModelFindOneStub.resolves(null);
        userModelCreateStub.resolves(newUserDoc);
        convertUserInterfaceStub.returns(convertedUser);

        const result = await authService.authenticateUser(loginData);

        const createCall = userModelCreateStub.firstCall.args[0];
        expect(createCall.firstName).to.equal('Test');
        expect(createCall.lastName).to.equal('User');
        expect(result).to.deep.equal(convertedUser);
      });
    });

    describe('role determination', () => {
      it('should assign Employe role for employee pattern usercode', async () => {
        const testCases = ['p123', 'P456', 'p999999'];

        for (const usercode of testCases) {
          const loginData: LoginRequest = { 
            usercode,
            firstName: 'Test',
            lastName: 'User'
          };
          
          userModelFindOneStub.resolves(null);
          userModelCreateStub.resolves({});
          convertUserInterfaceStub.returns({} as User);

          await authService.authenticateUser(loginData);

          const createCall = userModelCreateStub.lastCall.args[0];
          expect(createCall.role).to.equal(UserRole.Employe);
        }
      });

      it('should assign Etudiant role for non-employee usercode', async () => {
        const testCases = ['student123', 'abc123', 'p123abc', '123p456'];

        for (const usercode of testCases) {
          const loginData: LoginRequest = { 
            usercode,
            firstName: 'Test',
            lastName: 'User'
          };
          
          userModelFindOneStub.resolves(null);
          userModelCreateStub.resolves({});
          convertUserInterfaceStub.returns({} as User);

          await authService.authenticateUser(loginData);

          const createCall = userModelCreateStub.lastCall.args[0];
          expect(createCall.role).to.equal(UserRole.Etudiant);
        }
      });

      it('should handle case insensitive employee pattern', async () => {
        const loginData: LoginRequest = { 
          usercode: 'P123',
          firstName: 'Test',
          lastName: 'User'
        };
        
        userModelFindOneStub.resolves(null);
        userModelCreateStub.resolves({});
        convertUserInterfaceStub.returns({} as User);

        await authService.authenticateUser(loginData);

        const createCall = userModelCreateStub.firstCall.args[0];
        expect(createCall.role).to.equal(UserRole.Employe);
      });

      it('should trim whitespace in usercode for role determination', async () => {
        const loginData: LoginRequest = { 
          usercode: '  p123  ',
          firstName: 'Test',
          lastName: 'User'
        };
        
        userModelFindOneStub.resolves(null);
        userModelCreateStub.resolves({});
        convertUserInterfaceStub.returns({} as User);

        await authService.authenticateUser(loginData);

        const createCall = userModelCreateStub.firstCall.args[0];
        expect(createCall.role).to.equal(UserRole.Employe);
      });
    });

    describe('error handling', () => {
      it('should throw error when user creation fails', async () => {
        const loginData: LoginRequest = {
          usercode: 'failuser',
          firstName: 'Test',
          lastName: 'User'
        };

        const createError = new Error('Database constraint violation');

        userModelFindOneStub.resolves(null);
        userModelCreateStub.rejects(createError);

        try {
          await authService.authenticateUser(loginData);
          expect.fail('Should have thrown an error');
        } catch (error) {
          expect(error).to.be.instanceOf(Error);
          expect(error.message).to.equal('Failed to create user account');
          expect(mockLogger.error.calledWith('Failed to create user account for failuser: Error: Database constraint violation')).to.be.true;
        }
      });

      it('should handle UserModel.findOne errors', async () => {
        const loginData: LoginRequest = {
          usercode: 'testuser',
          firstName: 'Test',
          lastName: 'User'
        };

        const findError = new Error('Database connection failed');
        userModelFindOneStub.rejects(findError);

        try {
          await authService.authenticateUser(loginData);
          expect.fail('Should have thrown an error');
        } catch (error) {
          expect(error).to.equal(findError);
          expect(mockLogger.info.calledWith('Login attempt for usercode: testuser')).to.be.true;
        }
      });
    });

    describe('data preparation', () => {
      it('should prepare user data correctly for student', async () => {
        const loginData: LoginRequest = {
          usercode: 'student123',
          firstName: 'John',
          lastName: 'Doe'
        };

        userModelFindOneStub.resolves(null);
        userModelCreateStub.resolves({});
        convertUserInterfaceStub.returns({} as User);

        await authService.authenticateUser(loginData);

        const createCall = userModelCreateStub.firstCall.args[0];
        expect(createCall).to.deep.equal({
          usercode: 'student123',
          firstName: 'John',
          lastName: 'Doe',
          role: UserRole.Etudiant,
          currentPlan: '',
          plans: ['']
        });
      });

      it('should prepare user data correctly for employee', async () => {
        const loginData: LoginRequest = {
          usercode: 'p12345',
          firstName: 'Jane',
          lastName: 'Smith'
        };

        userModelFindOneStub.resolves(null);
        userModelCreateStub.resolves({});
        convertUserInterfaceStub.returns({} as User);

        await authService.authenticateUser(loginData);

        const createCall = userModelCreateStub.firstCall.args[0];
        expect(createCall).to.deep.equal({
          usercode: 'p12345',
          firstName: 'Jane',
          lastName: 'Smith',
          role: UserRole.Employe,
          currentPlan: '',
          plans: ['']
        });
      });
    });
  });
});
