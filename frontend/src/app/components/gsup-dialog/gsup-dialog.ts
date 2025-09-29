import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-gsup-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './gsup-dialog.html',
  styleUrl: './gsup-dialog.scss',
})
export class GsupDialog {
  constructor(
    public dialogRef: MatDialogRef<GsupDialog>,
    @Inject(MAT_DIALOG_DATA)
    public data: { message?: string; firstButton?: string; secondButton?: string }
  ) {}

  onConfirmClick(): void {
    this.dialogRef.close(true);
  }

  onCancelClick(): void {
    this.dialogRef.close(false);
  }
}
