import { Component, ViewChild } from '@angular/core';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ApiService } from '@app/services/api/api-service';
import { AuthentificationService } from '@app/services/authentification/authentification-service';
import { StudyPlanEntry } from '@common/study-plan';
import { StudyPlanService } from '@app/services/study-plan/study-plan-service';
import { Loading } from '@app/components/loading/loading';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { User } from '@common/user';

@Component({
  selector: 'app-verify-plans',
  standalone: true,
  imports: [MatTableModule, MatSortModule, Loading, CommonModule, RouterModule],
  templateUrl: './verify-plans.html',
  styleUrl: './verify-plans.scss',
})
export class VerifyPlans {
  //@Input() role ou user on sait pas: string = 'default';
  displayedColumns: string[] = ['Prénom', 'Nom', 'Diplôme', 'Date'];
  currentUser: User | null;
  dataSource = new MatTableDataSource<StudyPlanEntry>();
  isLoading$: typeof this.sPS.loading$;


  selectedRow: StudyPlanEntry | null = null;

  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private apiService: ApiService,
    private auth: AuthentificationService,
    private sPS: StudyPlanService,
  ) {
    this.isLoading$ = this.sPS.loading$;
    this.currentUser = this.auth.currentUser;
  }

  ngOnInit() {
    const id = this.auth.currentUser?._id;
    if(id){
      this.apiService.getStudyPlans(id).subscribe(plans => {
        this.dataSource.data = plans;
      });
    }
  }

  formatDate(date: string): string {
    if (!date) return '';

    const dateObj = new Date(date);
    return dateObj.toLocaleString('fr-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
  }

  onRowClick(row: StudyPlanEntry) {
    this.sPS.loadStudyPlan(row.studyPlanId);
  }
}
