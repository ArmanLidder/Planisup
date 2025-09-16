import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  constructor(private router: Router, private http: HttpClient) {}

  getDepartements(type: string): Observable<string[]> {
    return this.http.get<string[]>(`${environment.serverUrl}/program/${type}`);
  }

  getDegrees(type: string, departement: string): Observable<string[]> {
    return this.http.get<string[]>(`${environment.serverUrl}/program/${type}/${departement}`);
  }

  getOptions(type: string, departement: string, degree: string): Observable<string[]> {
    return this.http.get<string[]>(
      `${environment.serverUrl}/program/${type}/${departement}/${degree}`
    );
  }
}
