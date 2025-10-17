import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DepartementImages } from '@app/shared/records/image';
import { ProgramService } from '@app/services/program/program-service';
import { Loading } from '@app/components/loading/loading';

@Component({
  selector: 'app-program',
  standalone: true,
  imports: [CommonModule, RouterModule, Loading],
  templateUrl: './program.html',
  styleUrl: './program.scss',
})
export class Program implements OnInit {
  step$: typeof this.programService.step$;
  departements$: typeof this.programService.departements$;
  degrees$: typeof this.programService.degrees$;
  options$: typeof this.programService.options$;
  isLoading$: typeof this.programService.loading$;

  protected departementImages = DepartementImages;

  constructor(
    private readonly activatedRoute: ActivatedRoute,
    protected programService: ProgramService
  ) {
    this.step$ = this.programService.step$;
    this.departements$ = this.programService.departements$;
    this.degrees$ = this.programService.degrees$;
    this.options$ = this.programService.options$;
    this.isLoading$ = this.programService.loading$;
  }

  ngOnInit(): void {
    this.activatedRoute.paramMap.subscribe((params) => {
      const type = params.get('type');
      if (type) this.programService.loadDepartements(type);
    });
  }
}
