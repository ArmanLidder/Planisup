import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api/api-service';
import { DepartementImages } from '../../shared/records/image';

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
  private option: string | null = '';

  protected dataList: string[] = [];
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
      });
    }
  }

  programChoiceClicked(choice: string): void {
    if (this.type && !this.departement) {
      this.departement = choice;
      this.apiService.getDegrees(this.type, this.departement).subscribe((response) => {
        this.dataList = response;
      });
      this.route;
    } else if (this.type && this.departement && !this.degree) {
      this.degree = choice;
      this.apiService.getOptions(this.type, this.departement, this.degree).subscribe((response) => {
        this.dataList = response;
      });
    } else if (this.type && this.departement && this.degree && !this.option) {
      // fonction qui redirige vers page ali et charge les cours pour le denier choix //
      this.apiService.getOptions(this.type, this.departement, this.degree).subscribe((response) => {
        this.dataList = response;
        console.log(this.dataList);
      });
    }
  }
}
