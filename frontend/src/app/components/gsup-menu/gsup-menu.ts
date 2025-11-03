import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { AuthentificationService } from '@app/services/authentification/authentification-service';
import { User, UserRole } from '@common/user';
import { Search } from '@app/pages/search/search';
import { Archive } from '../archive/archive';
import { StudyPlanService } from '@app/services/study-plan/study-plan-service';
import { StudyPlanStatus } from '@common/study-plan';

@Component({
  selector: 'app-gsup-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './gsup-menu.html',
  styleUrls: ['./gsup-menu.scss'],
})
export class GsupMenu {
  @Input() currentUser: User | null = null;
  public isMenuOpen: boolean = false;

  constructor(
    private readonly reference: ElementRef,
    private readonly router: Router,
    private readonly authentificationService: AuthentificationService,
    private readonly dialog: MatDialog,
    private readonly sPS: StudyPlanService,
  ) {}

  public openMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  public logout(): void {
    this.authentificationService.logout();
    this.navigateTo('login');
  }

  public navigateTo(page: string) {
    this.isMenuOpen = false;
    this.router.navigate([`/${page}`]);
  }

  public searchCourses(): void {
    this.isMenuOpen = false;
    this.dialog.open(Search, {
      maxWidth: '90vw',
    });
  }

  public openArchive(): void {
    this.isMenuOpen = false;
    this.dialog.open(Archive, {
      maxWidth: '90vw',
    });
  }

  public isAdmin(): boolean {
    return this.currentUser?.role === UserRole.Administrateur;
  }

  public isStudent(): boolean {
    return this.currentUser?.role === UserRole.Etudiant;
  }

  public isRegistrar(): boolean {
    return this.currentUser?.role === UserRole.Registrar;
  }

  public isValidationForStudent(): boolean {
    const statusOngoingOrValidated = this.sPS.studyPlan?.status === StudyPlanStatus.VALIDATED
      || this.sPS.studyPlan?.status === StudyPlanStatus.LIVE;
    return this.isStudent() && statusOngoingOrValidated;
  }

  public redirectAddUserPage(): void {
    this.isMenuOpen = false;
    console.log('Redirect to add user page');
    // this.router.navigate(['/add-student']);
  }

  @HostListener('document:click', ['$event'])
  clickOutsideMenu(event: Event) {
    if (this.isMenuOpen && !this.reference.nativeElement.contains(event.target)) {
      this.isMenuOpen = false;
    }
  }

  @HostListener('window:resize')
  clickOnResizeMenu() {
    if (this.isMenuOpen) {
      this.isMenuOpen = false;
    }
  }
}
