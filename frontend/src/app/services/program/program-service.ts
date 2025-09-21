import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { ApiService } from '@app/services/api/api-service';
import { Program, ReducedProgram } from '@common/program';

@Injectable({
  providedIn: 'root'
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

  public program: Program | null = null;

  private type: string | null = null;
  private departement: string | null = null;
  private degree: string | null = null;

  constructor(private api: ApiService, private router: Router) {}

  /** Step 0 → 1: Load departements for a certain type */
  loadDepartements(type: string) {
    this.departementsSubject.next([]);
    this.type = type;
    this.loadingSubject.next(true);
    this.api.getDepartements(type).subscribe({
      next: (departements) => {
        this.departementsSubject.next(departements);
        this.stepSubject.next(1);
      },
      complete: () => {
        setTimeout(() => this.loadingSubject.next(false), 2000)
      },
    });
  }

  /** Step 1 → 2: Load programs for a departement and find degrees */
  chooseDepartement(departement: string) {
    this.departement = departement;
    this.loadingSubject.next(true);
    this.api.getPrograms(this.type!, departement).subscribe({
      next: (programs) => {
        const map = this.populateProgramMap(programs);
        this.programsSubject.next(map);
        this.degreesSubject.next(Array.from(map.keys()));
        this.stepSubject.next(2);
      },
      complete: () => this.loadingSubject.next(false),
    });
  }

  /** Step 2 → 3 if there are options else directly to study plan */
  chooseDegree(degree: string) {
    this.degree = degree;
    const programs = this.programsSubject.getValue().get(degree) || [];
    const options = programs.map((p) => p.option || 'Option de base');

    if (options.length === 1 && options[0] === 'Option de base') {
      this.loadProgram(programs[0]._id!);
      this.stepSubject.next(4); // skip directly to study plan
      console.log(this.stepSubject.getValue())
    } else {
      this.optionsSubject.next(options);
      this.stepSubject.next(3);
    }
  }

  /** Step 3 → study plan */
  chooseOption(index: number) {
    const program = this.programsSubject.getValue().get(this.degree!)?.[index];
    if (program) {
      this.loadProgram(program._id!);
      this.stepSubject.next(4);
    }
  }

  /** Go back one step */
  goBack() {
    const step = this.stepSubject.getValue();
    if (step <= 1) {
      this.router.navigate(['/accueil']);
      return;
    }
    this.stepSubject.next(step - 1);
    console.log(this.stepSubject.getValue())
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
  private loadProgram(id: string) {
    this.loadingSubject.next(true);
    this.api.getProgram(id).subscribe({
      next: (program: Program) => {
        this.program = program;
        this.router.navigate(['/study-plan']);
      },
      complete: () => this.loadingSubject.next(false),
    });
  }
}
