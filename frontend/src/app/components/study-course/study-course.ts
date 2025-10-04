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
    // Vérifier si la sélection est possible avant d'émettre
    if (selected) {
      const canSelect = this.courseStateService.canCourseBeSelected(
        this.course.sigle,
        this.currentModuleTitle,
        this.currentSubmoduleTitle,
        this.currentSectionDescription
      );
      
      if (!canSelect.canSelect) {
        // Empêcher la sélection et afficher un message
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
    // Désactivé si sélectionné dans un autre endroit
    if (this.isSelected) {
      return this.courseState.selectedInModule !== this.currentModuleTitle ||
             this.courseState.selectedInSubmodule !== this.currentSubmoduleTitle ||
             this.courseState.selectedInSection !== this.currentSectionDescription;
    }

    // Désactivé si la limite de crédits est atteinte dans la section/groupe de règles ou dans le module
    const canSelect = this.courseStateService.canCourseBeSelected(
      this.course.sigle,
      this.currentModuleTitle,
      this.currentSubmoduleTitle,
      this.currentSectionDescription
    );

    return !canSelect.canSelect;
  }

  get disabledReason(): string {
    if (this.isSelected && this.isDisabled) {
      // Sélectionné ailleurs
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

    // Limite de crédits atteinte
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
    return this.disabledReason;
  }

  // Permettre l'interaction seulement si le cours peut être modifié
  canBeToggled(): boolean {
    if (this.isSelected) {
      // Si sélectionné, on peut le désélectionner seulement s'il est sélectionné dans cette section
      return !this.isDisabled;
    } else {
      // Si non sélectionné, vérifier s'il peut être sélectionné
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