import { expect } from 'chai';
import { describe, it, beforeEach, afterEach } from 'mocha';
import * as sinon from 'sinon';
import { Request, Response, NextFunction } from 'express';
import { StudyPlanController } from './study-plan.controller';
import { Logger } from '@app/services/logger.service/logger.service';
import { StudyPlanService } from '@app/services/study-plan.service/study-plan.service';
import { StudyPlan } from '@common/study-plan';

describe('StudyPlanController', () => {
  let studyPlanController: StudyPlanController;
  let mockLogger: sinon.SinonStubbedInstance<Logger>;
  let mockStudyPlanService: sinon.SinonStubbedInstance<StudyPlanService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: sinon.SinonStub;
  let responseJson: sinon.SinonStub;
  let responseStatus: sinon.SinonStub;
  let responseSendStatus: sinon.SinonStub;

  beforeEach(() => {
    mockLogger = sinon.createStubInstance(Logger);
    mockStudyPlanService = sinon.createStubInstance(StudyPlanService);
    
    responseJson = sinon.stub();
    responseStatus = sinon.stub().returns({ json: responseJson });
    responseSendStatus = sinon.stub();
    mockNext = sinon.stub() as sinon.SinonStub & NextFunction;
    
    mockRequest = {
      params: {},
      body: {}
    };
    
    mockResponse = {
      status: responseStatus,
      json: responseJson,
      sendStatus: responseSendStatus
    };

    studyPlanController = new StudyPlanController(mockLogger, mockStudyPlanService);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('constructor', () => {
    it('should initialize router with six routes', () => {
      expect(studyPlanController.router).to.exist;
      expect(studyPlanController.router.stack).to.have.lengthOf(6);
      expect(studyPlanController.router.stack[0].route.path).to.equal('/:id');
      expect(studyPlanController.router.stack[1].route.path).to.equal('/assigned/:id');
      expect(studyPlanController.router.stack[2].route.path).to.equal('/student');
      expect(studyPlanController.router.stack[3].route.path).to.equal('/cancel/:id');
      expect(studyPlanController.router.stack[4].route.path).to.equal('/approuved/:id');
      expect(studyPlanController.router.stack[5].route.path).to.equal('/refuse/:id');
    });
  });

  describe('GET /:id', () => {
    it('should successfully get study plan and return 201', async () => {
      const studyPlanId = 'plan123';
      const mockStudyPlan: Partial<StudyPlan> = {
        _id: studyPlanId,
        studentId: 'student123',
        coursesSelection: {
          modules: []
        }
      };
      
      mockRequest.params = { id: studyPlanId };
      mockStudyPlanService.getStudyPlan.resolves(mockStudyPlan as any);

      await studyPlanController.router.stack[0].route.stack[0].handle(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockStudyPlanService.getStudyPlan.calledOnceWith(studyPlanId)).to.be.true;
      expect(responseStatus.calledOnceWith(201)).to.be.true;
      expect(responseJson.calledOnceWith(mockStudyPlan)).to.be.true;
    });

    it('should return 500 when study plan is null', async () => {
      const studyPlanId = 'plan123';
      
      mockRequest.params = { id: studyPlanId };
      mockStudyPlanService.getStudyPlan.resolves(null);

      await studyPlanController.router.stack[0].route.stack[0].handle(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockStudyPlanService.getStudyPlan.calledOnceWith(studyPlanId)).to.be.true;
      expect(responseSendStatus.calledOnceWith(500)).to.be.true;
    });

    it('should return 500 when service throws error', async () => {
      const studyPlanId = 'plan123';
      const error = new Error('Database error');
      
      mockRequest.params = { id: studyPlanId };
      mockStudyPlanService.getStudyPlan.rejects(error);

      await studyPlanController.router.stack[0].route.stack[0].handle(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(responseStatus.calledOnceWith(500)).to.be.true;
      expect(responseJson.calledOnceWith(error)).to.be.true;
    });
  });

  describe('GET /assigned/:id', () => {
    it('should successfully get assigned study plans and return 201', async () => {
      const userId = 'user123';
      const mockStudyPlans = [
        { 
          studyPlanId: 'plan1', 
          firstName: 'John',
          lastName: 'Doe',
          degree: 'Software Engineering',
          date: new Date()
        },
        { 
          studyPlanId: 'plan2', 
          firstName: 'Jane',
          lastName: 'Smith',
          degree: 'Computer Science',
          date: new Date()
        }
      ];
      
      mockRequest.params = { id: userId };
      mockStudyPlanService.getStudyPlans.resolves(mockStudyPlans);

      await studyPlanController.router.stack[1].route.stack[0].handle(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockStudyPlanService.getStudyPlans.calledOnceWith(userId)).to.be.true;
      expect(responseStatus.calledOnceWith(201)).to.be.true;
      expect(responseJson.calledOnceWith(mockStudyPlans)).to.be.true;
    });

    it('should return 500 when study plans is null', async () => {
      const userId = 'user123';
      
      mockRequest.params = { id: userId };
      mockStudyPlanService.getStudyPlans.resolves(null);

      await studyPlanController.router.stack[1].route.stack[0].handle(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(responseSendStatus.calledOnceWith(500)).to.be.true;
    });

    it('should return 500 when service throws error', async () => {
      const userId = 'user123';
      const error = new Error('Service error');
      
      mockRequest.params = { id: userId };
      mockStudyPlanService.getStudyPlans.rejects(error);

      await studyPlanController.router.stack[1].route.stack[0].handle(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(responseStatus.calledOnceWith(500)).to.be.true;
      expect(responseJson.calledOnceWith(error)).to.be.true;
    });
  });

  describe('POST /student', () => {
    it('should successfully handle student submission and return 201', async () => {
    const studyPlanData: Partial<StudyPlan> = {
      studentId: 'student123',
      coursesSelection: {
        modules: [
        { 
          title: 'Core Module', 
          courses: [
            { sigle: 'course1', name: 'Course 1', credits: 3, trimester: 'Automne' },
            { sigle: 'course2', name: 'Course 2', credits: 3, trimester: 'Hiver' }
          ]
        }
        ]
      }
    };
      const createdStudyPlan: Partial<StudyPlan> = {
        _id: 'plan123',
        ...studyPlanData
      };
      
      mockRequest.body = studyPlanData;
      mockStudyPlanService.handleStudentSubmission.resolves(createdStudyPlan as any);

      await studyPlanController.router.stack[2].route.stack[0].handle(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockLogger.info.calledOnceWith('Handle student study plan submission')).to.be.true;
      expect(mockStudyPlanService.handleStudentSubmission.calledOnceWith(studyPlanData)).to.be.true;
      expect(responseStatus.calledOnceWith(201)).to.be.true;
      expect(responseJson.calledOnceWith(createdStudyPlan)).to.be.true;
    });

    it('should return 500 when submission returns null', async () => {
      const studyPlanData: Partial<StudyPlan> = {
        studentId: 'student123'
      };
      
      mockRequest.body = studyPlanData;
      mockStudyPlanService.handleStudentSubmission.resolves(null);

      await studyPlanController.router.stack[2].route.stack[0].handle(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockLogger.info.calledOnceWith('Handle student study plan submission')).to.be.true;
      expect(responseSendStatus.calledOnceWith(500)).to.be.true;
    });

    it('should return 500 when service throws error', async () => {
      const studyPlanData: Partial<StudyPlan> = {
        studentId: 'student123'
      };
      const error = new Error('Submission failed');
      
      mockRequest.body = studyPlanData;
      mockStudyPlanService.handleStudentSubmission.rejects(error);

      await studyPlanController.router.stack[2].route.stack[0].handle(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(responseStatus.calledOnceWith(500)).to.be.true;
      expect(responseJson.calledOnceWith(error)).to.be.true;
    });
  });

  describe('DELETE /cancel/:id', () => {
    it('should successfully cancel study plan and return 200', async () => {
      const studyPlanId = 'plan123';
      
      mockRequest.params = { id: studyPlanId };
      mockStudyPlanService.cancelStudyPlan.resolves();

      await studyPlanController.router.stack[3].route.stack[0].handle(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockLogger.info.calledOnceWith('Handle student study plan cancellation')).to.be.true;
      expect(mockStudyPlanService.cancelStudyPlan.calledOnceWith(studyPlanId)).to.be.true;
      expect(responseStatus.calledOnceWith(200)).to.be.true;
      expect(responseJson.calledOnceWith()).to.be.true;
    });

    it('should return 500 when cancellation throws error', async () => {
      const studyPlanId = 'plan123';
      const error = new Error('Cancellation failed');
      
      mockRequest.params = { id: studyPlanId };
      mockStudyPlanService.cancelStudyPlan.rejects(error);

      await studyPlanController.router.stack[3].route.stack[0].handle(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockLogger.info.calledOnceWith('Handle student study plan cancellation')).to.be.true;
      expect(responseStatus.calledOnceWith(500)).to.be.true;
      expect(responseJson.calledOnceWith(error)).to.be.true;
    });
  });

  describe('PATCH /approuved/:id', () => {
    it('should successfully approve study plan and return 200', async () => {
      const studyPlanId = 'plan123';
      
      mockRequest.params = { id: studyPlanId };
      mockStudyPlanService.validateStudyPlan.resolves();

      await studyPlanController.router.stack[4].route.stack[0].handle(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockLogger.info.calledOnceWith('Handle student study plan approbation')).to.be.true;
      expect(mockStudyPlanService.validateStudyPlan.calledOnceWith(studyPlanId)).to.be.true;
      expect(responseStatus.calledOnceWith(200)).to.be.true;
      expect(responseJson.calledOnceWith()).to.be.true;
    });

    it('should return 500 when validation throws error', async () => {
      const studyPlanId = 'plan123';
      const error = new Error('Validation failed');
      
      mockRequest.params = { id: studyPlanId };
      mockStudyPlanService.validateStudyPlan.rejects(error);

      await studyPlanController.router.stack[4].route.stack[0].handle(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockLogger.info.calledOnceWith('Handle student study plan approbation')).to.be.true;
      expect(responseStatus.calledOnceWith(500)).to.be.true;
      expect(responseJson.calledOnceWith(error)).to.be.true;
    });
  });

  describe('PATCH /refuse/:id', () => {
    it('should successfully refuse study plan and return 200', async () => {
      const studyPlanId = 'plan123';
      
      mockRequest.params = { id: studyPlanId };
      mockStudyPlanService.refuseStudyPlan.resolves();

      await studyPlanController.router.stack[5].route.stack[0].handle(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockLogger.info.calledOnceWith('Handle student study plan refusal')).to.be.true;
      expect(mockStudyPlanService.refuseStudyPlan.calledOnceWith(studyPlanId)).to.be.true;
      expect(responseStatus.calledOnceWith(200)).to.be.true;
      expect(responseJson.calledOnceWith()).to.be.true;
    });

    it('should return 500 when refusal throws error', async () => {
      const studyPlanId = 'plan123';
      const error = new Error('Refusal failed');
      
      mockRequest.params = { id: studyPlanId };
      mockStudyPlanService.refuseStudyPlan.rejects(error);

      await studyPlanController.router.stack[5].route.stack[0].handle(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockLogger.info.calledOnceWith('Handle student study plan refusal')).to.be.true;
      expect(responseStatus.calledOnceWith(500)).to.be.true;
      expect(responseJson.calledOnceWith(error)).to.be.true;
    });
  });
});
