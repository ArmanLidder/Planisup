import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudyModule } from '../../components/study-module/study-module';
import { ProgramService } from "@app/services/program/program-service";
import { Program, Module, Course, ProgramType } from '@common/program';
import { CourseStateService } from '@app/services/course-state/course-state';
import { CourseService } from '@app/services/course/course-service';
import { StudyPlan as StudyPlanInterface, StudyPlanStatus, StudyPlanStep, StepValidationStatus } from '@common/study-plan';
import { AuthentificationService } from '@app/services/authentification/authentification-service';
import { ApiService } from '@app/services/api/api-service';
import { StudyPlanService } from '@app/services/study-plan/study-plan-service';

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
  allCourses: Course[] = []; // Tous les cours disponibles pour la recherche
  currentPlan: StudyPlanInterface | null = null;

  constructor(
    private programService: ProgramService,
    private courseStateService: CourseStateService,
    private courseService: CourseService,
    private authService: AuthentificationService,
    private apiService: ApiService,
    private sPS: StudyPlanService,
  ) {}

  ngOnInit() {
    this.program = this.programService.program!;
    this.modules = this.program.modules;
    for (const module of this.program.modules) {
      this.totalCredits += this.extractCreditsFromTitle(module.title)
    }

    // Initialiser le service avec les modules
    this.courseStateService.initializeCourseStates(this.modules);

    // Charger tous les cours depuis le backend
    this.loadAllCourses();

    this.calculateTotalCredits();
  }

  loadAllCourses() {
    if (this.courseService.courses.length > 0) {
      this.allCourses = this.courseService.courses;
    } else {
      console.error('Erreur lors du chargement des cours:');
      this.allCourses = this.extractCoursesFromProgram();
    }
  }

  // Méthode fallback pour extraire les cours du programme actuel
  extractCoursesFromProgram(): Course[] {
    const courses: Course[] = [];

    this.modules.forEach(module => {
      if (module.courses) {
        module.courses.forEach(section => {
          courses.push(...section.courses);
        });
      }

      if (module.subModules) {
        module.subModules.forEach(subModule => {
          if (subModule.courses) {
            subModule.courses.forEach(section => {
              courses.push(...section.courses);
            });
          }
        });
      }
    });

    // Supprimer les doublons basés sur le sigle
    const uniqueCourses = courses.filter((course, index, self) =>
      index === self.findIndex(c => c.sigle === course.sigle)
    );

    return uniqueCourses;
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

    // Validation des groupes de règles (incluant les nouvelles règles d'approbation directeur)
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
    // Tout ça devra être effacé et mis dans un beau service
    this.currentPlan = {
      status: StudyPlanStatus.LIVE,
      studentId: this.authService.currentUser?._id || '',
      directorId: '68d96bb5734ad2601d2bf2fa',
      coordonatorId: '68d879397bd1614a72e60539',
      programId: this.program._id!,
      programType: this.programService.type as ProgramType,
      studyPlanStep: StudyPlanStep.STUDENT,
      stepValidation: StepValidationStatus.IN_PROGRESS,
      coursesSelection: {
        modules: this.courseStateService.getSelectedCoursesByModule()
      }
    };

    console.log('Plan d\'études validé:', this.currentPlan);
    if (this.sPS.studyPlan) {
      alert('Plan d\'études déjè soumis!');
    } else {
      this.apiService.submitStudyPlan(this.currentPlan).subscribe({
      next: (response) => {
        console.log('Plan d\'études soumis avec succès:', response);
        this.sPS.loadStudyPlan(response._id, true)
        alert('Plan d\'études soumis avec succès!');
      },
      error: (error) => {
        console.error('Erreur lors de la soumission du plan d\'études:', error);
        alert('Erreur lors de la soumission du plan d\'études.');
      }
    });
    }

  }
}
