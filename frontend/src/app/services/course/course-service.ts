import { Injectable } from '@angular/core';
import { ApiService } from '../api/api-service';
import { Course, ExtendedInfoCourse } from '@common/program';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CourseService {
  public courses: Course[] = [];

  constructor(private readonly apiService: ApiService) {}

  public getAllCourses(): Observable<ExtendedInfoCourse[]> {
    return this.apiService.getAllCourses();
  }

  public getCourses(): void {
    this.apiService.getCourses().subscribe((listCourses) => {
      this.courses = listCourses;
    });
  }
}
