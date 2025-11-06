import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

export interface GsupDialogData {
  title?: string;
  message?: string;
  details?: string | string[];
  firstButton?: string;
  secondButton?: string;
  hideCancel?: boolean;
  confirmColor?: 'primary' | 'accent' | 'warn';
  icon?: string;
}

@Component({
  selector: 'app-gsup-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './gsup-dialog.html',
  styleUrl: './gsup-dialog.scss',
})
export class GsupDialog {
  detailLines: string[] = [];

  constructor(
    public dialogRef: MatDialogRef<GsupDialog>,
    @Inject(MAT_DIALOG_DATA) public data: GsupDialogData
  ) {
    this.detailLines = this.normalizeDetails(data?.details);
  }

  get dialogTitle(): string {
    return this.data?.title || 'Confirmation';
  }

  get dialogIcon(): string {
    return this.data?.icon || 'warning';
  }

  get confirmColor(): 'primary' | 'accent' | 'warn' {
    return this.data?.confirmColor || 'warn';
  }

  get confirmLabel(): string {
    return this.data?.secondButton || 'Confirmer';
  }

  get cancelLabel(): string {
    return this.data?.firstButton || 'Annuler';
  }

  get showCancel(): boolean {
    return !(this.data?.hideCancel ?? false);
  }

  onConfirmClick(): void {
    this.dialogRef.close(true);
  }

  onCancelClick(): void {
    this.dialogRef.close(false);
  }

  private normalizeDetails(details?: string | string[]): string[] {
    if (!details) return [];
    if (Array.isArray(details)) {
      return details.map((line) => line?.trim()).filter((line) => !!line);
    }
    return details
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  }
}
