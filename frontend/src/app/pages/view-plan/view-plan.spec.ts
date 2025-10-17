import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ViewPlan } from './view-plan';
import { AuthentificationService } from '@app/services/authentification/authentification-service';
import { StudyPlanService } from '@app/services/study-plan/study-plan-service';
import {
  StudyPlan,
  StudyPlanStatus,
  StudyPlanStep,
  StepValidationStatus,
} from '@common/study-plan';
import { User, UserRole } from '@common/user';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ProgramType } from '@common/program';

class TestViewPlan extends ViewPlan {
  override getStepOrderForProgram(programType: string): StudyPlanStep[] {
    return programType === ProgramType.DESS
      ? [StudyPlanStep.STUDENT, StudyPlanStep.DIRECTOR]
      : [StudyPlanStep.STUDENT];
  }

  public testIsStudent() { return this.isStudent(); }
  public testOnValidate() { this.onValidate(); }
  public testOnRefuse() { this.onRefuse(); }
  public testOnCancel() { this.onCancel(); }
  public testOnSubmit() { this.onSubmit(); }
}

describe('ViewPlan', () => {
  let component: TestViewPlan;
  let fixture: ComponentFixture<TestViewPlan>;
  let mockAuth: any;
  let mockStudyPlanService: any;

  beforeEach(() => {
    const mockUser: User = {
      _id: '1',
      usercode: 'ETUD2025',
      firstName: 'Jean',
      lastName: 'Dupont',
      role: UserRole.Etudiant,
      currentPlan: 'plan-1',
      plans: ['plan-1']
    };

    const mockStudyPlan: StudyPlan = {
      studentId: 's1',
      directorId: 'd1',
      coordonatorId: 'c1',
      programId: 'p1',
      programType: ProgramType.DESS,
      studyPlanStep: StudyPlanStep.STUDENT,
      stepValidation: StepValidationStatus.IN_PROGRESS,
      status: StudyPlanStatus.LIVE,
      coursesSelection: { modules: [] }
    };

    mockAuth = { get currentUser() { return mockUser; } };
    mockStudyPlanService = {
      approveStudyPlan: jasmine.createSpy(),
      refuseStudyPlan: jasmine.createSpy(),
      cancelStudyPlan: jasmine.createSpy(),
      updateStudyPlan: jasmine.createSpy(),
      get studyPlan() { return mockStudyPlan; },
      get loading$() { return false; },
      get studyPlan$() { return null; }
    };
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestViewPlan, HttpClientTestingModule],
      providers: [
        { provide: AuthentificationService, useValue: mockAuth },
        { provide: StudyPlanService, useValue: mockStudyPlanService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TestViewPlan);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should generate correct progress steps', () => {
    const steps = component.getProgressSteps();
    expect(steps.length).toBe(2);
    expect(steps[0].label).toBe('Étudiant');
    expect(steps[0].displayLabel).toBe('En cours');
    expect(steps[1].displayLabel).toBe('En attente');
  });

  it('should return correct status labels', () => {
    expect(component.getStatusLabel(StudyPlanStatus.LIVE)).toBe('En cours');
    expect(component.getStatusLabel(StudyPlanStatus.CANCELLED)).toBe('Annulé');
    expect(component.getStatusLabel(StudyPlanStatus.VALIDATED)).toBe('Validé');
  });

  it('should correctly identify if user is student', () => {
    expect(component.testIsStudent()).toBeTrue();

    Object.defineProperty(mockAuth, 'currentUser', {
      get: () => ({
        _id: '2',
        usercode: 'DIR2025',
        firstName: 'Marie',
        lastName: 'Lefevre',
        role: UserRole.Directeur,
        currentPlan: 'plan-2',
        plans: ['plan-2']
      } as User)
    });
    expect(component.testIsStudent()).toBeFalse();
  });

  it('should call appropriate service methods for actions', () => {
    component.testOnValidate();
    expect(mockStudyPlanService.approveStudyPlan).toHaveBeenCalled();

    component.testOnRefuse();
    expect(mockStudyPlanService.refuseStudyPlan).toHaveBeenCalled();

    component.testOnCancel();
    expect(mockStudyPlanService.cancelStudyPlan).toHaveBeenCalled();

    component.testOnSubmit();
    expect(mockStudyPlanService.updateStudyPlan).toHaveBeenCalled();
  });
});