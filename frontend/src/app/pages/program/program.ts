import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api/api-service';
import { DepartementImages } from '../../shared/records/image';
import { ReducedProgram } from '@common/program';

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
  private program: string | null = '';
  private option: string | null = '';
  private step: number = 0;

  protected dataList: string[] = [];
  protected programList: Map<string,ReducedProgram[]> = new Map<string, ReducedProgram[]>();
  protected departementImages = DepartementImages;

  constructor(private route: ActivatedRoute, private apiService: ApiService) {}

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

  // Step 0 => get Type
  // Step 1 => get Departements
  // Step 2 => get Degrees and if no option passes directly to step 4
  // Step 3 => get Options
  // Step 4 => get Full Program with specific ID
  programChoiceClicked(choice: string, index: number): void {
    if (this.step === 1) this.getDepartments(this.type!, choice);
    else if (this.step === 2) this.getDegrees(choice);
    else if (this.step === 3) this.getOptions(choice);
    else if (this.step === 4) {
      // this.apiService.getProgram(this.program!).subscribe((response) => {
        // this.program = response;
      // });
    }
  }

  private getDepartments(type: string, departement:string) {
    this.departement = departement;
    this.apiService.getPrograms(type, departement).subscribe((response) => {
      this.programList = this.populateProgramMap(response);
      this.dataList = Array.from(this.programList.keys());
    });
    this.step += 1;
  }

  private getDegrees(degree: string) {
    this.degree = degree;
    const tempList: string[] = this.programList.get(this.degree!)?.map((program) => program.option ? program.option : 'Option de base') || [];
    if (tempList.length == 1 && tempList.includes('Option de base') || tempList.length === 0) {
      this.option = "no-option";
      this.step += 2;
    } else {
      this.dataList = tempList;
      this.step += 1;
    }
  }

  private getOptions(option: string) {
    this.option = option;
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
}
