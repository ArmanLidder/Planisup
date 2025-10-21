import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VerifyPlans } from './verify-plans';
import { ApiService } from '@app/services/api/api-service';
import { AuthentificationService } from '@app/services/authentification/authentification-service';
import { StudyPlanService } from '@app/services/study-plan/study-plan-service';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { StudyPlanEntry } from '@common/study-plan';
import { of } from 'rxjs';
import { UserRole } from '@common/user';
import { HttpClientModule } from '@angular/common/http';

describe('VerifyPlans', () => {
  let component: VerifyPlans;
  let fixture: ComponentFixture<VerifyPlans>;
  let apiServiceMock: jasmine.SpyObj<ApiService>;
  let authServiceMock: jasmine.SpyObj<AuthentificationService>;
  let studyPlanServiceMock: jasmine.SpyObj<StudyPlanService>;

  const mockUser = {
    _id: 'user-1',
    firstName: 'John',
    lastName: 'Doe',
    role: UserRole.Etudiant,
    usercode: 'TEST123',
    currentPlan: 'plan-1',
    plans: ['plan-1']
  };

  const mockStudyPlans: StudyPlanEntry[] = [
    {
      studyPlanId: 'plan-1',
      firstName: 'John',
      lastName: 'Doe',
      degree: 'DESS',
      date: new Date('2023-01-01T10:00:00')
    }
  ];

  beforeEach(async () => {
    apiServiceMock = jasmine.createSpyObj('ApiService', ['getStudyPlans']);
    authServiceMock = jasmine.createSpyObj('AuthentificationService', [], {
      currentUser: mockUser
    });
    studyPlanServiceMock = jasmine.createSpyObj('StudyPlanService', ['loadStudyPlan'], {
      loading$: of(false)
    });

    await TestBed.configureTestingModule({
      imports: [
        VerifyPlans,
        MatTableModule,
        MatSortModule,
        BrowserAnimationsModule,
        HttpClientModule
      ],
      providers: [
        { provide: ApiService, useValue: apiServiceMock },
        { provide: AuthentificationService, useValue: authServiceMock },
        { provide: StudyPlanService, useValue: studyPlanServiceMock }
      ]
    }).compileComponents();

    apiServiceMock.getStudyPlans.and.returnValue(of(mockStudyPlans));

    fixture = TestBed.createComponent(VerifyPlans);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with correct displayed columns', () => {
    expect(component.displayedColumns).toEqual(['Prénom', 'Nom', 'Diplôme', 'Date']);
  });

  it('should load study plans on init for authenticated user', () => {
    expect(apiServiceMock.getStudyPlans).toHaveBeenCalledWith(mockUser._id);
    expect(component.dataSource.data).toEqual(mockStudyPlans);
  });

  it('should not load study plans if user is not authenticated', () => {
    // Override currentUser to be null
    Object.defineProperty(authServiceMock, 'currentUser', {
      get: () => null
    });

    component.ngOnInit();
    expect(apiServiceMock.getStudyPlans).not.toHaveBeenCalled();
  });

  it('should format date correctly', () => {
    const testDate = '2023-01-01T12:30:00';
    const formattedDate = component.formatDate(testDate);
    expect(formattedDate).toMatch(/2023-01-01 12:30/);
  });

  it('should return empty string for invalid date', () => {
    expect(component.formatDate('')).toBe('');
    expect(component.formatDate(undefined as any)).toBe('');
  });

  it('should handle row click', () => {
    const testRow = mockStudyPlans[0];
    component.onRowClick(testRow);
    expect(studyPlanServiceMock.loadStudyPlan).toHaveBeenCalledWith(testRow.studyPlanId);
  });

  it('should initialize sort after view init', () => {
    component.ngAfterViewInit();
    expect(component.dataSource.sort).toBeTruthy();
  });

  it('should have loading state from study plan service', () => {
    expect(component.isLoading$).toBe(studyPlanServiceMock.loading$);
  });
});