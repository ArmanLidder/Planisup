import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Program } from '@common/program';
import { ProgramModulesEditor } from '@app/components/program-modules-editor/program-modules-editor';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-program-editor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ProgramModulesEditor, MatIconModule],
  templateUrl: './program-editor.html',
  styleUrl: './program-editor.scss',
})
export class ProgramEditor implements OnChanges {
  @Input() program!: Program;
  @Input() isNew = false;
  @Output() programChange = new EventEmitter<Program>();

  @ViewChild(ProgramModulesEditor) private modulesEditor?: ProgramModulesEditor;

  form: FormGroup;
  allowedTypes: string[] = ['dess', 'maitrise', 'doctorat', 'dess,maitrise'];
  metadataEditing = false;
  private newModeInitialized = false;

  constructor(private readonly fb: FormBuilder) {
    this.form = this.fb.group({
      degree: ['', [Validators.required]],
      option: [''],
      type: ['', [Validators.required]],
      department: ['', [Validators.required]],
      description: [''],
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

  saveMetadata(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.value;
    const updated: Program = {
      ...this.program,
      degree: value.degree,
      option: value.option,
      type: value.type,
      department: value.department,
      description: value.description,
    } as Program;
    this.programChange.emit(updated);
    this.metadataEditing = false;
  }

  onModulesChange(mods: Program['modules']): void {
    const value = this.form.value;
    const updated: Program = {
      ...this.program,
      degree: value.degree,
      option: value.option,
      type: value.type,
      department: value.department,
      description: value.description,
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
      },
      { emitEvent: false }
    );
  }

  private enableCreationModeOnce(): void {
    if (this.newModeInitialized) return;
    this.metadataEditing = true;
    this.newModeInitialized = true;
  }
}
