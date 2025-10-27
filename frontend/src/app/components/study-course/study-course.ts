import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CourseState, CourseStateService } from '@app/services/course-state/course-state';
import { Course } from '@common/program';

@Component({
  selector: 'app-study-course',
  imports: [CommonModule],
  templateUrl: './study-course.html',
  styleUrl: './study-course.scss'
})
export class StudyCourse {
  @Input() course!: Course;
  @Input() currentModuleTitle!: string;
  @Input() currentSubmoduleTitle: string | null = null;
  @Input() currentSectionDescription!: string;
  @Input() isViewMode: boolean = false;
  @Output() selectionChange = new EventEmitter<{courseSigle: string, selected: boolean}>();

  constructor(private courseStateService: CourseStateService) {}

  onSelectionChange(selected: boolean) {
    if (this.isViewMode) return;
    
    if (selected) {
      const canSelect = this.courseStateService.canCourseBeSelected(
        this.course.sigle,
        this.currentModuleTitle,
        this.currentSubmoduleTitle,
        this.currentSectionDescription
      );
      
      if (!canSelect.canSelect) {
        return;
      }
    }

    this.selectionChange.emit({
      courseSigle: this.course.sigle,
      selected: selected
    });
  }

  get courseState(): CourseState {
    return this.courseStateService.getCourseState(this.course.sigle);
  }

  get isSelected(): boolean {
    return this.courseState.selected;
  }

  get isDisabled(): boolean {
    if (this.isViewMode) return true;
    
    if (this.isSelected) {
      return this.courseState.selectedInModule !== this.currentModuleTitle ||
             this.courseState.selectedInSubmodule !== this.currentSubmoduleTitle ||
             this.courseState.selectedInSection !== this.currentSectionDescription;
    }

    const canSelect = this.courseStateService.canCourseBeSelected(
      this.course.sigle,
      this.currentModuleTitle,
      this.currentSubmoduleTitle,
      this.currentSectionDescription
    );

    return !canSelect.canSelect;
  }

  get disabledReason(): string {
    if (this.isViewMode) return '';
    
    if (this.isSelected && this.isDisabled) {
      if (!this.currentSubmoduleTitle) {
        return this.courseState.selectedInModule === this.currentModuleTitle
        ? "Déjà sélectionné dans une autre section"
        : `Déjà sélectionné dans le module: ${this.courseState.selectedInModule}`;
      }

      if (this.courseState.selectedInSubmodule === this.currentSubmoduleTitle) {
        return "Déjà sélectionné dans une autre section";
      }
      
      if (this.courseState.selectedInModule === this.currentModuleTitle) {
        return `Déjà sélectionné dans le sous-module: ${this.courseState.selectedInSubmodule}`;
      }
      
      return `Déjà sélectionné dans le module: ${this.courseState.selectedInModule}`;
    }

    if (!this.isSelected && this.isDisabled) {
      const canSelect = this.courseStateService.canCourseBeSelected(
        this.course.sigle,
        this.currentModuleTitle,
        this.currentSubmoduleTitle,
        this.currentSectionDescription
      );
      
      return canSelect.reason || 'Non sélectionnable';
    }

    return '';
  }

  get selectionInfo(): string {
    if (this.isViewMode) return '';
    return this.disabledReason;
  }

  canBeToggled(): boolean {
    if (this.isViewMode) return false;
    
    if (this.isSelected) {
      return !this.isDisabled;
    } else {
      const canSelect = this.courseStateService.canCourseBeSelected(
        this.course.sigle,
        this.currentModuleTitle,
        this.currentSubmoduleTitle,
        this.currentSectionDescription
      );
      return canSelect.canSelect;
    }
  }
}