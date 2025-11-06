import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-portal',
  standalone: true,
  imports: [],
  templateUrl: './portal.html',
  styleUrl: './portal.scss',
})
export class Portal {
  constructor(private readonly router: Router) {}

  navigateToHome(): void {
    this.router.navigate(['/accueil']);
  }
}
