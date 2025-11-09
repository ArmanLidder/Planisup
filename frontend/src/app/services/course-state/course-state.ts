import { Injectable } from '@angular/core';
import { Course, Grade, Module, Section, SubModule, RuleDefinition, Trimester } from '@common/program';
import { SelectedModule, SerializedCourseState } from '@common/study-plan';

export interface CourseState {
  selected: boolean;
  selectedInModule: string | null;
  selectedInSubmodule: string | null;
  selectedInSection: string | null;
  credits: number;
  course: Course;
}

export interface ExclusiveSubModuleRule {
  moduleTitle: string;
  subModuleTitles: string[];
}

@Injectable({
  providedIn: 'root'
})
export class CourseStateService {
  public courseStates: Map<string, CourseState> = new Map();
  private exclusiveSubModuleRules: ExclusiveSubModuleRule[] = [];
  private modules: Module[] = [];

  /**
   * Sérialise le courseState en objet simple pour l'envoi au serveur
   */
  serializeCourseState(): { [courseSigle: string]: SerializedCourseState } {
    const serialized: { [courseSigle: string]: SerializedCourseState } = {};
    this.courseStates.forEach((state, sigle) => {
      serialized[sigle] = {
        selected: state.selected,
        selectedInModule: state.selectedInModule,
        selectedInSubmodule: state.selectedInSubmodule,
        selectedInSection: state.selectedInSection,
        credits: state.credits,
        course: state.course
      };
    });
    return serialized;
  }

  /**
   * Restaure le courseState depuis un objet sérialisé
   */
  restoreCourseState(serializedState: { [courseSigle: string]: SerializedCourseState }) {
    Object.entries(serializedState).forEach(([sigle, state]) => {
      this.courseStates.set(sigle, {
        selected: state.selected,
        selectedInModule: state.selectedInModule,
        selectedInSubmodule: state.selectedInSubmodule,
        selectedInSection: state.selectedInSection,
        credits: state.credits,
        course: state.course
      });
    });
  }

  initializeCourseStates(modules: Module[]) {
    this.courseStates.clear();
    this.exclusiveSubModuleRules = [];
    this.modules = modules;
    
    modules.forEach(module => {
      this.processModule(module);
    });
  }

  private processModule(module: Module) {
    // Traiter les règles d'exclusivité au niveau du module
    if (module.rules) {
      module.rules.forEach(rule => {
        if (rule.type === 'exclusive_submodules') {
          const subModuleTitles = module.subModules?.map(sm => sm.title) || [];
          if (subModuleTitles.length > 0) {
            this.exclusiveSubModuleRules.push({
              moduleTitle: module.title,
              subModuleTitles
            });
          }
        }
      });
    }

    // Traiter les sections directes du module
    if (module.courses) {
      module.courses.forEach(section => {
        this.processSectionCourses(section);
      });
    }

    // Traiter les sous-modules
    if (module.subModules) {
      module.subModules.forEach(subModule => {
        if (subModule.courses) {
          subModule.courses.forEach(section => {
            this.processSectionCourses(section);
          });
        }
      });
    }
  }

  private processSectionCourses(section: Section) {
    section.courses.forEach(course => {
      if (!this.courseStates.has(course.sigle)) {
        this.courseStates.set(course.sigle, {
          selected: false,
          selectedInModule: null,
          selectedInSubmodule: null,
          selectedInSection: null,
          credits: course.credits,
          course: course
        });
      }
    });
  }

  getCourseState(courseSigle: string): CourseState {
    return this.courseStates.get(courseSigle) || {
      selected: false,
      selectedInModule: null,
      selectedInSubmodule: null,
      selectedInSection: null,
      credits: 0,
      course: {} as Course
    };
  }

  addCourseToStates(course: Course): void {
    if (!this.courseStates.has(course.sigle)) {
      this.courseStates.set(course.sigle, {
        selected: false,
        selectedInModule: null,
        selectedInSubmodule: null,
        selectedInSection: null,
        credits: course.credits,
        course: course
      });
    }
  }

