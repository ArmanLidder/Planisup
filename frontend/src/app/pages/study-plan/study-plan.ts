import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudyModule } from '../../components/study-module/study-module';
import { ProgramService } from "@app/services/program/program-service";
import { Program, Module, Course } from '@common/program';


@Component({
  selector: 'app-study-plan',
  standalone: true,
  imports: [CommonModule, StudyModule],
  templateUrl: './study-plan.html',
  styleUrls: ['./study-plan.scss']
})

export class StudyPlan implements OnInit {
  totalCredits: number = 0;
  selectedCredits: number = 0;
  program!: Program;
  modules: Module[] = [];

  constructor(private programService: ProgramService) {}

  ngOnInit() {
    this.program = this.programService.program!;
    this.modules = this.program.modules;
    for (const module of this.program.modules) {
      this.totalCredits += this.extractCreditsFromTitle(module.title)
    }
    this.calculateTotalCredits();
  }

  onCourseSelectionChange(event: {courseSigle: string, moduleTitle: string, selected: boolean}) {
    const module = this.modules.find(m => m.title === event.moduleTitle);
    if (!module || !module.courses) return;

    // Find the course in all sections
    let targetCourse: Course | undefined;

    module.courses.forEach(section => {
      const course = section.courses.find(c => c.sigle === event.courseSigle);
      if (course) {
        targetCourse = course;
      }
    });

    if (!targetCourse) return;

    // Handle special rule for INF44504
    if (targetCourse.sigle === 'INF44504' && event.selected) {
      // Disable other courses in the same module
      module.courses.forEach(section => {
        section.courses.filter(c => c.sigle !== 'INF44504').forEach(c => {
          (c as any).disabled = true;
          if ((c as any).selected) {
            (c as any).selected = false;
          }
        });
      });
    } else if (targetCourse.sigle === 'INF44504' && !event.selected) {
      // Re-enable other courses
      module.courses.forEach(section => {
        section.courses.filter(c => c.sigle !== 'INF44504').forEach(c => {
          (c as any).disabled = false;
        });
      });
    }

    (targetCourse as any).selected = event.selected;
    this.calculateTotalCredits();
  }

  calculateTotalCredits() {
    this.selectedCredits = 0;

    this.modules.forEach(module => {
      if (module.courses) {
        module.courses.forEach(section => {
          section.courses.forEach(course => {
            if ((course as any).selected) {
              this.selectedCredits += course.credits;
            }
          });
        });
      }

      if (module.subModules) {
        module.subModules.forEach(subModule => {
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
    });
  }

  getProgressStyle(): any {
    const percentage = this.totalCredits > 0 ? Math.min((this.selectedCredits / this.totalCredits) * 100, 100) : 0;
    return {
      'width': `${percentage}%`,
      'background-color': percentage >= 100 ? '#4caf50' : '#2196f3'
    };
  }

  extractCreditsFromTitle(title: string): number {
    const creditMatch = title.match(/\((\d+)\s*crédits\)/i);
    return creditMatch ? parseInt(creditMatch[1], 10) : 0;
  }

  getModuleTitleWithoutCredits(title: string): string {
    return title.replace(/\(\d+\s*crédits\)/i, '').trim();
  }

  validatePlan() {
    const errors: string[] = [];
    
    this.modules.forEach(module => {
      let moduleCredits = 0;
      
      // Calculate module credits
      if (module.courses) {
        module.courses.forEach(section => {
          section.courses.forEach(course => {
            if ((course as any).selected) {
              moduleCredits += course.credits;
            }
          });
        });
      }

      // Extract required credits from module title
      const requiredCredits = this.extractCreditsFromTitle(module.title);
      
      if (requiredCredits > 0 && moduleCredits < requiredCredits) {
        errors.push(`Le module ${this.getModuleTitleWithoutCredits(module.title)} nécessite au moins ${requiredCredits} crédits.`);
      }
    });
    
    if (this.selectedCredits > 15) {
      errors.push('Le total des crédits ne peut pas dépasser 15.');
    }
    
    if (errors.length > 0) {
      alert('Erreurs de validation:\n' + errors.join('\n'));
      return;
    }
    
    alert('Plan d\'études validé avec succès!');
  }
}
