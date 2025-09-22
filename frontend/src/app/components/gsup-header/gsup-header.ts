import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthentificationService } from '../../services/authentification/authentification-service';
import { User, UserRole } from '../../../../../common/user';
import { ProgramService } from '@app/services/program/program-service';

@Component({
  selector: 'app-gsup-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './gsup-header.html',
  styleUrl: './gsup-header.scss',
})
export class GsupHeader implements OnInit {
  currentUser: User | null = null;

  constructor(
    private authentificationService: AuthentificationService,
    private programService: ProgramService,
    public router: Router
  ) {}

  ngOnInit(): void {
    this.authentificationService.currentUser$.subscribe((user) => {
      this.currentUser = user;
    });
  }

  goBack(): void {
    this.programService.goBack();
  }

  logout(): void {
    this.authentificationService.logout();
    this.router.navigate(['/login']);
  }

  isAdmin(): boolean {
    return this.currentUser?.role === UserRole.Administrateur;
  }

  navigateToAdmin(): void {
    this.router.navigate(['/admin']);
  }
}
