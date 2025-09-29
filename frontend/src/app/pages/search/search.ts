import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { GsupInput } from '@app/components/gsup-input/gsup-input';
import { CourseService } from '@app/services/course/course-service';
import { ExtendedInfoCourse } from '@common/program';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [GsupInput, CommonModule],
  templateUrl: './search.html',
  styleUrl: './search.scss',
})
export class Search implements OnInit {
  public loading: boolean = false;
  public allCourses: ExtendedInfoCourse[] = [];
  public filteredCourses: ExtendedInfoCourse[] = [];

  constructor(protected readonly courseService: CourseService) {}

  public ngOnInit(): void {
    this.loading = true;
    this.courseService.getAllCourses().subscribe((listCourses) => {
      this.allCourses = this.formatTrimester(listCourses);
      this.filteredCourses = [...listCourses];
      this.loading = false;
    });
  }

  public getSpecificCourse(value: string): void {
    const searchedValue = value.toLowerCase().trim();
    if (searchedValue === '') {
      this.filteredCourses = [...this.allCourses];
    } else {
      this.filteredCourses = this.allCourses.filter(
        (course) =>
          course.sigle.toLowerCase().includes(searchedValue) ||
          course.name.toLowerCase().includes(searchedValue) ||
          course.department.toLowerCase().includes(searchedValue) ||
          course.semesterList.some((semester) => semester.toLowerCase().includes(searchedValue)) ||
          course.language.toLowerCase().includes(searchedValue)
      );
    }
  }

  private formatTrimester(listCourses: ExtendedInfoCourse[]): ExtendedInfoCourse[] {
    return listCourses.map((course) => {
      const trimesters: string[] = [];
      if (course.semester['Automne'] === 'O') trimesters.push('Automne');
      if (course.semester['Hiver'] === 'O') trimesters.push('Hiver');
      if (course.semester['Été'] === 'O') trimesters.push('Été');

      if (trimesters.length === 0) {
        trimesters.push('Aucune session offerte');
      }

      return {
        ...course,
        semesterList: trimesters,
      };
    });
  }
}
