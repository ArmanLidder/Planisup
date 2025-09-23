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
  @Output() selectionChange = new EventEmitter<{courseSigle: string, selected: boolean}>();

  constructor(private courseStateService: CourseStateService) {}

  onSelectionChange(selected: boolean) {
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
    // Désactivé si sélectionné dans un autre endroit
    if (this.isSelected) {
      // Vérifier si sélectionné ailleurs
      return this.courseState.selectedInModule !== this.currentModuleTitle ||
             this.courseState.selectedInSubmodule !== this.currentSubmoduleTitle ||
             this.courseState.selectedInSection !== this.currentSectionDescription;
    }
    return false;
  }

  get selectionInfo(): string {
    if (!this.isDisabled) return '';

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

  // Permettre l'interaction seulement si le cours n'est pas sélectionné dans un autre module
  canBeToggled(): boolean {
    return !this.isDisabled || this.isSelected;
  }
}
