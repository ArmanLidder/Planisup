import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudyModule } from '../../components/study-module/study-module';

export interface Course {
  id: string;
  code: string;
  name: string;
  credits: number;
  selected: boolean;
  disabled?: boolean;
  specialNote?: string;
}

export interface Module {
  id: string;
  title: string;
  requiredCredits: number;
  maxCredits: number;
  courses: Course[];
  subModules?: Module[];
  selectedCredits: number;
}

@Component({
  selector: 'app-study-plan',
  standalone: true,
  imports: [CommonModule, StudyModule],
  templateUrl: './study-plan.html',
  styleUrls: ['./study-plan.scss']
})

export class StudyPlan {
  totalCredits: number = 0;
  
  modules: Module[] = [
    {
      id: 'A1',
      title: 'Cours fondamentaux',
      requiredCredits: 6,
      maxCredits: 9,
      selectedCredits: 0,
      courses: [
        { id: 'A1-1', code: 'INEF101', name: 'Analyse de cyberniques', credits: 3, selected: false },
        { id: 'A1-2', code: 'INF5035', name: 'Cyberécarité', credits: 3, selected: false },
        { id: 'A1-3', code: 'INEF103', name: 'Cyberécarité des infrastructures Critiques', credits: 3, selected: false },
        { id: 'A1-4', code: 'INEF104', name: 'Noms et réglementations en cybernécarité', credits: 3, selected: false }
      ]
    },
    {
      id: 'A2',
      title: 'Cours complémentaires',
      requiredCredits: 6,
      maxCredits: 6,
      selectedCredits: 0,
      courses: [
        { id: 'A2-1', code: 'INF44504', name: 'Cours avancé de cyberprotection', credits: 3, selected: false, specialNote: 'Cours spécial - protection renforcée' },
        { id: 'A2-2', code: 'CYB201', name: 'Sécurité des réseaux', credits: 3, selected: false },
        { id: 'A2-3', code: 'CYB202', name: 'Cryptographie appliquée', credits: 3, selected: false },
        { id: 'A2-4', code: 'CYB203', name: 'Forensique numérique', credits: 3, selected: false }
      ],
      subModules: [
        {
          id: 'A2-S1',
          title: 'Sous-module optionnel',
          requiredCredits: 0,
          maxCredits: 3,
          selectedCredits: 0,
          courses: [
            { id: 'A2-S1-1', code: 'OPT101', name: 'Option 1', credits: 3, selected: false },
            { id: 'A2-S1-2', code: 'OPT102', name: 'Option 2', credits: 3, selected: false }
          ]
        }
      ]
    },
    {
      id: 'A3',
      title: 'Cours 3',
      requiredCredits: 6,
      maxCredits: 6,
      selectedCredits: 0,
      courses: [],
      subModules: [
        {
          id: 'A3-S1',
          title: 'Sous-module optionnel 1',
          requiredCredits: 0,
          maxCredits: 3,
          selectedCredits: 0,
          courses: [
            { id: 'A2-S1-1', code: 'OPT101', name: 'Option 1', credits: 3, selected: false },
            { id: 'A2-S1-2', code: 'OPT102', name: 'Option 2', credits: 3, selected: false }
          ]
        },
        {
          id: 'A3-S2',
          title: 'Sous-module optionnel 2',
          requiredCredits: 0,
          maxCredits: 3,
          selectedCredits: 0,
          courses: [
            { id: 'A2-S1-1', code: 'OPT101', name: 'Option 1', credits: 3, selected: false },
            { id: 'A2-S1-2', code: 'OPT102', name: 'Option 2', credits: 3, selected: false }
          ]
        }
      ]
    }
  ];

  constructor() {
    this.calculateCredits();
  }

  onCourseSelectionChange(event: {courseId: string, moduleId: string, selected: boolean}) {
    const module = this.modules.find(m => m.id === event.moduleId);
    if (!module) return;

    const course = module.courses.find(c => c.id === event.courseId);
    if (!course) return;

    // Gestion de la règle spéciale pour INF44504
    if (course.code === 'INF44504' && event.selected) {
      // Désactiver les autres cours du module A2
      module.courses.filter(c => c.code !== 'INF44504').forEach(c => {
        c.disabled = true;
        if (c.selected) {
          c.selected = false;
          this.updateModuleCredits(module);
        }
      });
    } else if (course.code === 'INF44504' && !event.selected) {
      // Réactiver les autres cours
      module.courses.filter(c => c.code !== 'INF44504').forEach(c => {
        c.disabled = false;
      });
    }

    course.selected = event.selected;
    this.updateModuleCredits(module);
    this.calculateTotalCredits();
  }

  onSubModuleCourseSelectionChange(event: {courseId: string, moduleId: string, subModuleId: string, selected: boolean}) {
    const module = this.modules.find(m => m.id === event.moduleId);
    if (!module || !module.subModules) return;

    const subModule = module.subModules.find(sm => sm.id === event.subModuleId);
    if (!subModule) return;

    const course = subModule.courses.find(c => c.id === event.courseId);
    if (!course) return;

    course.selected = event.selected;
    this.updateModuleCredits(subModule);
    this.updateModuleCredits(module);
    this.calculateTotalCredits();
  }

  updateModuleCredits(module: Module) {
    module.selectedCredits = module.courses
      .filter(c => c.selected)
      .reduce((sum, current) => sum + current.credits, 0);
    
    // Calculer les crédits des sous-modules s'ils existent
    if (module.subModules) {
      module.subModules.forEach(subModule => {
        subModule.selectedCredits = subModule.courses
          .filter(c => c.selected)
          .reduce((sum, current) => sum + current.credits, 0);
        
        module.selectedCredits += subModule.selectedCredits;
      });
    }
  }

  calculateTotalCredits() {
    this.totalCredits = this.modules.reduce((sum, module) => sum + module.selectedCredits, 0);
  }

  calculateCredits() {
    this.modules.forEach(module => {
      this.updateModuleCredits(module);
    });
    this.calculateTotalCredits();
  }

  validatePlan() {
    const errors: string[] = [];
    
    this.modules.forEach(module => {
      if (module.selectedCredits < module.requiredCredits) {
        errors.push(`Le module ${module.title} nécessite au moins ${module.requiredCredits} crédits.`);
      }
      if (module.selectedCredits > module.maxCredits) {
        errors.push(`Le module ${module.title} ne peut pas dépasser ${module.maxCredits} crédits.`);
      }
    });
    
    if (this.totalCredits > 15) {
      errors.push('Le total des crédits ne peut pas dépasser 15.');
    }
    
    if (errors.length > 0) {
      alert('Erreurs de validation:\n' + errors.join('\n'));
      return;
    }
    
    alert('Plan d\'études validé avec succès!');
  }

  getProgressStyle(credits: number, max: number): any {
    const percentage = Math.min((credits / max) * 100, 100);
    return {
      'width': `${percentage}%`,
      'background-color': percentage >= 100 ? '#4caf50' : 
                          credits >= this.modules.find(m => m.maxCredits === max)?.requiredCredits! ? '#2196f3' : '#ff9800'
    };
  }
}