import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ProgressService {
  constructor() {}
  public eventHelper = new Subject<{ prev: boolean; next: boolean }>();
}
