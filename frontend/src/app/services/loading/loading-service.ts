import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  constructor() {}
  isLoading$ = new BehaviorSubject<boolean>(false);

  startLoading(): void {
    this.isLoading$.next(true);
  }

  stopLoading(): void {
    this.isLoading$.next(false);
  }
}
