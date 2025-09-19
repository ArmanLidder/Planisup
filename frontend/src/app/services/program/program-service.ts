import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '@app/services/api/api-service';
import { Program } from '@common/program';

@Injectable({
  providedIn: 'root'
})
export class ProgramService {
  public program: Program | null = null;
  constructor(private api: ApiService, private router: Router) {}

  load(id: string) {
    this.program = null;
    this.api.getProgram(id).subscribe((program: Program) => {
      this.program = program;
      this.router.navigate(['/study-plan']);
      console.log("Program service", this.program);
    });
  }
}
