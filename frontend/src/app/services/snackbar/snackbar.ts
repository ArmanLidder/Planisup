import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class SnackBar {
  constructor(private readonly snackBar: MatSnackBar) {}

  show(message: string, action: string = "Fermer"): void {
    this.snackBar.open(message, action, {
      duration: 5000,
      verticalPosition: 'bottom',
      horizontalPosition: 'center',
      panelClass: ['app-snackbar'],
    });
  }
}
