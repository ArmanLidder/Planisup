import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProgrammeService } from '../../services/program/program';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-program',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './program.html',
  styleUrl: './program.scss',
})
export class Program implements OnInit {
  constructor(public router: Router, private programmeService: ProgrammeService) {}
  ngOnInit(): void {}
}
