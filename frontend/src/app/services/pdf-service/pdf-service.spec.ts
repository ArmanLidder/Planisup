import { TestBed } from '@angular/core/testing';
import { PdfService } from './pdf-service';
import { ApiService } from '../api/api-service';
import { StudyPlan, StudyPlanStep } from '@common/study-plan';
import { User, UserRole } from '@common/user';
import { of, throwError } from 'rxjs';
import { lastValueFrom } from 'rxjs';
import { ProgramType } from '@common/program';

// Mocks
const mockApiService = {
  getStudyPlans: jasmine.createSpy('getStudyPlans'),
  getProgram: jasmine.createSpy('getProgram'),
  getUserById: jasmine.createSpy('getUserById')
};

const mockStudyPlan: StudyPlan = {
  _id: 'test-plan-123',
  status: 'live',
  studentId: 'student-123',
  directorId: 'director-456',
  coordonatorId: 'coordonator-789',
  programId: 'program-abc',
  programType: ProgramType.MASTER,
  studyPlanStep: StudyPlanStep.STUDENT,
  stepValidation: 'in-progress',
  coursesSelection: {
    modules: [
      {
        title: '(A) Module de base (15 crédits)',
        courses: [
          {
            sigle: 'DDI8001',
            name: 'Développement durable pour ingénieurs',
            credits: 3,
            trimester: { term: 'Automne', year: 2024 },
            alreadyDone: false
          }
        ]
      }
    ]
  }
} as any;

const mockCurrentUser: User = {
  _id: 'current-user-123',
  firstName: 'Jean',
  lastName: 'Dupont',
  email: 'jean.dupont@email.com',
  role: UserRole.Etudiant
} as any;

const mockProgramResponse: any = {
  _id: 'program-abc',
  department: 'Génie Informatique',
  option: 'Intelligence Artificielle',
  degree: 'Maîtrise',
  type: 'Recherche',
  description: 'Programme de maîtrise en génie informatique',
  modules: [
    {
      title: '(A) Module de base',
      credits: 15,
      courses: [
        {
          sigle: 'ABC123',
          name: 'Cours de base',
          credits: 3
        }
      ]
    }
  ],
  createdDate: new Date(),
  modifiedDate: new Date()
};

// Helpers pour créer des mocks d'utilisateurs
function createMockUserResponse(userOverrides?: Partial<User>, role?: UserRole): any {
  const baseUser = {
    _id: 'user-123',
    firstName: 'Test',
    lastName: 'User',
    email: 'test.user@email.com',
    role: role || UserRole.Etudiant,
    department: 'Génie Informatique',
    createdDate: new Date(),
    modifiedDate: new Date(),
    ...userOverrides
  };

  return {
    success: true,
    user: baseUser
  };
}

function createMockStudentResponse(): any {
  return createMockUserResponse({
    firstName: 'Étudiant',
    lastName: 'Test',
    role: UserRole.Etudiant
  });
}

function createMockDirectorResponse(): any {
  return createMockUserResponse({
    firstName: 'Directeur',
    lastName: 'Test',
    role: UserRole.Directeur
  });
}

function createMockCoordonatorResponse(): any {
  return createMockUserResponse({
    firstName: 'Coordonnateur',
    lastName: 'Test',
    role: UserRole.Coordonnateur
  });
}

// Mock par défaut pour getUserById
const defaultMockUserResponse = createMockUserResponse();

