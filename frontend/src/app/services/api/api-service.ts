import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, User } from '@common/user';
import { ReducedProgram, Program } from '@common/program';

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
}
