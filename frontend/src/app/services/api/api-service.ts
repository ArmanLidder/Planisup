import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, User, UserRole } from '@common/user';
import { ReducedProgram, Program, Course, ExtendedInfoCourse } from '@common/program';
import { Message } from '@common/chat';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  constructor(private readonly http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    //Pour securite avec tokens (?) dans le futur....
    return new HttpHeaders({
      'Content-Type': 'application/json',
    });
  }

  postLogin(
    loginRequest: LoginRequest
  ): Observable<{ success: boolean; user?: User; message?: string }> {
    return this.http.post<{ success: boolean; user?: User; message?: string }>(
      `${environment.serverUrl}/auth/login`,
      loginRequest,
      { headers: this.getAuthHeaders() }
    );
  }

  getDepartements(type: string): Observable<string[]> {
    return this.http.get<string[]>(`${environment.serverUrl}/program/query/${type}`);
  }

  getAllDepartements(): Observable<string[]> {
    return this.http.get<string[]>(`${environment.serverUrl}/program/departements`);
  }

  getPrograms(type: string, departement: string): Observable<ReducedProgram[]> {
    return this.http.get<ReducedProgram[]>(
      `${environment.serverUrl}/program/query/${type}/${departement}`
    );
  }

  getAllPrograms(): Observable<ReducedProgram[]> {
    return this.http.get<ReducedProgram[]>(
      `${environment.serverUrl}/program`
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

  getDirectorsAndCoordinators(): Observable<{ directors: User[]; coordinators: User[] }> {
    return this.http.get<{ directors: User[]; coordinators: User[] }>(
      `${environment.serverUrl}/users/employees/directors-coordinators`,
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
    newRole: UserRole,
    departement?: string,
  ): Observable<{ success: boolean; user: User; message: string }> {
    return this.http.patch<{ success: boolean; user: User; message: string }>(
      `${environment.serverUrl}/users/${userId}/role`,
      { newRole, departement },
      { headers: this.getAuthHeaders() }
    );
  }

  getAllCourses(): Observable<ExtendedInfoCourse[]> {
    return this.http.get<ExtendedInfoCourse[]>(`${environment.serverUrl}/course/allCourses`);
  }

  getCourses(): Observable<Course[]> {
    return this.http.get<Course[]>(`${environment.serverUrl}/course/courses`);
  }

  submitStudyPlan(studyPlan: any): Observable<any> {
    return this.http.post<any>(`${environment.serverUrl}/study-plan/student`, studyPlan);
  }

  cancelStudyPlan(id: string): Observable<any> {
    return this.http.delete<any>(`${environment.serverUrl}/study-plan/cancel/${id}`);
  }

  approveStudyPlan(id: string, employeeId: string): Observable<any> {
    return this.http.patch<any>(`${environment.serverUrl}/study-plan/approuved/${id}/${employeeId}`, {});
  }

  refuseStudyPlan(id: string): Observable<any> {
    return this.http.patch<any>(`${environment.serverUrl}/study-plan/refuse/${id}`, {});
  }

  getStudyPlan(id: string): Observable<any> {
    return this.http.get<any>(`${environment.serverUrl}/study-plan/${id}`);
  }

  // This will get study plan in progress that are linked to the user role
  getStudyPlans(id: string): Observable<any[]> {
    return this.http.get<any[]>(`${environment.serverUrl}/study-plan/assigned/${id}`);
  }

  getArchivedStudyPlans(id: string): Observable<any[]> {
    return this.http.get<any[]>(`${environment.serverUrl}/study-plan/archive/${id}`);
  }

  getChat(chatId: string): Observable<any> {
    return this.http.get<any>(`${environment.serverUrl}/chat/${chatId}`);
  }

  sendMessage(studyPlanId: string, message: Message): Observable<any> {
    return this.http.post<any>(`${environment.serverUrl}/chat/${studyPlanId}`, message);
  }

  deleteUser(userId: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${environment.serverUrl}/users/${userId}`,
      { headers: this.getAuthHeaders() }
    );
  }
}
