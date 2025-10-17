import { TestBed } from '@angular/core/testing';
import { CourseStateService, CourseState, SectionRule, ExclusiveSubModuleRule } from './course-state';
import { Course, Module, Section, SubModule } from '@common/program';

describe('CourseStateService', () => {
  let service: CourseStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CourseStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initializeCourseStates', () => {
    it('should initialize course states from modules', () => {
      const mockModules: Module[] = [
        {
          title: 'Module A (10 crédits)',
          description: [],
          courses: [
            {
              description: '5 crédits au choix parmi les suivants',
              courses: [
                { sigle: 'TEST101', name: 'Test Course 1', credits: 3, trimester: [{year: 2025, term: "Automne"}] },
                { sigle: 'TEST102', name: 'Test Course 2', credits: 3, trimester: [{year: 2025, term: "Hiver"}] }
              ]
            }
          ]
        }
      ];

      service.initializeCourseStates(mockModules);

      expect(service.courseStates.size).toBe(2);
      expect(service.courseStates.has('TEST101')).toBe(true);
      expect(service.courseStates.has('TEST102')).toBe(true);
    });

    it('should parse credits_choice rule', () => {
      const mockModules: Module[] = [
        {
          title: 'Module A',
          description: [],
          courses: [
            {
              description: '6 crédits au choix parmi les suivants',
              courses: [
                { sigle: 'TEST101', name: 'Test', credits: 3, trimester: [{year: 2025, term: "Automne"}] }
              ]
            }
          ]
        }
      ];

      service.initializeCourseStates(mockModules);

      expect(service.sectionRules.length).toBeGreaterThan(0);
      const rule = service.sectionRules[0];
      expect(rule.type).toBe('credits_choice');
      expect(rule.requiredCredits).toBe(6);
    });

    it('should parse credits_minimum rule', () => {
      const mockModules: Module[] = [
        {
          title: 'Module A',
          description: [],
          courses: [
            {
              description: 'Au moins 9 crédits au choix parmi les cours suivants',
              courses: [
                { sigle: 'TEST101', name: 'Test', credits: 3, trimester: [{year: 2025, term: "Automne"}] }
              ]
            }
          ]
        }
      ];

      service.initializeCourseStates(mockModules);

      const rule = service.sectionRules[0];
      expect(rule.type).toBe('credits_minimum');
      expect(rule.requiredCredits).toBe(9);
      expect(rule.isMinimum).toBe(true);
    });

    it('should parse director_approval rule', () => {
      const mockModules: Module[] = [
        {
          title: 'Module A',
          description: [],
          courses: [
            {
              description: "Et jusqu'à 6 crédits au choix avec l'approbation du directeur",
              courses: []
            }
          ]
        }
      ];

      service.initializeCourseStates(mockModules);

      const rule = service.sectionRules[0];
      expect(rule.type).toBe('director_approval');
      expect(rule.requiredCredits).toBe(6);
    });

    it('should parse director_approval_single rule', () => {
      const mockModules: Module[] = [
        {
          title: 'Module A',
          description: [],
          courses: [
            {
              description: "Ou un cours au choix avec l'approbation du directeur",
              courses: []
            }
          ]
        }
      ];

      service.initializeCourseStates(mockModules);

      const rule = service.sectionRules[0];
      expect(rule.type).toBe('director_approval_single');
    });

    it('should parse exclusive submodule rules', () => {
      const mockModules: Module[] = [
        {
          title: 'Module A',
          description: ['Choisir un module parmi les modules B1, B2 et B3'],
          subModules: [
            {
              title: '(B1) Base Module',
              description: [],
              courses: [
                {
                  description: 'Cours obligatoires',
                  courses: [{ sigle: 'TEST101', name: 'Test', credits: 3, trimester: [{year: 2025, term: "Automne"}] }]
                }
              ]
            },
            {
              title: '(B2) Advanced Module',
              description: [],
              courses: [
                {
                  description: 'Cours obligatoires',
                  courses: [{ sigle: 'TEST201', name: 'Test', credits: 3, trimester: [{year: 2025, term: "Automne"}] }]
                }
              ]
            }
          ]
        }
      ];

      service.initializeCourseStates(mockModules);

      expect(service.exclusiveSubModuleRules.length).toBe(1);
      const rule = service.exclusiveSubModuleRules[0];
      expect(rule.subModulePrefixes).toEqual(['B1', 'B2', 'B3']);
      expect(rule.subModuleTitles.length).toBe(2);
    });

    it('should group consecutive sections without rules', () => {
      const mockModules: Module[] = [
        {
          title: 'Module A',
          description: [],
          courses: [
            {
              description: '6 crédits au choix parmi les suivants',
              courses: [{ sigle: 'TEST101', name: 'Test', credits: 3, trimester: [{year: 2025, term: "Automne"}] }]
            },
            {
              description: 'Section sans règle',
              courses: [{ sigle: 'TEST102', name: 'Test', credits: 3, trimester: [{year: 2025, term: "Automne"}] }]
            },
            {
              description: 'Autre section sans règle',
              courses: [{ sigle: 'TEST103', name: 'Test', credits: 3, trimester: [{year: 2025, term: "Automne"}] }]
            }
          ]
        }
      ];

      service.initializeCourseStates(mockModules);

      const rule = service.sectionRules[0];
      expect(rule.groupSections?.length).toBe(3);
    });
  });

  describe('setCourseSelected', () => {
    beforeEach(() => {
      const mockModules: Module[] = [
        {
          title: 'Module A (10 crédits)',
          description: [],
          courses: [
            {
              description: '6 crédits au choix parmi les suivants',
              courses: [
                { sigle: 'TEST101', name: 'Test 1', credits: 3, trimester: [{year: 2025, term: "Automne"}] },
                { sigle: 'TEST102', name: 'Test 2', credits: 3, trimester: [{year: 2025, term: "Automne"}] },
                { sigle: 'TEST103', name: 'Test 3', credits: 3, trimester: [{year: 2025, term: "Automne"}] }
              ]
            }
          ]
        }
      ];
      service.initializeCourseStates(mockModules);
    });

    it('should select a course successfully', () => {
      const result = service.setCourseSelected(
        'TEST101',
        'Module A (10 crédits)',
        null,
        '6 crédits au choix parmi les suivants',
        true
      );

      expect(result).toBe(true);
      const state = service.getCourseState('TEST101');
      expect(state.selected).toBe(true);
      expect(state.selectedInModule).toBe('Module A (10 crédits)');
    });

    it('should deselect a course successfully', () => {
      service.setCourseSelected('TEST101', 'Module A (10 crédits)', null, '6 crédits au choix parmi les suivants', true);
      
      const result = service.setCourseSelected('TEST101', 'Module A (10 crédits)', null, '6 crédits au choix parmi les suivants', false);

      expect(result).toBe(true);
      const state = service.getCourseState('TEST101');
      expect(state.selected).toBe(false);
      expect(state.selectedInModule).toBe(null);
    });

    it('should prevent selecting a course already selected elsewhere', () => {
      service.setCourseSelected('TEST101', 'Module A (10 crédits)', null, '6 crédits au choix parmi les suivants', true);
      
      const result = service.setCourseSelected('TEST101', 'Module B', null, 'Another section', true);

      expect(result).toBe(false);
    });

    it('should enforce credits_choice limit', () => {
      service.setCourseSelected('TEST101', 'Module A (10 crédits)', null, '6 crédits au choix parmi les suivants', true);
      service.setCourseSelected('TEST102', 'Module A (10 crédits)', null, '6 crédits au choix parmi les suivants', true);
      
      const result = service.setCourseSelected('TEST103', 'Module A (10 crédits)', null, '6 crédits au choix parmi les suivants', true);

      expect(result).toBe(false);
    });

    it('should enforce director_approval_single limit (max 1 course)', () => {
      const mockModules: Module[] = [
        {
          title: 'Module A',
          description: [],
          courses: [
            {
              description: "Ou un cours au choix avec l'approbation du directeur",
              courses: []
            }
          ]
        }
      ];
      service.initializeCourseStates(mockModules);
      service.addCourseToStates({ sigle: 'TEST201', name: 'Test', credits: 3, trimester: [{year: 2025, term: "Automne"}] });
      service.addCourseToStates({ sigle: 'TEST202', name: 'Test', credits: 3, trimester: [{year: 2025, term: "Automne"}] });

      service.setCourseSelected('TEST201', 'Module A', null, "Ou un cours au choix avec l'approbation du directeur", true);
      const result = service.setCourseSelected('TEST202', 'Module A', null, "Ou un cours au choix avec l'approbation du directeur", true);

      expect(result).toBe(false);
    });
  });

  describe('Exclusive SubModule Rules', () => {
    beforeEach(() => {
      const mockModules: Module[] = [
        {
          title: 'Module A',
          description: ['Choisir un module parmi les modules B1 et B2'],
          subModules: [
            {
              title: '(B1) SubModule 1',
              description: [],
              courses: [
                {
                  description: 'Cours obligatoires',
                  courses: [{ sigle: 'TEST101', name: 'Test', credits: 3, trimester: [{year: 2025, term: "Automne"}] }]
                }
              ]
            },
            {
              title: '(B2) SubModule 2',
              description: [],
              courses: [
                {
                  description: 'Cours obligatoires',
                  courses: [{ sigle: 'TEST201', name: 'Test', credits: 3, trimester: [{year: 2025, term: "Automne"}] }]
                }
              ]
            }
          ]
        }
      ];
      service.initializeCourseStates(mockModules);
    });

    it('should allow selecting a course in first exclusive submodule', () => {
      const result = service.setCourseSelected(
        'TEST101',
        'Module A',
        '(B1) SubModule 1',
        'Cours obligatoires',
        true
      );

      expect(result).toBe(true);
    });

    it('should prevent selecting a course in second exclusive submodule after first is selected', () => {
      service.setCourseSelected('TEST101', 'Module A', '(B1) SubModule 1', 'Cours obligatoires', true);
      
      const result = service.setCourseSelected('TEST201', 'Module A', '(B2) SubModule 2', 'Cours obligatoires', true);

      expect(result).toBe(false);
    });

    it('should allow selecting in second submodule after deselecting from first', () => {
      service.setCourseSelected('TEST101', 'Module A', '(B1) SubModule 1', 'Cours obligatoires', true);
      service.setCourseSelected('TEST101', 'Module A', '(B1) SubModule 1', 'Cours obligatoires', false);
      
      const result = service.setCourseSelected('TEST201', 'Module A', '(B2) SubModule 2', 'Cours obligatoires', true);

      expect(result).toBe(true);
    });
  });

  describe('canCourseBeSelected', () => {
    beforeEach(() => {
      const mockModules: Module[] = [
        {
          title: 'Module A (10 crédits)',
          description: [],
          courses: [
            {
              description: '6 crédits au choix parmi les suivants',
              courses: [
                { sigle: 'TEST101', name: 'Test 1', credits: 3, trimester: [{year: 2025, term: "Automne"}] },
                { sigle: 'TEST102', name: 'Test 2', credits: 3, trimester: [{year: 2025, term: "Automne"}] }
              ]
            }
          ]
        }
      ];
      service.initializeCourseStates(mockModules);
    });

    it('should return true when course can be selected', () => {
      const result = service.canCourseBeSelected('TEST101', 'Module A (10 crédits)', null, '6 crédits au choix parmi les suivants');

      expect(result.canSelect).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should return false when course already selected', () => {
      service.setCourseSelected('TEST101', 'Module A (10 crédits)', null, '6 crédits au choix parmi les suivants', true);
      
      const result = service.canCourseBeSelected('TEST101', 'Module B', null, 'Another section');

      expect(result.canSelect).toBe(false);
      expect(result.reason).toContain('Déjà sélectionné ailleurs');
    });

    it('should return false when section credit limit reached', () => {
      service.setCourseSelected('TEST101', 'Module A (10 crédits)', null, '6 crédits au choix parmi les suivants', true);
      service.setCourseSelected('TEST102', 'Module A (10 crédits)', null, '6 crédits au choix parmi les suivants', true);
      
      service.addCourseToStates({ sigle: 'TEST103', name: 'Test 3', credits: 3, trimester: [{year: 2025, term: "Automne"}] });
      const result = service.canCourseBeSelected('TEST103', 'Module A (10 crédits)', null, '6 crédits au choix parmi les suivants');

      expect(result.canSelect).toBe(false);
      expect(result.reason).toContain('Limite de crédits de la section atteinte');
    });

    it('should return false when module credit limit reached', () => {
      service.setCourseSelected('TEST101', 'Module A (10 crédits)', null, '6 crédits au choix parmi les suivants', true);
      service.setCourseSelected('TEST102', 'Module A (10 crédits)', null, '6 crédits au choix parmi les suivants', true);
      
      service.addCourseToStates({ sigle: 'TEST103', name: 'Test 3', credits: 5, trimester: [{year: 2025, term: "Automne"}] });
      const result = service.canCourseBeSelected('TEST103', 'Module A (10 crédits)', null, '6 crédits au choix parmi les suivants');

      expect(result.canSelect).toBe(false);
      expect(result.reason).toContain('Limite de crédits du module atteinte');
    });
  });

  describe('getSectionSelectedCredits', () => {
    beforeEach(() => {
      const mockModules: Module[] = [
        {
          title: 'Module A',
          description: [],
          courses: [
            {
              description: 'Test section',
              courses: [
                { sigle: 'TEST101', name: 'Test 1', credits: 3, trimester: [{year: 2025, term: "Automne"}] },
                { sigle: 'TEST102', name: 'Test 2', credits: 4, trimester: [{year: 2025, term: "Automne"}] }
              ]
            }
          ]
        }
      ];
      service.initializeCourseStates(mockModules);
    });

    it('should return 0 when no courses selected', () => {
      const credits = service.getSectionSelectedCredits('Module A', null, 'Test section');
      expect(credits).toBe(0);
    });

    it('should return sum of selected course credits', () => {
      service.setCourseSelected('TEST101', 'Module A', null, 'Test section', true);
      service.setCourseSelected('TEST102', 'Module A', null, 'Test section', true);
      
      const credits = service.getSectionSelectedCredits('Module A', null, 'Test section');
      expect(credits).toBe(7);
    });
  });

  describe('validateRuleGroups', () => {
    it('should validate credits_choice rules', () => {
      const mockModules: Module[] = [
        {
          title: 'Module A',
          description: [],
          courses: [
            {
              description: '6 crédits au choix parmi les suivants',
              courses: [
                { sigle: 'TEST101', name: 'Test 1', credits: 3, trimester: [{year: 2025, term: "Automne"}] },
                { sigle: 'TEST102', name: 'Test 2', credits: 3, trimester: [{year: 2025, term: "Automne"}] }
              ]
            }
          ]
        }
      ];
      service.initializeCourseStates(mockModules);
      service.setCourseSelected('TEST101', 'Module A', null, '6 crédits au choix parmi les suivants', true);

      const validation = service.validateRuleGroups();

      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it('should validate credits_minimum rules', () => {
      const mockModules: Module[] = [
        {
          title: 'Module A',
          description: [],
          courses: [
            {
              description: 'Au moins 6 crédits au choix parmi les cours suivants',
              courses: [
                { sigle: 'TEST101', name: 'Test 1', credits: 3, trimester: [{year: 2025, term: "Automne"}] }
              ]
            }
          ]
        }
      ];
      service.initializeCourseStates(mockModules);
      service.setCourseSelected('TEST101', 'Module A', null, 'Au moins 6 crédits au choix parmi les cours suivants', true);

      const validation = service.validateRuleGroups();

      expect(validation.isValid).toBe(false);
      expect(validation.errors[0]).toContain('minimum requis');
    });

    it('should pass validation when rules are met', () => {
      const mockModules: Module[] = [
        {
          title: 'Module A',
          description: [],
          courses: [
            {
              description: '6 crédits au choix parmi les suivants',
              courses: [
                { sigle: 'TEST101', name: 'Test 1', credits: 3, trimester: [{year: 2025, term: "Automne"}] },
                { sigle: 'TEST102', name: 'Test 2', credits: 3, trimester: [{year: 2025, term: "Automne"}] }
              ]
            }
          ]
        }
      ];
      service.initializeCourseStates(mockModules);
      service.setCourseSelected('TEST101', 'Module A', null, '6 crédits au choix parmi les suivants', true);
      service.setCourseSelected('TEST102', 'Module A', null, '6 crédits au choix parmi les suivants', true);

      const validation = service.validateRuleGroups();

      expect(validation.isValid).toBe(true);
      expect(validation.errors.length).toBe(0);
    });

    it('should ignore validation for submodules with no selections', () => {
      const mockModules: Module[] = [
        {
          title: 'Module A',
          description: [],
          subModules: [
            {
              title: 'SubModule 1',
              description: [],
              courses: [
                {
                  description: '6 crédits au choix parmi les suivants',
                  courses: [
                    { sigle: 'TEST101', name: 'Test 1', credits: 3, trimester: [{year: 2025, term: "Automne"}] }
                  ]
                }
              ]
            }
          ]
        }
      ];
      service.initializeCourseStates(mockModules);

      const validation = service.validateRuleGroups();

      expect(validation.isValid).toBe(true);
    });
  });

  describe('getSelectedCoursesByModule', () => {
    beforeEach(() => {
      const mockModules: Module[] = [
        {
          title: 'Module A',
          description: [],
          courses: [
            {
              description: 'Test',
              courses: [
                { sigle: 'TEST101', name: 'Test 1', credits: 3, trimester: [{year: 2025, term: "Automne"}] },
                { sigle: 'TEST102', name: 'Test 2', credits: 3, trimester: [{year: 2025, term: "Automne"}] }
              ]
            }
          ]
        },
        {
          title: 'Module B',
          description: [],
          courses: [
            {
              description: 'Test',
              courses: [
                { sigle: 'TEST201', name: 'Test 3', credits: 3, trimester: [{year: 2025, term: "Automne"}] }
              ]
            }
          ]
        }
      ];
      service.initializeCourseStates(mockModules);
    });

    it('should return empty array when no courses selected', () => {
      const result = service.getSelectedCoursesByModule();
      expect(result).toEqual([]);
    });

    it('should group selected courses by module', () => {
      service.setCourseSelected('TEST101', 'Module A', null, 'Test', true);
      service.setCourseSelected('TEST102', 'Module A', null, 'Test', true);
      service.setCourseSelected('TEST201', 'Module B', null, 'Test', true);

      const result = service.getSelectedCoursesByModule();

      expect(result.length).toBe(2);
      expect(result[0].courses.length).toBe(2);
      expect(result[1].courses.length).toBe(1);
    });
  });

  describe('getModuleSelectedCredits', () => {
    beforeEach(() => {
      const mockModules: Module[] = [
        {
          title: 'Module A',
          description: [],
          courses: [
            {
              description: 'Test',
              courses: [
                { sigle: 'TEST101', name: 'Test 1', credits: 3, trimester: [{year: 2025, term: "Automne"}] },
                { sigle: 'TEST102', name: 'Test 2', credits: 4, trimester: [{year: 2025, term: "Automne"}] }
              ]
            }
          ]
        }
      ];
      service.initializeCourseStates(mockModules);
    });

    it('should return 0 when no courses selected in module', () => {
      const credits = service.getModuleSelectedCredits('Module A');
      expect(credits).toBe(0);
    });

    it('should return sum of all selected course credits in module', () => {
      service.setCourseSelected('TEST101', 'Module A', null, 'Test', true);
      service.setCourseSelected('TEST102', 'Module A', null, 'Test', true);

      const credits = service.getModuleSelectedCredits('Module A');
      expect(credits).toBe(7);
    });
  });

  describe('getSelectedCredits', () => {
    beforeEach(() => {
      const mockModules: Module[] = [
        {
          title: 'Module A',
          description: [],
          courses: [
            {
              description: 'Test',
              courses: [
                { sigle: 'TEST101', name: 'Test 1', credits: 3, trimester: [{year: 2025, term: "Automne"}] },
                { sigle: 'TEST102', name: 'Test 2', credits: 4, trimester: [{year: 2025, term: "Automne"}] }
              ]
            }
          ]
        }
      ];
      service.initializeCourseStates(mockModules);
    });

    it('should return total of all selected credits', () => {
      service.setCourseSelected('TEST101', 'Module A', null, 'Test', true);
      service.setCourseSelected('TEST102', 'Module A', null, 'Test', true);

      const credits = service.getSelectedCredits();
      expect(credits).toBe(7);
    });
  });

  describe('getSectionStatus', () => {
    beforeEach(() => {
      const mockModules: Module[] = [
        {
          title: 'Module A',
          description: [],
          courses: [
            {
              description: '6 crédits au choix parmi les suivants',
              courses: [
                { sigle: 'TEST101', name: 'Test 1', credits: 3, trimester: [{year: 2025, term: "Automne"}] }
              ]
            }
          ]
        }
      ];
      service.initializeCourseStates(mockModules);
    });

    it('should return correct status for section with rule', () => {
      const status = service.getSectionStatus('Module A', null, '6 crédits au choix parmi les suivants');

      expect(status.hasRule).toBe(true);
      expect(status.requiredCredits).toBe(6);
      expect(status.selectedCredits).toBe(0);
      expect(status.isComplete).toBe(false);
    });

    it('should show complete when credits match requirement', () => {
      service.setCourseSelected('TEST101', 'Module A', null, '6 crédits au choix parmi les suivants', true);
      service.addCourseToStates({ sigle: 'TEST102', name: 'Test 2', credits: 3, trimester: [{year: 2025, term: "Automne"}] });
      service.setCourseSelected('TEST102', 'Module A', null, '6 crédits au choix parmi les suivants', true);

      const status = service.getSectionStatus('Module A', null, '6 crédits au choix parmi les suivants');

      expect(status.isComplete).toBe(true);
    });
  });
});