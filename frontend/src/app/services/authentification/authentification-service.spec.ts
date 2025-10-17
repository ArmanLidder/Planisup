import { TestBed } from '@angular/core/testing';
import { AuthentificationService } from './authentification-service';
import { ApiService } from '../api/api-service';
import { LoginRequest, User, UserRole } from '../../../../../common/user';
import { of, throwError } from 'rxjs';

describe('AuthentificationService', () => {
  let service: AuthentificationService;
  let apiServiceMock: jasmine.SpyObj<ApiService>;
  let localStorageSpy: jasmine.Spy;

  const mockUser: User = {
    _id: 'test-id',
    usercode: 'TEST123',
    firstName: 'Test',
    lastName: 'User',
    role: UserRole.Etudiant,
    currentPlan: 'plan-1',
    plans: ['plan-1']
  };

  const mockLoginRequest: LoginRequest = {
    usercode: 'TEST123',
    firstName: 'password123',
    lastName: 'string'
  };

  beforeEach(() => {
    // Create API service mock
    apiServiceMock = jasmine.createSpyObj('ApiService', ['postLogin']);
    
    // Spy on localStorage
    localStorageSpy = spyOn(localStorage, 'setItem');
    spyOn(localStorage, 'getItem');
    spyOn(localStorage, 'removeItem');

    TestBed.configureTestingModule({
      providers: [
        AuthentificationService,
        { provide: ApiService, useValue: apiServiceMock }
      ]
    });

    service = TestBed.inject(AuthentificationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('login', () => {
    it('should store user and update currentUser$ on successful login', (done) => {
      const response = { success: true, user: mockUser };
      apiServiceMock.postLogin.and.returnValue(of(response));

      service.login(mockLoginRequest).subscribe({
        next: (result) => {
          expect(result).toEqual(response);
          expect(localStorageSpy).toHaveBeenCalledWith('currentUser', JSON.stringify(mockUser));
          service.currentUser$.subscribe(user => {
            expect(user).toEqual(mockUser);
            done();
          });
        }
      });
    });

    it('should handle login errors with appropriate messages', (done) => {
      const error = { status: 401 };
      apiServiceMock.postLogin.and.returnValue(throwError(() => error));

      service.login(mockLoginRequest).subscribe({
        error: (err) => {
          expect(err).toEqual({
            success: false,
            message: 'Identifiants incorrects.'
          });
          done();
        }
      });
    });
  });

  describe('logout', () => {
    it('should clear localStorage and currentUser', (done) => {
      service.logout();
      
      expect(localStorage.removeItem).toHaveBeenCalledWith('currentUser');
      service.currentUser$.subscribe(user => {
        expect(user).toBeNull();
        done();
      });
    });
  });

  describe('authentication checks', () => {
    it('should correctly check if user is authenticated', () => {
      // Not authenticated initially
      expect(service.isAuthenticated()).toBeFalse();

      // Set a user
      service['currentUserSubject'].next(mockUser);
      expect(service.isAuthenticated()).toBeTrue();
    });

    it('should correctly check user roles', () => {
      service['currentUserSubject'].next(mockUser);
      
      expect(service.hasRole(UserRole.Etudiant)).toBeTrue();
      expect(service.hasRole(UserRole.Administrateur)).toBeFalse();
    });

    it('should check admin access', () => {
      // Regular user
      service['currentUserSubject'].next(mockUser);
      expect(service.canAccessAdmin()).toBeFalse();

      // Admin user
      service['currentUserSubject'].next({
        ...mockUser,
        role: UserRole.Administrateur
      });
      expect(service.canAccessAdmin()).toBeTrue();
    });
  });

  describe('addStudyPlan', () => {
    it('should update user study plan', (done) => {
      service['currentUserSubject'].next(mockUser);
      const newPlanId = 'new-plan-id';

      service.addStudyPlan(newPlanId);

      expect(localStorageSpy).toHaveBeenCalled();
      service.currentUser$.subscribe(user => {
        expect(user?.currentPlan).toBe(newPlanId);
        done();
      });
    });
  });

  describe('bypassLogin', () => {
    it('should create fake admin user', (done) => {
      service.bypassLogin();

      service.currentUser$.subscribe(user => {
        expect(user?.role).toBe(UserRole.Administrateur);
        expect(user?.usercode).toBe('test-user');
        done();
      });
    });
  });
});