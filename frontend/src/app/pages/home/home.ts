import { Component } from '@angular/core';
import { GsupButton } from '../../components/gsup-button/gsup-button';
import { Router } from '@angular/router';
import { Degree } from './../../shared/enums/degree';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [GsupButton],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  public degree = Object.values(Degree); // mets en liste de string l'enum //

  constructor(private router: Router) {}

  navigateTo(degree: string): void {
    this.router.navigate([`/${degree.toLowerCase()}`]);
  }
}
