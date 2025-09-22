import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProgressHelperService {
  constructor() { }
  public eventHelper = new Subject<{ prev: boolean; next: boolean}>();

}
