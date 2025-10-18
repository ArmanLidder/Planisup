import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StudySection } from './study-section';
import { CourseStateService } from '@app/services/course-state/course-state';
import { Section, Course } from '@common/program';

describe('StudySection', () => {
  let component: StudySection;
  let fixture: ComponentFixture<StudySection>;
  let mockCourseStateService: jasmine.SpyObj<CourseStateService>;

  const mockSection: Section = {
    description: '6 crédits parmi les suivants',
    courses: [
      { sigle: 'TEST101', name: 'Test Course 1', credits: 3, trimester: [{year: 2025, term: "Automne"}] }
    ]
  };

  beforeEach(async () => {
    mockCourseStateService = jasmine.createSpyObj('CourseStateService', [
      'getSectionStatus',
      'getSectionRule',
      'getCourseState',
      'canCourseBeSelected',
      'canSearchCourseBeSelected'
    ]);

    mockCourseStateService.getSectionStatus.and.returnValue({
      selectedCredits: 0,
      requiredCredits: 6,
      isMinimum: false,
      isComplete: false,
      hasRule: true,
      isInGroup: false,
      isGroupLeader: false
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
    mockCourseStateService.canSearchCourseBeSelected.and.returnValue({"canSelect": true, "reason": "Test"});

    await TestBed.configureTestingModule({
      imports: [StudySection],
      providers: [
        { provide: CourseStateService, useValue: mockCourseStateService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(StudySection);
    component = fixture.componentInstance;
    component.section = mockSection;
    component.currentModuleTitle = 'Module A';
    component.currentSubmoduleTitle = null;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('event emissions', () => {
    it('should emit course selection with section info', () => {
      spyOn(component.courseSelectionChange, 'emit');
      
      component.onCourseSelectionChange({ courseSigle: 'TEST101', selected: true });
      expect(component.courseSelectionChange.emit).toHaveBeenCalledWith({
        courseSigle: 'TEST101',
        selected: true,
        section: '6 crédits parmi les suivants',
        submoduleTitle: null
      });
    });

    it('should emit search course selection', () => {
      spyOn(component.courseSelectionChange, 'emit');
      const course: Course = { sigle: 'SEARCH101', name: 'Search', credits: 3, trimester: [{year: 2025, term: "Automne"}] };
      
      component.onSearchCourseSelectionChange({ course, selected: true });
      expect(component.courseSelectionChange.emit).toHaveBeenCalledWith({
        courseSigle: 'SEARCH101',
        selected: true,
        section: '6 crédits parmi les suivants',
        submoduleTitle: null
      });
    });
  });

  describe('rule type identification', () => {
    it('should identify different rule types', () => {
      mockCourseStateService.getSectionRule.and.returnValue({ type: 'credits_choice', description: 'test', requiredCredits: 6, moduleTitle: 'Module A', subModuleTitle:null });
      fixture.detectChanges();
      expect(component.isRuleSection).toBe(true);

      mockCourseStateService.getSectionRule.and.returnValue({ type: 'director_approval_single', description: 'test', requiredCredits: 3, moduleTitle: 'Module A', subModuleTitle:null });
      fixture.detectChanges();
      expect(component.isDirectorApprovalSingleSection).toBe(true);
      expect(component.isDirectorApprovalSection).toBe(true);

      mockCourseStateService.getSectionRule.and.returnValue({ type: 'credits_minimum', description: 'test', requiredCredits: 6, moduleTitle: 'Module A', subModuleTitle:null });
      fixture.detectChanges();
      expect(component.isMinimumRuleSection).toBe(true);

      mockCourseStateService.getSectionRule.and.returnValue(null);
      fixture.detectChanges();
      expect(component.isRuleSection).toBe(false);
    });

    it('should identify rule groups', () => {
      mockCourseStateService.getSectionRule.and.returnValue({ 
        type: 'credits_choice', 
        description: '6 crédits parmi les suivants', 
        requiredCredits: 6,
        groupSections: ['Section A'], 
        moduleTitle: 'Module A', 
        subModuleTitle:null
      });
      fixture.detectChanges();
      
      expect(component.isInRuleGroup).toBe(true);
      expect(component.isFirstInRuleGroup).toBe(true);

      mockCourseStateService.getSectionRule.and.returnValue({ 
        type: 'credits_choice', 
        description: 'Different', 
        requiredCredits: 6, 
        moduleTitle: 'Module A', 
        subModuleTitle:null
      });
      fixture.detectChanges();
      expect(component.isInRuleGroup).toBe(false);
      expect(component.isFirstInRuleGroup).toBe(false);
    });
  });

  describe('progress calculations', () => {
    it('should calculate progress percentage and cap at 100', () => {
      mockCourseStateService.getSectionStatus.and.returnValue({
        selectedCredits: 3,
        requiredCredits: 6,
        isMinimum: false,
        isComplete: false,
        hasRule: true,
        isInGroup: false,
        isGroupLeader: false
      });
      fixture.detectChanges();
      expect(component.progressPercentage).toBe(50);

      mockCourseStateService.getSectionStatus.and.returnValue({
        selectedCredits: 9,
        requiredCredits: 6,
        isMinimum: false,
        isComplete: true,
        hasRule: true,
        isInGroup: false,
        isGroupLeader: false
      });
      fixture.detectChanges();
      expect(component.progressPercentage).toBe(100);
    });

    it('should return correct colors for exact requirements', () => {
      mockCourseStateService.getSectionStatus.and.returnValue({ 
        selectedCredits: 6, 
        requiredCredits: 6, 
        isMinimum: false,
        isComplete: true,
        hasRule: true,
        isInGroup: false,
        isGroupLeader: false
      });
      fixture.detectChanges();
      expect(component.getProgressColor()).toBe('#4caf50');

      mockCourseStateService.getSectionStatus.and.returnValue({ 
        selectedCredits: 3, 
        requiredCredits: 6, 
        isMinimum: false,
        isComplete: false,
        hasRule: true,
        isInGroup: false,
        isGroupLeader: false
      });
      fixture.detectChanges();
      expect(component.getProgressColor()).toBe('#2196f3');

      mockCourseStateService.getSectionStatus.and.returnValue({ 
        selectedCredits: 0, 
        requiredCredits: 6, 
        isMinimum: false,
        isComplete: false,
        hasRule: true,
        isInGroup: false,
        isGroupLeader: false
      });
      fixture.detectChanges();
      expect(component.getProgressColor()).toBe('#e0e0e0');
    });

    it('should return correct colors for minimum requirements', () => {
      mockCourseStateService.getSectionStatus.and.returnValue({ 
        selectedCredits: 9, 
        requiredCredits: 6, 
        isMinimum: true,
        isComplete: true,
        hasRule: true,
        isInGroup: false,
        isGroupLeader: false
      });
      fixture.detectChanges();
      expect(component.getProgressColor()).toBe('#4caf50');

      mockCourseStateService.getSectionStatus.and.returnValue({ 
        selectedCredits: 3, 
        requiredCredits: 6, 
        isMinimum: true,
        isComplete: false,
        hasRule: true,
        isInGroup: false,
        isGroupLeader: false
      });
      fixture.detectChanges();
      expect(component.getProgressColor()).toBe('#2196f3');
    });
  });

  describe('completion checks', () => {
    it('should check if credits are complete', () => {
      mockCourseStateService.getSectionStatus.and.returnValue({ 
        selectedCredits: 6, 
        requiredCredits: 6, 
        isMinimum: false,
        isComplete: true,
        hasRule: true,
        isInGroup: false,
        isGroupLeader: false
      });
      fixture.detectChanges();
      expect(component.isCreditsComplete).toBe(true);
      expect(component.hasRequiredCredits).toBe(true);

      mockCourseStateService.getSectionStatus.and.returnValue({ 
        selectedCredits: 3, 
        requiredCredits: 6, 
        isMinimum: false,
        isComplete: false,
        hasRule: true,
        isInGroup: false,
        isGroupLeader: false
      });
      fixture.detectChanges();
      expect(component.isCreditsComplete).toBe(false);

      mockCourseStateService.getSectionStatus.and.returnValue({ 
        selectedCredits: 3, 
        requiredCredits: undefined, 
        isMinimum: false,
        isComplete: false,
        hasRule: false,
        isInGroup: false,
        isGroupLeader: false
      });
      fixture.detectChanges();
      expect(component.hasRequiredCredits).toBe(false);
      expect(component.isCreditsComplete).toBe(false);
    });
  });
});