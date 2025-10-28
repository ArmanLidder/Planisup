import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudyPlan } from '@app/pages/study-plan/study-plan';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { Program, ReducedProgram } from '@common/program';
import { ApiService } from '@app/services/api/api-service';
import { ProgramService } from '@app/services/program/program-service';
import { MatInputModule } from '@angular/material/input';
import { ProgramEditor } from '@app/components/program-editor/program-editor';
import { ActivatedRoute, Router } from '@angular/router';
import removeAccents from 'remove-accents';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-program-management',
  standalone: true,
  imports: [StudyPlan, CommonModule, MatInputModule, ProgramEditor, MatButtonModule, MatDialogModule],
  templateUrl: './program-management.html',
  styleUrl: './program-management.scss',
})
export class ProgramManagement implements OnInit {
  private readonly programsSubject = new BehaviorSubject<Map<string, ReducedProgram[]>>(new Map());
  programs$ = this.programsSubject.asObservable();

  protected readonly allPrograms = new BehaviorSubject<Map<string, string>>(new Map());
  allPrograms$ = this.allPrograms.asObservable();

  private allProgramsOriginal = new Map<string, string>();
  private readonly draftPrograms = new Map<string, Program>();
  selectedProgramId: string | null = null;
  isEditing = false;
  isPreviewing = false;
  isSaving = false;

  @ViewChild(ProgramEditor) private programEditorComponent?: ProgramEditor;

  constructor(
    private readonly apiService: ApiService,
    private readonly activatedRoute: ActivatedRoute,
    private readonly router: Router,
    protected programService: ProgramService,
    private readonly dialog: MatDialog
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
    const isDraft = this.draftPrograms.has(programId);
    const switchingProgram = this.selectedProgramId && this.selectedProgramId !== programId;
    this.selectedProgramId = programId;
    this.isPreviewing = false;
    if (switchingProgram && this.isEditing && !isDraft) {
      // Auto-exit edit mode when selecting another program
      this.exitEdit();
    }
    const draftProgram = this.draftPrograms.get(programId);
    if (draftProgram) {
      this.programService.program = draftProgram;
      this.enterEditMode();
      return;
    }
    this.apiService.getProgram(this.selectedProgramId).subscribe({
      next: (program: Program) => {
        this.programService.program = program;
      },
    });
  }

  onProgramChange(updated: Program) {
    this.programService.program = updated;
    // Update left list label to reflect metadata changes
    this.updateProgramLabel(updated);
    if (this.selectedProgramId && this.draftPrograms.has(this.selectedProgramId)) {
      this.draftPrograms.set(this.selectedProgramId, updated);
    }
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
    const name = this.buildProgramLabel(program);
    if (!name) return;
    const updated = new Map(this.allProgramsOriginal);
    updated.set(this.selectedProgramId, name);
    this.allProgramsOriginal = updated;
    this.allPrograms.next(new Map(updated));
  }

  createProgram(): void {
    const tempId = `draft-${Date.now()}`;
    const draftProgram: Program = {
      _id: tempId,
      degree: '',
      option: '',
      type: '',
      department: '',
      description: '',
      modules: [],
    };
    this.draftPrograms.set(tempId, draftProgram);
    const updatedOptions = new Map(this.allProgramsOriginal);
    updatedOptions.set(tempId, 'Nouveau programme');
    this.allProgramsOriginal = updatedOptions;
    this.allPrograms.next(new Map(updatedOptions));
    this.selectedProgramId = tempId;
    this.programService.program = draftProgram;
    this.enterEditMode();
  }

  togglePreview(): void {
    if (!this.isEditing) return;
    this.programEditorComponent?.flushModulesToProgram();
    this.isPreviewing = !this.isPreviewing;
  }

  async saveProgram(): Promise<void> {
    this.programEditorComponent?.flushModulesToProgram();
    const program = this.programService.program;
    if (!program) return;
    if (this.isPreviewing) this.isPreviewing = false;
    const wasDraft = this.isDraftSelected;
    const draftId = wasDraft ? this.selectedProgramId : null;
    const confirmed = await this.confirmSave(
      wasDraft
        ? 'Voulez-vous créer ce nouveau programme ?'
        : 'Voulez-vous enregistrer les modifications apportées à ce programme ?',
      wasDraft ? 'Créer' : 'Enregistrer'
    );
    if (!confirmed) return;

    this.isSaving = true;
    this.programService.saveProgram(program).subscribe({
      next: (saved) => {
        this.handleProgramSaved(saved, wasDraft, draftId);
        this.isSaving = false;
      },
      error: (error) => {
        console.error('Erreur lors de la sauvegarde du programme:', error);
        this.isSaving = false;
      },
    });
  }