  private isSubModuleExcluded(
    targetModuleTitle: string,
    targetSubModuleTitle: string | null
  ): boolean {
    if (!targetSubModuleTitle) return false;

    const rule = this.exclusiveSubModuleRules.find(r => 
      r.moduleTitle === targetModuleTitle &&
      r.subModuleTitles.includes(targetSubModuleTitle)
    );

    if (!rule) return false;

    let hasSelectionInOtherSubModule = false;
    
    this.courseStates.forEach((state) => {
      if (state.selected && 
          state.selectedInModule === targetModuleTitle &&
          state.selectedInSubmodule &&
          rule.subModuleTitles.includes(state.selectedInSubmodule) &&
          state.selectedInSubmodule !== targetSubModuleTitle) {
        hasSelectionInOtherSubModule = true;
      }
    });

    return hasSelectionInOtherSubModule;
  }

  setCourseSelected(
    courseSigle: string, 
    moduleTitle: string, 
    submoduleTitle: string | null,
    sectionDescription: string, 
    selected: boolean
  ): boolean {
    let state = this.getCourseState(courseSigle);
    
    if (selected) {
      if (this.isCourseSelected(courseSigle)) {
        return false;
      }

      if (this.isSubModuleExcluded(moduleTitle, submoduleTitle)) {
        return false;
      }
      
      // Vérifier les règles
      const module = this.getModule(moduleTitle);
      if (!module) return false;

      const section = this.getSection(module, submoduleTitle, sectionDescription);
      const subModule = submoduleTitle ? this.getSubModule(module, submoduleTitle) : null;

      // Vérifier les règles de section
      if (section?.rules) {
        for (const rule of section.rules) {
          if (!this.canApplyRule(rule, courseSigle, moduleTitle, submoduleTitle, sectionDescription)) {
            return false;
          }
        }
      }

      // Vérifier les règles de sous-module
      if (subModule?.rules) {
        for (const rule of subModule.rules) {
          if (!this.canApplyRule(rule, courseSigle, moduleTitle, submoduleTitle, null)) {
            return false;
          }
        }
      }

      // Vérifier les règles de module
      if (module.rules) {
        for (const rule of module.rules) {
          if (rule.type !== 'exclusive_submodules') {
            if (!this.canApplyRule(rule, courseSigle, moduleTitle, null, null)) {
              return false;
            }
          }
        }
      }

      state.selected = true;
      state.selectedInModule = moduleTitle;
      state.selectedInSubmodule = submoduleTitle;
      state.selectedInSection = sectionDescription;
    } else {
      state.selected = false;
      state.selectedInModule = null;
      state.selectedInSubmodule = null;
      state.selectedInSection = null;
    }
    
    this.courseStates.set(courseSigle, state);
    return true;
  }

  private canApplyRule(
    rule: RuleDefinition,
    courseSigle: string,
    moduleTitle: string,
    subModuleTitle: string | null,
    sectionDescription: string | null
  ): boolean {
    const courseCredits = this.getCourseCredits(courseSigle);
    const currentCredits = this.getCreditsForScope(moduleTitle, subModuleTitle, sectionDescription);

    switch (rule.type) {
      case 'credits_exact':
        return currentCredits + courseCredits <= (rule.value || 0);
      
      case 'credits_maximum':
        return currentCredits + courseCredits <= (rule.value || 0);
      
      default:
        return true;
    }
  }

  private getCreditsForScope(
    moduleTitle: string,
    subModuleTitle: string | null,
    sectionDescription: string | null
  ): number {
    let credits = 0;
    
    this.courseStates.forEach((state) => {
      if (!state.selected) return;
      
      const matchesModule = state.selectedInModule === moduleTitle;
      const matchesSubModule = subModuleTitle === null || state.selectedInSubmodule === subModuleTitle;
      const matchesSection = sectionDescription === null || state.selectedInSection === sectionDescription;
      
      if (matchesModule && matchesSubModule && matchesSection) {
        credits += state.credits;
      }
    });
    
    return credits;
  }

  private getModule(moduleTitle: string): Module | null {
    return this.modules.find(m => m.title === moduleTitle) || null;
  }

  private getSubModule(module: Module, subModuleTitle: string): SubModule | null {
    return module.subModules?.find(sm => sm.title === subModuleTitle) || null;
  }

