import { Injectable } from '@angular/core';
import { Course, Module, Section, SubModule } from '@common/program';
import { SelectedModule } from '@common/study-plan';

export interface CourseState {
  selected: boolean;
  selectedInModule: string | null;
  selectedInSubmodule: string | null;
  selectedInSection: string | null;
  credits: number;
}

export interface SectionRule {
  type: 'credits_choice' | 'director_approval' | 'credits_minimum' | 'none';
  requiredCredits?: number;
  isMinimum?: boolean;
  description: string;
  groupSections?: string[];
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
            selectedInSection: null,
            credits: course.credits
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
    description = description.trim().replace(/\s+/g, ' ');
    // Regex pour "Au moins X crédits au choix parmi les suivants"
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
      credits: 0
    };
  }

  // Méthode pour ajouter un cours au système (pour les cours de la recherche)
  addCourseToStates(course: Course): void {
    if (!this.courseStates.has(course.sigle)) {
      this.courseStates.set(course.sigle, {
        selected: false,
        selectedInModule: null,
        selectedInSubmodule: null,
        selectedInSection: null,
        credits: course.credits
      });
    }
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
      // Désélectionner
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
    
    console.warn(`Course ${courseSigle} not found in courseStates`);
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
          if (course) {
            // @ts-ignore
            course.trimester = course.trimester[0];
            console.log('Found course:', course);
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
            console.log('Found course:', course);
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
    // Si le cours est déjà sélectionné ailleurs
    const alreadySelected = this.isCourseSelected(courseSigle);
    if (alreadySelected) {
      return { canSelect: false, reason: 'Déjà sélectionné ailleurs' };
    }

    // Vérifier les règles de la section
    const rule = this.getSectionRule(moduleTitle, subModuleTitle, sectionDescription);
    if (rule && (rule.type === 'credits_choice' || rule.type === 'director_approval')) {
      const currentCredits = this.getSectionSelectedCredits(moduleTitle, subModuleTitle, sectionDescription);
      const courseCredits = this.getCourseCredits(courseSigle);
      
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

  getSelectedCredits(): number {
    let credits = 0;

    // Parcourir tous les cours sélectionnés
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
      if ((rule.type === 'credits_choice' || rule.type === 'credits_minimum') && rule.groupSections) {
        // Créer un identifiant unique pour éviter les doublons
        const ruleId = `${rule.moduleTitle}::${rule.subModuleTitle || 'main'}::${rule.description}`;
        
        if (!processedRules.has(ruleId)) {
          processedRules.add(ruleId);
          
          const selectedCredits = this.getGroupSelectedCredits(rule);
          
          if (rule.requiredCredits) {
            const groupName = rule.subModuleTitle 
              ? `${rule.moduleTitle} > ${rule.subModuleTitle}`
              : rule.moduleTitle;
              
            if (rule.isMinimum) {
              // Pour les règles de minimum : vérifier seulement le minimum
              if (selectedCredits < rule.requiredCredits) {
                errors.push(
                  `Groupe de règle "${rule.description}" dans ${groupName} : ` +
                  `${selectedCredits}/${rule.requiredCredits} crédits sélectionnés (minimum requis)`
                );
              }
            } else {
              // Pour les règles exactes : vérifier minimum ET maximum
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
}