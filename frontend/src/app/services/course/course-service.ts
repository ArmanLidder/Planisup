import { Injectable } from '@angular/core';
import { ApiService } from '../api/api-service';
import { ExtendedInfoCourse } from '@common/program';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CourseService {
  constructor(private apiService: ApiService) {}

  public getAllCourses(): Observable<ExtendedInfoCourse[]> {
    return this.apiService.getAllCourses();
  }

  public getSpecificCourse(value: string): Observable<ExtendedInfoCourse[]> {
    return this.apiService.getSpecificCourse(value);
  }
}