  private getSection(
    module: Module,
    subModuleTitle: string | null,
    sectionDescription: string
  ): Section | null {
    if (subModuleTitle) {
      const subModule = this.getSubModule(module, subModuleTitle);
      return subModule?.courses?.find(s => s.description === sectionDescription) || null;
    }
    return module.courses?.find(s => s.description === sectionDescription) || null;
  }

  private getCourseCredits(courseSigle: string): number {
    const state = this.courseStates.get(courseSigle);
    return state ? state.credits : 0;
  }

  getSectionSelectedCredits(moduleTitle: string, subModuleTitle: string | null, sectionDescription: string): number {
    return this.getCreditsForScope(moduleTitle, subModuleTitle, sectionDescription);
  }

  public getSelectedCoursesByModule(): SelectedModule[] {
    const moduleMap: { [moduleTitle: string]: Course[] } = {};
    
    this.courseStates.forEach((state) => {
      if (state.selected && state.selectedInModule) {
        if (!moduleMap[state.selectedInModule]) {
          moduleMap[state.selectedInModule] = [];
        }
        const course = this.findCourseInModules(
          state.course.sigle, 
          state.selectedInModule, 
          state.selectedInSubmodule, 
          state.selectedInSection
        );
        if (course) {
          moduleMap[state.selectedInModule].push(course);
        }
      }
    });
    
    return Object.entries(moduleMap).map(([title, courses]) => ({
      title,
      courses
    }));
  }

  private findCourseInModules(
    courseSigle: string, 
    moduleTitle: string, 
    subModuleTitle: string | null, 
    sectionDescription: string | null
  ): Course | null {
    const module = this.getModule(moduleTitle);
    if (!module) return null;

    if (subModuleTitle) {
      const subModule = this.getSubModule(module, subModuleTitle);
      if (subModule?.courses) {
        for (const section of subModule.courses) {
          const course = section.courses.find(c => c.sigle === courseSigle);
          if (course) {
            // @ts-ignore
            course.trimester = course.trimester[0];
            return course;
          }
        }
      }
    } else {
      if (module.courses) {
        for (const section of module.courses) {
          const course = section.courses.find(c => c.sigle === courseSigle);
          if (course) {
            // @ts-ignore
            course.trimester = course.trimester[0];
            return course;
          }
        }
      }
    }
    return null;
  }

  canCourseBeSelected(
    courseSigle: string, 
    moduleTitle: string, 
    subModuleTitle: string | null, 
    sectionDescription: string
  ): { canSelect: boolean; reason?: string } {
    if (this.isCourseSelected(courseSigle)) {
      return { canSelect: false, reason: 'Déjà sélectionné ailleurs' };
    }

    const module = this.getModule(moduleTitle);
    if (!module) return { canSelect: false, reason: 'Module introuvable' };

    const section = this.getSection(module, subModuleTitle, sectionDescription);
    const subModule = subModuleTitle ? this.getSubModule(module, subModuleTitle) : null;
    const courseCredits = this.getCourseCredits(courseSigle);

    // Vérifier les règles de module
    if (module.rules) {
      for (const rule of module.rules) {
        if (rule.type !== 'exclusive_submodules') {
          const result = this.validateRuleForSelection(
            rule, 
            courseSigle, 
            moduleTitle, 
            null, 
            null,
            'module'
          );
          if (!result.canSelect) return result;
        }
      }
    }

    // Vérifier les règles de sous-module
    if (subModule?.rules) {
      for (const rule of subModule.rules) {
        const result = this.validateRuleForSelection(
          rule, 
          courseSigle, 
          moduleTitle, 
          subModuleTitle, 
          null,
          'sous-module'
        );
        if (!result.canSelect) return result;
      }
    }

    // Vérifier la règle d'exclusivité des sous-modules
    if (this.isSubModuleExcluded(moduleTitle, subModuleTitle)) {
      const rule = this.exclusiveSubModuleRules.find(r => 
        r.moduleTitle === moduleTitle &&
        subModuleTitle &&
        r.subModuleTitles.includes(subModuleTitle)
      );
      
      if (rule) {
        let selectedSubModule = '';
        this.courseStates.forEach((state) => {
          if (state.selected && 
              state.selectedInModule === moduleTitle &&
              state.selectedInSubmodule &&
              rule.subModuleTitles.includes(state.selectedInSubmodule) &&
              state.selectedInSubmodule !== subModuleTitle) {
            selectedSubModule = state.selectedInSubmodule;
          }
        });
        
        return { 
          canSelect: false, 
          reason: `Un autre module exclusif est déjà sélectionné (${selectedSubModule})` 
        };
      }
    }

    // Vérifier les règles de section
    if (section?.rules) {
      for (const rule of section.rules) {
        const result = this.validateRuleForSelection(
          rule, 
          courseSigle, 
          moduleTitle, 
          subModuleTitle, 
          sectionDescription,
          'section'
        );
        if (!result.canSelect) return result;
      }
    }

    return { canSelect: true };
  }

