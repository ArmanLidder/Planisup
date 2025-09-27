import { Injectable } from '@angular/core';
import { HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { LoginRequest, User, UserRole } from '../../../../../common/user';
import { ApiService } from '../api/api-service';

interface LoginResponse {
  success: boolean;
  user?: User;
  message?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthentificationService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private apiService: ApiService) {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        this.currentUserSubject.next(user);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('currentUser');
      }
    }
  }

  login(loginRequest: LoginRequest): Observable<LoginResponse> {
    return this.apiService.postLogin(loginRequest).pipe(
      map((response: LoginResponse) => {
        if (response.success && response.user) {
          localStorage.setItem('currentUser', JSON.stringify(response.user));
          this.currentUserSubject.next(response.user);
        }
        return response;
      }),
      catchError((error) => {
        console.error('Login error:', error);
        let errorMessage = 'Erreur de connexion. Veuillez réessayer.';

        if (error.status === 400) {
          errorMessage = 'Données de connexion invalides.';
        } else if (error.status === 401) {
          errorMessage = 'Identifiants incorrects.';
        } else if (error.status === 403) {
          errorMessage = 'Accès refusé.';
        } else if (error.status === 500) {
          errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
        } else if (error.status === 0) {
          errorMessage = 'Impossible de contacter le serveur.';
        }

        return throwError(() => ({
          success: false,
          message: errorMessage,
        }));
      })
    );
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return !!this.currentUser;
  }

  hasRole(role: UserRole): boolean {
    return this.currentUser?.role === role;
  }

  isEmployee(): boolean {
    return this.currentUser?.role === UserRole.Employe;
  }

  isAdmin(): boolean {
    return this.currentUser?.role === UserRole.Administrateur;
  }

  canAccessAdmin(): boolean {
    const role = this.currentUser?.role;
    return role === UserRole.Administrateur;
  }

  bypassLogin(): void {
    const fakeUser: User = {
      _id: 'fake-user-id',
      firstName: 'Test',
      usercode: 'test-user',
      role: UserRole.Administrateur,
      lastName: 'string',
      currentPlan: "",
      plans: [""],
    };
    localStorage.setItem('currentUser', JSON.stringify(fakeUser));
    this.currentUserSubject.next(fakeUser);
  }
}
