import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Module } from '@common/program';
import { StudySection } from '../study-section/study-section';

@Component({
  selector: 'app-study-module',
  imports: [StudySection, CommonModule],
  templateUrl: './study-module.html',
  styleUrl: './study-module.scss'
})
export class StudyModule implements OnInit {
  @Input() module!: Module;
  @Input() progressStyle!: any;
  @Output() courseSelectionChange = new EventEmitter<{courseSigle: string, moduleTitle: string, selected: boolean}>();

  title: string = '';
  credits: number = 0;
  selectedCredits: number = 0;
  
  ngOnInit(): void {
    this.initialization();
    this.calculateSelectedCredits();
  }

  initialization() {
    const creditMatch = this.module.title.match(/\((\d+)\s*crédits\)/i);
    if (creditMatch) {
      this.credits = parseInt(creditMatch[1], 10);
      this.title = this.module.title.replace(creditMatch[0], '').trim();
    } else {
      this.title = this.module.title;
      this.credits = 0;
    }
  }

  onCourseSelectionChange(event: {courseSigle: string, selected: boolean}) {
    this.courseSelectionChange.emit({
      courseSigle: event.courseSigle,
      moduleTitle: this.module.title,
      selected: event.selected
    });
    this.calculateSelectedCredits();
  }

  calculateSelectedCredits() {
    this.selectedCredits = 0;
    
    if (this.module.courses) {
      this.module.courses.forEach(section => {
        section.courses.forEach(course => {
          if ((course as any).selected) {
            this.selectedCredits += course.credits;
          }
        });
      });
    }

    if (this.module.subModules) {
      this.module.subModules.forEach(subModule => {
        if (subModule.courses) {
          subModule.courses.forEach(section => {
            section.courses.forEach(course => {
              if ((course as any).selected) {
                this.selectedCredits += course.credits;
              }
            });
          });
        }
      });
    }
  }

  getModuleProgressStyle(): any {
    const percentage = this.credits > 0 ? Math.min((this.selectedCredits / this.credits) * 100, 100) : 0;
    return {
      'width': `${percentage}%`,
      'background-color': percentage >= 100 ? '#4caf50' : 
                          this.selectedCredits >= this.credits ? '#2196f3' : '#ff9800'
    };
  }

  extractCreditsFromTitle(title: string): number {
    const creditMatch = title.match(/\((\d+)\s*crédits\)/i);
    return creditMatch ? parseInt(creditMatch[1], 10) : 0;
  }

  getModuleTitleWithoutCredits(title: string): string {
    return title.replace(/\(\d+\s*crédits\)/i, '').trim();
  }
}
