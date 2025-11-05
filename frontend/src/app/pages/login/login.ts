import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { AuthentificationService } from '@app/services/authentification/authentification-service';
import { UserRole, LoginRequest, User } from '@common/user';
import { StudyPlanService } from '@app/services/study-plan/study-plan-service';
import { Loading } from '@app/components/loading/loading';
import { CourseService } from '@app/services/course/course-service';
import { ProgramService } from '@app/services/program/program-service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatIconModule,
    Loading,
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  isLoading$: typeof this.sPS.loading$;

  constructor(
    private readonly fb: FormBuilder,
    private readonly authentificationService: AuthentificationService,
    private readonly router: Router,
    private readonly sPS: StudyPlanService,
    private readonly coursesService: CourseService,
    private readonly pS: ProgramService,
  ) {
    this.loginForm = this.fb.group({
      usercode: ['', [Validators.required, Validators.minLength(3)]],
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
    });
    this.isLoading$ = this.sPS.loading$;
    this.coursesService.getAllCourses();
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const formValue = this.loginForm.value;
      const loginRequest: LoginRequest = {
        usercode: formValue.usercode.trim(),
        firstName: formValue.firstName.trim(),
        lastName: formValue.lastName.trim(),
      };

      this.authentificationService.login(loginRequest).subscribe({
        next: (response: any) => {
          this.isLoading = false;

          // Handle the new response format with success flag
          if (response.success && response.user) {
            const user = response.user;

            // Show role assignment message for new users
            if (user.role === UserRole.Employe) {
              console.log(
                "Connecté en tant qu'employé. Un administrateur peut vous assigner un rôle spécifique."
              );
            }

            console.log('Connecté en tant que', response);
            // Redirect based on role
            if (user.role === UserRole.Administrateur) {
              this.router.navigate(['/admin']);
            }
            // else if (user.role !== UserRole.Etudiant) {
            //   this.router.navigate(['/staff']);
            // }
            else {
              if (response.user.currentPlan) {
                this.sPS.loadStudyPlan(response.user.currentPlan, user.role === UserRole.Etudiant);
              } else if (!response.user.currentPlan && response.user.programId) {
                this.pS.loadProgram(response.user.programId);
              } else {
                this.router.navigate(['/accueil']);
              }
            }
          } else {
            this.errorMessage = response.message || 'Erreur de connexion';
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

  // Helper text for usercode field
  getUsercodeHint(): string {
    const usercodeValue = this.loginForm.get('usercode')?.value || '';
    if (usercodeValue.toLowerCase().startsWith('p')) {
      return 'Code employé détecté - rôle employé sera assigné';
    } else if (usercodeValue.length >= 3) {
      return 'Code étudiant détecté - rôle étudiant sera assigné';
    }
    return 'Entrez votre code utilisateur Polytechnique';
  }

  bypassLogin(): void {
    this.authentificationService.bypassLogin();
    this.router.navigate(['/admin']);
  }
}