  private enterEditMode(): void {
    this.isEditing = true;
    this.isPreviewing = false;
    this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: { edit: '1' },
      queryParamsHandling: 'merge',
    });
  }

  get isDraftSelected(): boolean {
    return !!(this.selectedProgramId && this.draftPrograms.has(this.selectedProgramId));
  }

  async requestExit(): Promise<void> {
    const confirmed = await this.confirmExit();
    if (!confirmed) return;
    this.exitEdit();
  }

  exitEdit(): void {
    if (this.isDraftSelected && this.selectedProgramId) {
      const draftId = this.selectedProgramId;
      this.draftPrograms.delete(draftId);
      const updated = new Map(this.allProgramsOriginal);
      updated.delete(draftId);
      this.allProgramsOriginal = updated;
      this.allPrograms.next(new Map(updated));
      this.selectedProgramId = null;
      this.programService.program = null;
    }
    this.isEditing = false;
    this.isPreviewing = false;
    this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: { edit: null },
      queryParamsHandling: 'merge',
    });
  }

  private async confirmSave(message: string, confirmLabel: string): Promise<boolean> {
    const { GsupDialog } = await import('@app/components/gsup-dialog/gsup-dialog');
    const dialogRef = this.dialog.open(GsupDialog, {
      data: { message, firstButton: 'Annuler', secondButton: confirmLabel },
    });
    const result = await firstValueFrom(dialogRef.afterClosed());
    return !!result;
  }

  private async confirmExit(): Promise<boolean> {
    const { GsupDialog } = await import('@app/components/gsup-dialog/gsup-dialog');
    const dialogRef = this.dialog.open(GsupDialog, {
      data: {
        message: 'Quitter l’édition ? Les modifications non enregistrées seront perdues.',
        firstButton: 'Rester',
        secondButton: 'Quitter',
      },
    });
    const result = await firstValueFrom(dialogRef.afterClosed());
    return !!result;
  }

  private handleProgramSaved(saved: Program, wasDraft: boolean, draftId: string | null): void {
    if (!saved._id) {
      console.warn('Programme sauvegardé sans identifiant retourné.');
      return;
    }

    if (wasDraft && draftId) {
      this.draftPrograms.delete(draftId);
      const options = new Map(this.allProgramsOriginal);
      options.delete(draftId);
      options.set(saved._id, this.buildProgramLabel(saved));
      this.allProgramsOriginal = options;
      this.allPrograms.next(new Map(options));
      this.selectedProgramId = saved._id;
    } else {
      this.selectedProgramId = saved._id;
    }

    this.updateProgramLabel(saved);
    this.syncReducedPrograms(saved, wasDraft ? draftId ?? undefined : undefined);
    this.isEditing = false;
    this.isPreviewing = false;
    this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: { edit: null },
      queryParamsHandling: 'merge',
    });
  }

  private syncReducedPrograms(saved: Program, removedId?: string): void {
    const currentMap = new Map(this.programsSubject.getValue());

    for (const [degree, programs] of Array.from(currentMap.entries())) {
      const filtered = programs.filter((prog) => prog._id !== (removedId ?? saved._id));
      if (filtered.length === 0) currentMap.delete(degree);
      else if (filtered.length !== programs.length) currentMap.set(degree, filtered);
    }

    const reduced = this.toReducedProgram(saved);
    const existing = currentMap.get(saved.degree) ?? [];
    const cleaned = existing.filter((prog) => prog._id !== reduced._id);
    currentMap.set(saved.degree, [...cleaned, reduced]);
    this.programsSubject.next(currentMap);
  }

  private toReducedProgram(program: Program): ReducedProgram {
    const types = Array.isArray(program.type)
      ? program.type
      : program.type
      ? [program.type]
      : [];
    return {
      _id: program._id,
      degree: program.degree,
      option: program.option,
      type: types,
      department: program.department,
    };
  }

  private buildProgramLabel(program: Program): string {
    return program.option
      ? program.degree
        ? `${program.degree} - ${program.option}`
        : program.option
      : program.degree || '';
  }

}
