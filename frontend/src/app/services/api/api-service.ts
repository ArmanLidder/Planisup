import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, User, UserRole } from '@common/user';
import { ReducedProgram, Program, Course } from '@common/program';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  constructor(private http: HttpClient) {}

  postLogin(login: LoginRequest, headers: HttpHeaders): Observable<User> {
    return this.http.post<User>(`${environment.serverUrl}/auth/login`, login, { headers });
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

  getAllUsers(
    headers: HttpHeaders
  ): Observable<{ success: boolean; users: User[]; count: number }> {
    return this.http.get<{ success: boolean; users: User[]; count: number }>(
      `${environment.serverUrl}/users`,
      { headers }
    );
  }

  getUserById(userId: string, headers: HttpHeaders): Observable<{ success: boolean; user: User }> {
    return this.http.get<{ success: boolean; user: User }>(
      `${environment.serverUrl}/users/${userId}`,
      { headers }
    );
  }

  updateUserRole(
    userId: string,
    newRole: UserRole,
    headers: HttpHeaders
  ): Observable<{ success: boolean; user: User; message: string }> {
    return this.http.patch<{ success: boolean; user: User; message: string }>(
      `${environment.serverUrl}/users/${userId}/role`,
      { newRole },
      { headers }
    );
  }

  getCourses(value: string): Observable<Course[]> {
    return this.http.get<Course[]>(`${environment.serverUrl}/course/search`, { params: { value } });
  }

  //Not a feature, but useful
  deleteUser(
    userId: string,
    headers: HttpHeaders
  ): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${environment.serverUrl}/users/${userId}`,
      { headers }
    );
  }
}
