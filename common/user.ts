export enum UserRole {
    Etudiant = 'ETUDIANT',
    Directeur = 'DIRECTEUR',
    Agent = 'AGENT',
    Coordonnateur = 'COORDONNATEUR',
    Administrateur = 'ADMINISTRATEUR',
}

export interface User {
    _id: string;
    usercode: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    currentPlan: Object;
    plans: [Object];
}
export interface LoginRequest {
    usercode: string;
    firstName: string;
    lastName: string;
    role: UserRole;
}

export interface LoginResponse {
    user: User;
    token: string;
    success: boolean;
    message?: string;
}
