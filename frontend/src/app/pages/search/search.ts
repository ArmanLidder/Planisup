import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { GsupInput } from '@app/components/gsup-input/gsup-input';
import { ApiService } from '@app/services/api/api-service';
import { debounceTime, Subject } from 'rxjs';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [GsupInput, CommonModule],
  templateUrl: './search.html',
  styleUrl: './search.scss',
})
export class Search implements OnInit {
  public courses: any[] = [
    {
      sigle: 'INF8102',
      titre: 'Securité INFO',
      departement: 'Genie logiciel',
      trimestre: 'H2025',
      langue: 'francais',
    },
    {
      sigle: 'INF8102',
      titre: 'Securité INFO',
      departement: 'Genie logiciel',
      trimestre: 'H2025',
      langue: 'francais',
    },
    {
      sigle: 'INF8102',
      titre: 'Securité INFO',
      departement: 'Genie logiciel',
      trimestre: 'H2025',
      langue: 'francais',
    },
    {
      sigle: 'INF8102',
      titre: 'Securité INFO',
      departement: 'Genie logiciel',
      trimestre: 'H2025',
      langue: 'francais',
    },
    {
      sigle: 'INF8102',
      titre: 'Securité INFO',
      departement: 'Genie logiciel',
      trimestre: 'H2025',
      langue: 'francais',
    },
    {
      sigle: 'INF8102',
      titre: 'Securité INFO',
      departement: 'Genie logiciel',
      trimestre: 'H2025',
      langue: 'francais',
    },
    {
      sigle: 'INF8102',
      titre: 'Securité INFO',
      departement: 'Genie logiciel',
      trimestre: 'H2025',
      langue: 'francais',
    },
    {
      sigle: 'INF8102',
      titre: 'Securité INFO',
      departement: 'Genie logiciel',
      trimestre: 'H2025',
      langue: 'francais',
    },
    {
      sigle: 'INF8102',
      titre: 'Securité INFO',
      departement: 'Genie logiciel',
      trimestre: 'H2025',
      langue: 'francais',
    },
    {
      sigle: 'INF8102',
      titre: 'Securité INFO',
      departement: 'Genie logiciel',
      trimestre: 'H2025',
      langue: 'francais',
    },
    {
      sigle: 'INF8102',
      titre: 'Securité INFO',
      departement: 'Genie logiciel',
      trimestre: 'H2025',
      langue: 'francais',
    },
  ];

  private search$ = new Subject<string>();

  constructor(private apiService: ApiService) {}

  public ngOnInit(): void {
    // JARRANGE SOON CE BHAY mais pour linstant le data ets bien send
    this.search$.pipe(debounceTime(100)).subscribe((value) => {
      this.apiService.getCourses(value).subscribe({
        next: (results) => (this.courses = results),
        error: (err) => {
          console.error('Erreur API', err);
        },
      });
    });
  }

  public sendValue(value: string): void {
    this.search$.next(value);
  }
}