  private validateRuleForSelection(
    rule: RuleDefinition,
    courseSigle: string,
    moduleTitle: string,
    subModuleTitle: string | null,
    sectionDescription: string | null,
    scopeName: string
  ): { canSelect: boolean; reason?: string } {
    const currentCredits = this.getCreditsForScope(moduleTitle, subModuleTitle, sectionDescription);
    const courseCredits = this.getCourseCredits(courseSigle);

    switch (rule.type) {
      case 'credits_exact':
      case 'credits_maximum':
        if (currentCredits + courseCredits > (rule.value || 0)) {
          return {
            canSelect: false,
            reason: `Limite de crédits du ${scopeName} atteinte (${currentCredits}/${rule.value})`
          };
        }
        break;
    }

    return { canSelect: true };
  }

  canSearchCourseBeSelected(
    courseSigle: string,
    moduleTitle: string,
    subModuleTitle: string | null
  ): { canSelect: boolean; reason?: string } {
    if (this.isCourseSelected(courseSigle)) {
      return { canSelect: false, reason: 'Déjà sélectionné ailleurs' };
    }

    const module = this.getModule(moduleTitle);
    if (!module) return { canSelect: false, reason: 'Module introuvable' };

    const subModule = subModuleTitle ? this.getSubModule(module, subModuleTitle) : null;
    const courseCredits = this.getCourseCredits(courseSigle);

    // Vérifier les règles de module
    if (module.rules) {
      for (const rule of module.rules) {
        if (rule.type !== 'exclusive_submodules' && rule.type !== 'credits_minimum') {
          const currentCredits = this.getCreditsForScope(moduleTitle, null, null);
          if ((currentCredits >= (rule.value || 0)) || (currentCredits + courseCredits > (rule.value || 0))) {
            return {
              canSelect: false,
              reason: `Limite de crédits du module atteinte (${currentCredits}/${rule.value})`
            };
          }
        }
      }
    }

    // Vérifier les règles de sous-module
    if (subModule?.rules) {
      for (const rule of subModule.rules) {
        const currentCredits = this.getCreditsForScope(moduleTitle, subModuleTitle, null);
        if (currentCredits + courseCredits > (rule.value || 0)) {
          return {
            canSelect: false,
            reason: `Limite de crédits du sous-module atteinte (${currentCredits}/${rule.value})`
          };
        }
      }
    }

    // Vérifier la règle d'exclusivité
    if (this.isSubModuleExcluded(moduleTitle, subModuleTitle)) {
      return {
        canSelect: false,
        reason: 'Un autre module exclusif est déjà sélectionné'
      };
    }

    return { canSelect: true };
  }

  getModuleSelectedCredits(moduleTitle: string): number {
    return this.getCreditsForScope(moduleTitle, null, null);
  }

  private isCourseSelected(courseSigle: string): boolean {
    const state = this.courseStates.get(courseSigle);
    return state ? state.selected : false;
  }

  getSelectedCredits(): number {
    let credits = 0;
    this.courseStates.forEach((state) => {
      if (state.selected && !state.course.sigle.includes("CAP")) {
        credits += state.credits;
      }
    });
    return credits;
  }

