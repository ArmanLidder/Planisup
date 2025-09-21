import { Component, Input, ViewChild } from '@angular/core';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Router } from '@angular/router';

export interface Plan {
  matricule: string;
  nomEtudiant: string;
  plan: string;
  date: string;
}

const data: Plan[] = [
  {
    matricule: '123456',
    nomEtudiant: 'Jean Dupont',
    plan: 'DESS',
    date: '2025-10-01',
  },
  {
    matricule: '789012',
    nomEtudiant: 'Marie Curie',
    plan: 'Maitrise',
    date: '2025-10-02',
  },
];

@Component({
  selector: 'app-verify-plans',
  standalone: true,
  imports: [MatTableModule, MatSortModule],
  templateUrl: './verify-plans.html',
  styleUrl: './verify-plans.scss',
})
export class VerifyPlans {
  //@Input() role ou user on sait pas: string = 'default';
  displayedColumns: string[] = ['matricule', 'nomEtudiant', 'plan', 'date'];
  dataSource = new MatTableDataSource<Plan>(data);

  selectedRow: Plan | null = null;

  @ViewChild(MatSort) sort!: MatSort;

  constructor(private router: Router) {}

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
  }

  onRowClick(row: Plan) {
    this.selectedRow = this.selectedRow?.matricule === row.matricule ? null : row;
    // console.log('Ligne cliquée :', this.selectedRow);
    this.router.navigate(['/view-plan']);
  }
}
