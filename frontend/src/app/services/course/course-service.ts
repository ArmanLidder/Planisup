import { Injectable } from '@angular/core';
import { ApiService } from '../api/api-service';
import { Course, ExtendedInfoCourse } from '@common/program';

@Injectable({
  providedIn: 'root',
})
export class CourseService {
  public courses: Course[] = [];
  public searchCourses: ExtendedInfoCourse[] = [];

  constructor(private readonly apiService: ApiService) {}

  public getAllCourses(): void {
    if (this.searchCourses.length === 0) {
      this.apiService.getAllCourses().subscribe((listCourses) => {
        this.searchCourses = listCourses;
      });
    }
  }

  public getCourses(): void {
    if (!this.courses) {
      this.apiService.getCourses().subscribe((listCourses) => {
        this.courses = listCourses;
      });
    }
  }
}
