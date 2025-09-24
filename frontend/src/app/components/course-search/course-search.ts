import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Course } from '@common/program';

@Component({
  selector: 'app-course-search',
  imports: [CommonModule, FormsModule],
  templateUrl: './course-search.html',
  styleUrl: './course-search.scss'
})
export class CourseSearch implements OnInit {
  @Input() allCourses: Course[] = [];
  @Input() maxCredits: number = 0;
  @Input() currentModuleTitle!: string;
  @Input() currentSubmoduleTitle: string | null = null;
  @Input() currentSectionDescription!: string;
  
  @Output() courseSelectionChange = new EventEmitter<{
    course: Course;
    selected: boolean;
  }>();

  searchTerm: string = '';
  creditFilter: string = '';
  filteredCourses: Course[] = [];
  selectedCourses: Course[] = [];
  selectedCredits: number = 0;
  isExpanded: boolean = false;
  
  // Pagination
  currentPage: number = 0;
  coursesPerPage: number = 10;

  ngOnInit() {
    this.filteredCourses = [...this.allCourses];
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

  canSelectCourse(course: Course): boolean {
    if (this.isSelected(course)) return true;
    return this.selectedCredits + course.credits <= this.maxCredits;
  }

  getStatusMessage(course: Course): string {
    if (this.selectedCredits + course.credits > this.maxCredits) {
      return `Dépasserait la limite de crédits (${this.selectedCredits + course.credits}/${this.maxCredits})`;
    }
    return '';
  }

  toggleCourse(course: Course) {
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
    
    this.selectedCourses.push(course);
    this.selectedCredits += course.credits;
    this.courseSelectionChange.emit({ course, selected: true });
  }

  removeCourse(course: Course) {
    const index = this.selectedCourses.findIndex(c => c.sigle === course.sigle);
    if (index > -1) {
      this.selectedCourses.splice(index, 1);
      this.selectedCredits -= course.credits;
      this.courseSelectionChange.emit({ course, selected: false });
    }
  }
}
