import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StudyPlan } from './study-plan';
import { ProgramService } from '@app/services/program/program-service';
import { CourseStateService } from '@app/services/course-state/course-state';
import { CourseService } from '@app/services/course/course-service';
import { AuthentificationService } from '@app/services/authentification/authentification-service';
import { ApiService } from '@app/services/api/api-service';
import { StudyPlanService } from '@app/services/study-plan/study-plan-service';
import { Program, Module, ProgramType } from '@common/program';
import { of, throwError, BehaviorSubject } from 'rxjs';

describe('StudyPlan', () => {
  let component: StudyPlan;
  let fixture: ComponentFixture<StudyPlan>;
  let mockProgramService: jasmine.SpyObj<ProgramService>;
  let mockCourseStateService: jasmine.SpyObj<CourseStateService>;
  let mockCourseService: jasmine.SpyObj<CourseService>;
  let mockAuthService: jasmine.SpyObj<AuthentificationService>;
  let mockApiService: jasmine.SpyObj<ApiService>;
  let mockStudyPlanService: jasmine.SpyObj<StudyPlanService>;
  let programSubject: BehaviorSubject<Program | null>;

  const mockProgram: Program = {
    _id: 'program123',
    degree: 'Master en Informatique',
    type: "dess",
    department: "Test",
    option: 'Intelligence Artificielle',
    description: 'Programme de test',
    modules: [
      {
        title: 'Module A (10 crédits)',
        description: [],
        courses: [
          {
            description: '6 crédits au choix parmi les suivants',
            courses: [
              { sigle: 'TEST101', name: 'Test Course 1', credits: 3, trimester: [{year: 2025, term: "Automne"}] },
              { sigle: 'TEST102', name: 'Test Course 2', credits: 3, trimester: [{year: 2025, term: "Automne"}] }
            ]
          }
        ]
      },
      {
        title: 'Module B (15 crédits)',
        description: [],
        courses: [
          {
            description: 'Cours obligatoires',
            courses: [
              { sigle: 'TEST201', name: 'Test Course 3', credits: 5, trimester: [{year: 2025, term: "Hiver"}] }
            ]
          }
        ]
      }
    ]
  };

  beforeEach(async () => {
    // Créer un BehaviorSubject pour program$
    programSubject = new BehaviorSubject<Program | null>(mockProgram);

    mockProgramService = jasmine.createSpyObj('ProgramService', [], {
      program: mockProgram,
      program$: programSubject.asObservable(),
      type: ProgramType.MASTER
    });

    mockCourseStateService = jasmine.createSpyObj('CourseStateService', [
      'initializeCourseStates',
      'setCourseSelected',
      'getSelectedCredits',
      'validateRuleGroups',
      'getSelectedCoursesByModule',
      'getSectionRule',
      'getCourseState',
      'canCourseBeSelected'
    ], {
      courseStates: new Map(),
      exclusiveSubModuleRules: []
    });
    
    // Configurer les retours par défaut
    mockCourseStateService.getSectionRule.and.returnValue(null);
    mockCourseStateService.getCourseState.and.returnValue({
      selected: false,
      selectedInModule: null,
      selectedInSubmodule: null,
      selectedInSection: null,
      credits: 0
    });
    mockCourseStateService.canCourseBeSelected.and.returnValue({"canSelect": true, "reason": "Test"});

    mockCourseService = jasmine.createSpyObj('CourseService', [], {
      courses: []
    });

    mockAuthService = jasmine.createSpyObj('AuthentificationService', [], {
      currentUser: { _id: 'user123', name: 'Test User' }
    });

    mockApiService = jasmine.createSpyObj('ApiService', ['submitStudyPlan']);
    mockStudyPlanService = jasmine.createSpyObj('StudyPlanService', ['loadStudyPlan'], {
      studyPlan: null
    });

    await TestBed.configureTestingModule({
      imports: [StudyPlan],
      providers: [
        { provide: ProgramService, useValue: mockProgramService },
        { provide: CourseStateService, useValue: mockCourseStateService },
        { provide: CourseService, useValue: mockCourseService },
        { provide: AuthentificationService, useValue: mockAuthService },
        { provide: ApiService, useValue: mockApiService },
        { provide: StudyPlanService, useValue: mockStudyPlanService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(StudyPlan);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should initialize program and modules', () => {
      fixture.detectChanges();

      expect(component.program).toEqual(mockProgram);
      expect(component.modules).toEqual(mockProgram.modules);
    });

    it('should calculate total credits from modules', () => {
      fixture.detectChanges();

      expect(component.totalCredits).toBe(25); // 10 + 15
    });

    it('should initialize course state service', () => {
      fixture.detectChanges();

      expect(mockCourseStateService.initializeCourseStates).toHaveBeenCalledWith(mockProgram.modules);
    });

    it('should load all courses', () => {
      fixture.detectChanges();

      expect(component.allCourses.length).toBe(3);
    });
  });

  describe('extractCoursesFromProgram', () => {
    it('should extract all courses from program modules', () => {
      fixture.detectChanges();
      
      const courses = component.extractCoursesFromProgram();

      expect(courses.length).toBe(3);
      expect(courses.map(c => c.sigle)).toContain('TEST101');
      expect(courses.map(c => c.sigle)).toContain('TEST102');
      expect(courses.map(c => c.sigle)).toContain('TEST201');
    });

    it('should extract courses from submodules', () => {
      const programWithSubModules: Program = {
        degree: 'Test',
        type: "dess",
        department: "test",
        description: "",
        modules: [
          {
            title: 'Module A',
            description: [],
            subModules: [
              {
                title: 'SubModule 1',
                description: [],
                courses: [
                  {
                    description: 'Test',
                    courses: [
                      { sigle: 'SUB101', name: 'Sub Course', credits: 3, trimester: [{year: 2025, term: "Automne"}] }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      };

      // Mettre à jour le subject ET la propriété program
      programSubject.next(programWithSubModules);
      Object.defineProperty(mockProgramService, 'program', {
        value: programWithSubModules,
        writable: true,
        configurable: true
      });
      
      fixture.detectChanges();

      const courses = component.extractCoursesFromProgram();

      expect(courses.length).toBe(1);
      expect(courses[0].sigle).toBe('SUB101');
    });

    it('should remove duplicate courses', () => {
      const programWithDuplicates: Program = {
        degree: 'Test',
        type: "dess",
        department: "test",
        description: "",
        modules: [
          {
            title: 'Module A',
            description: [],
            courses: [
              {
                description: 'Section 1',
                courses: [
                  { sigle: 'TEST101', name: 'Test', credits: 3, trimester: [{year: 2025, term: "Automne"}] }
                ]
              },
              {
                description: 'Section 2',
                courses: [
                  { sigle: 'TEST101', name: 'Test', credits: 3, trimester: [{year: 2025, term: "Automne"}] }
                ]
              }
            ]
          }
        ]
      };

      programSubject.next(programWithDuplicates);
      Object.defineProperty(mockProgramService, 'program', {
        value: programWithDuplicates,
        writable: true,
        configurable: true
      });
      
      fixture.detectChanges();

      const courses = component.extractCoursesFromProgram();

      expect(courses.length).toBe(1);
    });
  });

  describe('onCourseSelectionChange', () => {
    beforeEach(() => {
      mockCourseStateService.setCourseSelected.and.returnValue(true);
      mockCourseStateService.getSelectedCredits.and.returnValue(6);
      fixture.detectChanges();
    });

    it('should call setCourseSelected on course state service', () => {
      const event = {
        courseSigle: 'TEST101',
        moduleTitle: 'Module A (10 crédits)',
        submoduleTitle: null,
        selected: true,
        selectedSection: '6 crédits au choix parmi les suivants'
      };

      component.onCourseSelectionChange(event);

      expect(mockCourseStateService.setCourseSelected).toHaveBeenCalledWith(
        'TEST101',
        'Module A (10 crédits)',
        null,
        '6 crédits au choix parmi les suivants',
        true
      );
    });

    it('should recalculate total credits after selection', () => {
      const event = {
        courseSigle: 'TEST101',
        moduleTitle: 'Module A (10 crédits)',
        submoduleTitle: null,
        selected: true,
        selectedSection: 'Test'
      };

      component.onCourseSelectionChange(event);

      expect(component.selectedCredits).toBe(6);
    });

    it('should not recalculate if setCourseSelected returns false', () => {
      mockCourseStateService.setCourseSelected.and.returnValue(false);
      const initialCredits = component.selectedCredits;

      const event = {
        courseSigle: 'TEST101',
        moduleTitle: 'Module A (10 crédits)',
        submoduleTitle: null,
        selected: true,
        selectedSection: 'Test'
      };

      component.onCourseSelectionChange(event);

      expect(component.selectedCredits).toBe(initialCredits);
    });

    it('should handle module not found gracefully', () => {
      const event = {
        courseSigle: 'TEST101',
        moduleTitle: 'Non-existent Module',
        submoduleTitle: null,
        selected: true,
        selectedSection: 'Test'
      };

      expect(() => component.onCourseSelectionChange(event)).not.toThrow();
    });
  });

  describe('calculateTotalCredits', () => {
    it('should get selected credits from course state service', () => {
      mockCourseStateService.getSelectedCredits.and.returnValue(12);
      fixture.detectChanges();

      component.calculateTotalCredits();

      expect(component.selectedCredits).toBe(12);
      expect(mockCourseStateService.getSelectedCredits).toHaveBeenCalled();
    });
  });

  describe('getProgressStyle', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return correct style for 0% progress', () => {
      component.selectedCredits = 0;
      component.totalCredits = 25;

      const style = component.getProgressStyle();

      expect(style.width).toBe('0%');
      expect(style['background-color']).toBe('#2196f3');
    });

    it('should return correct style for 50% progress', () => {
      component.selectedCredits = 12;
      component.totalCredits = 24;

      const style = component.getProgressStyle();

      expect(style.width).toBe('50%');
      expect(style['background-color']).toBe('#2196f3');
    });

    it('should return green color for 100% progress', () => {
      component.selectedCredits = 25;
      component.totalCredits = 25;

      const style = component.getProgressStyle();

      expect(style.width).toBe('100%');
      expect(style['background-color']).toBe('#4caf50');
    });

    it('should cap progress at 100%', () => {
      component.selectedCredits = 30;
      component.totalCredits = 25;

      const style = component.getProgressStyle();

      expect(style.width).toBe('100%');
    });

    it('should handle division by zero', () => {
      component.selectedCredits = 10;
      component.totalCredits = 0;

      const style = component.getProgressStyle();

      expect(style.width).toBe('0%');
    });
  });

  describe('extractCreditsFromTitle', () => {
    it('should extract credits from title with format "(X crédits)"', () => {
      const credits = component.extractCreditsFromTitle('Module A (10 crédits)');
      expect(credits).toBe(10);
    });

    it('should return 0 when no credits in title', () => {
      const credits = component.extractCreditsFromTitle('Module A');
      expect(credits).toBe(0);
    });
  });

  describe('getModuleTitleWithoutCredits', () => {
    it('should remove credits from title', () => {
      const title = component.getModuleTitleWithoutCredits('Module A (10 crédits)');
      expect(title).toBe('Module A');
    });

    it('should return unchanged title if no credits', () => {
      const title = component.getModuleTitleWithoutCredits('Module A');
      expect(title).toBe('Module A');
    });
  });

  describe('validatePlan', () => {
    beforeEach(() => {
      mockCourseStateService.getSelectedCoursesByModule.and.returnValue([]);
      mockApiService.submitStudyPlan.and.returnValue(of({ _id: 'plan123' }));
      fixture.detectChanges();
      spyOn(window, 'alert');
    });

    it('should validate rule groups', () => {
      mockCourseStateService.validateRuleGroups.and.returnValue({
        isValid: true,
        errors: []
      });
      
      const mockState = new Map();
      mockCourseStateService.courseStates = mockState;
      component.selectedCredits = 25;

      component.validatePlan();

      expect(mockCourseStateService.validateRuleGroups).toHaveBeenCalled();
    });

    it('should show alert with errors when validation fails', () => {
      mockCourseStateService.validateRuleGroups.and.returnValue({
        isValid: false,
        errors: ['Erreur 1', 'Erreur 2']
      });

      component.validatePlan();

      expect(window.alert).toHaveBeenCalledWith(jasmine.stringContaining('Erreur 1'));
      expect(mockApiService.submitStudyPlan).not.toHaveBeenCalled();
    });

    it('should validate module credit requirements', () => {
      mockCourseStateService.validateRuleGroups.and.returnValue({
        isValid: true,
        errors: []
      });
      
      const mockState = new Map();
      mockCourseStateService.courseStates = mockState;
      component.selectedCredits = 5;

      component.validatePlan();

      expect(window.alert).toHaveBeenCalledWith(jasmine.stringContaining('nécessite au moins'));
    });

    it('should prevent submitting if total credits exceed maximum', () => {
      mockCourseStateService.validateRuleGroups.and.returnValue({
        isValid: true,
        errors: []
      });
      
      const mockState = new Map();
      mockCourseStateService.courseStates = mockState;
      component.selectedCredits = 30;
      component.totalCredits = 25;

      component.validatePlan();

      expect(window.alert).toHaveBeenCalledWith(jasmine.stringContaining('ne peut pas dépasser'));
    });

    it('should submit study plan when validation passes', () => {
      mockCourseStateService.validateRuleGroups.and.returnValue({
        isValid: true,
        errors: []
      });
      
      const mockState = new Map();
      mockState.set('TEST101', {
        selected: true,
        selectedInModule: 'Module A (10 crédits)',
        selectedInSubmodule: null,
        selectedInSection: 'Test',
        credits: 5
      });
      mockState.set('TEST102', {
        selected: true,
        selectedInModule: 'Module A (10 crédits)',
        selectedInSubmodule: null,
        selectedInSection: 'Test',
        credits: 5
      });
      mockState.set('TEST201', {
        selected: true,
        selectedInModule: 'Module B (15 crédits)',
        selectedInSubmodule: null,
        selectedInSection: 'Test',
        credits: 15
      });
      
      // IMPORTANT: Remplacer complètement courseStates
      Object.defineProperty(mockCourseStateService, 'courseStates', {
        value: mockState,
        writable: true,
        configurable: true
      });
      mockCourseStateService.courseStates = mockState;
      mockApiService.submitStudyPlan.and.returnValue(of({ _id: 'plan123' }));

      component.validatePlan();

      expect(mockApiService.submitStudyPlan).toHaveBeenCalled();
    });

    it('should show alert when study plan already submitted', () => {
      mockCourseStateService.validateRuleGroups.and.returnValue({
        isValid: true,
        errors: []
      });
      
      Object.defineProperty(mockStudyPlanService, 'studyPlan', {
        value: { _id: 'existing' },
        writable: true,
        configurable: true
      });
      
      const mockState = new Map();
      mockState.set('TEST101', {
        selected: true,
        selectedInModule: 'Module A (10 crédits)',
        selectedInSubmodule: null,
        selectedInSection: 'Test',
        credits: 5
      });
      mockState.set('TEST102', {
        selected: true,
        selectedInModule: 'Module A (10 crédits)',
        selectedInSubmodule: null,
        selectedInSection: 'Test',
        credits: 5
      });
      mockState.set('TEST201', {
        selected: true,
        selectedInModule: 'Module B (15 crédits)',
        selectedInSubmodule: null,
        selectedInSection: 'Test',
        credits: 15
      });
      
      // IMPORTANT: Remplacer complètement courseStates
      Object.defineProperty(mockCourseStateService, 'courseStates', {
        value: mockState,
        writable: true,
        configurable: true
      });
      mockCourseStateService.courseStates = mockState;
      component.selectedCredits = 25;
      
      mockApiService.submitStudyPlan.calls.reset();

      component.validatePlan();

      expect(window.alert).toHaveBeenCalledWith('Plan d\'études déjà soumis!');
      expect(mockApiService.submitStudyPlan).not.toHaveBeenCalled();
      
      Object.defineProperty(mockStudyPlanService, 'studyPlan', {
        value: null,
        writable: true,
        configurable: true
      });
    });

    it('should handle API error on submission', () => {
      mockCourseStateService.validateRuleGroups.and.returnValue({
        isValid: true,
        errors: []
      });
      
      const mockState = new Map();
      mockState.set('TEST101', {
        selected: true,
        selectedInModule: 'Module A (10 crédits)',
        selectedInSubmodule: null,
        selectedInSection: 'Test',
        credits: 5
      });
      mockState.set('TEST102', {
        selected: true,
        selectedInModule: 'Module A (10 crédits)',
        selectedInSubmodule: null,
        selectedInSection: 'Test',
        credits: 5
      });
      mockState.set('TEST201', {
        selected: true,
        selectedInModule: 'Module B (15 crédits)',
        selectedInSubmodule: null,
        selectedInSection: 'Test',
        credits: 15
      });
      
      // IMPORTANT: Remplacer complètement courseStates
      Object.defineProperty(mockCourseStateService, 'courseStates', {
        value: mockState,
        writable: true,
        configurable: true
      });
      mockCourseStateService.courseStates = mockState;
      component.selectedCredits = 25;

      mockApiService.submitStudyPlan.and.returnValue(
        throwError(() => new Error('Network error'))
      );

      component.validatePlan();

      expect(window.alert).toHaveBeenCalledWith(jasmine.stringContaining('Erreur lors de la soumission'));
    });
  });

  describe('extractSubModulePrefix', () => {
    it('should extract prefix from submodule title', () => {
      const prefix = component.extractSubModulePrefix('(B1) Base Module');
      expect(prefix).toBe('B1');
    });

    it('should return full title if no prefix found', () => {
      const prefix = component.extractSubModulePrefix('Base Module');
      expect(prefix).toBe('Base Module');
    });

    it('should handle complex prefixes', () => {
      const prefix = component.extractSubModulePrefix('(A12) Advanced Module');
      expect(prefix).toBe('A12');
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe from program subscription', () => {
      fixture.detectChanges();
      
      spyOn(component['programSubscription']!, 'unsubscribe');
      
      component.ngOnDestroy();
      
      expect(component['programSubscription']!.unsubscribe).toHaveBeenCalled();
    });

    it('should handle null subscription gracefully', () => {
      component['programSubscription'] = null;
      
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });
});