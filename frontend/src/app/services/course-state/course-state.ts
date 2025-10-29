import { Injectable } from '@angular/core';
import { Course, Grade, Module, Section, SubModule } from '@common/program';
import { SelectedModule, SerializedCourseState } from '@common/study-plan';

export interface CourseState {
  selected: boolean;
  selectedInModule: string | null;
  selectedInSubmodule: string | null;
  selectedInSection: string | null;
  credits: number;
  course: Course;
}

export interface SectionRule {
  type: 'credits_choice' | 'director_approval' | 'credits_minimum' | 'director_approval_single' | 'none';
  requiredCredits?: number;
  isMinimum?: boolean;
  description: string;
  groupSections?: string[];
  moduleTitle: string;
  subModuleTitle: string | null;
}

export interface ExclusiveSubModuleRule {
  moduleTitle: string;
  subModulePrefixes: string[];
  subModuleTitles: string[]; 
}

@Injectable({
  providedIn: 'root'
})
export class CourseStateService {
  public courseStates: Map<string, CourseState> = new Map();
  public sectionRules: SectionRule[] = [];
  public exclusiveSubModuleRules: ExclusiveSubModuleRule[] = [];
  private modules: Module[] = [];

  private readonly AVANTAGE_POLY_MAX_CREDITS = 15;

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
    console.log(serialized)
    return serialized;
  }

  /**
   * Restaure le courseState depuis un objet sérialisé
   */
  restoreCourseState(serializedState: { [courseSigle: string]: SerializedCourseState }) {
    console.log("je suis la pr voir se que tu fais");
    console.log(serializedState)
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

  initializeCourseStates(modules: any[]) {
    this.courseStates.clear();
    this.sectionRules = [];
    this.exclusiveSubModuleRules = [];
    this.modules = modules;
    
    modules.forEach(module => {
      // Vérifier les règles d'exclusivité dans la description du module
      this.parseExclusiveSubModuleRules(module);
      
      if (module.courses) {
        this.processSections(module.courses, module.title, null);
      }
      if (module.subModules) {
        module.subModules.forEach((subModule: any) => {
          if (subModule.courses) {
            this.processSections(subModule.courses, module.title, subModule.title);
          }
        });
      }
    });

    console.log('Course States:', this.courseStates);
    console.log('Section Rules:', this.sectionRules);
    console.log('Exclusive SubModule Rules:', this.exclusiveSubModuleRules);
  }

  private parseExclusiveSubModuleRules(module: Module) {
    if (!module.description || module.description.length === 0) return;
    
    // Regex pour capturer : "Choisir un module parmi les modules X, Y et Z"
    const exclusiveRegex = /Choisir\s+un\s+module\s+parmi\s+les\s+modules\s+((?:[A-Z]\d+(?:,\s*|\s+et\s+))+[A-Z]\d+)/i;
    
    module.description.forEach(desc => {
      const match = desc.match(exclusiveRegex);
      if (match) {
        // Extraire les préfixes (B1, B2, B3)
        const prefixesStr = match[1];
        const prefixes = prefixesStr
          .split(/,\s*|\s+et\s+/)
          .map(p => p.trim())
          .filter(p => p.length > 0);
        
        // Trouver les titres complets des sous-modules correspondants
        const subModuleTitles: string[] = [];
        if (module.subModules) {
          module.subModules.forEach(subModule => {
            const subModulePrefix = this.extractSubModulePrefix(subModule.title);
            if (prefixes.includes(subModulePrefix)) {
              subModuleTitles.push(subModule.title);
            }
          });
        }
        
        if (subModuleTitles.length > 0) {
          this.exclusiveSubModuleRules.push({
            moduleTitle: module.title,
            subModulePrefixes: prefixes,
            subModuleTitles
          });
        }
      }
    });
  }

  private extractSubModulePrefix(subModuleTitle: string): string {
    // Extraire le préfixe entre parenthèses : "(B1) Module de Base" -> "B1"
    const match = subModuleTitle.match(/\(([A-Z]\d+)\)/);
    return match ? match[1] : '';
  }

  private processSections(sections: Section[], moduleTitle: string, subModuleTitle: string | null) {
    let currentGroup: { 
      rule: SectionRule; 
      sections: string[]; 
    } | null = null;

    sections.forEach((section: Section, index: number) => {
      const parsedRule = this.parseRuleFromDescription(section.description);

      if (parsedRule.type !== 'none') {
        if (currentGroup) {
          this.finalizeRuleGroup(currentGroup);
        }

        const newRule: SectionRule = {
          type: parsedRule.type,
          requiredCredits: parsedRule.requiredCredits,
          isMinimum: parsedRule.isMinimum,
          description: parsedRule.description,
          moduleTitle,
          subModuleTitle,
          groupSections: [section.description]
        };
        
        currentGroup = {
          rule: newRule,
          sections: [section.description]
        };
      } 
      else if (currentGroup && parsedRule.type === 'none') {
        currentGroup.sections.push(section.description);
      } 

      section.courses.forEach((course: Course) => {
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
    });

    if (currentGroup) {
      this.finalizeRuleGroup(currentGroup);
    }
  }

  private finalizeRuleGroup(group: { rule: SectionRule; sections: string[]; }) {
    group.rule.groupSections = [...group.sections];
    this.sectionRules.push(group.rule);
  }

  private parseRuleFromDescription(description: string): Omit<SectionRule, 'moduleTitle' | 'subModuleTitle'> {
    description = description.trim().replace(/\s+/g, ' ');
    
    const creditsMinimumRegex = /Au\s+moins\s+(\d+)\s*crédits?\s+au\s+choix\s+parmi\s+les\s+(?:cours\s+)?suivants/i;
    const creditsMinimumMatch = description.match(creditsMinimumRegex);
    
    if (creditsMinimumMatch) {
      return {
        type: 'credits_minimum',
        requiredCredits: parseInt(creditsMinimumMatch[1], 10),
        isMinimum: true,
        description
      };
    }

    const creditsChoiceRegex = /(\d+)\s*crédits?\s+au\s+choix\s+parmi\s+les\s+suivants/i;
    const match = description.match(creditsChoiceRegex);
    
    if (match) {
      return {
        type: 'credits_choice',
        requiredCredits: parseInt(match[1], 10),
        description
      };
    }

    const singleCourseApprovalRegex = /Ou\s+un\s+cours\s+au\s+choix\s+avec\s+l['']?approbation\s+du\s+directeur/i;
    const singleCourseMatch = description.match(singleCourseApprovalRegex);
    
    if (singleCourseMatch) {
      return {
        type: 'director_approval_single',
        requiredCredits: 0,
        description
      };
    }

    const directorApprovalRegex = /Et\s+jusqu['']?à\s+(\d+)\s*crédits?\s+au\s+choix\s+avec\s+l['']?approbation\s/i;
    const directorApprovalMatch = description.match(directorApprovalRegex);
    
    if (directorApprovalMatch) {
      return {
        type: 'director_approval',
        requiredCredits: parseInt(directorApprovalMatch[1], 10),
        description
      };
    }

    return {
      type: 'none',
      description
    };
  }

  getSectionRule(moduleTitle: string, subModuleTitle: string | null, sectionDescription: string): SectionRule | null {
    return this.sectionRules.find(rule => 
      rule.moduleTitle === moduleTitle &&
      rule.subModuleTitle === subModuleTitle &&
      (rule.description === sectionDescription || 
       rule.groupSections?.includes(sectionDescription))
    ) || null;
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

  // Vérifier si un sous-module est exclu par la règle d'exclusivité
  private isSubModuleExcluded(
    targetModuleTitle: string,
    targetSubModuleTitle: string | null
  ): boolean {
    if (!targetSubModuleTitle) return false;

    // Trouver la règle d'exclusivité applicable
    const rule = this.exclusiveSubModuleRules.find(r => 
      r.moduleTitle === targetModuleTitle &&
      r.subModuleTitles.includes(targetSubModuleTitle)
    );

    if (!rule) return false;

    // Vérifier si un cours est déjà sélectionné dans un autre sous-module du groupe
    let hasSelectionInOtherSubModule = false;
    
    this.courseStates.forEach((state, courseSigle) => {
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
      // Vérifier si le cours est déjà sélectionné ailleurs
      const alreadySelected = this.isCourseSelected(courseSigle);
      if (alreadySelected) {
        return false;
      }

      // Vérifier la règle d'exclusivité des sous-modules
      if (this.isSubModuleExcluded(moduleTitle, submoduleTitle)) {
        return false;
      }
      
      // Vérifier les règles de la section
      const rule = this.getSectionRule(moduleTitle, submoduleTitle, sectionDescription);

      // Gérer la règle "un cours au choix"
      if (rule && rule.type === 'director_approval_single') {
        // Vérifier qu'aucun autre cours n'est déjà sélectionné dans cette section
        const alreadySelectedInSection = this.getSelectedCoursesInSection(moduleTitle, submoduleTitle, sectionDescription);
        if (alreadySelectedInSection.length >= 1) {
          return false; // Déjà un cours sélectionné
        }
      }

      if (rule && (rule.type === 'credits_choice' || rule.type === 'director_approval')) {
        const currentCredits = this.getSectionSelectedCredits(moduleTitle, submoduleTitle, sectionDescription);
        const courseCredits = this.getCourseCredits(courseSigle);
        
        if (currentCredits + courseCredits > rule.requiredCredits!) {
          return false;
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

  private getCourseCredits(courseSigle: string): number {
    const state = this.courseStates.get(courseSigle);
    if (state) {
      return state.credits;
    }
    
    return 0;
  }

  getSectionSelectedCredits(moduleTitle: string, subModuleTitle: string | null, sectionDescription: string): number {
    const rule = this.getSectionRule(moduleTitle, subModuleTitle, sectionDescription);
    
    if (rule?.groupSections) {
      return this.getGroupSelectedCredits(rule);
    }
    
    let credits = 0;
    this.courseStates.forEach((state, courseSigle) => {
      if (state.selected && 
          state.selectedInModule === moduleTitle &&
          state.selectedInSubmodule === subModuleTitle &&
          state.selectedInSection === sectionDescription) {
        credits += this.getCourseCredits(courseSigle);
      }
    });
    
    return credits;
  }

  private getGroupSelectedCredits(rule: SectionRule): number {
    if (!rule.groupSections) return 0;

    let totalCredits = 0;
    this.courseStates.forEach((state, courseSigle) => {
      if (state.selected && 
          state.selectedInModule === rule.moduleTitle &&
          state.selectedInSubmodule === rule.subModuleTitle &&
          rule.groupSections!.includes(state.selectedInSection || '')) {
        totalCredits += this.getCourseCredits(courseSigle);
      }
    });

    return totalCredits;
  }

  public getSelectedCoursesByModule(): SelectedModule[] {
    const moduleMap: { [moduleTitle: string]: Course[] } = {};
    
    this.courseStates.forEach((state, courseSigle) => {
      if (state.selected && state.selectedInModule) {
        if (!moduleMap[state.selectedInModule]) {
          moduleMap[state.selectedInModule] = [];
        }
        const course = this.findCourseInModules(courseSigle, state.selectedInModule, state.selectedInSubmodule, state.selectedInSection);
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

  private findCourseInModules(courseSigle: string, moduleTitle: string, subModuleTitle: string | null, sectionDescription: string | null): Course | null {
    const module = this.modules.find(m => m.title === moduleTitle);
    if (!module) return null;

    if (subModuleTitle) {
      const subModule = module.subModules?.find(sm => sm.title === subModuleTitle);
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
    const alreadySelected = this.isCourseSelected(courseSigle);
    if (alreadySelected) {
      return { canSelect: false, reason: 'Déjà sélectionné ailleurs' };
    }

    // Vérifier la limite de crédits du module
    const module = this.modules.find(m => m.title === moduleTitle);
    if (module) {
      const moduleMaxCredits = this.extractCreditsFromTitle(module.title);
      if (moduleMaxCredits > 0) {
        const currentModuleCredits = this.getModuleSelectedCredits(moduleTitle);
        const courseCredits = this.getCourseCredits(courseSigle);
        
        if (currentModuleCredits + courseCredits > moduleMaxCredits) {
          return { 
            canSelect: false, 
            reason: `Limite de crédits du module atteinte (${currentModuleCredits}/${moduleMaxCredits})` 
          };
        }
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
          reason: `Un autre module exclusif est déjà sélectionné (${this.extractSubModulePrefix(selectedSubModule)})` 
        };
      }
    }

    const rule = this.getSectionRule(moduleTitle, subModuleTitle, sectionDescription);
    if (rule && (rule.type === 'credits_choice' || rule.type === 'director_approval')) {
      const currentCredits = this.getSectionSelectedCredits(moduleTitle, subModuleTitle, sectionDescription);
      const courseCredits = this.getCourseCredits(courseSigle);
      
      if (currentCredits + courseCredits > rule.requiredCredits!) {
        return { 
          canSelect: false, 
          reason: `Limite de crédits de la section atteinte (${currentCredits}/${rule.requiredCredits})` 
        };
      }
    }

    return { canSelect: true };
  }

  // Méthode pour vérifier si un cours de la recherche peut être sélectionné
  canSearchCourseBeSelected(
    courseSigle: string,
    moduleTitle: string,
    subModuleTitle: string | null
  ): { canSelect: boolean; reason?: string } {
    const alreadySelected = this.isCourseSelected(courseSigle);
    if (alreadySelected) {
      return { canSelect: false, reason: 'Déjà sélectionné ailleurs' };
    }

    // Vérifier la limite de crédits du module
    const module = this.modules.find(m => m.title === moduleTitle);
    if (module) {
      const moduleMaxCredits = this.extractCreditsFromTitle(module.title);
      if (moduleMaxCredits > 0) {
        const currentModuleCredits = this.getModuleSelectedCredits(moduleTitle);
        const courseCredits = this.getCourseCredits(courseSigle);
        
        if (currentModuleCredits >= moduleMaxCredits || currentModuleCredits + courseCredits > moduleMaxCredits) {
          return { 
            canSelect: false, 
            reason: `Limite de crédits du module atteinte (${currentModuleCredits}/${moduleMaxCredits})` 
          };
        }
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
          reason: `Un autre module exclusif est déjà sélectionné (${this.extractSubModulePrefix(selectedSubModule)})` 
        };
      }
    }

    return { canSelect: true };
  }

  private extractCreditsFromTitle(title: string): number {
    const creditMatch = title.match(/\((\d+)\s*crédits\)/i);
    return creditMatch ? parseInt(creditMatch[1], 10) : 0;
  }

  getModuleSelectedCredits(moduleTitle: string): number {
    let credits = 0;
    this.courseStates.forEach((state, courseSigle) => {
      if (state.selected && state.selectedInModule === moduleTitle) {
        credits += state.credits;
      }
    });
    return credits;
  }

  private isCourseSelected(courseSigle: string): boolean {
    const state = this.courseStates.get(courseSigle);
    return state ? state.selected : false;
  }

  getSelectedCredits(): number {
    let credits = 0;
    this.courseStates.forEach((state, courseSigle) => {
      if (state.selected) {
        credits += state.credits;
      }
    });
    return credits;
  }

  validateRuleGroups(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const processedRules = new Set<string>();
    
    this.sectionRules.forEach(rule => {
      if ((rule.type === 'credits_choice' || rule.type === 'credits_minimum' || rule.type === 'director_approval') && rule.groupSections) {
        const ruleId = `${rule.moduleTitle}::${rule.subModuleTitle || 'main'}::${rule.description}`;
        
        if (!processedRules.has(ruleId)) {
          processedRules.add(ruleId);
          
          const selectedCredits = this.getGroupSelectedCredits(rule);
          
          // Si le sous-module n'a aucun cours sélectionné, ignorer cette règle
          // Cela permet de ne valider que les sous-modules effectivement choisis
          if (rule.subModuleTitle) {
            let hasAnySelectionInSubModule = false;
            this.courseStates.forEach((state) => {
              if (state.selected && 
                  state.selectedInModule === rule.moduleTitle &&
                  state.selectedInSubmodule === rule.subModuleTitle) {
                hasAnySelectionInSubModule = true;
              }
            });
            
            // Si aucun cours n'est sélectionné dans ce sous-module, ignorer la validation
            if (!hasAnySelectionInSubModule) {
              return;
            }
          }
          
          if (rule.requiredCredits) {
            const groupName = rule.subModuleTitle 
              ? `${rule.moduleTitle} > ${rule.subModuleTitle}`
              : rule.moduleTitle;
              
            if (rule.isMinimum || rule.type === 'credits_minimum') {
              if (selectedCredits < rule.requiredCredits) {
                errors.push(
                  `Groupe de règle "${rule.description}" dans ${groupName} : ` +
                  `${selectedCredits}/${rule.requiredCredits} crédits sélectionnés (minimum requis)`
                );
              }
            } else if (rule.type === 'director_approval') {
              if (selectedCredits > rule.requiredCredits) {
                errors.push(
                  `Groupe de règle "${rule.description}" dans ${groupName} : ` +
                  `Trop de crédits sélectionnés (${selectedCredits}/${rule.requiredCredits})`
                );
              }
            } else {
              if (selectedCredits < rule.requiredCredits) {
                errors.push(
                  `Groupe de règle "${rule.description}" dans ${groupName} : ` +
                  `${selectedCredits}/${rule.requiredCredits} crédits sélectionnés`
                );
              }
              
              if (selectedCredits > rule.requiredCredits) {
                errors.push(
                  `Groupe de règle "${rule.description}" dans ${groupName} : ` +
                  `Trop de crédits sélectionnés (${selectedCredits}/${rule.requiredCredits})`
                );
              }
            }
          }
        }
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  getSectionStatus(moduleTitle: string, subModuleTitle: string | null, sectionDescription: string): {
    selectedCredits: number;
    requiredCredits?: number;
    isComplete: boolean;
    hasRule: boolean;
    isInGroup: boolean;
    isGroupLeader: boolean;
    isMinimum?: boolean;
  } {
    const rule = this.getSectionRule(moduleTitle, subModuleTitle, sectionDescription);
    const selectedCredits = this.getSectionSelectedCredits(moduleTitle, subModuleTitle, sectionDescription);
    const isInGroup = rule?.groupSections !== undefined;
    const isGroupLeader = rule?.description === sectionDescription && rule?.type === 'credits_choice';
    
    return {
      selectedCredits,
      requiredCredits: rule?.requiredCredits,
      isComplete: rule?.type === 'credits_choice' ? selectedCredits === rule.requiredCredits! : false,
      hasRule: rule?.type !== 'none' && rule !== null,
      isInGroup,
      isGroupLeader,
      isMinimum: rule?.isMinimum,
    };
  }

  getRuleGroupDetails(moduleTitle: string, subModuleTitle: string | null, sectionDescription: string): {
    rule: SectionRule | null;
    sections: string[];
    selectedCredits: number;
    requiredCredits: number;
    selectedCourses: { sigle: string; credits: number; section: string }[];
  } {
    const rule = this.getSectionRule(moduleTitle, subModuleTitle, sectionDescription);
    const sections = rule?.groupSections || [];
    const selectedCredits = rule ? this.getGroupSelectedCredits(rule) : 0;
    const selectedCourses: { sigle: string; credits: number; section: string }[] = [];
    
    if (rule?.groupSections) {
      this.courseStates.forEach((state, courseSigle) => {
        if (state.selected && 
            state.selectedInModule === rule.moduleTitle &&
            state.selectedInSubmodule === rule.subModuleTitle &&
            rule.groupSections!.includes(state.selectedInSection || '')) {
          const credits = this.getCourseCredits(courseSigle);
          selectedCourses.push({
            sigle: courseSigle,
            credits,
            section: state.selectedInSection!
          });
        }
      });
    }
    
    return {
      rule,
      sections,
      selectedCredits,
      requiredCredits: rule?.requiredCredits || 0,
      selectedCourses
    };
  }

  private getSelectedCoursesInSection(moduleTitle: string, subModuleTitle: string | null, sectionDescription: string): string[] {
    const selectedCourses: string[] = [];
    this.courseStates.forEach((state, courseSigle) => {
      if (state.selected && 
          state.selectedInModule === moduleTitle &&
          state.selectedInSubmodule === subModuleTitle &&
          state.selectedInSection === sectionDescription) {
        selectedCourses.push(courseSigle);
      }
    });
    return selectedCourses;
  }

  setAvantagePoly(courseSigle: string, alreadyDone: boolean, grade?: Grade) {
    const state = this.courseStates.get(courseSigle);

    if (!state || !state.selected) return;

    state.course.alreadyDone = alreadyDone

    if (grade) state.course.grade = grade;
  }
}