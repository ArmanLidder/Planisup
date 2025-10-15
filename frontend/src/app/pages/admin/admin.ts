import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { UserManagement } from '@app/components/user-management/user-management';
import { AuthentificationService } from '@app/services/authentification/authentification-service';
import { ProgramManagement } from '@app/components/program-management/program-management';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, UserManagement, ProgramManagement],
  templateUrl: './admin.html',
  styleUrl: './admin.scss',
})
export class Admin implements OnInit {
  protected selectedSection: string = '';

  constructor(
    private readonly router: Router,
    private readonly activatedRoute: ActivatedRoute,
    public authentificationService: AuthentificationService
  ) {}

  ngOnInit(): void {
    this.activatedRoute.params.subscribe((params) => {
      this.selectedSection = params['section'];
    });
  }

  navigateToSection(section: string): void {
    this.router.navigate([`/admin/${section}`]);
  }
}
