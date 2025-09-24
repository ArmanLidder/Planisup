// study-plan.ts (modifications principales)
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudyModule } from '../../components/study-module/study-module';
import { ProgramService } from "@app/services/program/program-service";
import { Program, Module, Course } from '@common/program';
import { CourseStateService } from '@app/services/course-state/course-state';

@Component({
  selector: 'app-study-plan',
  standalone: true,
  imports: [CommonModule, StudyModule],
  templateUrl: './study-plan.html',
  styleUrls: ['./study-plan.scss']
})

export class StudyPlan implements OnInit {
  totalCredits: number = 0;
  selectedCredits: number = 0;
  program!: Program; 
  modules: Module[] = [];

  constructor(
    private programService: ProgramService,
    private courseStateService: CourseStateService
  ) {}

  ngOnInit() {
    this.program = this.programService.program!;
    this.modules = this.program.modules;
    for (const module of this.program.modules) {
      this.totalCredits += this.extractCreditsFromTitle(module.title)
    }

    // Passer les modules au service pour l'initialisation
    this.courseStateService.initializeCourseStates(this.modules);
    this.calculateTotalCredits();
  }

  onCourseSelectionChange(event: {
    courseSigle: string, 
    moduleTitle: string,
    submoduleTitle: string | null,
    selected: boolean, 
    selectedSection: string
  }) {
    const module = this.modules.find(m => m.title === event.moduleTitle);
    if (!module) return;

    const result = this.courseStateService.setCourseSelected(
      event.courseSigle, 
      event.moduleTitle, 
      event.submoduleTitle,
      event.selectedSection,
      event.selected
    );
    
    if (!result) return;

    this.calculateTotalCredits();
  }

  calculateTotalCredits() {
    this.selectedCredits = this.courseStateService.getSelectedCredits(this.modules);
  }

  getProgressStyle(): any {
    const percentage = this.totalCredits > 0 ? Math.min((this.selectedCredits / this.totalCredits) * 100, 100) : 0;
    return {
      'width': `${percentage}%`,
      'background-color': percentage >= 100 ? '#4caf50' : '#2196f3'
    };
  }

  extractCreditsFromTitle(title: string): number {
    const creditMatch = title.match(/\((\d+)\s*crédits\)/i);
    return creditMatch ? parseInt(creditMatch[1], 10) : 0;
  }

  getModuleTitleWithoutCredits(title: string): string {
    return title.replace(/\(\d+\s*crédits\)/i, '').trim();
  }

  validatePlan() {
    const errors: string[] = [];
    
    // Validation des groupes de règles
    const groupValidation = this.courseStateService.validateRuleGroups();
    if (!groupValidation.isValid) {
      errors.push(...groupValidation.errors);
    }
    
    // Validation des modules
    this.modules.forEach(module => {
      let moduleCredits = 0;
      
      // Calculate module credits (sections principales)
      if (module.courses) {
        module.courses.forEach(section => {
          section.courses.forEach(course => {
            const state = this.courseStateService.getCourseState(course.sigle);
            if (state.selected && 
                state.selectedInModule === module.title && 
                state.selectedInSubmodule === null &&
                state.selectedInSection === section.description
              ) {
              moduleCredits += course.credits;
            }
          });
        });
      }

      // Calculate module credits (sous-modules)
      if (module.subModules) {
        module.subModules.forEach(subModule => {
          if (subModule.courses) {
            subModule.courses.forEach(section => {
              section.courses.forEach(course => {
                const state = this.courseStateService.getCourseState(course.sigle);
                if (state.selected && 
                    state.selectedInModule === module.title && 
                    state.selectedInSubmodule === subModule.title &&
                    state.selectedInSection === section.description
                  ) {
                  moduleCredits += course.credits;
                }
              });
            });
          }
        });
      }

      const requiredCredits = this.extractCreditsFromTitle(module.title);
      
      if (requiredCredits > 0 && moduleCredits < requiredCredits) {
        errors.push(`Le module ${this.getModuleTitleWithoutCredits(module.title)} nécessite au moins ${requiredCredits} crédits (actuellement: ${moduleCredits}).`);
      }
    });
    
    if (this.selectedCredits > this.totalCredits) {
      errors.push('Le total des crédits ne peut pas dépasser le maximum autorisé.');
    }
    
    if (errors.length > 0) {
      alert('Erreurs de validation:\n' + errors.join('\n'));
      return;
    }
    
    alert('Plan d\'études validé avec succès!');
  }
}