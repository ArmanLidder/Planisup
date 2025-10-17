import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudyPlan } from '@app/pages/study-plan/study-plan';
import { BehaviorSubject } from 'rxjs';
import { Program, ReducedProgram } from '@common/program';
import { ApiService } from '@app/services/api/api-service';
import { ProgramService } from '@app/services/program/program-service';

@Component({
  selector: 'app-program-management',
  standalone: true,
  imports: [StudyPlan, CommonModule],
  templateUrl: './program-management.html',
  styleUrl: './program-management.scss',
})
export class ProgramManagement implements OnInit {
  private programsSubject = new BehaviorSubject<Map<string, ReducedProgram[]>>(new Map());
  programs$ = this.programsSubject.asObservable();
  private allPrograms = new BehaviorSubject<Map<string, string>>(new Map());
  allPrograms$ = this.allPrograms.asObservable();
  
  selectedProgramId: string | null = null;
  
  constructor(
    private apiService: ApiService,
    protected pS: ProgramService,
  ) {};

  async ngOnInit(): Promise<void> {
    await this.initialization();
  }

  private async initialization() {
    await this.getPrograms();
    const allPrograms = Array.from(this.programsSubject.getValue().values()).flat();
    this.populateOptionsList(allPrograms);
  }

  getPrograms(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.apiService.getAllPrograms().subscribe({
        next: (programs) => {
          const map = this.populateProgramMap(programs);
          this.programsSubject.next(map);
          resolve();
        },
        error: (err) => {
          console.error("Error fetching programs", err);
          reject(err);
        },
      });
    });
  }

  private populateProgramMap(programs: ReducedProgram[]): Map<string, ReducedProgram[]> {
    const map = new Map<string, ReducedProgram[]>();
    programs.forEach((program) => {
      if (!map.has(program.degree)) map.set(program.degree, [program]);
      else map.get(program.degree)?.push(program);
    });
    return map;
  }

  private populateOptionsList(programs: ReducedProgram[]): void {
    const optionsSet = new Map<string, string>();
    programs.forEach((program) => {
      if (program.option) {
        if (program.degree){
          optionsSet.set(program._id!, program.degree + " - " + program.option);
        }
        else{
          optionsSet.set(program._id!, program.option);
        }
      }
      else if (program.degree) { 
        optionsSet.set(program._id!, program.degree);
      }
      else{ console.warn("Program without option or degree:", program); }
    });
    this.allPrograms.next(optionsSet);
  }

  selectProgram(programId: string): void {
    this.selectedProgramId = programId;
    this.apiService.getProgram(this.selectedProgramId).subscribe({
      next: (program: Program) => {
        this.pS.program =  program;
      },
    });
  }
}

