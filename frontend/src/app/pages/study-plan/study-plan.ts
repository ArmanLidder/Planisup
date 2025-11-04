import { Component, OnInit, OnDestroy, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StudyModule } from '../../components/study-module/study-module';
import { ProgramService } from '@app/services/program/program-service';
import { Program, Module, Course, ProgramType, SubModule, Section } from '@common/program';
import { CourseStateService } from '@app/services/course-state/course-state';
import { CourseService } from '@app/services/course/course-service';
import {
  StudyPlan as StudyPlanInterface,
  StudyPlanStatus,
  StudyPlanStep,
  StepValidationStatus,
} from '@common/study-plan';
import { AuthentificationService } from '@app/services/authentification/authentification-service';
import { ApiService } from '@app/services/api/api-service';
import { StudyPlanService } from '@app/services/study-plan/study-plan-service';
import { Subscription } from 'rxjs';
import { User } from '@common/user';
import { Router } from '@angular/router';

@Component({
  selector: 'app-study-plan',
  standalone: true,
  imports: [CommonModule, StudyModule, FormsModule],
  templateUrl: './study-plan.html',
  styleUrls: ['./study-plan.scss'],
})
export class StudyPlan implements OnInit, OnDestroy, OnChanges {
  @Input() state: 'viewValidation' | 'viewAdmin' | 'modifyStudent' | 'modifyAdmin' = 'modifyStudent';
  @Input() programOverride?: Program;
  @Input() isViewMode: boolean = false;
  totalCredits: number = 0;
  selectedCredits: number = 0;
  program!: Program;
  modules: Module[] = [];
  allCourses: Course[] = [];

  // Selection des directeur et coordonateurs
  directors: User[] = [];
  coordinators: User[] = [];
  @Input() directorId: string = '';
  @Input() coordonatorId: string = '';

  currentPlan: StudyPlanInterface | null = null;
  private programSubscription: Subscription | null = null;
  private readonly AVANTAGE_POLY_MAX_CREDITS = 15;

  constructor(
    private programService: ProgramService,
    private courseStateService: CourseStateService,
    private courseService: CourseService,
    private authService: AuthentificationService,
    private apiService: ApiService,
    private sPS: StudyPlanService,
    private router: Router
  ) {}

  ngOnInit() {
    this.courseService.getCourses();

    if (this.programOverride) {
      this.initializeWithProgram(this.programOverride);
    } else {
      this.programSubscription = this.programService.program$.subscribe((program) => {
        if (program) {
          this.initializeWithProgram(program);
        }
      });
    }

    this.apiService.getDirectorsAndCoordinators().subscribe({
      next: (response) => {
        this.directors = response.directors;
        this.coordinators = response.coordinators;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des directeurs et coordonnateurs:', error);
      },
    });
  }

  ngOnDestroy() {
    if (this.programSubscription) {
      this.programSubscription.unsubscribe();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['programOverride'] && this.programOverride) {
      this.initializeWithProgram(this.programOverride);
    }
  }

  private initializeWithProgram(program: Program) {
    this.program = program;

    // En mode view, filtrer les modules pour ne garder que les cours sélectionnés
    if (this.isViewMode) {
      this.modules = this.filterSelectedCourses(program.modules);
    } else {
      this.modules = this.program.modules;
    }

    this.totalCredits = 0;
    this.selectedCredits = 0;

    // faire sa avec la regle de module credit exact avec le value
    for (const module of this.program.modules) {
      // this.totalCredits += this.extractCreditsFromTitle(module.title);
      const rule = module.rules?.find(rule => rule.type === 'credits_exact');
      this.totalCredits += rule?.value ? rule.value : 0 ;
    }

    // Initialiser le service avec les modules
    if (!this.isViewMode) {
      this.courseStateService.initializeCourseStates(this.modules);
    }

    // Charger tous les cours depuis le backend
    this.loadAllCourses();

    this.calculateTotalCredits();
  }

  /**
   * Filtre les modules pour ne garder que les cours sélectionnés
   */
  private filterSelectedCourses(modules: Module[]): Module[] {
    return modules
      .map((module) => this.filterModule(module))
      .filter((module) => this.hasSelectedCourses(module));
  }

  /**
   * Filtre un module pour ne garder que les cours sélectionnés
   */
  private filterModule(module: Module): Module {
    const filteredModule: Module = { ...module };

    if (module.courses)
      filteredModule.courses = this.filterSections(module.courses, module.title, null);

    if (module.subModules) {
      filteredModule.subModules = module.subModules
        .map((subModule) => this.filterSubModule(subModule, module.title))
        .filter((subModule) => this.hasSelectedCoursesInSubModule(subModule, module.title));
    }

    return filteredModule;
  }