  validateRuleGroups(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    this.modules.forEach(module => {
      // Valider les règles de module
      if (module.rules) {
        module.rules.forEach(rule => {
          if (rule.type !== 'exclusive_submodules') {
            const result = this.validateRule(rule, module.title, null, null, module.title);
            if (result) errors.push(result);
          }
        });
      }

      // Valider les règles de sous-modules
      if (module.subModules) {
        module.subModules.forEach(subModule => {
          // Ne valider que si des cours sont sélectionnés dans ce sous-module
          const hasSelection = Array.from(this.courseStates.values()).some(
            state => state.selected && 
                     state.selectedInModule === module.title &&
                     state.selectedInSubmodule === subModule.title
          );

          if (!hasSelection) return;

          if (subModule.rules) {
            subModule.rules.forEach(rule => {
              const result = this.validateRule(
                rule, 
                module.title, 
                subModule.title, 
                null, 
                `Sous-module "${subModule.title}"`
              );
              if (result) errors.push(result);
            });
          }

          // Valider les règles de sections
          if (subModule.courses) {
            subModule.courses.forEach(section => {
              if (section.rules) {
                section.rules.forEach(rule => {
                  const result = this.validateRule(
                    rule,
                    module.title,
                    subModule.title,
                    section.description,
                    `${subModule.title} - Section "${section.description}"`
                  );
                  if (result) errors.push(result);
                });
              }
            });
          }
        });
      }

      // Valider les règles de sections directes du module
      if (module.courses) {
        module.courses.forEach(section => {
          if (section.rules) {
            section.rules.forEach(rule => {
              const result = this.validateRule(
                rule,
                module.title,
                null,
                section.description,
                `Section "${section.description}" dans ${module.title}`
              );
              if (result) errors.push(result);
            });
          }
        });
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private validateRule(
    rule: RuleDefinition,
    moduleTitle: string,
    subModuleTitle: string | null,
    sectionDescription: string | null,
    locationName: string
  ): string | null {
    if (rule.value === undefined) return null;

    const currentCredits = this.getCreditsForScope(moduleTitle, subModuleTitle, sectionDescription);

    switch (rule.type) {
      case 'credits_minimum':
        if (currentCredits < rule.value) {
          return `${locationName} : ${currentCredits}/${rule.value} crédits sélectionnés (minimum requis)`;
        }
        break;
      
      case 'credits_exact':
        if (currentCredits !== rule.value) {
          return `${locationName} : ${currentCredits}/${rule.value} crédits sélectionnés (exactement ${rule.value} requis)`;
        }
        break;
      
      case 'credits_maximum':
        if (currentCredits > rule.value) {
          return `${locationName} : Trop de crédits sélectionnés (${currentCredits}/${rule.value})`;
        }
        break;
      
      case 'director_approval':
        if (currentCredits > rule.value) {
          return `${locationName} : Trop de crédits avec approbation (${currentCredits}/${rule.value})`;
        }
        break;
    }

    return null;
  }

  getSectionStatus(moduleTitle: string, subModuleTitle: string | null, sectionDescription: string): {
    selectedCredits: number;
    requiredCredits?: number;
  } {
    const module = this.getModule(moduleTitle);
    if (!module) {
      return {
        selectedCredits: 0,
      };
    }

    const section = this.getSection(module, subModuleTitle, sectionDescription);
    const selectedCredits = this.getSectionSelectedCredits(moduleTitle, subModuleTitle, sectionDescription);
    
    const rule = section?.rules?.[0];
    
    return {
      selectedCredits,
      requiredCredits: rule?.value,
    };
  }

  setAvantagePoly(courseSigle: string, alreadyDone: boolean, grade?: Grade) {
    const state = this.courseStates.get(courseSigle);
    if (!state || !state.selected) return;

    state.course.alreadyDone = alreadyDone;
    if (grade) state.course.grade = grade;
  }

  /**
   * Définir le trimestre sélectionné pour un cours
   */
  setCourseTrimester(courseSigle: string, trimester: Trimester) {
    const state = this.courseStates.get(courseSigle);
    if (!state || !state.selected) return;

    // Stocker le trimestre comme string dans le course
    state.course.trimester = [trimester];
    
    // Mettre à jour le state
    this.courseStates.set(courseSigle, state);
  }

  getAvantagePolyCredit(): number {
    let credits = 0;
    this.courseStates.forEach((state) => {
      if (state.course.alreadyDone && state.selected) {
        credits += state.credits;
      }
    });
    return credits;
  }

  isAllAvantagePolyGrade(): boolean {
    let isGrade = true;
    this.courseStates.forEach((state) => {
      if (state.course.alreadyDone && state.selected && !state.course.grade) {
        isGrade = false;
      }
    });
    return isGrade;
  }
}