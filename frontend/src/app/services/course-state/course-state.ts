import { Injectable } from '@angular/core';
import { Course, Module, Section, SubModule } from '@common/program';
import { SelectedModule } from '@common/study-plan';

export interface CourseState {
  selected: boolean;
  selectedInModule: string | null;
  selectedInSubmodule: string | null;
  selectedInSection: string | null;
}

export interface SectionRule {
  type: 'credits_choice' | 'director_approval' | 'none';
  requiredCredits?: number;
  description: string;
  groupSections?: string[]; // Toutes les sections concernées par cette règle
  moduleTitle: string;
  subModuleTitle: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class CourseStateService {
  public courseStates: Map<string, CourseState> = new Map();
  public sectionRules: SectionRule[] = [];
  private modules: Module[] = [];

  initializeCourseStates(modules: any[]) {
    this.courseStates.clear();
    this.sectionRules = [];
    this.modules = modules;
    
    modules.forEach(module => {
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
  }

  private processSections(sections: Section[], moduleTitle: string, subModuleTitle: string | null) {
    let currentGroup: { 
      rule: SectionRule; 
      sections: string[]; 
    } | null = null;

    sections.forEach((section: Section, index: number) => {
      const parsedRule = this.parseRuleFromDescription(section.description);
      
      // Si c'est une nouvelle règle de choix de crédits
      if (parsedRule.type !== 'none') {
        // Finaliser le groupe précédent
        if (currentGroup) {
          this.finalizeRuleGroup(currentGroup);
        }

        // Créer un nouveau groupe
        const newRule: SectionRule = {
          type: parsedRule.type,
          requiredCredits: parsedRule.requiredCredits,
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
      // Si nous sommes dans un groupe actif et que cette section n'a pas de règle spécifique
      else if (currentGroup && parsedRule.type === 'none') {
        currentGroup.sections.push(section.description);
      } 

      // Initialiser les états des cours
      section.courses.forEach((course: Course) => {
        if (!this.courseStates.has(course.sigle)) {
          this.courseStates.set(course.sigle, {
            selected: false,
            selectedInModule: null,
            selectedInSubmodule: null,
            selectedInSection: null
          });
        }
      });
    });

    // Finaliser le dernier groupe
    if (currentGroup) {
      this.finalizeRuleGroup(currentGroup);
    }
  }

  private finalizeRuleGroup(group: { rule: SectionRule; sections: string[]; }) {
    group.rule.groupSections = [...group.sections];
    this.sectionRules.push(group.rule);
  }

  private parseRuleFromDescription(description: string): Omit<SectionRule, 'moduleTitle' | 'subModuleTitle'> {
    // Regex pour "X crédits au choix parmi les suivants"
    const creditsChoiceRegex = /(\d+)\s*crédits?\s+au\s+choix\s+parmi\s+les\s+suivants/i;
    const match = description.match(creditsChoiceRegex);
    
    if (match) {
      return {
        type: 'credits_choice',
        requiredCredits: parseInt(match[1], 10),
        description
      };
    }

    // Regex pour "Et jusqu'à X crédits au choix avec l'approbation du directeur"
    const directorApprovalRegex = /Et\s+jusqu['']?à\s+(\d+)\s*crédits?\s+au\s+choix\s+avec\s+l['']?approbation\s+du\s+directeur/i;
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
      selectedInSection: null
    };
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
      
      // Vérifier les règles de la section
      const rule = this.getSectionRule(moduleTitle, submoduleTitle, sectionDescription);
      if (rule && rule.type !== 'none') {
        const currentCredits = this.getSectionSelectedCredits(moduleTitle, submoduleTitle, sectionDescription);
        const courseCredits = this.getCourseCredits(courseSigle, moduleTitle, submoduleTitle, sectionDescription);
        
        if (currentCredits + courseCredits > rule.requiredCredits!) {
          return false;
        }
      }
      
      state.selected = true;
      state.selectedInModule = moduleTitle;
      state.selectedInSubmodule = submoduleTitle;
      state.selectedInSection = sectionDescription;
    } else {
      // Désélectionner
      state.selected = false;
      state.selectedInModule = null;
      state.selectedInSubmodule = null;
      state.selectedInSection = null;
    }
    
    this.courseStates.set(courseSigle, state);
    return true;
  }

  private getCourseCredits(courseSigle: string, moduleTitle: string, subModuleTitle: string | null, sectionDescription: string): number {
    const module = this.modules.find(m => m.title === moduleTitle);
    if (!module) return 0;

    if (subModuleTitle) {
      const subModule = module.subModules?.find(sm => sm.title === subModuleTitle);
      if (subModule?.courses) {
        for (const section of subModule.courses) {
          const course = section.courses.find(c => c.sigle === courseSigle);
          if (course) return course.credits;
        }
      }
    } else {
      if (module.courses) {
        for (const section of module.courses) {
          const course = section.courses.find(c => c.sigle === courseSigle);
          if (course) return course.credits;
        }
      }
    }
    
    return 0;
  }

  getSectionSelectedCredits(moduleTitle: string, subModuleTitle: string | null, sectionDescription: string): number {
    const rule = this.getSectionRule(moduleTitle, subModuleTitle, sectionDescription);
    
    // Si la section fait partie d'un groupe de règles, calculer les crédits pour tout le groupe
    if (rule?.groupSections) {
      return this.getGroupSelectedCredits(rule);
    }
    
    // Sinon, calculer seulement pour cette section
    let credits = 0;
    this.courseStates.forEach((state, courseSigle) => {
      if (state.selected && 
          state.selectedInModule === moduleTitle &&
          state.selectedInSubmodule === subModuleTitle &&
          state.selectedInSection === sectionDescription) {
        credits += this.getCourseCredits(courseSigle, moduleTitle, subModuleTitle, sectionDescription);
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
        totalCredits += this.getCourseCredits(
          courseSigle, 
          state.selectedInModule!, 
          state.selectedInSubmodule, 
          state.selectedInSection!
        );
      }
    });

    return totalCredits;
  }

  public getSelectedCoursesByModule(): SelectedModule[] {
    const moduleMap: { [moduleTitle: string]: Course[] } = {};
    console.log('Course States:', this.courseStates);
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
          if (course) return course;
        }
      }
    } else {
      if (module.courses) {
        for (const section of module.courses) {
          const course = section.courses.find(c => c.sigle === courseSigle);
          if (course) return course;
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
    // Si le cours est déjà sélectionné ailleurs
    const alreadySelected = this.isCourseSelected(courseSigle);
    if (alreadySelected) {
      return { canSelect: false, reason: 'Déjà sélectionné ailleurs' };
    }

    // Vérifier les règles de la section
    const rule = this.getSectionRule(moduleTitle, subModuleTitle, sectionDescription);
    if (rule && rule.type === 'credits_choice') {
      const currentCredits = this.getSectionSelectedCredits(moduleTitle, subModuleTitle, sectionDescription);
      const courseCredits = this.getCourseCredits(courseSigle, moduleTitle, subModuleTitle, sectionDescription);
      
      if (currentCredits + courseCredits > rule.requiredCredits!) {
        return { 
          canSelect: false, 
          reason: `Limite de crédits atteinte (${currentCredits}/${rule.requiredCredits})` 
        };
      }
    }

    return { canSelect: true };
  }

  private isCourseSelected(courseSigle: string): boolean {
    const state = this.courseStates.get(courseSigle);
    return state ? state.selected : false;
  }

  getSelectedCredits(modules: Module[]): number {
    let credits = 0;

    modules.forEach(module => {
      if (module.courses) {
        module.courses.forEach((section: Section) => {
          section.courses.forEach((course: Course) => {
            const state = this.getCourseState(course.sigle);
            if (state.selected &&
              state.selectedInModule === module.title &&
              state.selectedInSubmodule === null &&
              state.selectedInSection === section.description
            ) {
              credits += course.credits;
            }
          });
        });
      }

      // submodule
      if (module.subModules) {
        module.subModules.forEach((subModule: SubModule) => {
          if (subModule.courses) {
            subModule.courses.forEach((section: Section) => {
              section.courses.forEach((course: Course) => {
                const state = this.getCourseState(course.sigle);
                if (state.selected && 
                    state.selectedInModule === module.title && 
                    state.selectedInSubmodule === subModule.title &&
                    state.selectedInSection === section.description) {
                  credits += course.credits;
                }
              });
            });
          }
        });
      }
    });
    
    return credits;
  }

  validateRuleGroups(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const processedRules = new Set<string>();
    
    this.sectionRules.forEach(rule => {
      if (rule.type === 'credits_choice' && rule.groupSections) {
        // Créer un identifiant unique pour éviter les doublons
        const ruleId = `${rule.moduleTitle}::${rule.subModuleTitle || 'main'}::${rule.description}`;
        
        if (!processedRules.has(ruleId)) {
          processedRules.add(ruleId);
          
          const selectedCredits = this.getGroupSelectedCredits(rule);
          
          if (rule.requiredCredits) {
            if (selectedCredits < rule.requiredCredits) {
              const groupName = rule.subModuleTitle 
                ? `${rule.moduleTitle} > ${rule.subModuleTitle}`
                : rule.moduleTitle;
              errors.push(
                `Groupe de règle "${rule.description}" dans ${groupName} : ` +
                `${selectedCredits}/${rule.requiredCredits} crédits sélectionnés`
              );
            }
            
            if (selectedCredits > rule.requiredCredits) {
              const groupName = rule.subModuleTitle 
                ? `${rule.moduleTitle} > ${rule.subModuleTitle}`
                : rule.moduleTitle;
              errors.push(
                `Groupe de règle "${rule.description}" dans ${groupName} : ` +
                `Trop de crédits sélectionnés (${selectedCredits}/${rule.requiredCredits})`
              );
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
      isGroupLeader
    };
  }

  // Méthode utilitaire pour obtenir les détails d'un groupe de règles
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
    
    // Collecter les cours sélectionnés dans le groupe
    if (rule?.groupSections) {
      this.courseStates.forEach((state, courseSigle) => {
        if (state.selected && 
            state.selectedInModule === rule.moduleTitle &&
            state.selectedInSubmodule === rule.subModuleTitle &&
            rule.groupSections!.includes(state.selectedInSection || '')) {
          const credits = this.getCourseCredits(
            courseSigle, 
            state.selectedInModule!, 
            state.selectedInSubmodule, 
            state.selectedInSection!
          );
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
}