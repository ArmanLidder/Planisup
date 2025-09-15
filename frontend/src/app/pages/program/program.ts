import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProgrammeService } from '../../services/program/program';
import { TitleCasePipe } from '@angular/common';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-program',
  standalone: true,
  imports: [TitleCasePipe, CommonModule, RouterModule],
  templateUrl: './program.html',
  styleUrl: './program.scss',
})
export class Program implements OnInit {
  type: string | null = null;
  discipline: string | null = null;
  module: string | null = null;
  data: any = {};

  constructor(private route: ActivatedRoute, private programmeService: ProgrammeService) {}
  ngOnInit(): void {
    this.programmeService.getJSON().subscribe((json) => {
      this.route.paramMap.subscribe((params) => {
        this.type = params.get('type');
        this.discipline = params.get('discipline');
        this.module = params.get('module');

        if (this.type && !this.discipline) {
          this.data = json[this.type]; // liste des génies
        } else if (this.type && this.discipline && !this.module) {
          this.data = json[this.type][this.discipline]; // liste des options
        } else if (this.type && this.discipline && this.module) {
          this.data = json[this.type][this.discipline][this.module]; // liste des cours
        }
      });
    });
  }
}
