import { Component, OnInit } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { AddStudentFormService } from '@app/services/add-student-form/add-student-form';
import { ApiService } from '@app/services/api/api-service';
import { ActivatedRoute } from '@angular/router';
import { Program, ReducedProgram } from '@common/program';
import { User } from '@common/user';

@Component({
  standalone: true,
  selector: 'app-add-student-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCardModule,
    MatButtonModule,
  ],
  templateUrl: './add-student-form.html',
  styleUrls: ['./add-student-form.scss'],
})
export class AddStudentForm implements OnInit {
  form!: FormGroup;
  programs: ReducedProgram[] = [];
  directors: User[] = [];
  coDirectors: User[] = [];
  submitting = false;

  constructor(
    private formService: AddStudentFormService,
    private api: ApiService,
    private readonly route: ActivatedRoute
  ) {
    this.api.getAllPrograms().subscribe((reducedPrograms: ReducedProgram[]) => {
      this.programs = reducedPrograms;
      console.log('Salam:', this.programs);
    });
    const dirAndCoor = this.route.snapshot.data['dirAndCoor'] || {};
    this.directors = dirAndCoor.directors || [];
    this.coDirectors = dirAndCoor.coDirectors || [];
  }

  ngOnInit(): void {
    this.form = this.formService.buildForm();

    this.api.getDirectorsAndCoordinators().subscribe({
      next: (users) => {
        this.directors = users.directors;
        this.coDirectors = users.directors;
      },
      error: (err) => console.error('Erreur chargement directeurs', err),
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.submitting = true;

    this.api.createStudent(this.form.value).subscribe({
      next: (user) => {
        if (!user) {
          console.error("L'étudiant existe déjà");
          this.submitting = false;
          return;
        }
        this.form.reset();
        this.submitting = false;
      },
      error: (err) => {
        console.error(err);
        this.submitting = false;
      },
    });
  }
}
