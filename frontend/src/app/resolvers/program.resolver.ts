import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
import { Observable } from 'rxjs';
import { ReducedProgram } from '@common/program';
import { ApiService } from '@app/services/api/api-service';

@Injectable({
  providedIn: 'root',
})
export class ProgramResolver implements Resolve<ReducedProgram[]> {
  constructor(private readonly apiService: ApiService) {}

  resolve(): Observable<ReducedProgram[]> {
    return this.apiService.getAllPrograms();
  }
}
