import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GsupButton } from '../../components/gsup-button/gsup-button';
import { Router } from '@angular/router';
import { Degree } from './../../shared/enums/degree';
import { AuthentificationService } from '@app/services/authentification/authentification-service';
import { VerifyPlans } from '@app/components/verify-plans/verify-plans';
import { UserRole } from '@common/user';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, GsupButton, VerifyPlans],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  protected degree = Object.values(Degree);
  protected role = Object.values(UserRole);

  constructor(private router: Router, public auth: AuthentificationService) {}

  navigateTo(degree: string): void {
    this.router.navigate([`/${degree.toLowerCase()}`]);
  }
}
