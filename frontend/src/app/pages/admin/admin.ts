import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { UserManagement} from '@app/components/user-management/user-management';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    UserManagement
  ],
  templateUrl: './admin.html',
  styleUrl: './admin.scss'
})
export class Admin {
  currentSection = 'users';

  showSection(section: string): void {
    this.currentSection = section;
  }
}
