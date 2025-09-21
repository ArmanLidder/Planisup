import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DepartementImages } from '@app/shared/records/image';
import { ProgramService } from '@app/services/program/program-service';

@Component({
  selector: 'app-program',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './program.html',
  styleUrl: './program.scss',
})

export class Program implements OnInit {
  step$: typeof this.pS.step$;
  departements$: typeof this.pS.departements$;
  degrees$: typeof this.pS.degrees$;
  options$: typeof this.pS.options$;
  isLoading$: typeof this.pS.loading$;

  protected departementImages = DepartementImages;

  constructor(
    private route: ActivatedRoute,
    protected pS: ProgramService,
  ) {
    this.step$ = this.pS.step$;
    this.departements$ = this.pS.departements$;
    this.degrees$ = this.pS.degrees$;
    this.options$ = this.pS.options$;
    this.isLoading$ = this.pS.loading$;
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const type = params.get('type');
      if (type) this.pS.loadDepartements(type);
    });
  }
}

