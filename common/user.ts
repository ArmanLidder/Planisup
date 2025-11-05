export enum UserRole {
  Etudiant = "ETUDIANT",
  Employe = "EMPLOYE",
  Directeur = "DIRECTEUR",
  Agent = "AGENT",
  Coordonnateur = "COORDONNATEUR",
  Administrateur = "ADMINISTRATEUR",
  Registrar = "REGISTRAR",
}

export interface User {
  _id: string;
  usercode: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  currentPlan: string;
  plans: [string];
  departement?: string;
  // Those properties are linked to the student role only
  programId?: string;
  directorId?: string;
  codirectorsIds?: string[];
  matricule?: string;
}

export interface LoginRequest {
  usercode: string;
  firstName: string;
  lastName: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  success: boolean;
  message?: string;
}
