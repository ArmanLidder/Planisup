import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GsupButton } from '@app/components/gsup-button/gsup-button';
import { Router } from '@angular/router';
import { Degree } from '@app/shared/enums/degree';
import { AuthentificationService } from '@app/services/authentification/authentification-service';
import { VerifyPlans } from '@app/components/verify-plans/verify-plans';
import { ProgramService } from '@app/services/program/program-service';
import { UserRole } from '@common/user';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, GsupButton, VerifyPlans],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {
  protected degree = Object.values(Degree);
  protected role = Object.values(UserRole);

  constructor(
    private router: Router,
    private pS: ProgramService,
    public auth: AuthentificationService
  ) {}

  ngOnInit(): void {
      console.log("Ng Onit")
      this.pS.reset();
  }

  navigateTo(degree: string): void {
    this.router.navigate([`/${degree.toLowerCase()}`]);
  }
}
