import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudyPlan } from '@app/pages/study-plan/study-plan';
import { BehaviorSubject } from 'rxjs';
import { Program, ReducedProgram } from '@common/program';
import { ApiService } from '@app/services/api/api-service';
import { ProgramService } from '@app/services/program/program-service';
import { MatInputModule } from '@angular/material/input';
import { ProgramEditor } from '@app/components/program-editor/program-editor';
import { ActivatedRoute, Router } from '@angular/router';
import removeAccents from 'remove-accents';

@Component({
  selector: 'app-program-management',
  standalone: true,
  imports: [StudyPlan, CommonModule, MatInputModule, ProgramEditor],
  templateUrl: './program-management.html',
  styleUrl: './program-management.scss',
})
export class ProgramManagement implements OnInit {
  private readonly programsSubject = new BehaviorSubject<Map<string, ReducedProgram[]>>(new Map());
  programs$ = this.programsSubject.asObservable();

  protected readonly allPrograms = new BehaviorSubject<Map<string, string>>(new Map());
  allPrograms$ = this.allPrograms.asObservable();

  private allProgramsOriginal = new Map<string, string>();
  selectedProgramId: string | null = null;
  isEditing = false;

  constructor(
    private readonly apiService: ApiService,
    private readonly activatedRoute: ActivatedRoute,
    private readonly router: Router,
    protected programService: ProgramService
  ) {}

  ngOnInit(): void {
    const programs = this.activatedRoute.snapshot.data['programs'];
    const map = this.populateProgramMap(programs);
    this.programsSubject.next(map);
    const allPrograms = Array.from(map.values()).flat();
    this.populateOptionsList(allPrograms);

    // Toggle edit mode via query param (?edit=1)
    this.activatedRoute.queryParams.subscribe((qp) => {
      this.isEditing = qp['edit'] === '1' || qp['edit'] === 'true';
    });
  }

  onSearch(event: string): void {
    const search = removeAccents(event.trim().toLowerCase());
    if (!search) {
      this.allPrograms.next(new Map(this.allProgramsOriginal));
      return;
    }
    const filteredPrograms = new Map(
      [...this.allProgramsOriginal].filter(([_, program]) =>
        removeAccents(program.toLowerCase()).includes(search)
      )
    );
    this.allPrograms.next(filteredPrograms);
  }

  selectProgram(programId: string): void {
    const switchingProgram = this.selectedProgramId && this.selectedProgramId !== programId;
    this.selectedProgramId = programId;
    if (switchingProgram && this.isEditing) {
      // Auto-exit edit mode when selecting another program
      this.exitEdit();
    }
    this.apiService.getProgram(this.selectedProgramId).subscribe({
      next: (program: Program) => {
        this.programService.program = program;
      },
    });
  }

  exitEdit(): void {
    // Remove edit flag from query params
    this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: { edit: null },
      queryParamsHandling: 'merge',
    });
  }

  onProgramChange(updated: Program) {
    this.programService.program = updated;
    // Update left list label to reflect metadata changes
    this.updateProgramLabel(updated);
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
      const name = program.option
        ? program.degree
          ? `${program.degree} - ${program.option}`
          : program.option
        : program.degree ?? '';
      optionsSet.set(program._id!, name);
    });

    this.allProgramsOriginal = new Map(optionsSet);
    this.allPrograms.next(optionsSet);
  }

  private updateProgramLabel(program: Program): void {
    if (!this.selectedProgramId) return;
    const name = program.option
      ? program.degree
        ? `${program.degree} - ${program.option}`
        : program.option
      : program.degree || '';
    if (!name) return;
    const updated = new Map(this.allProgramsOriginal);
    updated.set(this.selectedProgramId, name);
    this.allProgramsOriginal = updated;
    this.allPrograms.next(new Map(updated));
  }
}
