import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ApiService } from '@app/services/api/api-service';
import { Program, ReducedProgram } from '@common/program';

@Injectable({
  providedIn: 'root',
})
export class ProgramService {
  private stepSubject = new BehaviorSubject<number>(0);
  step$ = this.stepSubject.asObservable();

  private departementsSubject = new BehaviorSubject<string[]>([]);
  departements$ = this.departementsSubject.asObservable();

  private programsSubject = new BehaviorSubject<Map<string, ReducedProgram[]>>(new Map());
  programs$ = this.programsSubject.asObservable();

  private degreesSubject = new BehaviorSubject<string[]>([]);
  degrees$ = this.degreesSubject.asObservable();

  private optionsSubject = new BehaviorSubject<string[]>([]);
  options$ = this.optionsSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  loading$ = this.loadingSubject.asObservable();

  private _program: Program | null = null;
  private programSubject = new BehaviorSubject<Program | null>(null);

  get program(): Program | null {
    return this._program;
  }

  set program(value: Program | null) {
    this._program = value;
    this.programSubject.next(value);
  }

  get program$(): Observable<Program | null> {
    return this.programSubject.asObservable();
  }

  public type: string | null = null;
  private departement: string | null = null;
  private degree: string | null = null;

  constructor(private api: ApiService, private router: Router) {}

  // Admin edit mode state (in-memory only)
  private adminEditingSubject = new BehaviorSubject<boolean>(false);
  adminEditing$ = this.adminEditingSubject.asObservable();

  setAdminEditing(value: boolean): void {
    this.adminEditingSubject.next(value);
  }

  /** Step 0 → 1: Load departements for a certain type */
  loadDepartements(type: string): void {
    if (this.departementsSubject.getValue().length > 0) return;
    this.departementsSubject.next([]);
    this.type = type;
    this.loadingSubject.next(true);
    this.api.getDepartements(type).subscribe({
      next: (departements) => {
        this.departementsSubject.next(departements);
        this.stepSubject.next(1);
      },
      complete: () => this.loadingSubject.next(false),
    });
  }

  /** Step 1 → 2: Load programs for a departement and find degrees */
  chooseDepartement(departement: string): void {
    this.departement = departement;
    // this.loadingSubject.next(true); // I have commented loading because too fast
    this.api.getPrograms(this.type!, departement).subscribe({
      next: (programs) => {
        const map = this.populateProgramMap(programs);
        this.programsSubject.next(map);
        this.degreesSubject.next(Array.from(map.keys()));
        this.stepSubject.next(2);
      },
      // complete: () => this.loadingSubject.next(false),
    });
  }

  /** Step 2 → 3 if there are options else directly to study plan */
  chooseDegree(degree: string): void {
    this.degree = degree;
    const programs = this.programsSubject.getValue().get(degree) || [];
    const options = programs.map((p) => p.option || 'Option de base');

    if (options.length === 1 && options[0] === 'Option de base') {
      this.loadProgram(programs[0]._id!);
      this.optionsSubject.next([]);
      this.stepSubject.next(4); // skip directly to study plan
    } else {
      this.optionsSubject.next(options);
      this.stepSubject.next(3);
    }
  }

  /** Step 3 → study plan */
  chooseOption(index: number): void {
    const program = this.programsSubject.getValue().get(this.degree!)?.[index];
    if (program) {
      this.loadProgram(program._id!);
      this.stepSubject.next(4);
    }
  }

  /** Go back one step */
  goBack(): void {
    const step = this.stepSubject.getValue();
    if (step <= 1) {
      this.router.navigate(['/accueil']);
      return;
    }
    if (step >= 4) this.returnFromStudyPlan(step);
    else this.stepSubject.next(step - 1);
  }

  reset(): void {
    this.stepSubject.next(0);
    this.departementsSubject.next([]);
    this.degreesSubject.next([]);
    this.programsSubject.next(new Map<string, ReducedProgram[]>());
    this.optionsSubject.next([]);
    this.type = null;
    this.departement = null;
    this.degree = null;
  }

  private populateProgramMap(programs: ReducedProgram[]): Map<string, ReducedProgram[]> {
    const map = new Map<string, ReducedProgram[]>();
    programs.forEach((program) => {
      if (!map.has(program.degree)) map.set(program.degree, [program]);
      else map.get(program.degree)?.push(program);
    });
    return map;
  }

  /** Navigate to study plan */
  loadProgram(id: string): void {
    this.loadingSubject.next(true);
    this.api.getProgram(id).subscribe({
      next: (program: Program) => {
        this.program = program;
        this.router.navigate(['/study-plan']);
      },
      complete: () => this.loadingSubject.next(false),
    });
  }

  private returnFromStudyPlan(step: number): void {
    this.router.navigate([`/${this.type}`]);
    const noOption = this.optionsSubject.getValue().length === 0;
    const decrement = noOption ? 2 : 1;
    this.stepSubject.next(step - decrement);
  }

  saveProgram(program: Program): Observable<Program> {
    const isDraft = !program._id || program._id.startsWith('draft-');
    if (isDraft) {
      const { _id, ...payload } = program;
      return this.api.createProgram(payload as Omit<Program, '_id'>).pipe(
        tap((saved) => {
          this.program = saved;
        })
      );
    }
    return this.api.updateProgram(program._id!, program).pipe(
      tap((saved) => {
        this.program = saved;
      })
    );
  }

  deleteProgram(id: string): Observable<{ message: string; id: string }> {
    return this.api.deleteProgram(id).pipe(
      tap(() => {
        if (this.program?._id === id) this.program = null;
      })
    );
  }
}
