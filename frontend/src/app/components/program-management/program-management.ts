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

  protected readonly allPrograms = new BehaviorSubject<Map<string, string>>(new Map());
  allPrograms$ = this.allPrograms.asObservable();

  private allProgramsOriginal = new Map<string, string>();

  selectedProgramId: string | null = null;
  isEditing = false;
  isPreviewing = false;
  isSaving = false;

  private originalProgram: Program | null = null;
  protected editingDraft: Program | null = null;
  protected isCreatingNew = false;

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

    const current = this.programService.program;
    if (current?._id) {
      this.selectedProgramId = current._id;
      this.originalProgram = current;
    }
    this.programService.adminEditing$.subscribe((edit) => {
      this.isEditing = !!edit;
      if (edit) {
        this.isPreviewing = false;
        if (!this.editingDraft) {
          const base = this.originalProgram || this.programService.program;
          if (base) this.editingDraft = JSON.parse(JSON.stringify(base));
        }
      }
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
    this.isCreatingNew = false;
    const switchingProgram = this.selectedProgramId && this.selectedProgramId !== programId;

    if (switchingProgram && this.isEditing && this.hasUnsavedChanges()) {
      this.confirmExit().then((ok) => {
        if (!ok) return;
        this.exitEdit();
        this.finishSelectProgram(programId);
      });
      return;
    }
    this.finishSelectProgram(programId);
  }

    private finishSelectProgram(programId: string): void {
    if (this.isEditing && !this.hasUnsavedChanges()) {
      this.isEditing = false;
      this.isPreviewing = false;
      this.programService.setAdminEditing(false);
      if (this.originalProgram) this.editingDraft = JSON.parse(JSON.stringify(this.originalProgram));
      else this.editingDraft = null;
    }
    this.selectedProgramId = programId;

    this.isPreviewing = false;
    this.apiService.getProgram(programId).subscribe({
      next: (program: Program) => {
        this.programService.program = program; // view mode
        this.originalProgram = program;
        this.editingDraft = JSON.parse(JSON.stringify(program));
      },
    });
  }

  onProgramChange(updated: Program) {
    this.editingDraft = JSON.parse(JSON.stringify(updated));
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
    if (this.isEditing) {
      if (this.hasUnsavedChanges()) {
        // Ask before discarding current edits
        this.confirmExit().then((ok) => {
          if (!ok) return;
          this.exitEdit();
          this.startNewDraft();
        });
        return;
      }
      this.exitEdit();
    }
    this.startNewDraft();
  }

  private startNewDraft(): void {
    const draftProgram: Program = {
      _id: undefined,
      degree: '',
      option: '',
      type: '',
      department: '',
      description: '',
      coordonatorId: null,
      modules: [],
    } as Program;
    this.selectedProgramId = 'new-program';
    this.originalProgram = null;
    this.editingDraft = JSON.parse(JSON.stringify(draftProgram));
    this.isCreatingNew = true;
    this.enterEditMode();
  }

  togglePreview(): void {
    if (!this.isEditing) return;
    this.programEditorComponent?.flushModulesToProgram();
    this.isPreviewing = !this.isPreviewing;
  }

  async saveProgram(): Promise<void> {
    const ready = await this.ensureNoUnappliedChanges();
    if (!ready) return;
    this.programEditorComponent?.flushModulesToProgram();
    const program = this.editingDraft;
    if (!program) return;
    if (this.isPreviewing) this.isPreviewing = false;
    const wasDraft = this.isCreatingNew;
    const confirmed = await this.confirmSave(
      wasDraft
        ? 'Voulez-vous créer ce nouveau programme ?'
        : 'Voulez-vous enregistrer les modifications apportées à ce programme ?',
      wasDraft ? 'Créer' : 'Enregistrer'
    );
    if (!confirmed) return;

    this.isSaving = true;
    this.programService.saveProgram(program).subscribe({
      next: async (saved) => {
        this.handleProgramSaved(saved, wasDraft);
        this.isSaving = false;
        await this.showDialogMessage({
          title: 'Succès',
          message: wasDraft
            ? 'Programme créé avec succès.'
            : 'Modifications enregistrées avec succès.',
          icon: 'check_circle',
          confirmColor: 'primary',
        });
      },
      error: async (error) => {
        console.error('Erreur lors de la sauvegarde du programme:', error);
        const baseMessage = error?.error?.message || 'Une erreur est survenue lors de la sauvegarde.';
        const details = this.formatValidationDetails(error?.error?.details);
        this.isSaving = false;
        await this.showDialogMessage({
          title: 'Erreur',
          message: baseMessage,
          details: details ?? undefined,
          icon: 'error',
          confirmColor: 'warn',
        });
      },

    });
  }

  private async ensureNoUnappliedChanges(): Promise<boolean> {
    const editor = this.programEditorComponent;
    if (!editor) return true;
    if (!editor.hasPendingEdits()) return true;

    const proceed = await this.confirmPendingEdits();
    if (!proceed) return false;

    const applied = editor.applyPendingEdits();
    return applied;
  }

  private async confirmPendingEdits(): Promise<boolean> {
    const { GsupDialog } = await import('@app/components/gsup-dialog/gsup-dialog');
    const dialogRef = this.dialog.open(GsupDialog, {
      data: {
        message: "Certaines modifications n'ont pas été appliquées. Voulez-vous les appliquer avant d'enregistrer ?",
        firstButton: 'Retour',
        secondButton: 'Appliquer',
      },
    });
    const result = await firstValueFrom(dialogRef.afterClosed());
    return !!result;
  }

  private enterEditMode(): void {
    this.isEditing = true;
    this.isPreviewing = false;
    this.programService.setAdminEditing(true);
  }

  async requestExit(): Promise<void> {
    const confirmed = await this.confirmExit();
    if (!confirmed) return;
    this.exitEdit();
  }

  exitEdit(): void {
    if (this.isCreatingNew) {
      this.selectedProgramId = null;
      this.originalProgram = null;
      this.editingDraft = null;
      this.isCreatingNew = false;
    }
    this.isEditing = false;
    this.isPreviewing = false;
    this.programService.setAdminEditing(false);
    if (this.originalProgram) {
      this.editingDraft = JSON.parse(JSON.stringify(this.originalProgram));
    }
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

  private handleProgramSaved(saved: Program, wasDraft: boolean): void {
    if (!saved._id) {
      return;
    }
    this.updateProgramLabel(saved);
    this.syncReducedPrograms(saved, undefined);
    this.isEditing = false;
    this.isPreviewing = false;
    this.programService.setAdminEditing(false);
    this.programService.program = saved;
    this.selectedProgramId = saved._id!;
    this.originalProgram = saved;
    this.editingDraft = JSON.parse(JSON.stringify(saved));
    this.isCreatingNew = false;
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
      coordonatorId: program.coordonatorId ?? null,
    };
  }

  private buildProgramLabel(program: Program): string {
    return program.option
      ? program.degree
        ? `${program.degree} - ${program.option}`
        : program.option
      : program.degree || '';
  }

  protected hasUnsavedChanges(): boolean {
    if (!this.isEditing) return false;
    if (this.editingDraft == null && this.originalProgram == null) return false;
    // New draft considered dirty if editingDraft exists and differs from a blank
    if (!this.originalProgram && this.editingDraft) {
      try {
        const ed = this.editingDraft as Program;
        const normalized = JSON.stringify({
          degree: ed.degree || '',
          option: ed.option || '',
          type: ed.type || '',
          department: ed.department || '',
          description: ed.description || '',
          coordonatorId: ed.coordonatorId ?? null,
          modules: ed.modules || [],
        });
        const blank = JSON.stringify({
          degree: '',
          option: '',
          type: '',
          department: '',
          description: '',
          coordonatorId: null,
          modules: [],
        });
        return normalized !== blank;
      } catch {
        return true;
      }
    }
    if (!this.originalProgram || !this.editingDraft) return false;
    try {
      return this.isDraftDifferentThanOriginal();
    } catch {
      return true;
    }
  }

  protected isDraftDifferentThanOriginal(): boolean {
    return JSON.stringify(this.originalProgram) !== JSON.stringify(this.editingDraft);
  }

  async confirmDeleteProgram(): Promise<void> {
    if (!this.selectedProgramId) return;

    const { GsupDialog } = await import('@app/components/gsup-dialog/gsup-dialog');
    const dialogRef = this.dialog.open(GsupDialog, {
      data: {
        message: 'Supprimer ce programme ? Cette action est irréversible.',
        firstButton: 'Annuler',
        secondButton: 'Supprimer',
      },
    });
    const result = await firstValueFrom(dialogRef.afterClosed());
    if (!result) return;

    this.apiService.deleteProgram(this.selectedProgramId).subscribe({
      next: (res) => {
        alert('Programme supprimé avec succès.');
        this.selectedProgramId = null;
        this.originalProgram = null;
        this.editingDraft = null;
        this.isEditing = false;
        this.isPreviewing = false;
        this.programService.setAdminEditing(false);

        this.reloadProgramsList();
      },

      error: (err) => {
        console.error('Erreur lors de la suppression du programme:', err);
        alert('Échec de la suppression du programme.');
      },
    });
  }

  private reloadProgramsList(): void {
    this.apiService.getAllPrograms().subscribe({
      next: (programs) => {
        const map = this.populateProgramMap(programs);
        this.programsSubject.next(map);

        const allPrograms = Array.from(map.values()).flat();
        this.populateOptionsList(allPrograms);
      },
      error: (err) => {
        console.error('Erreur lors du rechargement des programmes:', err);
        alert('Impossible de recharger la liste des programmes.');
      },
    });
  }

  private formatValidationDetails(details: unknown): string[] | null {
    if (!details) return null;

    if (typeof details === 'string') {
      const lines = details
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
      return lines.length > 0 ? lines : null;
    }

    if (Array.isArray(details)) {
      const items = details
        .map((entry) => String(entry).trim())
        .filter((line) => line.length > 0);
      return items.length > 0 ? items : null;
    }

    if (typeof details === 'object') {
      const entries = Object.entries(details as Record<string, unknown>);
      if (entries.length === 0) return null;
      const lines = entries.map(([path, message]) => {
        const readablePath = this.humanizeErrorPath(path);
        const textValue =
          typeof message === 'string'
            ? message
            : (message as any)?.message || JSON.stringify(message);
        return `${readablePath}: ${textValue}`;
      });
      return lines;
    }

    return [String(details)];
  }

  private humanizeErrorPath(rawPath: string): string {
    if (!rawPath) return 'Champ';
    const dictionary: Record<string, string> = {
      modules: 'Module',
      subModules: 'Sous-module',
      courses: 'Section',
      rules: 'Règles',
      title: 'Titre',
      description: 'Description',
      credits: 'Crédits',
    };

    return rawPath
      .split('.')
      .map((segment) => {
        const match = /^([a-zA-Z_]+)(\[(\d+)\])?$/.exec(segment);
        if (!match) return segment;
        const [, name, , index] = match;
        const label = dictionary[name] || name;
        if (index !== undefined) {
          const numericIndex = Number(index);
          return Number.isNaN(numericIndex) ? label : `${label} ${numericIndex + 1}`;
        }
        return label;
      })
      .join(' > ');
  }

  private async showDialogMessage(options: {
    title: string;
    message: string;
    details?: string[];
    icon?: string;
    confirmColor?: 'primary' | 'accent' | 'warn';
  }): Promise<void> {
    const { GsupDialog } = await import('@app/components/gsup-dialog/gsup-dialog');
    this.dialog.open(GsupDialog, {
      data: {
        title: options.title,
        message: options.message,
        details: options.details,
        icon: options.icon,
        confirmColor: options.confirmColor || 'primary',
        hideCancel: true,
        secondButton: 'Fermer',
      },
    });
  }
}
