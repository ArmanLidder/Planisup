import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GsupButton } from '../../components/gsup-button/gsup-button';
import { Router } from '@angular/router';
import { Degree } from './../../shared/enums/degree';
import { AuthentificationService } from '@app/services/authentification/authentification-service'

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, GsupButton],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  public degree = Object.values(Degree); // mets en liste de string l'enum //

  constructor(private router: Router, public auth: AuthentificationService) {}

  navigateTo(degree: string): void {
    this.router.navigate([`/${degree.toLowerCase()}`]);
  }
}
