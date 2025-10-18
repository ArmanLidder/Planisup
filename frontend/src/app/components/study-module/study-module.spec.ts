import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StudyModule } from './study-module';
import { CourseStateService } from '@app/services/course-state/course-state';
import { Module, Course } from '@common/program';

describe('StudyModule', () => {
  let component: StudyModule;
  let fixture: ComponentFixture<StudyModule>;
  let mockCourseStateService: jasmine.SpyObj<CourseStateService>;

  const mockModule: Module = {
    title: 'Module de base (15 crédits)',
    description: ['Description du module'],
    courses: [
      {
        description: '6 crédits parmi les suivants',
        courses: [
          { sigle: 'TEST101', name: 'Test Course 1', credits: 3, trimester: [{year: 2025, term: "Automne"}] },
          { sigle: 'TEST102', name: 'Test Course 2', credits: 3, trimester: [{year: 2025, term: "Hiver"}] }
        ]
      }
    ]
  };

  const mockModuleWithSubModules: Module = {
    title: 'Module avec sous-modules (20 crédits)',
    description: ['Description'],
    subModules: [
      {
        title: 'Sous-module A',
        description: ['Description A'],
        courses: []
      },
      {
        title: 'Sous-module B',
        description: ['Description B'],
        courses: []
      }
    ]
  };

  beforeEach(async () => {
    mockCourseStateService = jasmine.createSpyObj('CourseStateService', [
      'getSectionRule',
      'getCourseState',
      'canCourseBeSelected'
    ], {
      courseStates: new Map()
    });

    mockCourseStateService.getSectionRule.and.returnValue(null);
    mockCourseStateService.getCourseState.and.returnValue({
      selected: false,
      selectedInModule: null,
      selectedInSubmodule: null,
      selectedInSection: null,
      credits: 0
    });
    mockCourseStateService.canCourseBeSelected.and.returnValue({"canSelect": true, "reason": "Test"});

    await TestBed.configureTestingModule({
      imports: [StudyModule],
      providers: [
        { provide: CourseStateService, useValue: mockCourseStateService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(StudyModule);
    component = fixture.componentInstance;
    component.module = mockModule;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should initialize title, credits and calculate selected credits', () => {
      fixture.detectChanges();

      expect(component.title).toBe('Module de base');
      expect(component.credits).toBe(15);
      expect(component.selectedCredits).toBe(0);
    });

    it('should initialize expanded state for submodules', () => {
      component.module = mockModuleWithSubModules;
      fixture.detectChanges();

      expect(component.expandedSubModules.size).toBe(2);
      expect(component.expandedSubModules.get('Sous-module A')).toBe(false);
    });
  });

  describe('initialization', () => {
    it('should extract credits and title from module title', () => {
      component.module = { ...mockModule, title: 'Test Module (20 crédits)' };
      component.initialization();

      expect(component.title).toBe('Test Module');
      expect(component.credits).toBe(20);
    });

    it('should handle title without credits', () => {
      component.module = { ...mockModule, title: 'Test Module' };
      component.initialization();

      expect(component.title).toBe('Test Module');
      expect(component.credits).toBe(0);
    });
  });

  describe('toggleModule', () => {
    it('should toggle isExpanded', () => {
      component.isExpanded = false;
      component.toggleModule();
      expect(component.isExpanded).toBe(true);
      component.toggleModule();
      expect(component.isExpanded).toBe(false);
    });
  });

  describe('toggleSubModule', () => {
    it('should toggle submodule expansion state', () => {
      component.expandedSubModules.set('SubModule A', false);
      component.toggleSubModule('SubModule A');
      expect(component.expandedSubModules.get('SubModule A')).toBe(true);
    });

    it('should create entry for new submodule', () => {
      component.toggleSubModule('SubModule C');
      expect(component.expandedSubModules.get('SubModule C')).toBe(true);
    });
  });

  describe('isSubModuleExpanded', () => {
    it('should return expansion state or false', () => {
      component.expandedSubModules.set('SubModule A', true);
      expect(component.isSubModuleExpanded('SubModule A')).toBe(true);
      expect(component.isSubModuleExpanded('SubModule B')).toBe(false);
    });
  });

  describe('onCourseSelectionChange', () => {
    it('should emit event and recalculate credits', () => {
      fixture.detectChanges();
      spyOn(component.courseSelectionChange, 'emit');
      spyOn(component, 'calculateSelectedCredits');

      const event = {
        courseSigle: 'TEST101',
        selected: true,
        section: 'Section A',
        submoduleTitle: 'Sub A'
      };

      component.onCourseSelectionChange(event);

      expect(component.courseSelectionChange.emit).toHaveBeenCalledWith({
        courseSigle: 'TEST101',
        moduleTitle: 'Module de base (15 crédits)',
        submoduleTitle: 'Sub A',
        selected: true,
        selectedSection: 'Section A'
      });
      expect(component.calculateSelectedCredits).toHaveBeenCalled();
    });
  });

  describe('calculateSelectedCredits', () => {
    it('should calculate credits for selected courses in this module', () => {
      const mockState = new Map();
      mockState.set('TEST101', {
        selected: true,
        selectedInModule: 'Module de base (15 crédits)',
        selectedInSubmodule: null,
        selectedInSection: 'Section A',
        credits: 3
      });
      mockState.set('TEST102', {
        selected: true,
        selectedInModule: 'Module de base (15 crédits)',
        selectedInSubmodule: null,
        selectedInSection: 'Section A',
        credits: 3
      });
      Object.defineProperty(mockCourseStateService, 'courseStates', {
        value: mockState,
        writable: true,
        configurable: true
      });

      component.calculateSelectedCredits();

      expect(component.selectedCredits).toBe(6);
    });

    it('should not count courses from other modules or deselected courses', () => {
      const mockState = new Map();
      mockState.set('TEST101', {
        selected: true,
        selectedInModule: 'Module de base (15 crédits)',
        selectedInSubmodule: null,
        selectedInSection: 'Section A',
        credits: 3
      });
      mockState.set('OTHER101', {
        selected: true,
        selectedInModule: 'Other Module',
        selectedInSubmodule: null,
        selectedInSection: 'Section B',
        credits: 5
      });
      mockState.set('TEST102', {
        selected: false,
        selectedInModule: 'Module de base (15 crédits)',
        selectedInSubmodule: null,
        selectedInSection: 'Section A',
        credits: 3
      });
      Object.defineProperty(mockCourseStateService, 'courseStates', {
        value: mockState,
        writable: true,
        configurable: true
      });

      component.calculateSelectedCredits();

      expect(component.selectedCredits).toBe(3);
    });
  });

  describe('getModuleProgressStyle', () => {
    beforeEach(() => {
      component.credits = 15;
    });

    it('should return correct styles for different progress levels', () => {
      component.selectedCredits = 0;
      let style = component.getModuleProgressStyle();
      expect(style.width).toBe('0%');
      expect(style['background-color']).toBe('#ff9800');

      component.selectedCredits = 7;
      style = component.getModuleProgressStyle();
      expect(style['background-color']).toBe('#ff9800');

      component.selectedCredits = 15;
      style = component.getModuleProgressStyle();
      expect(style.width).toBe('100%');
      expect(style['background-color']).toBe('#4caf50');

      component.selectedCredits = 18;
      style = component.getModuleProgressStyle();
      expect(style.width).toBe('100%');
      expect(style['background-color']).toBe('#4caf50');
    });

    it('should handle division by zero', () => {
      component.credits = 0;
      component.selectedCredits = 10;
      const style = component.getModuleProgressStyle();
      expect(style.width).toBe('0%');
    });
  });

  describe('getModuleTitleWithoutCredits', () => {
    it('should remove credits from title', () => {
      expect(component.getModuleTitleWithoutCredits('Module de base (15 crédits)')).toBe('Module de base');
      expect(component.getModuleTitleWithoutCredits('Module de base')).toBe('Module de base');
    });
  });
});