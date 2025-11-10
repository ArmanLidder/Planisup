import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CourseState, CourseStateService } from '@app/services/course-state/course-state';
import { CourseService } from '@app/services/course/course-service';
import { StudyPlanService } from '@app/services/study-plan/study-plan-service';
import { Course, Grade, Trimester } from '@common/program';

@Component({
  selector: 'app-study-course',
  imports: [CommonModule, FormsModule],
  templateUrl: './study-course.html',
  styleUrl: './study-course.scss'
})
export class StudyCourse {
  @Input() course!: Course;
  @Input() currentModuleTitle!: string;
  @Input() currentSubmoduleTitle: string | null = null;
  @Input() currentSectionDescription!: string;
  @Input() isViewMode: boolean = false;
  @Input() isSectionHighlight: boolean = false;
  @Output() selectionChange = new EventEmitter<{courseSigle: string, selected: boolean}>();

  showGradeDropdown: boolean = false;
  grades = Object.values(Grade);

  constructor(
    private courseStateService: CourseStateService,
    private courseService: CourseService,
    private studyPlanService: StudyPlanService,
  ) {}

  onSelectionChange(selected: boolean) {
    if (this.isViewMode) return;
    
    if (selected) {
      const canSelect = this.courseStateService.canCourseBeSelected(
        this.course.sigle,
        this.currentModuleTitle,
        this.currentSubmoduleTitle,
        this.currentSectionDescription,
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

  onAvantagePolyChange(event: Event) {
    if (this.isViewMode) return;

    const checked = (event.target as HTMLInputElement).checked;

    this.courseStateService.setAvantagePoly(this.course.sigle, checked);

    this.showGradeDropdown = checked;
  }

  onGradeSelect(grade: Grade) {
    if (this.isViewMode) return;
    
    this.courseStateService.setAvantagePoly(this.course.sigle, true, grade);
  }

  get currentGrade(): Grade | undefined {
    return this.courseState.course.grade;
  }

  get isAvantagePolyChecked(): boolean {
    return this.courseState.course.alreadyDone || false;
  }

  // Nouvelle fonctionnalité : Gestion des trimestres
  get availableTrimesters(): string[] {
    const courseTrim = this.courseService.courses.find(trim => trim.sigle === this.course.sigle) as any;

    if (!courseTrim) return [];


    if (Array.isArray(courseTrim.trimester)) {
      const trimesters = courseTrim.trimester.map((t: { trimestre: string; annee: string, jourSoir: string }) => {
        if (t.jourSoir.trim() !== "") return `${t.trimestre} ${t.annee}`;
        return null;
      }).filter((item: string) => item !== null);
      return trimesters.length > 0 ? trimesters : ["Aucun Trimestre"]
    }

    return ["Aucun Trimestre"];
  }

  get selectedTrimester(): string {
    if (Array.isArray(this.courseState.course.trimester) && this.courseState.course.trimester.length > 0 && this.courseState.course.trimester[0]) {
      return `${this.courseState.course.trimester[0].term} ${this.courseState.course.trimester[0].year}`; 
    }
    return "Aucun Trimestre";
  }

  onTrimesterSelect(event: Event) {
    if (this.isViewMode) return;
    
    const selectElement = event.target as HTMLSelectElement;
    const value = selectElement.value;

    const [term, year] = value.split(' ');
    let trimester: Trimester;
    if (term === "Aucun") {
      trimester  = { 
        term: "-", 
        year: 0, 
      };
    } else {
      trimester = { 
        term: term, 
        year: parseInt(year, 10), 
      };
    }
    this.courseStateService.setCourseTrimester(this.course.sigle, trimester);
  }

  get needsTrimesterSelection(): boolean {
    return this.isSelected && !this.isViewMode && this.availableTrimesters.length > 0;
  }
}