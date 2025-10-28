import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '@app/services/api/api-service';
import { AuthentificationService } from '@app/services/authentification/authentification-service';
import { StudyPlanService } from '@app/services/study-plan/study-plan-service';
import { StudyPlanEntry } from '@common/study-plan';
import { Loading } from '@app/components/loading/loading';
import { RouterModule } from '@angular/router';
import { User } from '@common/user';
import { MatDialogRef } from '@angular/material/dialog';
import { ProgramService } from '@app/services/program/program-service';

@Component({
  selector: 'app-archive',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatSortModule,
    MatSelectModule,
    MatInputModule,
    MatProgressSpinnerModule,
    Loading,
    RouterModule,
  ],
  templateUrl: './archive.html',
  styleUrl: './archive.scss',
})
export class Archive implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['firstName', 'lastName', 'degree', 'date'];
  dataSource: StudyPlanEntry[] = [];
  filteredPlans: StudyPlanEntry[] = [];

  selectedRow: StudyPlanEntry | null = null;
  selectedDegree: string | null = null;
  selectedYear: string | null = null;

  degrees: string[] = [];
  years: string[] = [];
  searchValue: string = '';

  isLoading$: typeof this.sPS.loading$;
  currentUser: User | null;

  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private readonly apiService: ApiService,
    private readonly sPS: StudyPlanService,
    private readonly pS: ProgramService,
    protected readonly auth: AuthentificationService,
    private readonly dialogRef: MatDialogRef<Archive>
  ) {
    this.isLoading$ = this.sPS.loading$;
    this.currentUser = this.auth.currentUser;
  }

  ngOnInit(): void {
    const id = this.currentUser?._id;
    if (id) {
      this.apiService.getArchivedStudyPlans(id).subscribe((plans) => {
        this.dataSource = plans;
        this.filteredPlans = [...plans];
        this.degrees = [...new Set(plans.map((p) => p.degree))];
        this.years = [...new Set(plans.map((p) => new Date(p.date).getFullYear().toString()))];
      });
    }
  }

  ngAfterViewInit(): void {}

  onSearch(value: string) {
    this.searchValue = value.toLowerCase().trim();
    this.filterBySelectedValue();
  }

  filterBySelectedValue() {
    this.filteredPlans = this.dataSource.filter((plan) => {
      const matchSearch =
        this.searchValue === '' ||
        plan.firstName.toLowerCase().includes(this.searchValue) ||
        plan.lastName.toLowerCase().includes(this.searchValue);

      const matchDegree = !this.selectedDegree || plan.degree === this.selectedDegree;
      const matchYear =
        !this.selectedYear ||
        new Date(plan.date).getFullYear().toString() === this.selectedYear;

      return matchSearch && matchDegree && matchYear;
    });
  }

  formatDate(date: string): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleString('fr-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }

  onRowClick(row: StudyPlanEntry) {
    this.selectedRow = row;
    this.sPS.resetPlan();
    this.pS.reset();
    this.sPS.loadStudyPlan(row.studyPlanId);
    this.dialogRef.close();
  }
}
