import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Program } from '@common/program';
import { ProgramModulesEditor } from '@app/components/program-modules-editor/program-modules-editor';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '@app/services/api/api-service';
import { User } from '@common/user';

@Component({
  selector: 'app-program-editor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ProgramModulesEditor, MatIconModule],
  templateUrl: './program-editor.html',
  styleUrl: './program-editor.scss',
})
export class ProgramEditor implements OnChanges, OnInit {
  @Input() program!: Program;
  @Input() isNew = false;
  @Output() programChange = new EventEmitter<Program>();

  @ViewChild(ProgramModulesEditor) private modulesEditor?: ProgramModulesEditor;

  form: FormGroup;
  allowedTypes: string[] = ['dess', 'maitrise', 'doctorat'];
  metadataEditing = false;
  private newModeInitialized = false;
  coordinators: User[] = [];

  constructor(private readonly fb: FormBuilder, private readonly apiService: ApiService) {
    this.form = this.fb.group({
      degree: ['', [Validators.required]],
      option: [''],
      type: ['', [Validators.required]],
      department: ['', [Validators.required]],
      description: [''],
      coordonatorId: [''],
    });
  }

  ngOnInit(): void {
    this.apiService.getDirectorsAndCoordinators().subscribe({
      next: (response) => {
        this.coordinators = response.coordinators;
      },
      error: (error) => {
        console.error('Failed to load coordinators for program editor:', error);
      },
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['program'] && this.program) {
      this.syncFormWithProgram();
    }
    if (changes['isNew']) {
      if (this.isNew) {
        this.enableCreationModeOnce();
      } else {
        this.newModeInitialized = false;
      }
    } else if (this.isNew) {
      this.enableCreationModeOnce();
    }
  }

  enterMetadataEdit(): void {
    this.metadataEditing = true;
    this.syncFormWithProgram();
  }

  flushModulesToProgram(): void {
    this.modulesEditor?.commitDrafts();
  }

  saveMetadata(): boolean {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return false;
    }
    const value = this.form.value;
    const coordonatorId = value.coordonatorId ? value.coordonatorId : null;
    const updated: Program = {
      ...this.program,
      degree: value.degree,
      option: value.option,
      type: value.type,
      department: value.department,
      description: value.description,
      coordonatorId,
    } as Program;
    this.programChange.emit(updated);
    this.metadataEditing = false;
    return true;
  }

  onModulesChange(mods: Program['modules']): void {
    const value = this.form.value;
    const coordonatorId = value.coordonatorId ? value.coordonatorId : null;
    const updated: Program = {
      ...this.program,
      degree: value.degree,
      option: value.option,
      type: value.type,
      department: value.department,
      description: value.description,
      coordonatorId,
      modules: mods,
    } as Program;
    this.programChange.emit(updated);
  }

  cancelMetadata(): void {
    this.syncFormWithProgram();
    this.metadataEditing = this.isNew ? true : false;
  }

  private syncFormWithProgram(): void {
    if (!this.program) return;
    this.form.reset(
      {
        degree: this.program.degree,
        option: this.program.option || '',
        type: this.program.type,
        department: this.program.department,
        description: this.program.description || '',
        coordonatorId: this.program.coordonatorId ?? '',
      },
      { emitEvent: false }
    );
  }

  private enableCreationModeOnce(): void {
    if (this.newModeInitialized) return;
    this.metadataEditing = true;
    this.newModeInitialized = true;
  }

  getCoordinatorName(id: string | null | undefined): string {
    if (!id) return 'Aucun coordonnateur';
    const coordinator = this.coordinators.find((user) => user._id === id);
    return coordinator ? `${coordinator.firstName} ${coordinator.lastName}` : id;
  }

  hasPendingEdits(): boolean {
    const metadataPending = this.metadataEditing && this.form.dirty;
    const modulesPending = this.modulesEditor?.hasPendingEdits() ?? false;
    return metadataPending || modulesPending;
  }

  applyPendingEdits(): boolean {
    if (this.metadataEditing && this.form.dirty) {
      const saved = this.saveMetadata();
      if (!saved) return false;
    }
    this.modulesEditor?.applyAllPendingEdits();
    return true;
  }
}

