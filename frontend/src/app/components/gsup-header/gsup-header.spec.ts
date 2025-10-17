import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { GsupHeader } from './gsup-header';
import { User, UserRole } from '@common/user';
import { AuthentificationService } from '@app/services/authentification/authentification-service';
import { ProgramService } from '@app/services/program/program-service';
import { of } from 'rxjs';

class MockAuthService {
  currentUser$ = of<User | null>(null);
}
class MockProgramService {
  goBack = jasmine.createSpy('goBack');
}
class MockRouter {
  navigate = jasmine.createSpy('navigate');
}

describe('GsupHeader', () => {
  let component: GsupHeader;
  let fixture: ComponentFixture<GsupHeader>;
  let mockAuthService: MockAuthService;
  let mockProgramService: MockProgramService;
  let mockRouter: MockRouter;

  beforeEach(async () => {
    mockAuthService = new MockAuthService();
    mockProgramService = new MockProgramService();
    mockRouter = new MockRouter();

    await TestBed.configureTestingModule({
      imports: [GsupHeader],
      providers: [
        { provide: AuthentificationService, useValue: mockAuthService },
        { provide: ProgramService, useValue: mockProgramService },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GsupHeader);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit()', () => {
    it('should subscribe to currentUser$', () => {
      const mockUser: User = {
        _id: '1',
        usercode: 'U001',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.Etudiant,
        currentPlan: 'Plan1',
        plans: ['Plan1'],
      };

      mockAuthService.currentUser$ = of(mockUser);
      component.ngOnInit();
      expect(component.currentUser).toEqual(mockUser);
    });
  });

  describe('goBack()', () => {
    it('should navigate to /accueil for non-student, non-admin roles', () => {
      component.currentUser = {
        _id: '1',
        usercode: 'U001',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.Directeur,
        currentPlan: '',
        plans: ['Plan1'],
      };
      component.goBack();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/accueil']);
    });

    it('should navigate to /admin for admin role', () => {
      component.currentUser = {
        _id: '1',
        usercode: 'U001',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.Administrateur,
        currentPlan: '',
        plans: ['Plan1'],
      };
      component.goBack();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/admin']);
    });

    it('should call programService.goBack() for student role', () => {
      component.currentUser = {
        _id: '1',
        usercode: 'U001',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.Etudiant,
        currentPlan: '',
        plans: ['Plan1'],
      };
      component.goBack();
      expect(mockProgramService.goBack).toHaveBeenCalled();
    });
  });

  describe('isStudentWithActiveStudy()', () => {
    it('should return true if user is Etudiant with a current plan', () => {
      component.currentUser = {
        _id: '1',
        usercode: 'U001',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.Etudiant,
        currentPlan: 'Plan1',
        plans: ['Plan0'],
      };
      expect(component.isStudentWithActiveStudy()).toBeTrue();
    });

    it('should return false if user is not Etudiant', () => {
      component.currentUser = {
        _id: '1',
        usercode: 'U001',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.Coordonnateur,
        currentPlan: 'Plan1',
        plans: ['Plan0'],
      };
      expect(component.isStudentWithActiveStudy()).toBeFalse();
    });

    it('should return false if Etudiant but no current plan', () => {
      component.currentUser = {
        _id: '1',
        usercode: 'U001',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.Etudiant,
        currentPlan: '',
        plans: ['Plan0'],
      };
      expect(component.isStudentWithActiveStudy()).toBeFalse();
    });
  });
});
