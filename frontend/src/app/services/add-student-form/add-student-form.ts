import { Injectable } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class AddStudentFormService {
  constructor(private fb: FormBuilder) {}

  buildForm(): FormGroup {
    return this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      usercode: [
        '',
        [Validators.required, Validators.pattern(/^[a-zA-Z0-9]{3,16}$/)],
      ],
      programId: ['', Validators.required],
      directorId: ['', Validators.required],
      codirectorsIds: [[]],
    });
  }

  patchForm(form: FormGroup, student: any): void {
    if (!form || !student) return;
    form.patchValue({
      firstName: student.firstName,
      lastName: student.lastName,
      usercode: student.usercode,
      programId: student.programId,
      directorId: student.directorId,
      codirectorsIds: student.codirectorsIds || [],
    });
  }
}
