import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTabsModule } from '@angular/material/tabs';
import { ApiService } from '../../services/api/api-service';
import { User, UserRole } from '../../../../../common/user';
import { GsupDialog } from '../gsup-dialog/gsup-dialog';
import { error } from 'pdf-lib';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatBadgeModule,
    MatTabsModule,
  ],
  templateUrl: './user-management.html',
  styleUrl: './user-management.scss',
})
export class UserManagement implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  unassignedEmployees: User[] = [];
  assignedUsers: User[] = [];
  userRoles = Object.values(UserRole);
  availableRoles: UserRole[] = [];
  isLoading = false;
  message = '';
  currentAdminId = '';
  searchTerm = '';
  selectedTabIndex = 0;
  departements : string[] = [];

  constructor(private readonly apiService: ApiService, private readonly dialog: MatDialog) {}

  ngOnInit(): void {
    this.getCurrentAdminId();
    this.setAvailableRoles();
    this.loadUsers();
    this.apiService.getAllDepartements().subscribe({
      next: (response) => this.departements = response,
    });
  }

  private getCurrentAdminId(): void {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    this.currentAdminId = currentUser._id || '';
  }

  private setAvailableRoles(): void {
    this.availableRoles = [
      UserRole.Directeur,
      UserRole.Agent,
      UserRole.Coordonnateur,
      UserRole.Registrar,
    ];
  }

  loadUsers(): void {
    this.isLoading = true;

    this.apiService.getAllUsers().subscribe({
      next: (response) => {
        if (response.success) {
          this.users = response.users.filter((user) => user._id !== this.currentAdminId);
          this.categorizeUsers();
          this.filterUsers();
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
      },
    });
  }

  private categorizeUsers(): void {
    this.unassignedEmployees = this.users.filter((user) => user.role === UserRole.Employe);
    this.assignedUsers = this.users.filter((user) => user.role !== UserRole.Employe);
  }

  onSearchChange(event: any): void {
    this.searchTerm = event.target.value;
    this.filterUsers();
  }

  private filterUsers(): void {
    const searchLower = this.searchTerm.toLowerCase();

    if (this.searchTerm) {
      this.filteredUsers = this.assignedUsers.filter(
        (user) =>
          user.firstName.toLowerCase().includes(searchLower) ||
          user.lastName.toLowerCase().includes(searchLower) ||
          user.usercode.toLowerCase().includes(searchLower) ||
          this.getRoleDisplayName(user.role).toLowerCase().includes(searchLower)
      );
    } else {
      this.filteredUsers = this.assignedUsers;
    }
  }

  confirmRoleAssignment(employee: User, newRole: UserRole): void {
    const roleDisplayName = this.getRoleDisplayName(newRole);
    const message = `Assigner le rôle "${roleDisplayName}" à ${employee.firstName} ${employee.lastName} (${employee.usercode}) ?\n\nCette action retirera l'employé de la liste des utilisateurs non assignés.`;

    const dialogRef = this.dialog.open(GsupDialog, {
      data: { message, firstButton: 'Annuler', secondButton: 'Confirmer' },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.updateUserRole(employee, newRole);
      }
    });
  }

  confirmRoleChange(user: User, newRole: UserRole): void {
    const roleDisplayName = this.getRoleDisplayName(newRole);
    const currentRoleDisplayName = this.getRoleDisplayName(user.role);

    const dialogRef = this.dialog.open(GsupDialog, {
      data: {
        message: `Êtes-vous sûr de vouloir changer le rôle de ${user.firstName} ${user.lastName} de "${currentRoleDisplayName}" vers "${roleDisplayName}" ?`,
        firstButton: 'Annuler',
        secondButton: 'Confirmer',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.updateUserRole(user, newRole);
      }
    });
  }

  private updateUserRole(user: User, newRole: UserRole, department?: string): void {
    this.apiService.updateUserRole(user._id, newRole, department).subscribe({
      next: (response) => {
        if (response.success) {
          const userIndex = this.users.findIndex((u) => u._id === user._id);
          if (userIndex !== -1) {
            this.users[userIndex] = response.user;
          }
          this.categorizeUsers();
          this.filterUsers();
        }
      },
      error: (error) => {
        this.loadUsers();
      },
    });
  }

  confirmDeleteUser(user: User): void {
    const dialogRef = this.dialog.open(GsupDialog, {
      data: {
        message: `ATTENTION: Vous êtes sur le point de supprimer définitivement l'utilisateur ${user.firstName} ${user.lastName} (${user.usercode}).\n\nCette action est irréversible. Êtes-vous absolument certain ?`,
        firstButton: 'Annuler',
        secondButton: 'Confirmer',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.deleteUser(user);
      }
    });
  }

  private deleteUser(user: User): void {
    this.apiService.deleteUser(user._id).subscribe({
      next: (response) => {
        if (response.success) {
          this.users = this.users.filter((u) => u._id !== user._id);
          this.categorizeUsers();
          this.filterUsers();
        }
      },
    });
  }

  getRoleDisplayName(role: UserRole): string {
    const roleNames = {
      [UserRole.Etudiant]: 'Étudiant',
      [UserRole.Employe]: 'Employé (non assigné)',
      [UserRole.Directeur]: 'Directeur',
      [UserRole.Agent]: 'Agent administratif',
      [UserRole.Coordonnateur]: 'Coordonnateur (CPES)',
      [UserRole.Administrateur]: 'Administrateur',
      [UserRole.Registrar]: 'Registraire',
    };
    return roleNames[role];
  }

  getRoleColor(role: UserRole): string {
    const roleColors = {
      [UserRole.Etudiant]: 'primary',
      [UserRole.Employe]: 'warn',
      [UserRole.Directeur]: '',
      [UserRole.Agent]: 'accent',
      [UserRole.Coordonnateur]: '',
      [UserRole.Administrateur]: '',
      [UserRole.Registrar]: '',
    };
    return roleColors[role];
  }

  onTabChange(index: number): void {
    this.selectedTabIndex = index;
  }

  onDepartmentChange(user: User, department: string): void {
    const message = `Assigner ${user.firstName} ${user.lastName} au(x) département(s) "${department}" ?`;

    const dialogRef = this.dialog.open(GsupDialog, {
      data: { message, firstButton: 'Annuler', secondButton: 'Confirmer' },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.updateUserRole(user, user.role, department);
      }
    });
  }

  protected readonly UserRole = UserRole;
}
