import { Injectable } from '@angular/core';
import { Course, Module, Section, SubModule } from '@common/program';

export interface CourseState {
  selected: boolean;
  selectedInModule: string | null;
  selectedInSubmodule: string | null;
  selectedInSection: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class CourseStateService {
  public courseStates: Map<string, CourseState> = new Map();

  initializeCourseStates(modules: any[]) {
    this.courseStates.clear();
    
    modules.forEach(module => {
      // Cours dans les sections principales
      if (module.courses) {
        module.courses.forEach((section: any) => {
          section.courses.forEach((course: Course) => {
            if (!this.courseStates.has(course.sigle)) {
              this.courseStates.set(course.sigle, {
                selected: false,
                selectedInModule: null,
                selectedInSubmodule: null,
                selectedInSection: null
              });
            }
          });
        });
      }

      if (module.subModules) {
        module.subModules.forEach((subModule: any) => {
          if (subModule.courses) {
            subModule.courses.forEach((section: any) => {
              section.courses.forEach((course: Course) => {
                if (!this.courseStates.has(course.sigle)) {
                  this.courseStates.set(course.sigle, {
                    selected: false,
                    selectedInModule: null,
                    selectedInSubmodule: null,
                    selectedInSection: null
                  });
                }
              });
            });
          }
        });
      }
    });
  }

  getCourseState(courseSigle: string): CourseState {
    return this.courseStates.get(courseSigle) || {
      selected: false,
      selectedInModule: null,
      selectedInSubmodule: null,
      selectedInSection: null
    };
  }

  setCourseSelected(
    courseSigle: string, 
    moduleTitle: string, 
    submoduleTitle: string | null,
    sectionDescription: string, 
    selected: boolean
  ): boolean {
    let state = this.getCourseState(courseSigle);
    
    if (selected) {
      // Vérifier si le cours est déjà sélectionné ailleurs dans le MÊME module
      const alreadySelected = this.isCourseSelected(courseSigle);
      if (alreadySelected) return false;
      
      state.selected = true;
      state.selectedInModule = moduleTitle;
      state.selectedInSubmodule = submoduleTitle;
      state.selectedInSection = sectionDescription;
    } else {
      // Désélectionner seulement si c'est le bon cours
      state.selected = false;
      state.selectedInModule = null;
      state.selectedInSubmodule = null;
      state.selectedInSection = null;
    }
    
    this.courseStates.set(courseSigle, state);
    return true;
  }

  private isCourseSelected(courseSigle: string): boolean {
    const state = this.courseStates.get(courseSigle);
    return state ? state.selected : false;
  }

  getSelectedCredits(modules: Module[]): number {
    let credits = 0;

    modules.forEach(module => {
      if (module.courses) {
        module.courses.forEach((section: Section) => {
          section.courses.forEach((course: Course) => {
            const state = this.getCourseState(course.sigle);
            if (state.selected &&
              state.selectedInModule === module.title &&
              state.selectedInSubmodule === null &&
              state.selectedInSection === section.description
            ) {
              credits += course.credits;
            }
          });
        });
      }

      // submodule
      if (module.subModules) {
        module.subModules.forEach((subModule: SubModule) => {
          if (subModule.courses) {
            subModule.courses.forEach((section: Section) => {
              section.courses.forEach((course: Course) => {
                const state = this.getCourseState(course.sigle);
                if (state.selected && 
                    state.selectedInModule === module.title && 
                    state.selectedInSubmodule === subModule.title && // Vérifie le sous-module
                    state.selectedInSection === section.description) {
                  credits += course.credits;
                }
              });
            });
          }
        });
      }
    });
    
    return credits;
  }

}