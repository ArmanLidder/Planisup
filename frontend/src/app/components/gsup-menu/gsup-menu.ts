import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthentificationService } from '@app/services/authentification/authentification-service';
import { User, UserRole } from '@common/user';

@Component({
  selector: 'app-gsup-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './gsup-menu.html',
  styleUrls: ['./gsup-menu.scss'],
})
export class GsupMenu implements OnInit {
  @Input() currentUser: User | null = null;
  public isMenuOpen: boolean = false;

  constructor(
    private reference: ElementRef,
    private router: Router,
    private authentificationService: AuthentificationService
  ) {}

  public ngOnInit(): void {}

  public openMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  public logout(): void {
    this.authentificationService.logout();
    this.navigateTo('login');
  }

  public isAdmin(): boolean {
    return this.currentUser?.role === UserRole.Administrateur;
  }

  public navigateTo(page: string) {
    this.isMenuOpen = false;
    this.router.navigate([`/${page}`]);
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
