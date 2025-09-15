import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ProgrammeService {
  private url = 'http://localhost:3000/programmes';

  constructor(private http: HttpClient) {}

  // Récupérer tout le JSON
  getJSON(): Observable<any> {
    return this.http.get(this.url);
  }

  // Récupérer un type (maitrise, dess, doctorat)
  getStudyLevel(level: string): Observable<any> {
    return this.http.get(`${this.url}/${level}`);
  }

  // Récupérer une discipline spécifique
  getStudyProgram(level: string, program: string): Observable<any> {
    return this.http.get(`${this.url}/${level}/${program}`);
  }

  // Récupérer un module (professionnelle, recherche, etc.)
  getStudyModule(level: string, program: string, module: string): Observable<any> {
    return this.http.get(`${this.url}/${level}/${program}/${module}`);
  }
}
