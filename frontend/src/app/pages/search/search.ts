import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { GsupInput } from '@app/components/gsup-input/gsup-input';
import { CourseService } from '@app/services/course/course-service';
import { ExtendedInfoCourse } from '@common/program';
import { debounceTime, Subject } from 'rxjs';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [GsupInput, CommonModule],
  templateUrl: './search.html',
  styleUrl: './search.scss',
})
export class Search implements OnInit {
  public courses: ExtendedInfoCourse[] = [];
  public loading: boolean = false;

  private search$ = new Subject<string>();

  constructor(private courseService: CourseService) {}

  public ngOnInit(): void {
    this.getAllCourses();
    this.getSpecificCourse();
  }

  public sendValue(value: string): void {
    this.search$.next(value);
  }

  private getAllCourses(): void {
    this.loading = true;
    this.courseService.getAllCourses().subscribe((listCourses) => {
      this.courses = listCourses;
      this.loading = false;
    });
  }

  private getSpecificCourse(): void {
    this.loading = true;
    this.search$.pipe(debounceTime(500)).subscribe((value) => {
      this.courseService.getSpecificCourse(value).subscribe({
        next: (listCourses) => {
          this.courses = listCourses;
          this.loading = false;
        },
      });
    });
  }
}
