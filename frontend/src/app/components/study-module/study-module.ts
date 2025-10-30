import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Module, Course } from '@common/program';
import { StudySection } from '../study-section/study-section';
import { CourseStateService } from '@app/services/course-state/course-state';

@Component({
  selector: 'app-study-module',
  imports: [StudySection, CommonModule],
  templateUrl: './study-module.html',
  styleUrl: './study-module.scss'
})
export class StudyModule implements OnInit {
  @Input() module!: Module;
  @Input() progressStyle!: any;
  @Input() allCourses: Course[] = [];
  @Input() isViewMode: boolean = false;
  @Output() courseSelectionChange = new EventEmitter<{
    courseSigle: string, 
    moduleTitle: string, 
    submoduleTitle: string | null, 
    selected: boolean, 
    selectedSection: string
  }>();

  title: string = '';
  credits: number = 0;
  selectedCredits: number = 0;
  isExpanded: boolean = false;
  expandedSubModules: Map<string, boolean> = new Map();
  
  constructor(private courseStateService: CourseStateService) {}

  ngOnInit(): void {
    this.initialization();
    this.calculateSelectedCredits();
    if (this.module.subModules) {
      this.module.subModules.forEach(subModule => {
        this.expandedSubModules.set(subModule.title, false);
      });
    }
  }

  initialization() {
    const titleMatch = this.module.title.match(/\((\d+)\s*crédits\)/i);
    const rule = this.module.rules?.find(rule => rule.type === 'credits_exact');
    if (titleMatch) {
      this.title = this.module.title.replace(titleMatch[0], '').trim();
    } else {
      this.title = this.module.title;
    }
    this.credits = rule?.value ? rule.value : 0 ;
  }

  toggleModule() {
    this.isExpanded = !this.isExpanded;
  }

  toggleSubModule(subModuleTitle: string) {
    const currentState = this.expandedSubModules.get(subModuleTitle) || false;
    this.expandedSubModules.set(subModuleTitle, !currentState);
  }

  isSubModuleExpanded(subModuleTitle: string): boolean {
    return this.expandedSubModules.get(subModuleTitle) || false;
  }

  onCourseSelectionChange(event: {
    courseSigle: string, 
    selected: boolean, 
    section: string
    submoduleTitle: string | null
  }) {
    if (this.isViewMode) return;
    
    this.courseSelectionChange.emit({
      courseSigle: event.courseSigle,
      moduleTitle: this.module.title,
      submoduleTitle: event.submoduleTitle,
      selected: event.selected,
      selectedSection: event.section
    });
    this.calculateSelectedCredits();
  }

  calculateSelectedCredits() {
    this.selectedCredits = this.courseStateService.getModuleSelectedCredits(this.module.title);
  }

  getModuleProgressStyle(): any {
    const percentage = this.credits > 0 ? Math.min((this.selectedCredits / this.credits) * 100, 100) : 0;
    return {
      'width': `${percentage}%`,
      'background-color': percentage >= 100 ? '#4caf50' : 
                          this.selectedCredits >= this.credits ? '#2196f3' : '#ff9800'
    };
  }

  getModuleTitleWithoutCredits(title: string): string {
    return title.replace(/\(\d+\s*crédits\)/i, '').trim();
  }
}
