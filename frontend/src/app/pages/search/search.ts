import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { CourseService } from '@app/services/course/course-service';
import { ExtendedInfoCourse } from '@common/program';
import { MatInputModule } from '@angular/material/input';
import { MatOption, MatSelect } from '@angular/material/select';
import { MatHeaderCell, MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [
    CommonModule,
    MatInputModule,
    MatSelect,
    MatOption,
    MatHeaderCell,
    MatTableModule,
    MatIconModule,
  ],
  templateUrl: './search.html',
  styleUrl: './search.scss',
})
export class Search implements OnInit {
  public displayedColumns: string[] = [
    'sigle',
    'name',
    'department',
    'credits',
    'semesterList',
    'language',
  ];

  public allCourses: ExtendedInfoCourse[] = [];
  public filteredCourses: ExtendedInfoCourse[] = [];

  public selectedDepartment: string | null = null;
  public selectedTrimester: string | null = null;
  public selectedLanguage: string | null = null;

  public departments: string[] = [];
  public trimesters: string[] = [];
  public languages: string[] = [];

  private searchValue: string = '';

  constructor(protected readonly courseService: CourseService) {}

  public ngOnInit(): void {
    this.allCourses = this.formatTrimester(this.courseService.searchCourses);
    this.filteredCourses = [...this.allCourses];
    this.departments = [...new Set(this.allCourses.map((course) => course.department))];
    this.trimesters = [...new Set(this.allCourses.flatMap((course) => course.semesterList))];
    this.languages = [...new Set(this.allCourses.map((course) => course.language))];
  }

  public onSearch(value: string): void {
    this.searchValue = value.toLowerCase().trim();
    this.filterBySelectedValue();
  }

  public filterBySelectedValue(): void {
    this.filteredCourses = this.allCourses.filter((course) => {
      const matchSearch =
        this.searchValue === '' ||
        course.sigle.toLowerCase().startsWith(this.searchValue) ||
        course.name.toLowerCase().startsWith(this.searchValue);

      const matchDepartment =
        !this.selectedDepartment || course.department === this.selectedDepartment;

      const matchTrimester =
        !this.selectedTrimester || course.semesterList.includes(this.selectedTrimester);

      const matchLanguage = !this.selectedLanguage || course.language === this.selectedLanguage;

      return matchSearch && matchDepartment && matchTrimester && matchLanguage;
    });
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