  /**
   * Filtre un sous-module pour ne garder que les cours sélectionnés
   */
  private filterSubModule(subModule: SubModule, moduleTitle: string): SubModule {
    const filteredSubModule: SubModule = { ...subModule };

    if (subModule.courses)
      filteredSubModule.courses = this.filterSections(
        subModule.courses,
        moduleTitle,
        subModule.title
      );

    return filteredSubModule;
  }

  /**
   * Filtre les sections pour ne garder que celles avec des cours sélectionnés
   * Inclut TOUS les cours sélectionnés (même ceux de course-search)
   */
  private filterSections(
    sections: Section[],
    moduleTitle: string,
    subModuleTitle: string | null
  ): Section[] {
    const filteredSections: Section[] = [];

    sections.forEach((section) => {
      const selectedCoursesInSection: Course[] = [];

      this.courseStateService.courseStates.forEach((state, courseSigle) => {
        if (
          state.selected &&
          state.selectedInModule === moduleTitle &&
          state.selectedInSubmodule === subModuleTitle &&
          state.selectedInSection === section.description
        ) {
          if (state.course) selectedCoursesInSection.push(state.course);
        }
      });

      if (selectedCoursesInSection.length > 0) {
        filteredSections.push({
          ...section,
          courses: selectedCoursesInSection,
        });
      }
    });

    return filteredSections;
  }

  /**
   * Vérifie si un module contient des cours sélectionnés
   */
  private hasSelectedCourses(module: Module): boolean {
    if (module.courses && module.courses.some((section) => section.courses.length > 0)) return true;

    if (module.subModules && module.subModules.length > 0) return true;

    return false;
  }

  /**
   * Vérifie si un sous-module contient des cours sélectionnés
   */
  private hasSelectedCoursesInSubModule(subModule: SubModule, moduleTitle: string): boolean {
    if (!subModule.courses) return false;

    return subModule.courses.some((section) => section.courses.length > 0);
  }

  /**
   * Met tous les cours du API dans le allCourse
   * A enlever pour juste utiliser le service dans le courseSearch
   */
  loadAllCourses() {
    if (this.courseService.courses.length > 0) {
      this.allCourses = this.courseService.courses;
    } else {
      console.error('Erreur lors du chargement des cours:');
      this.allCourses = this.extractCoursesFromProgram();
    }
  }

  /**
   * Méthode fallback pour extraire les cours du programme actuel
   * A enlever afin de juste demander a l utilisateur d'entrer manuellement le cours dans le courseSearch
   */
  extractCoursesFromProgram(): Course[] {
    const courses: Course[] = [];

    this.modules.forEach((module) => {
      if (module.courses) {
        module.courses.forEach((section) => {
          courses.push(...section.courses);
        });
      }

      if (module.subModules) {
        module.subModules.forEach((subModule) => {
          if (subModule.courses) {
            subModule.courses.forEach((section) => {
              courses.push(...section.courses);
            });
          }
        });
      }
    });

    // Supprimer les doublons basés sur le sigle
    const uniqueCourses = courses.filter(
      (course, index, self) => index === self.findIndex((c) => c.sigle === course.sigle)
    );

    return uniqueCourses;
  }

