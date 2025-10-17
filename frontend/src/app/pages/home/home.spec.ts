import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Home } from './home';
import { Router } from '@angular/router';
import { ProgramService } from '@app/services/program/program-service';
import { StudyPlanService } from '@app/services/study-plan/study-plan-service';
import { CourseService } from '@app/services/course/course-service';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { GsupButton } from '@app/components/gsup-button/gsup-button';
import { VerifyPlans } from '@app/components/verify-plans/verify-plans';
import { AuthentificationService } from '@app/services/authentification/authentification-service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

class MockRouter {
  navigate = jasmine.createSpy('navigate');
}

class MockProgramService {
  reset = jasmine.createSpy('reset');
}

class MockStudyPlanService {
  resetPlan = jasmine.createSpy('resetPlan');
}

class MockCourseService {
  getCourses = jasmine.createSpy('getCourses');
}

describe('Home', () => {
  let component: Home;
  let fixture: ComponentFixture<Home>;
  let mockRouter: MockRouter;
  let mockProgramService: MockProgramService;
  let mockStudyPlanService: MockStudyPlanService;
  let mockCourseService: MockCourseService;

  beforeEach(async () => {
    mockRouter = new MockRouter();
    mockProgramService = new MockProgramService();
    mockStudyPlanService = new MockStudyPlanService();
    mockCourseService = new MockCourseService();

    await TestBed.configureTestingModule({
      imports: [
        Home,
        CommonModule,
        MatIconModule,
        GsupButton,
        VerifyPlans,
        HttpClientTestingModule,
      ],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: ProgramService, useValue: mockProgramService },
        { provide: StudyPlanService, useValue: mockStudyPlanService },
        { provide: CourseService, useValue: mockCourseService },
        AuthentificationService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Home);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit()', () => {
    it('should call required service methods on init', () => {
      component.ngOnInit();

      expect(mockCourseService.getCourses).toHaveBeenCalled();
      expect(mockProgramService.reset).toHaveBeenCalled();
      expect(mockStudyPlanService.resetPlan).toHaveBeenCalled();
    });
  });

  describe('navigateTo()', () => {
    it('should navigate to lowercase route based on degree', () => {
      component.navigateTo('MAITRISE');
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/maitrise']);
    });
  });
});
