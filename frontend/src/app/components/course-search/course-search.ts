import { Component, EventEmitter, Input, OnInit, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Course } from '@common/program';
import { CourseStateService } from '@app/services/course-state/course-state';

@Component({
  selector: 'app-course-search',
  imports: [CommonModule, FormsModule],
  templateUrl: './course-search.html',
  styleUrl: './course-search.scss'
})
export class CourseSearch implements OnInit, OnChanges {
  @Input() allCourses: Course[] = [];
  @Input() maxCredits: number = 0;
  @Input() currentModuleTitle!: string;
  @Input() currentSubmoduleTitle: string | null = null;
  @Input() currentSectionDescription!: string;
  @Input() maxCourses: number = 999;
  @Input() pickMode: boolean = false;
  @Input() showSelectedList: boolean = true;
  @Input() showCheckboxes: boolean = true;
  @Input() allowManualInput: boolean = true;

  @Output() courseSelectionChange = new EventEmitter<{
    course: Course;
    selected: boolean;
  }>();

  manualCourseSigle: string = '';
  manualCourseName: string = '';
  manualCourseCredits: number | null = null;
  manualCourseError: string | null = null;

  searchTerm: string = '';
  creditFilter: string = '';
  filteredCourses: Course[] = [];
  selectedCourses: Course[] = [];
  selectedCredits: number = 0;
  isExpanded: boolean = false;

  // Pagination
  currentPage: number = 0;
  coursesPerPage: number = 10;

  constructor(private courseStateService: CourseStateService) {}