  /**
   * Change le status du cours selectionner dans le programme
   */
  onCourseSelectionChange(event: {
    courseSigle: string;
    moduleTitle: string;
    submoduleTitle: string | null;
    selected: boolean;
    selectedSection: string;
  }) {
    if (this.isViewMode) return;

    const module = this.modules.find((m) => m.title === event.moduleTitle);
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

  /**
   * calcule les crédits totals selectionner dans le programme
   */
  calculateTotalCredits() {
    this.selectedCredits = this.courseStateService.getSelectedCredits();
  }

  /**
   * le changement de la couleur de la barre de progression
   */
  getProgressStyle(): any {
    const percentage =
      this.totalCredits > 0 ? Math.min((this.selectedCredits / this.totalCredits) * 100, 100) : 0;
    return {
      width: `${percentage}%`,
      'background-color': percentage >= 100 ? '#4caf50' : '#2196f3',
    };
  }

  // à enlever
  extractCreditsFromTitle(title: string): number {
    const creditMatch = title.match(/\((\d+)\s*crédits\)/i);
    return creditMatch ? parseInt(creditMatch[1], 10) : 0;
  }

  getModuleCreditRequired(module: Module): number {
    const rule = module.rules?.find(rule => rule.type === 'credits_exact');
    return rule?.value || 0;
  }

  /**
   * Enleve le nombre de crédit dans le titre du module
   */
  getModuleTitleWithoutCredits(title: string): string {
    return title.replace(/\(\d+\s*crédits\)/i, '').trim();
  }

  validatePlan() {
    if (this.isViewMode) return;

    const errors: string[] = [];

    if (this.directorId === '') {
      errors.push('Vous devez selectionner un Directeur');
    }

    if (this.coordonatorId === '') {
      errors.push('Vous devez selectionner un Coordonateur');
    }

    // Validation des groupes de règles
    const groupValidation = this.courseStateService.validateRuleGroups();
    if (!groupValidation.isValid) {
      errors.push(...groupValidation.errors);
    }

    // Validation de la règle d'exclusivité des sous-modules
    this.program.modules.forEach(module => {
      // Vérifier si le module a une règle d'exclusivité
      const hasExclusiveRule = module.rules?.some(rule => rule.type === 'exclusive_submodules');
      
      if (hasExclusiveRule && module.subModules) {
        const selectedSubModules: string[] = [];

        // Trouver tous les sous-modules avec des cours sélectionnés
        module.subModules.forEach(subModule => {
          const hasSelection = Array.from(this.courseStateService.courseStates.values()).some(
            state => state.selected && 
                     state.selectedInModule === module.title &&
                     state.selectedInSubmodule === subModule.title
          );

          if (hasSelection) {
            selectedSubModules.push(subModule.title);
          }
        });

        // Valider qu'un seul sous-module a été choisi
        if (selectedSubModules.length === 0) {
          const subModuleTitles = module.subModules.map(sm => this.extractSubModulePrefix(sm.title)).join(', ');
          errors.push(`Vous devez choisir un module parmi: ${subModuleTitles}`);
        } else if (selectedSubModules.length > 1) {
          const prefixes = selectedSubModules.map(title => this.extractSubModulePrefix(title)).join(', ');
          errors.push(
            `Vous ne pouvez choisir qu'un seul module parmi le groupe d'exclusivité. Actuellement sélectionnés: ${prefixes}`
          );
        }
      }
    });

    // Validation des crédits totaux
    if (this.selectedCredits > this.totalCredits) {
      errors.push('Le total des crédits ne peut pas dépasser le maximum autorisé.');
    }

    // Validation Avantage Poly
    if (this.courseStateService.getAvantagePolyCredit() > this.AVANTAGE_POLY_MAX_CREDITS) {
      errors.push(
        `Le total de crédits d'avantage Poly ne peut pas dépasser 15 (actuellement: ${this.courseStateService.getAvantagePolyCredit()})`
      );
    }

    if (!this.courseStateService.isAllAvantagePolyGrade()) {
      errors.push("Il manque la note d'un ou plusieurs cours avec Avantage Poly");
    }

    // Afficher les erreurs ou soumettre le plan
    if (errors.length > 0) {
      alert('Erreurs de validation:\n' + errors.join('\n'));
      return;
    }

    this.submitStudyPlan();
  }

  private submitStudyPlan() {
    this.currentPlan = {
      status: StudyPlanStatus.LIVE,
      studentId: this.authService.currentUser?._id || '',
      directorId: this.directorId,
      coordonatorId: this.coordonatorId,
      programId: this.program._id!,
      programType: this.programService.type as ProgramType,
      studyPlanStep: StudyPlanStep.STUDENT,
      stepValidation: StepValidationStatus.IN_PROGRESS,
      courseState: this.courseStateService.serializeCourseState(),
      coursesSelection: {
        modules: this.courseStateService.getSelectedCoursesByModule(),
      },
    };

    if (this.sPS.studyPlan) {
      alert("Plan d'études déjà soumis!");
    } else {
      this.apiService.submitStudyPlan(this.currentPlan).subscribe({
        next: (response) => {
          this.sPS.loadStudyPlan(response._id, true);
          alert("Plan d'études soumis avec succès!");
        },
        error: (error) => {
          console.error("Erreur lors de la soumission du plan d'études:", error);
          alert("Erreur lors de la soumission du plan d'études.");
        },
      });
    }
  }

  modifyPlan(): void {
    this.programService.setAdminEditing(true);
    if (this.router.url !== '/admin/programs') {
      this.router.navigate(['/admin/programs']);
    }
  }

  // Ajouter cette méthode helper
  extractSubModulePrefix(subModuleTitle: string): string {
    const match = subModuleTitle.match(/\(([A-Z]\d+)\)/);
    return match ? match[1] : subModuleTitle;
  }

  getDirectorName(id: string): string | null {
    const d = this.directors.find((dir) => dir._id === id);
    return d ? `${d.firstName} ${d.lastName}` : null;
  }

  getCoordinatorName(id: string): string | null {
    const c = this.coordinators.find((co) => co._id === id);
    return c ? `${c.firstName} ${c.lastName}` : null;
  }

  getTypeDirector(): string {
    return (this.program.type == "doctorat" || this.program.degree.includes("recherche")) 
      ? "Directeur de recherche" 
      : "Directeur d'étude";
  }
}
