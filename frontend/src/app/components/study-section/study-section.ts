import { Component, EventEmitter, Input, Output } from '@angular/core';
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
  @Output() courseSelectionChange = new EventEmitter<{
    courseSigle: string, 
    selected: boolean, 
    section: string, 
    submoduleTitle: string | null
  }>();

  constructor(private courseStateService: CourseStateService) {}

  onCourseSelectionChange(event: {courseSigle: string, selected: boolean}) {
    this.courseSelectionChange.emit({
      courseSigle: event.courseSigle,
      selected: event.selected,
      section: this.section.description,
      submoduleTitle: this.currentSubmoduleTitle
    });
  }

  onSearchCourseSelectionChange(event: { course: Course; selected: boolean }) {
    this.courseSelectionChange.emit({
      courseSigle: event.course.sigle,
      selected: event.selected,
      section: this.section.description,
      submoduleTitle: this.currentSubmoduleTitle
    });
  }

  get sectionStatus() {
    return this.courseStateService.getSectionStatus(
      this.currentModuleTitle,
      this.currentSubmoduleTitle,
      this.section.description
    );
  }

  get sectionRule() {
    return this.courseStateService.getSectionRule(
      this.currentModuleTitle,
      this.currentSubmoduleTitle,
      this.section.description
    );
  }

  get isRuleSection(): boolean {
    return this.sectionRule?.type === 'credits_choice';
  }

  get isDirectorApprovalSection(): boolean {
    return this.sectionRule?.type === 'director_approval';
  }

  get isMinimumRuleSection(): boolean {
    return this.sectionRule?.type === 'credits_minimum';
  }

  get isInRuleGroup(): boolean {
    return this.sectionRule?.groupSections !== undefined;
  }

  get isFirstInRuleGroup(): boolean {
    // Vérifier si c'est la section leader du groupe (celle qui a défini la règle originale)
    return this.sectionRule?.description === this.section.description && 
           (this.sectionRule?.type === 'credits_choice' || 
            this.sectionRule?.type === 'credits_minimum' || 
            this.sectionRule?.type === 'director_approval');
  }

  get progressPercentage(): number {
    if (!this.hasRequiredCredits) return 0;
    const percentage = (this.sectionStatus.selectedCredits / this.sectionStatus.requiredCredits!) * 100;
    return Math.min(percentage, 100);
  }

  getProgressColor(): string {
    if (!this.hasRequiredCredits) return '#e0e0e0';
    
    const selected = this.sectionStatus.selectedCredits;
    const required = this.sectionStatus.requiredCredits!;
    const isMinimum = this.sectionStatus.isMinimum;
    
    if (isMinimum) {
      // Pour les minimums : vert si >= requis, bleu si > 0, gris sinon
      if (selected >= required) return '#4caf50'; // Vert - minimum atteint
      if (selected > 0) return '#2196f3'; // Bleu - en cours
      return '#e0e0e0'; // Gris - rien sélectionné
    } else {
      // Pour les exacts : vert si === requis, bleu si > 0, gris sinon
      if (selected === required) return '#4caf50'; // Vert - exact
      if (selected > 0) return '#2196f3'; // Bleu - en cours
      return '#e0e0e0'; // Gris - rien sélectionné
    }
  }

  get hasRequiredCredits(): boolean {
    return this.sectionStatus.requiredCredits !== undefined && this.sectionStatus.requiredCredits > 0;
  }

  get isCreditsComplete(): boolean {
    return this.hasRequiredCredits && 
           this.sectionStatus.selectedCredits >= this.sectionStatus.requiredCredits!;
  }
}