  ngOnInit() {
    this.filteredCourses = [...this.allCourses];
    this.loadSelectedCourses();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['allCourses']) {
      this.filteredCourses = [...this.allCourses];
      this.loadSelectedCourses();
    }
  }

  get isCourseLimitReached(): boolean {
    return this.selectedCourses.length >= this.maxCourses;
  }

  get isExcludedBySubModuleRule(): boolean {
    const testResult = this.courseStateService.canSearchCourseBeSelected(
      'TEST',
      this.currentModuleTitle,
      this.currentSubmoduleTitle
    );

    return (!testResult.canSelect && testResult.reason?.includes('module exclusif')) || false;
  }

  get exclusionMessage(): string {
    const testResult = this.courseStateService.canSearchCourseBeSelected(
      'TEST',
      this.currentModuleTitle,
      this.currentSubmoduleTitle
    );

    return testResult.reason || '';
  }

  // Charger les cours sélectionnés depuis le service d'état
  loadSelectedCourses() {
    this.selectedCourses = [];
    this.selectedCredits = 0;

    this.allCourses.forEach(course => {
      const state = this.courseStateService.getCourseState(course.sigle);
      if (state.selected &&
          state.selectedInModule === this.currentModuleTitle &&
          state.selectedInSubmodule === this.currentSubmoduleTitle &&
          state.selectedInSection === this.currentSectionDescription) {
        this.selectedCourses.push(course);
        this.selectedCredits += course.credits;
      }
    });
  }

  filterCourses() {
    this.filteredCourses = this.allCourses.filter(course => {
      const matchesSearch = !this.searchTerm ||
        course.sigle.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        course.name.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesCredit = !this.creditFilter ||
        course.credits.toString() === this.creditFilter;

      return matchesSearch && matchesCredit;
    });

    this.currentPage = 0;
  }

  get paginatedCourses(): Course[] {
    const start = this.currentPage * this.coursesPerPage;
    const end = start + this.coursesPerPage;
    return this.filteredCourses.slice(start, end);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredCourses.length / this.coursesPerPage);
  }

  changePage(direction: number) {
    this.currentPage += direction;
  }

  toggleExpanded() {
    this.isExpanded = !this.isExpanded;
  }

  isSelected(course: Course): boolean {
    return this.selectedCourses.some(c => c.sigle === course.sigle);
  }

  isSelectedElsewhere(course: Course): boolean {
    const state = this.courseStateService.getCourseState(course.sigle);
    return state.selected &&
           (state.selectedInModule !== this.currentModuleTitle ||
            state.selectedInSubmodule !== this.currentSubmoduleTitle ||
            state.selectedInSection !== this.currentSectionDescription);
  }

  canSelectCourse(course: Course): boolean {
    if (this.isSelected(course)) return true;

    if (this.isSelectedElsewhere(course)) return false;

    if (this.isCourseLimitReached) return false;

    const canSelect = this.courseStateService.canSearchCourseBeSelected(
      course.sigle,
      this.currentModuleTitle,
      this.currentSubmoduleTitle
    );

    if (!canSelect.canSelect) return false;

    if (this.maxCredits > 0 && this.selectedCredits + course.credits > this.maxCredits) {
      return false;
    }

    return true;
  }

  getStatusMessage(course: Course): string {
    if (this.isSelectedElsewhere(course)) {
      const state = this.courseStateService.getCourseState(course.sigle);
      const location = state.selectedInSubmodule
        ? `${state.selectedInModule} > ${state.selectedInSubmodule}`
        : state.selectedInModule;
      return `Déjà sélectionné dans: ${location}`;
    }

    if (this.isCourseLimitReached && !this.isSelected(course)) {
      return `Limite de cours atteinte (${this.selectedCourses.length}/${this.maxCourses})`;
    }

    const canSelect = this.courseStateService.canSearchCourseBeSelected(
      course.sigle,
      this.currentModuleTitle,
      this.currentSubmoduleTitle
    );

    if (!canSelect.canSelect && canSelect.reason) {
      return canSelect.reason;
    }

    if (this.maxCredits > 0 && this.selectedCredits + course.credits > this.maxCredits) {
      return `Dépasserait la limite de crédits de la section (${this.selectedCredits + course.credits}/${this.maxCredits})`;
    }

    return '';
  }

  toggleCourse(course: Course) {
    if (this.pickMode) {
      this.courseSelectionChange.emit({ course, selected: true });
      return;
    }
    if (!this.canSelectCourse(course) && !this.isSelected(course)) {
      return;
    }

    const isCurrentlySelected = this.isSelected(course);

    if (isCurrentlySelected) {
      this.removeCourse(course);
    } else {
      this.addCourse(course);
    }
  }

  addCourse(course: Course) {
    if (!this.canSelectCourse(course)) return;
    console.log("je suiss la")
    if (this.pickMode) {
      this.courseSelectionChange.emit({ course, selected: true });
      return;
    }

    this.courseStateService.addCourseToStates(course);

    this.selectedCourses.push(course);
    this.selectedCredits += course.credits;
    this.courseSelectionChange.emit({ course, selected: true });
    console.log("je suis la en bas")
  }

  removeCourse(course: Course) {
    const index = this.selectedCourses.findIndex(c => c.sigle === course.sigle);
    if (index > -1) {
      this.selectedCourses.splice(index, 1);
      this.selectedCredits -= course.credits;
      this.courseSelectionChange.emit({ course, selected: false });
    }
  }

  numSequence(n: number): Array<number> {
    return Array(n).fill(0).map((x, i) => i + 1);
  }

  addManualCourse(): void {
    this.manualCourseError = null;

    const sigle = (this.manualCourseSigle || '').trim().toUpperCase();
    const name = (this.manualCourseName || '').trim();
    const rawCredits = this.manualCourseCredits;

    if (!sigle || !name || rawCredits === null || rawCredits === undefined) {
      this.manualCourseError = 'Renseignez le sigle, le titre et les crédits du cours.';
      return;
    }

    const credits = Number(rawCredits);
    if (!Number.isFinite(credits) || credits <= 0) {
      this.manualCourseError = 'Les crédits doivent être un nombre positif.';
      return;
    }

    if (this.allCourses.some((c) => c.sigle.toUpperCase() === sigle)) {
      this.manualCourseError = 'Ce sigle est déjà présent dans la liste des cours.';
      return;
    }

    const course: Course = { sigle, name, credits, trimester: [] };

    this.allCourses = [course, ...this.allCourses];
    this.filteredCourses = [course, ...this.filteredCourses];

    this.addCourse(course);

    this.manualCourseSigle = '';
    this.manualCourseName = '';
    this.manualCourseCredits = null;
  }
}