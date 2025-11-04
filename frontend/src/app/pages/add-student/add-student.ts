import { Component, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { BehaviorSubject } from 'rxjs';
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
  form!: FormGroup;
  programs: ReducedProgram[] = [];
  directors: User[] = [];
  coDirectors: User[] = [];
  submitting = false;

  protected readonly allStudents = new BehaviorSubject<Map<string, string>>(new Map());
  allStudents$ = this.allStudents.asObservable();

  private allProgramsOriginal = new Map<string, string>();
  selectedProgramId: string | null = null;

  constructor(
    private formService: AddStudentFormService,
    private api: ApiService,
    private readonly route: ActivatedRoute
  ) {
    this.api.getAllPrograms().subscribe((reducedPrograms: ReducedProgram[]) => {
      this.programs = reducedPrograms;
    });

    this.api.getStudentsWithUnsubmittedPlans().subscribe((respobnse) => {
      console.log(respobnse);
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

  onSearch(event: string): void {
    /*const search = removeAccents(event.trim().toLowerCase());
    if (!search) {
      this.allPrograms.next(new Map(this.allProgramsOriginal));
      return;
    }
    const filteredPrograms = new Map(
      [...this.allProgramsOriginal].filter(([_, program]) =>
        removeAccents(program.toLowerCase()).includes(search)
      )
    );
    this.allPrograms.next(filteredPrograms);*/
  }

  selectProgram(programId: string): void {
    /*this.isCreatingNew = false;
    const switchingProgram = this.selectedProgramId && this.selectedProgramId !== programId;

    if (switchingProgram && this.isEditing && this.hasUnsavedChanges()) {
      this.confirmExit().then((ok) => {
        if (!ok) return;
        this.exitEdit();
        this.finishSelectProgram(programId);
      });
      return;
    }
    this.finishSelectProgram(programId);*/
  }
}
