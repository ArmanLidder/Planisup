import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { AddStudentForm } from '@app/components/add-student-form/add-student-form';

@Component({
  selector: 'app-add-student',
  imports: [AddStudentForm, MatCardModule],
  standalone: true,
  templateUrl: './add-student.html',
  styleUrls: ['./add-student.scss']
})
export class AddStudentPage {

}
