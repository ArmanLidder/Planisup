import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpHeaders } from '@angular/common/http';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../services/api/api-service';
import { User, UserRole } from '../../../../../common/user';
import { GsupButton } from '../../components/gsup-button/gsup-button';
import { ConfirmationDialog } from '../../components/confirmation-dialog/confirmation-dialog';

@Component({
  selector: 'app-admin',
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
    MatDialogModule
  ],
  templateUrl: './admin.html',
  styleUrl: './admin.scss'
})
export class Admin implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  userRoles = Object.values(UserRole);
  availableRoles: UserRole[] = [];
  isLoading = false;
  message = '';
  currentAdminId = '';
  searchTerm = '';

  constructor(
    private apiService: ApiService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.getCurrentAdminId();
    this.setAvailableRoles();
    this.loadUsers();
  }

  private getCurrentAdminId(): void {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    this.currentAdminId = currentUser._id || '';
  }

  private setAvailableRoles(): void {
    this.availableRoles = this.userRoles.filter(role => role !== UserRole.Administrateur);
  }

  private getAuthHeaders(): HttpHeaders {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    return new HttpHeaders({
      'user-role': currentUser.role || '',
      'Content-Type': 'application/json'
    });
  }

  loadUsers(): void {
    this.isLoading = true;
    this.message = '';
    const headers = this.getAuthHeaders();

    this.apiService.getAllUsers(headers).subscribe({
      next: (response) => {
        if (response.success) {
          this.users = response.users;
          this.filterUsers();
          this.message = `${this.filteredUsers.length} utilisateurs trouvés`;
        } else {
          this.message = 'Erreur lors du chargement des utilisateurs';
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.message = 'Erreur: ' + (error.error?.message || error.message);
        this.isLoading = false;
      }
    });
  }

  onSearchChange(event: any): void {
    this.searchTerm = event.target.value;
    this.filterUsers();
  }

  private filterUsers(): void {
    let filtered = this.users.filter(user => user._id !== this.currentAdminId);

    if (this.searchTerm) {
      filtered = filtered.filter(user =>
        user.firstName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        user.lastName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        user.usercode.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        this.getRoleDisplayName(user.role).toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }

    this.filteredUsers = filtered;
  }

  confirmRoleChange(user: User, newRole: UserRole): void {
    const roleDisplayName = this.getRoleDisplayName(newRole);
    const currentRoleDisplayName = this.getRoleDisplayName(user.role);

    const dialogRef = this.dialog.open(ConfirmationDialog, {
      data: {
        message: `Êtes-vous sûr de vouloir changer le rôle de ${user.firstName} ${user.lastName} de "${currentRoleDisplayName}" vers "${roleDisplayName}" ?`
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.updateUserRole(user, newRole);
      }
    });
  }

  private updateUserRole(user: User, newRole: UserRole): void {
    const headers = this.getAuthHeaders();

    this.apiService.updateUserRole(user._id, newRole, headers).subscribe({
      next: (response) => {
        if (response.success) {
          const userIndex = this.users.findIndex(u => u._id === user._id);
          if (userIndex !== -1) {
            this.users[userIndex] = response.user;
          }
          this.filterUsers();
          this.message = `✓ Rôle mis à jour pour ${user.firstName} ${user.lastName}`;
        } else {
          this.message = '✗ Erreur lors de la mise à jour du rôle';
        }
      },
      error: (error) => {
        this.message = '✗ Erreur: ' + (error.error?.message || error.message);
        this.loadUsers();
      }
    });
  }

  confirmDeleteUser(user: User): void {
    const dialogRef = this.dialog.open(ConfirmationDialog, {
      data: {
        message: `⚠️ ATTENTION: Vous êtes sur le point de supprimer définitivement l'utilisateur ${user.firstName} ${user.lastName} (${user.usercode}).\n\nCette action est irréversible. Êtes-vous absolument certain ?`
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.deleteUser(user);
      }
    });
  }

  private deleteUser(user: User): void {
    const headers = this.getAuthHeaders();

    this.apiService.deleteUser(user._id, headers).subscribe({
      next: (response) => {
        if (response.success) {
          this.users = this.users.filter(u => u._id !== user._id);
          this.filterUsers();
          this.message = `✓ Utilisateur ${user.firstName} ${user.lastName} supprimé`;
        } else {
          this.message = '✗ Erreur lors de la suppression';
        }
      },
      error: (error) => {
        this.message = '✗ Erreur: ' + (error.error?.message || error.message);
      }
    });
  }

  getRoleDisplayName(role: UserRole): string {
    const roleNames = {
      [UserRole.Etudiant]: 'Étudiant',
      [UserRole.Directeur]: 'Directeur',
      [UserRole.Agent]: 'Agent administratif',
      [UserRole.Coordonnateur]: 'Coordonnateur (CPES)',
      [UserRole.Administrateur]: 'Administrateur'
    };
    return roleNames[role];
  }

  getRoleColor(role: UserRole): string {
    const roleColors = {
      [UserRole.Etudiant]: 'primary',
      [UserRole.Directeur]: 'warn',
      [UserRole.Agent]: 'accent',
      [UserRole.Coordonnateur]: '',
      [UserRole.Administrateur]: ''
    };
    return roleColors[role];
  }

  clearMessage(): void {
    this.message = '';
  }
}
