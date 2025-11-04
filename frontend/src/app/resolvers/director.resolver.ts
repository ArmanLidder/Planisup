import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
import { Observable } from 'rxjs';
import { User } from '@common/user';
import { ApiService } from '@app/services/api/api-service';

@Injectable({
  providedIn: 'root',
})
export class DirectorResolvers implements Resolve<{ directors: User[]; coordinators: User[] }> {
  constructor(private readonly apiService: ApiService) {}

  resolve(): Observable<{ directors: User[]; coordinators: User[] }> {
    return this.apiService.getDirectorsAndCoordinators();
  }
}
