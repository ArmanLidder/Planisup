import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthentificationService } from '../../services/authentification/authentification-service';
import { User, UserRole } from '../../../../../common/user';
import { ProgramService } from '@app/services/program/program-service';
import { GsupMenu } from '../gsup-menu/gsup-menu';

@Component({
  selector: 'app-gsup-header',
  standalone: true,
  imports: [CommonModule, RouterModule, GsupMenu],
  templateUrl: './gsup-header.html',
  styleUrl: './gsup-header.scss',
})
export class GsupHeader implements OnInit {
  currentUser: User | null = null;
  etudiantRole = UserRole.Etudiant;

  constructor(
    private readonly authentificationService: AuthentificationService,
    private readonly programService: ProgramService,
    public router: Router
  ) {}

  ngOnInit(): void {
    this.authentificationService.currentUser$.subscribe((user) => {
      this.currentUser = user;
    });
  }

  goBack(): void {
    if (
      this.currentUser?.role !== UserRole.Etudiant &&
      this.currentUser?.role !== UserRole.Administrateur
    ) {
      this.router.navigate(['/accueil']);
    } else if (this.currentUser?.role === UserRole.Administrateur) {
      this.router.navigate(['/admin']);
    } else {
      this.programService.goBack();
    }
  }

  isStudentWithActiveStudy(): boolean {
    return this.currentUser?.role === UserRole.Etudiant && this.currentUser.currentPlan !== '';
  }
}
