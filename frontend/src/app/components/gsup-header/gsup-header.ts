import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthentificationService } from '../../services/authentification/authentification-service';
import { User } from '../../../../../common/user';

@Component({
  selector: 'app-gsup-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './gsup-header.html',
  styleUrl: './gsup-header.scss',
})
export class GsupHeader implements OnInit {
  currentUser: User | null = null;

  constructor(private authentificationService: AuthentificationService, private router: Router) {}

  ngOnInit(): void {
    this.authentificationService.currentUser$.subscribe((user) => {
      this.currentUser = user;
    });
  }

  logout(): void {
    this.authentificationService.logout();
    this.router.navigate(['/login']);
  }
}
