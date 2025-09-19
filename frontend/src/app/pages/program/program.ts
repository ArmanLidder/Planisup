import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api/api-service';
import { DepartementImages } from '../../shared/records/image';
import { ReducedProgram, Program as ProgramModel } from '@common/program';
import { ProgramService } from '@app/services/program/program-service';

@Component({
  selector: 'app-program',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './program.html',
  styleUrl: './program.scss',
})
export class Program implements OnInit {
  private type: string | null = '';
  private departement: string | null = '';
  private degree: string | null = '';
  private programId: string | null = '';
  private program: ProgramModel | null = null;
  private option: string | null = '';
  private step: number = 0;

  protected dataList: string[] = [];
  // Map avec key = degree et value les variantes du degree
  protected programs: Map<string,ReducedProgram[]> = new Map<string, ReducedProgram[]>();
  protected departementImages = DepartementImages;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private programService: ProgramService,
  ) {}

  ngOnInit(): void {
    this.initialization();
  }

  initialization(): void {
    this.route.paramMap.subscribe((params) => {
      this.type = params.get('type');
      this.departement = params.get('departement');
      this.degree = params.get('degree');
      this.option = params.get('option');
    });

    if (this.type && !this.departement) {
      this.apiService.getDepartements(this.type).subscribe((response) => {
        this.dataList = response;
        this.step = 1;
      });
    }
  }

  // Step 0 => get Type
  // Step 1 => get Departements
  // Step 2 => get Degrees and if no option passes directly to study plan
  // Step 3 => get Options and passes directly to study plan
  programChoiceClicked(choice: string, index: number): void {
    if (this.step === 1) this.getDepartments(this.type!, choice);
    else if (this.step === 2) this.getDegrees(choice);
    else if (this.step === 3) this.getOptions(choice, index);
  }

  public goBack() {
    if (this.step - 1 < 0) return;
    this.step -= 1;
    if (this.step === 0) {
      this.router.navigate(['/accueil']);
    } else if (this.step === 1) {
      this.departement = null;
      this.dataList = [];
      this.degree = null;
      this.initialization();
    } else if (this.step === 2) {
      this.degree = null;
      this.dataList = [];
      this.option = null;
      this.programs = new Map<string, ReducedProgram[]>();
      this.getDepartments(this.type!, this.departement!);
      this.step -= 1;
    }
  }

  private getDepartments(type: string, departement:string) {
    this.departement = departement;
    this.apiService.getPrograms(type, departement).subscribe((response) => {
      this.programs = this.populateProgramMap(response);
      this.dataList = Array.from(this.programs.keys());
    });
    this.step += 1;
  }

  private populateProgramMap(programs: ReducedProgram[]): Map<string,ReducedProgram[]> {
    const map = new Map<string, ReducedProgram[]>()
    programs.map((program: ReducedProgram) => {
      if (!map.has(program.degree)) map.set(program.degree, [program])
      else map.get(program.degree)?.push(program)
    })
    return map;
  }

  private getDegrees(degree: string) {
    this.degree = degree;
    const tempList: string[] = this.programs.get(this.degree!)?.map((program) => program.option ? program.option : 'Option de base') || [];
    if (tempList.length == 1 && tempList.includes('Option de base') || tempList.length === 0) {
      this.option = "no-option";
      const id = this.programs.get(this.degree!)?.[0]._id!;
      this.openStudyPlan(id);
      this.step += 2;
    } else {
      this.dataList = tempList;
      this.step += 1;
    }
  }

  private getOptions(option: string, index: number) {
    this.option = option;
    const id = this.programs.get(this.degree!)?.[index]._id!;
    this.openStudyPlan(id);
    this.step += 1;
  }

  private openStudyPlan(id: string) {
    this.programService.load(id);
  }
}
