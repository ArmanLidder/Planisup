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
  @Input() isViewMode: boolean = false;
  @Output() courseSelectionChange = new EventEmitter<{
    courseSigle: string, 
    selected: boolean, 
    section: string, 
    submoduleTitle: string | null
  }>();

  constructor(private courseStateService: CourseStateService) {}

  onCourseSelectionChange(event: {courseSigle: string, selected: boolean}) {
    if (this.isViewMode) return;
    
    this.courseSelectionChange.emit({
      courseSigle: event.courseSigle,
      selected: event.selected,
      section: this.section.description,
      submoduleTitle: this.currentSubmoduleTitle
    });
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

  get sectionStatus() {
    if (this.isViewMode) {
      return {
        selectedCredits: 0,
        requiredCredits: undefined,
        isComplete: false,
        hasRule: false,
        isInGroup: false,
        isGroupLeader: false,
        isMinimum: false
      };
    }
    
    return this.courseStateService.getSectionStatus(
      this.currentModuleTitle,
      this.currentSubmoduleTitle,
      this.section.description
    );
  }

  get sectionRule() {
    if (this.isViewMode) {
      return null;
    }
    
    return this.courseStateService.getSectionRule(
      this.currentModuleTitle,
      this.currentSubmoduleTitle,
      this.section.description
    );
  }

  get isRuleSection(): boolean {
    return !this.isViewMode && this.sectionRule?.type === 'credits_choice';
  }

  get isDirectorApprovalSingleSection(): boolean {
    return !this.isViewMode && this.sectionRule?.type === 'director_approval_single';
  }

  get isDirectorApprovalSection(): boolean {
    return !this.isViewMode && (this.sectionRule?.type === 'director_approval' || this.sectionRule?.type === 'director_approval_single');
  }

  get isMinimumRuleSection(): boolean {
    return !this.isViewMode && this.sectionRule?.type === 'credits_minimum';
  }

  get isInRuleGroup(): boolean {
    return !this.isViewMode && this.sectionRule?.groupSections !== undefined;
  }

  get isFirstInRuleGroup(): boolean {
    return !this.isViewMode && 
           this.sectionRule?.description === this.section.description && 
           (this.sectionRule?.type === 'credits_choice' || 
            this.sectionRule?.type === 'credits_minimum' || 
            this.sectionRule?.type === 'director_approval');
  }

  get progressPercentage(): number {
    if (this.isViewMode || !this.hasRequiredCredits) return 0;
    const percentage = (this.sectionStatus.selectedCredits / this.sectionStatus.requiredCredits!) * 100;
    return Math.min(percentage, 100);
  }

  getProgressColor(): string {
    if (this.isViewMode || !this.hasRequiredCredits) return '#e0e0e0';
    
    const selected = this.sectionStatus.selectedCredits;
    const required = this.sectionStatus.requiredCredits!;
    const isMinimum = this.sectionStatus.isMinimum;
    
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
           this.sectionStatus.requiredCredits !== undefined && 
           this.sectionStatus.requiredCredits > 0;
  }

  get isCreditsComplete(): boolean {
    return !this.isViewMode && 
           this.hasRequiredCredits && 
           this.sectionStatus.selectedCredits >= this.sectionStatus.requiredCredits!;
  }
}