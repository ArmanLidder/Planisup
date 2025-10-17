import { expect } from 'chai';
import { describe, it, beforeEach, afterEach } from 'mocha';
import * as sinon from 'sinon';
import { Request, Response, NextFunction } from 'express';
import { CourseController } from './course.controller';
import { Logger } from '@app/services/logger.service/logger.service';
import * as loadProgramUtils from '@app/utils/load-program';

describe('CourseController', () => {
  let courseController: CourseController;
  let mockLogger: sinon.SinonStubbedInstance<Logger>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: sinon.SinonStub;
  let responseJson: sinon.SinonStub;
  let responseStatus: sinon.SinonStub;
  let fetchCoursesStub: sinon.SinonStub;
  let fetchTriennalStub: sinon.SinonStub;

  beforeEach(() => {
    mockLogger = sinon.createStubInstance(Logger);
    
    responseJson = sinon.stub();
    responseStatus = sinon.stub().returns({ json: responseJson });
    mockNext = sinon.stub() as sinon.SinonStub & NextFunction;
    
    mockRequest = {};
    
    mockResponse = {
      status: responseStatus,
      json: responseJson
    };

    // Stub utility functions
    fetchCoursesStub = sinon.stub(loadProgramUtils, 'fetchCoursesFromUrl');
    fetchTriennalStub = sinon.stub(loadProgramUtils, 'fetchTriennalFromUrl');

    courseController = new CourseController(mockLogger);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('constructor', () => {
    it('should initialize router with allCourses and courses routes', () => {
      expect(courseController.router).to.exist;
      expect(courseController.router.stack).to.have.lengthOf(2);
      expect(courseController.router.stack[0].route.path).to.equal('/allCourses');
      expect(courseController.router.stack[1].route.path).to.equal('/courses');
    });
  });

  describe('GET /allCourses', () => {
    it('should successfully fetch and filter ES courses and return 200', async () => {
      const mockRawCourses = [
        {
          sigle: ' LOG8970 ',
          titre: 'Software Engineering',
          nombreCredit: 3,
          secteurEnseignement: 'ES',
          indPlanTriAut: true,
          indPlanTriHiv: false,
          indPlanTriEte: false,
          departement: 'Computer Engineering',
          descriptionCours: 'Advanced software engineering course'
        },
        {
          sigle: 'MTH1001',
          titre: 'Mathematics',
          nombreCredit: 4,
          secteurEnseignement: 'MTH',
          indPlanTriAut: true,
          indPlanTriHiv: true,
          indPlanTriEte: false,
          departement: 'Mathematics',
          descriptionCours: 'Basic mathematics'
        },
        {
          sigle: 'LOG8970E',
          titre: 'Software Engineering in English',
          nombreCredit: 3,
          secteurEnseignement: 'ES',
          indPlanTriAut: false,
          indPlanTriHiv: true,
          indPlanTriEte: false,
          departement: 'Computer Engineering',
          descriptionCours: 'Advanced software engineering course in English'
        }
      ];

      fetchCoursesStub.resolves(mockRawCourses);

      await courseController.router.stack[0].route.stack[0].handle(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      const expectedEsCourses = [
        {
          sigle: 'LOG8970',
          name: 'Software Engineering',
          credits: 3,
          semester: {
            Automne: true,
            Hiver: false,
            Été: false
          },
          department: 'Computer Engineering',
          description: 'Advanced software engineering course',
          language: 'Français'
        },
        {
          sigle: 'LOG8970E',
          name: 'Software Engineering in English',
          credits: 3,
          semester: {
            Automne: false,
            Hiver: true,
            Été: false
          },
          department: 'Computer Engineering',
          description: 'Advanced software engineering course in English',
          language: 'Anglais'
        }
      ];

      expect(mockLogger.info.calledWith('Fetching all ES courses...')).to.be.true;
      expect(mockLogger.info.calledWith('Found 2 ES courses from API')).to.be.true;
      expect(fetchCoursesStub.calledOnce).to.be.true;
      expect(responseStatus.calledOnceWith(200)).to.be.true;
      expect(responseJson.calledOnceWith(expectedEsCourses)).to.be.true;
    });

    it('should return empty array when no ES courses found', async () => {
      const mockRawCourses = [
        {
          sigle: 'MTH1001',
          titre: 'Mathematics',
          nombreCredit: 4,
          secteurEnseignement: 'MTH',
          indPlanTriAut: true,
          indPlanTriHiv: true,
          indPlanTriEte: false,
          departement: 'Mathematics',
          descriptionCours: 'Basic mathematics'
        }
      ];

      fetchCoursesStub.resolves(mockRawCourses);

      await courseController.router.stack[0].route.stack[0].handle(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockLogger.info.calledWith('Found 0 ES courses from API')).to.be.true;
      expect(responseStatus.calledOnceWith(200)).to.be.true;
      expect(responseJson.calledOnceWith([])).to.be.true;
    });

    it('should return 500 when fetchCoursesFromUrl throws an error', async () => {
      const error = new Error('API connection failed');
      fetchCoursesStub.rejects(error);

      await courseController.router.stack[0].route.stack[0].handle(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockLogger.info.calledWith('Fetching all ES courses...')).to.be.true;
      expect(mockLogger.error.calledWith('Error fetching courses: Error: API connection failed')).to.be.true;
      expect(responseStatus.calledOnceWith(500)).to.be.true;
      expect(responseJson.calledOnceWith({ error: 'Failed to fetch courses' })).to.be.true;
    });

    it('should handle non-Error exceptions', async () => {
      const errorString = 'Network timeout';
      fetchCoursesStub.rejects(errorString);

      await courseController.router.stack[0].route.stack[0].handle(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockLogger.error.calledWith('Error fetching courses: Network timeout')).to.be.true;
      expect(responseStatus.calledOnceWith(500)).to.be.true;
      expect(responseJson.calledOnceWith({ error: 'Failed to fetch courses' })).to.be.true;
    });
  });

  describe('GET /courses', () => {
    it('should successfully fetch and filter triennal courses and return 200', async () => {
      const mockTriennalCourses = [
        {
          sigle: ' LOG8970 ',
          titre: 'Software Engineering',
          nbCredits: 3,
          codeSecteur: 'ES',
          listPlanTriennal: ['A2024', 'H2025']
        },
        {
          sigle: 'MTH1001',
          titre: 'Mathematics',
          nbCredits: 4,
          codeSecteur: 'MTH',
          listPlanTriennal: ['A2024', 'H2025', 'E2025']
        },
        {
          sigle: 'INF8970',
          titre: 'Computer Science',
          nbCredits: 3,
          codeSecteur: 'ES',
          listPlanTriennal: ['H2025']
        }
      ];

      fetchTriennalStub.resolves(mockTriennalCourses);

      await courseController.router.stack[1].route.stack[0].handle(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      const expectedCourses = [
        {
          sigle: 'LOG8970',
          name: 'Software Engineering',
          credits: 3,
          trimester: ['A2024', 'H2025']
        },
        {
          sigle: 'INF8970',
          name: 'Computer Science',
          credits: 3,
          trimester: ['H2025']
        }
      ];

      expect(mockLogger.info.calledWith('Fetching all courses from triennal...')).to.be.true;
      expect(mockLogger.info.calledWith('Found 2 courses from API')).to.be.true;
      expect(fetchTriennalStub.calledOnce).to.be.true;
      expect(responseStatus.calledOnceWith(200)).to.be.true;
      expect(responseJson.calledOnceWith(expectedCourses)).to.be.true;
    });

    it('should return empty array when no ES courses found in triennal', async () => {
      const mockTriennalCourses = [
        {
          sigle: 'MTH1001',
          titre: 'Mathematics',
          nbCredits: 4,
          codeSecteur: 'MTH',
          listPlanTriennal: ['A2024', 'H2025', 'E2025']
        }
      ];

      fetchTriennalStub.resolves(mockTriennalCourses);

      await courseController.router.stack[1].route.stack[0].handle(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockLogger.info.calledWith('Found 0 courses from API')).to.be.true;
      expect(responseStatus.calledOnceWith(200)).to.be.true;
      expect(responseJson.calledOnceWith([])).to.be.true;
    });

    it('should return 500 when fetchTriennalFromUrl throws an error', async () => {
      const error = new Error('Triennal API failed');
      fetchTriennalStub.rejects(error);

      await courseController.router.stack[1].route.stack[0].handle(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockLogger.info.calledWith('Fetching all courses from triennal...')).to.be.true;
      expect(mockLogger.error.calledWith('Error fetching courses: Error: Triennal API failed')).to.be.true;
      expect(responseStatus.calledOnceWith(500)).to.be.true;
      expect(responseJson.calledOnceWith({ error: 'Failed to fetch courses' })).to.be.true;
    });

    it('should handle non-Error exceptions in triennal endpoint', async () => {
      const errorString = 'Service unavailable';
      fetchTriennalStub.rejects(errorString);

      await courseController.router.stack[1].route.stack[0].handle(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockLogger.error.calledWith('Error fetching courses: Service unavailable')).to.be.true;
      expect(responseStatus.calledOnceWith(500)).to.be.true;
      expect(responseJson.calledOnceWith({ error: 'Failed to fetch courses' })).to.be.true;
    });
  });
});
