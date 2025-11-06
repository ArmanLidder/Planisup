import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { StudyCourse } from '../study-course/study-course';
import { CourseSearch } from '../course-search/course-search';
import { CommonModule } from '@angular/common';
import { Section, Course } from '@common/program';
import { CourseStateService } from '@app/services/course-state/course-state';

@Component({
  selector: 'app-study-section',
  standalone: true,
  imports: [StudyCourse, CourseSearch, CommonModule],
  templateUrl: './study-section.html',
  styleUrl: './study-section.scss'
})
export class StudySection {
  @Input() section!: Section;
  @Input() currentModuleTitle!: string;
  @Input() currentSubmoduleTitle: string | null = null;
  @Input() allCourses: Course[] = [];
  @Input() isViewMode: boolean = false;
  @Output() courseSelectionChange = new EventEmitter<{
    courseSigle: string, 
    selected: boolean, 
    section: string, 
    submoduleTitle: string | null
  }>();

  @ViewChild(CourseSearch) courseSearchComponent!: CourseSearch;

  constructor(private courseStateService: CourseStateService) {}

  onCourseSelectionChange(event: {courseSigle: string, selected: boolean}) {
    if (this.isViewMode) return;
    
    this.courseSelectionChange.emit({
      courseSigle: event.courseSigle,
      selected: event.selected,
      section: this.section.description,
      submoduleTitle: this.currentSubmoduleTitle
    });

    // Rafraîchir la liste des cours sélectionnés dans course-search
    if (this.courseSearchComponent) {
      this.courseSearchComponent.loadSelectedCourses();
      console.log(this.sectionCourses)
    }
  }

  onSearchCourseSelectionChange(event: { course: Course; selected: boolean }) {
    if (this.isViewMode) return;
    
    this.courseSelectionChange.emit({
      courseSigle: event.course.sigle,
      selected: event.selected,
      section: this.section.description,
      submoduleTitle: this.currentSubmoduleTitle
    });
  }

  // Obtenir tous les cours de la section (cours fixes + cours ajoutés via search)
  get sectionCourses(): Course[] {
    const fixedCourses = this.section.courses || [];
    const searchCourses: Course[] = [];
    
    // Récupérer les cours ajoutés via course-search qui sont dans cette section
    this.courseStateService.courseStates.forEach((state, courseSigle) => {
        if (state.selected &&
            state.selectedInModule === this.currentModuleTitle &&
            state.selectedInSubmodule === this.currentSubmoduleTitle &&
            state.selectedInSection === this.section.description &&
            !fixedCourses.some(fixedCourse => fixedCourse.sigle === courseSigle)) {
            
            // Récupérer l'objet Course complet depuis allCourses si nécessaire
            if (state.course) {
                searchCourses.push(state.course);
            }
        }
    });
    return [...fixedCourses, ...searchCourses];
  }

  get selectedCredits() {
    return this.isViewMode ? 0 : this.courseStateService.getSectionSelectedCredits(this.currentModuleTitle, this.currentSubmoduleTitle, this.section.description);
  }

  get requiredCredits() {
    const rules = this.section.rules || [];

    if (this.isViewMode) return undefined;

    return rules.find(rule => rule.type === 'credits_exact')?.value ??
         rules.find(rule => rule.type === 'credits_minimum')?.value ??
         rules.find(rule => rule.type === 'credits_maximum')?.value;
  }

  /**
   * Vérifie si la section a une règle de type credits_exact
   */
  get isRuleExact(): boolean {
    return !this.isViewMode && !!this.section.rules?.some(rule => rule.type === 'credits_exact');
  }

  /**
   * Vérifie si la section nécessite l'approbation du directeur
   */
  get isDirectorApprovalSection(): boolean {
    return !this.isViewMode && !!this.section.rules?.some(rule => rule.type === 'director_approval');
  }

  /**
   * Vérifie si la section a une règle de minimum de crédits
   */
  get isMinimumRuleSection(): boolean {
    return !this.isViewMode && !!this.section.rules?.some(rule => rule.type === 'credits_minimum');
  }

  /**
   * Vérifie si la section a une règle de maximum de crédits
   */
  get isMaximumRuleSection(): boolean {
    return !this.isViewMode && !!this.section.rules?.some(rule => rule.type === 'credits_maximum');
  }

  get progressPercentage(): number {
    if (this.isViewMode || !this.hasRequiredCredits) return 0;
    const percentage = (this.selectedCredits / this.requiredCredits!) * 100;
    return Math.min(percentage, 100);
  }

  getProgressColor(): string {
    if (this.isViewMode || !this.hasRequiredCredits) return '#e0e0e0';
    
    const selected = this.selectedCredits;
    const required = this.requiredCredits!;
    const isMinimum = this.isMinimumRuleSection;
    
    if (isMinimum) {
      if (selected >= required) return '#4caf50';
      if (selected > 0) return '#2196f3';
      return '#e0e0e0';
    } else {
      if (selected === required) return '#4caf50';
      if (selected > 0) return '#2196f3';
      return '#e0e0e0';
    }
  }

  get hasRequiredCredits(): boolean {
    return !this.isViewMode && 
           this.requiredCredits !== undefined && 
           this.requiredCredits > 0;
  }


  /**
   * Vérifie si la section nécessite l'approbation du directeur
   */
  get isSectionHighlight (): boolean {
    return this.isViewMode && !!this.section.rules?.some(rule => rule.type === 'director_approval');
  }
}