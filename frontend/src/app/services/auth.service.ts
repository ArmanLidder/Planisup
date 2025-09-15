import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { LoginRequest, LoginResponse, User, UserRole } from '../../../../common/user'

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_BASE_URL = 'http://localhost:3000/api'; // Update with your backend URL
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    // Check if user is already logged in
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      this.currentUserSubject.next(JSON.parse(storedUser));
    }
  }

  login(loginRequest: LoginRequest): Observable<User> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post<User>(`${this.API_BASE_URL}/auth/login`, loginRequest, { headers })
      .pipe(
        map((response: User) => {
          if (response._id) {
            localStorage.setItem('currentUser', JSON.stringify(response));
            this.currentUserSubject.next(response);
          }
          return response;
        }),
        catchError((error) => {
          console.error('Login error:', error);
          let errorMessage = 'Erreur de connexion. Veuillez réessayer.';

          if (error.status === 401) {
            errorMessage = 'Identifiants incorrects.';
          } else if (error.status === 403) {
            errorMessage = 'Accès refusé.';
          } else if (error.status === 0) {
            errorMessage = 'Impossible de contacter le serveur.';
          }

          return throwError(() => ({
            success: false,
            message: errorMessage,
            user: {} as User,
            token: ''
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

  bypassLogin(): void {
    const fakeUser: User = {
      _id: 'fake-user-id',
      firstName: 'Test',
      usercode: 'test-user',
      role: UserRole.Etudiant,
      lastName: 'string',
      currentPlan: {},
      plans: [{}],
    };
    localStorage.setItem('currentUser', JSON.stringify(fakeUser));
    this.currentUserSubject.next(fakeUser);
  }
}
