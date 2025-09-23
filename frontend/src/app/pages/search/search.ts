import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { GsupInput } from '@app/components/gsup-input/gsup-input';
import { ApiService } from '@app/services/api/api-service';
import { debounceTime, Subject, Subscription } from 'rxjs';

export interface RawCourse {
  sigle: string;
  title: string;
  department: string;
  trimester: string[];
  language: string;
  credit?: number;
  description?: string;
}

export interface PlanTri {
  indPlanTriAut: "N",
  indPlanTriHiv: "O",
  indPlanTriEte: "N",
}

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [GsupInput, CommonModule],
  templateUrl: './search.html',
  styleUrl: './search.scss',
})
export class Search implements OnInit, OnDestroy {
  public courses: RawCourse[] = [];
  public loading: boolean = false;

  private search$ = new Subject<string>();
  private subscriptions: Subscription = new Subscription();

  constructor(private apiService: ApiService) {}

  public ngOnInit(): void {
    console.log('Initialisation du composant Search');
    this.getAllCourses();

    const searchSubscription = this.search$
      .pipe(debounceTime(300))
      .subscribe((value) => {
        console.log('Recherche:', value);
        this.searchCourses(value);
      });

    this.subscriptions.add(searchSubscription);
  }

  public ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private getAllCourses(): void {
    this.loading = true;
    console.log('Début du chargement des cours');

    this.apiService.getAllCourses().subscribe({
      next: (results: any[]) => {
        this.courses = this.transformApiData(results);
        console.log('Cours reçus:', this.courses);
        this.loading = false;
        console.log(`Chargement terminé: ${this.courses.length} cours`);
      },
      error: (err) => {
        console.error('Erreur lors du chargement des cours', err);
        this.loading = false;
      },
    });
  }

  private searchCourses(course: string): void {
    if (!course.trim()) {
      this.getAllCourses();
      return;
    }

    this.loading = true;
    console.log('Début de la recherche:', course);

    this.apiService.searchCourses(course).subscribe({
      next: (results: any[]) => {
        this.courses = this.transformApiData(results);
        console.log('Résultats de recherche:', this.courses);
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur lors de la recherche', err);
        this.loading = false;
      },
    });
  }

  private transformApiData(apiData: any[]): RawCourse[] {
    if (!apiData || !Array.isArray(apiData)) {
      console.warn('Données API invalides:', apiData);
      return [];
    }
    
    return apiData.map(course => ({
      sigle: course.sigle || '',
      title: course.titre || '',
      department: course.departement || 'Non spécifié',
      trimester: this.getTrimester(course.indPlanTriAut, course.indPlanTriHiv, course.indPlanTriEte),
      language: course.sigle.trim().endsWith("E") ? "Anglais" : "Français",
      credit: course.nombreCredit || '',
      description: course.descriptionCours || ''
    }));
  }

  private getTrimester(indPlanTriAut:string, indPlanTriHiv:string, indPlanTriEte:string): string[] {
    const trimester = []
    if (indPlanTriAut === "O") {
      trimester.push("Automne");
    }
    if (indPlanTriHiv === "O") {
      trimester.push("Hiver");
    }
    if (indPlanTriEte === "O") {
      trimester.push("Ete")
    }
    return trimester
  }

  public sendValue(value: string): void {
    this.search$.next(value);
  }

  public refreshCourses(): void {
    this.getAllCourses();
  }
}