import { Component, OnInit } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AddStudentFormService } from '@app/services/add-student-form/add-student-form';
import { ApiService } from '@app/services/api/api-service';
import { User } from '@common/user';
import { Program } from '@common/program';
import { MatFormField, MatLabel } from "@angular/material/form-field";
import { MatCardContent, MatCardSubtitle, MatCardHeader, MatCard, MatCardTitle, MatCardActions } from "@angular/material/card";
import { MatSelect, MatOption } from "@angular/material/select";
import { ActivatedRoute } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-add-student-form',
  imports: [
    MatFormField,
    MatCardContent,
    MatCardSubtitle,
    MatCardHeader,
    MatCard,
    MatCardTitle,
    MatLabel,
    MatSelect,
    MatOption,
    MatCardActions,
    ReactiveFormsModule,
    FormsModule
  ],
  templateUrl: './add-student-form.html',
  styleUrls: ['./add-student-form.scss']
})
export class AddStudentForm {
  form!: FormGroup;
  programs: Program[] = [];
  directors: User[] = [];
  coDirectors: User[] = [];
  submitting = false;


  constructor(
    private formService: AddStudentFormService,
    private api: ApiService,
    private readonly activatedRoute: ActivatedRoute,
  ) {
    this.programs = this.activatedRoute.snapshot.data['programs'];
    this.directors = this.activatedRoute.snapshot.data['dirAndCoor'].directors;
    this.coDirectors = this.activatedRoute.snapshot.data['dirAndCoor'].coDirectors;
  }

  ngOnInit(): void {
    this.form = this.formService.buildForm();
    this.api.getDirectorsAndCoordinators().subscribe({
      next: (users) => {
        this.directors = users.directors;
        this.coDirectors = users.directors;
      },
      error: (err) => {
        console.error('Erreur lors de la récupération des directeurs et coordonnateurs', err);
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.submitting = true;

    this.api.createStudent(this.form.value).subscribe({
      next: (user) => {
        if (!user) {
          // Gérer ce cas avec l'apparition d'un snackbar erreur
          console.error("L'étudiant existe déjà")
          this.submitting = false;
          return;
        }
        this.form.reset();
        this.submitting = false;
        // Gérer ce cas positif avec l'apparition d'un snackbar
      },
      error: (err) => {
        console.error(err);
        this.submitting = false;
        // Gérer ce cas positif avec l'apparition d'un snackbar
      },
    });
  }
}
