import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, User, UserRole } from '@common/user';
import { ReducedProgram, Program, Course, ExtendedInfoCourse } from '@common/program';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    //Pour securite avec tokens (?) dans le futur....
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }

  postLogin(loginRequest: LoginRequest): Observable<{success: boolean, user?: User, message?: string}> {
    return this.http.post<{success: boolean, user?: User, message?: string}>(
      `${environment.serverUrl}/auth/login`,
      loginRequest,
      { headers: this.getAuthHeaders() }
    );
  }

  getDepartements(type: string): Observable<string[]> {
    return this.http.get<string[]>(`${environment.serverUrl}/program/query/${type}`);
  }

  getPrograms(type: string, departement: string): Observable<ReducedProgram[]> {
    return this.http.get<ReducedProgram[]>(
      `${environment.serverUrl}/program/query/${type}/${departement}`
    );
  }

  getProgram(id: string): Observable<Program> {
    return this.http.get<Program>(`${environment.serverUrl}/program/${id}`);
  }

  getAllUsers(): Observable<{ success: boolean; users: User[]; count: number }> {
    return this.http.get<{ success: boolean; users: User[]; count: number }>(
      `${environment.serverUrl}/users`,
      { headers: this.getAuthHeaders() }
    );
  }

  getUserById(userId: string): Observable<{ success: boolean; user: User }> {
    return this.http.get<{ success: boolean; user: User }>(
      `${environment.serverUrl}/users/${userId}`,
      { headers: this.getAuthHeaders() }
    );
  }

  updateUserRole(
    userId: string,
    newRole: UserRole
  ): Observable<{ success: boolean; user: User; message: string }> {
    return this.http.patch<{ success: boolean; user: User; message: string }>(
      `${environment.serverUrl}/users/${userId}/role`,
      { newRole },
      { headers: this.getAuthHeaders() }
    );
  }

  getAllCourses(): Observable<ExtendedInfoCourse[]> {
    return this.http.get<ExtendedInfoCourse[]>(`${environment.serverUrl}/course/allCourses`);
  }

  getCourses(): Observable<Course[]> {
    return this.http.get<Course[]>(`${environment.serverUrl}/course/courses`);
  }

  getSpecificCourse(value: string): Observable<ExtendedInfoCourse[]> {
    return this.http.get<ExtendedInfoCourse[]>(`${environment.serverUrl}/course/course`, {
      params: { value },
    });
  }

  submitStudyPlan(studyPlan: any): Observable<any> {
    return this.http.post<any>(`${environment.serverUrl}/study-plan/student`, studyPlan);
  }

  cancelStudyPlan(id: string): Observable<any> {
    return this.http.delete<any>(`${environment.serverUrl}/study-plan/cancel/${id}`);
  }

  approveStudyPlan(id: string): Observable<any> {
    return this.http.patch<any>(`${environment.serverUrl}/study-plan/approuved/${id}`, {});
  }

  refuseStudyPlan(id: string): Observable<any> {
    return this.http.patch<any>(`${environment.serverUrl}/study-plan/refuse/${id}`, {});
  }

  getStudyPlan(id: string): Observable<any> {
    return this.http.get<any>(`${environment.serverUrl}/study-plan/${id}`);
  }

  deleteUser(
    userId: string
  ): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${environment.serverUrl}/users/${userId}`,
      { headers: this.getAuthHeaders() }
    );
  }
}