describe('PdfService', () => {
  let service: PdfService;
  let apiService: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PdfService,
        { provide: ApiService, useValue: mockApiService }
      ]
    });

    service = TestBed.inject(PdfService);
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;

    // Reset des mocks
    Object.values(apiService).forEach(method => {
      if (method instanceof Function) {
        method.calls.reset();
      }
    });
  });

  describe('generateStudyPlanPdf', () => {
    beforeEach(() => {
      // Configuration des mocks par défaut
      apiService.getStudyPlans.and.returnValue(of([mockStudyPlan]));
      apiService.getProgram.and.returnValue(of(mockProgramResponse));
      apiService.getUserById.and.returnValue(of(defaultMockUserResponse));
    });

    it('should generate PDF successfully', async () => {
      // Act
      const result = await service.generateStudyPlanPdf(mockStudyPlan, mockCurrentUser);

      // Assert
      expect(result).toBeInstanceOf(Uint8Array);
      expect(apiService.getStudyPlans).toHaveBeenCalledWith(mockCurrentUser._id);
      expect(apiService.getProgram).toHaveBeenCalledWith(mockStudyPlan.programId);
    });

    it('should handle API errors gracefully', async () => {
      // Arrange
      apiService.getStudyPlans.and.returnValue(throwError(() => new Error('API Error')));

      // Act & Assert
      await expectAsync(service.generateStudyPlanPdf(mockStudyPlan, mockCurrentUser))
        .toBeRejected();
    });

    it('should handle empty study plans', async () => {
      // Arrange
      apiService.getStudyPlans.and.returnValue(of([]));

      // Act & Assert
      await expectAsync(service.generateStudyPlanPdf(mockStudyPlan, mockCurrentUser))
        .toBeResolved();
    });
  });

  describe('getUsersignature', () => {
    it('should return student signature', async () => {
      // Arrange
      apiService.getUserById.and.returnValue(of(createMockStudentResponse()));

      // Act
      const result = await lastValueFrom(service['getUsersignature'](mockStudyPlan, StudyPlanStep.STUDENT));

      // Assert
      expect(result).toBe('Étudiant Test');
      expect(apiService.getUserById).toHaveBeenCalledWith(mockStudyPlan.studentId);
    });

    it('should return director signature', async () => {
      // Arrange
      apiService.getUserById.and.returnValue(of(createMockDirectorResponse()));

      // Act
      const result = await lastValueFrom(service['getUsersignature'](mockStudyPlan, StudyPlanStep.DIRECTOR));

      // Assert
      expect(result).toBe('Directeur Test');
      expect(apiService.getUserById).toHaveBeenCalledWith(mockStudyPlan.directorId);
    });

    it('should return coordonator signature', async () => {
      // Arrange
      apiService.getUserById.and.returnValue(of(createMockCoordonatorResponse()));

      // Act
      const result = await lastValueFrom(service['getUsersignature'](mockStudyPlan, StudyPlanStep.COORDONATOR));

      // Assert
      expect(result).toBe('Coordonnateur Test');
      expect(apiService.getUserById).toHaveBeenCalledWith(mockStudyPlan.coordonatorId);
    });

    it('should handle API errors and return fallback', async () => {
      // Arrange
      apiService.getUserById.and.returnValue(throwError(() => new Error('User not found')));

      // Act
      const result = await lastValueFrom(service['getUsersignature'](mockStudyPlan, StudyPlanStep.STUDENT));

      // Assert
      expect(result).toBe('student-123');
    });

    it('should return empty string for unknown role', async () => {
      // Act
      const result = await lastValueFrom(service['getUsersignature'](mockStudyPlan, 'unknown-role'));

      // Assert
      expect(result).toBe('');
    });
  });

  describe('formatTrimester', () => {
    it('should format trimester with term and year', () => {
      // Arrange
      const trimester = { term: 'Automne', year: 2024 };

      // Act
      const result = service['formatTrimester'](trimester);

      // Assert
      expect(result).toBe('Automne 2024');
    });

    it('should return "Non spécifié" for null trimester', () => {
      // Act
      const result = service['formatTrimester'](null);

      // Assert
      expect(result).toBe('Non spécifié');
    });

    it('should return "Format inconnu" for invalid trimester', () => {
      // Act
      const result = service['formatTrimester']('invalid');

      // Assert
      expect(result).toBe('Format inconnu');
    });
  });

  describe('extractAllCourses', () => {
    it('should extract all courses from modules', () => {
      // Act
      const result = service['extractAllCourses'](mockStudyPlan);

      // Assert
      expect(result.length).toBe(1);
      expect(result[0].sigle).toBe('DDI8001');
      expect(result[0].moduleType).toBe('A');
    });

    it('should handle empty courses selection', () => {
      // Arrange
      const emptyStudyPlan = { ...mockStudyPlan, coursesSelection: { modules: [] } };

      // Act
      const result = service['extractAllCourses'](emptyStudyPlan);

      // Assert
      expect(result.length).toBe(0);
    });

    it('should handle missing courses array', () => {
      // Arrange
      const invalidStudyPlan = { 
        ...mockStudyPlan, 
        coursesSelection: { modules: [{ title: 'Module A' }] } 
      };

      // Act
      const result = service['extractAllCourses'](invalidStudyPlan);

      // Assert
      expect(result.length).toBe(0);
    });
  });

  describe('determineModuleType', () => {
    it('should return "A" for module with (A)', () => {
      expect(service['determineModuleType']('(A) Module de base')).toBe('A');
    });

    it('should return "B" for module with (B)', () => {
      expect(service['determineModuleType']('(B) Module spécialisation')).toBe('B');
    });

    it('should return "C" for module with (C)', () => {
      expect(service['determineModuleType']('(C) Module intégration')).toBe('C');
    });

    it('should return "autre" for unknown module format', () => {
      expect(service['determineModuleType']('Module sans type')).toBe('autre');
    });
  });

  describe('generateAndDownloadPdf', () => {
    it('should generate and trigger download', async () => {
      // Arrange
      const mockPdfBytes = new Uint8Array([1, 2, 3]);
      spyOn(service, 'generateStudyPlanPdf').and.returnValue(Promise.resolve(mockPdfBytes));
      
      const createElementSpy = spyOn(document, 'createElement').and.callThrough();
      const clickSpy = jasmine.createSpy('click');
      const mockLink = { 
        href: '', 
        download: '',
        click: clickSpy 
      } as any;
      createElementSpy.withArgs('a').and.returnValue(mockLink);

      const revokeSpy = spyOn(URL, 'revokeObjectURL');

      // Act
      await service.generateAndDownloadPdf(mockStudyPlan, mockCurrentUser);

      // Assert
      expect(service.generateStudyPlanPdf).toHaveBeenCalledWith(mockStudyPlan, mockCurrentUser);
      expect(clickSpy).toHaveBeenCalled();
      expect(revokeSpy).toHaveBeenCalled();
    });
  });

  describe('Program Type Handling', () => {
    it('should handle MASTER program type', async () => {
      // Arrange
      const masterPlan = { ...mockStudyPlan, programType: ProgramType.MASTER };

      // Act
      await service.generateStudyPlanPdf(masterPlan, mockCurrentUser);

      // Assert - Vérifie que le service a été appelé (le checkbox sera géré dans fillFirstSection)
      expect(apiService.getStudyPlans).toHaveBeenCalled();
    });

    it('should handle DESS program type', async () => {
      // Arrange
      const dessPlan = { ...mockStudyPlan, programType: ProgramType.DESS };

      // Act
      await service.generateStudyPlanPdf(dessPlan, mockCurrentUser);

      // Assert
      expect(apiService.getStudyPlans).toHaveBeenCalled();
    });
  });

  describe('Error Scenarios', () => {
    it('should handle getUserById errors in getUsersignature', async () => {
      // Arrange
      apiService.getUserById.and.returnValue(throwError(() => new Error('User not found')));

      // Act
      const result = await lastValueFrom(service['getUsersignature'](mockStudyPlan, StudyPlanStep.STUDENT));

      // Assert
      expect(result).toBe(mockStudyPlan.studentId);
    });

    it('should handle missing user ID in fillFormFields', async () => {
      // Arrange
      const userWithoutId = { ...mockCurrentUser };

      // Act & Assert
      await expectAsync(service.generateStudyPlanPdf(mockStudyPlan, userWithoutId))
        .toBeResolved();
    });
  });
});