import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { AddStudentForm } from '@app/components/add-student-form/add-student-form';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-add-student',
  imports: [AddStudentForm, MatCardModule],
  standalone: true,
  templateUrl: './add-student.html',
  styleUrls: ['./add-student.scss'],
})
export class AddStudentPage {
  protected list = [];
  protected readonly allPrograms = new BehaviorSubject<Map<string, string>>(new Map());
  allPrograms$ = this.allPrograms.asObservable();

  private allProgramsOriginal = new Map<string, string>();
  selectedProgramId: string | null = null;
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
