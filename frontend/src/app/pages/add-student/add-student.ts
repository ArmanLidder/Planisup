import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { AddStudentFormService } from '@app/services/add-student-form/add-student-form';
import { ApiService } from '@app/services/api/api-service';
import { ActivatedRoute } from '@angular/router';
import { ReducedProgram } from '@common/program';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { User } from '@common/user';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import removeAccents from 'remove-accents';

@Component({
  selector: 'app-add-student',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCardModule,
    MatButtonModule,
  ],
  standalone: true,
  templateUrl: './add-student.html',
  styleUrls: ['./add-student.scss'],
})
export class AddStudentPage implements OnInit {
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  form!: FormGroup;
  programs: ReducedProgram[] = [];
  directors: User[] = [];
  coDirectors: User[] = [];
  students: User[] = [];
  studentsOriginal: User[] = [];
  isSubmitting = false;
  selectedStudentId: string | null = null;

  constructor(
    private formService: AddStudentFormService,
    private apiService: ApiService,
    private readonly activatedRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const dirAndCoor = this.activatedRoute.snapshot.data['dirAndCoor'] || {};
    this.directors = dirAndCoor.directors || [];
    this.coDirectors = dirAndCoor.coDirectors || [];
    this.form = this.formService.buildForm();
    this.updateStudentsList();
    this.getPrograms();
    this.getDirectorsAndCodirectors();
  }

  selectStudent(studentId: string): void {
    this.selectedStudentId = studentId;
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.isSubmitting = true;

    this.apiService.createStudent(this.form.value).subscribe({
      next: (user) => {
        if (!user) {
          console.error("L'étudiant existe déjà");
          this.isSubmitting = false;
          return;
        }
        this.form.reset();
        this.isSubmitting = false;
        this.selectedStudentId = null;
        this.searchInput.nativeElement.value = '';
        this.updateStudentsList();
      },
      error: (err) => {
        console.error(err);
        this.isSubmitting = false;
      },
    });
  }

  onSearch(event: string): void {
    const search = removeAccents(event.trim().toLowerCase());
    if (!search) {
      this.students = this.studentsOriginal;
      return;
    }

    this.students = this.studentsOriginal.filter((student) => {
      const firstName = student.firstName.toLowerCase() || '';
      const lastName = student.lastName.toLowerCase() || '';
      return removeAccents(firstName).includes(search) || removeAccents(lastName).includes(search);
    });

    const stillVisible = this.students.some((student) => student._id === this.selectedStudentId);
    if (!stillVisible) {
      this.selectedStudentId = null;
    }
  }

  onDelete(): void {
    if (this.selectedStudentId) {
      this.apiService.deleteUser(this.selectedStudentId).subscribe({
        next: (response) => {
          if (response.success) {
            this.selectedStudentId = null;
            this.searchInput.nativeElement.value = '';
            this.updateStudentsList();
          }
        },
        error: (err) => {
          console.error('Erreur suppression étudiant', err);
          this.selectedStudentId = null;
          this.searchInput.nativeElement.value = '';
          this.updateStudentsList();
        },
      });
    }
  }

  private updateStudentsList(): void {
    this.apiService.getStudentsWithUnsubmittedPlans().subscribe((students) => {
      this.students = students;
      this.studentsOriginal = students;
    });
  }

  private getPrograms(): void {
    this.apiService.getAllPrograms().subscribe((reducedPrograms: ReducedProgram[]) => {
      this.programs = reducedPrograms;
    });
  }

  private getDirectorsAndCodirectors(): void {
    this.apiService.getDirectorsAndCoordinators().subscribe({
      next: (users) => {
        this.directors = users.directors;
        this.coDirectors = users.directors;
      },
      error: (err) => console.error('Erreur chargement directeurs', err),
    });
  }
}
