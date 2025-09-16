import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { AuthentificationService } from '../../services/authentification/authentification-service';
import { UserRole, LoginRequest, User } from '../../../../../common/user';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatIconModule,
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  userRoles = Object.values(UserRole);

  constructor(
    private fb: FormBuilder,
    private authentificationService: AuthentificationService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      usercode: ['', [Validators.required, Validators.minLength(3)]],
      firstName: ['', [Validators.required, Validators.minLength(3)]],
      lastName: ['', [Validators.required, Validators.minLength(3)]],
      role: ['', Validators.required],
    });
  }

  getRoleDisplayName(role: UserRole): string {
    const roleNames: { [key in UserRole]: string } = {
      [UserRole.Etudiant]: 'Étudiant',
      [UserRole.Directeur]: 'Directeur',
      [UserRole.Agent]: 'Agent administratif',
      [UserRole.Coordonnateur]: 'Coordonnateur (CPES)',
      [UserRole.Administrateur]: 'Administrateur',
    };
    return roleNames[role];
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const formValue = this.loginForm.value;
      const loginRequest: LoginRequest = {
        usercode: formValue.usercode,
        firstName: formValue.firstName,
        lastName: formValue.lastName, // Map lastName to lowercase lastname
        role: formValue.role,
      };

      this.authentificationService.login(loginRequest).subscribe({
        next: (response: User) => {
          this.isLoading = false;
          if (response._id) {
            this.router.navigate(['/accueil']);
          } else {
            this.errorMessage = 'Erreur de connexion';
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.message || 'Erreur de connexion. Veuillez réessayer.';
          console.error('Login error:', error);
        },
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach((field) => {
      const control = this.loginForm.get(field);
      control?.markAsTouched({ onlySelf: true });
    });
  }

  getFieldError(fieldName: string): string {
    const control = this.loginForm.get(fieldName);
    if (control?.errors && control.touched) {
      if (control.errors['required']) {
        const fieldLabels: { [key: string]: string } = {
          usercode: 'Code utilisateur',
          firstName: 'Prénom',
          lastName: 'Nom de famille',
          role: 'Rôle',
        };
        return `${fieldLabels[fieldName] || fieldName} requis`;
      }
      if (control.errors['minlength']) {
        const requiredLength = control.errors['minlength'].requiredLength;
        return `Minimum ${requiredLength} caractères requis`;
      }
    }
    return '';
  }

  bypassLogin(): void {
    this.authentificationService.bypassLogin();
    this.router.navigate(['/accueil']);
  }
}
