import { expect } from 'chai';
import { describe, it, beforeEach, afterEach } from 'mocha';
import * as sinon from 'sinon';
import { StudyPlanService } from './study-plan.service';
import { Logger } from '@app/services/logger.service/logger.service';
import { UserModel } from '@app/models/user.model/user.model';
import { ProgramModel } from '@app/models/program.model/program.model';
import { ChatModel } from '@app/models/chat.model/chat.model';
import { StudyPlanModel } from '@app/models/study-plan.model/study-plan.model';
import { StudyPlan, StepValidationStatus, StudyPlanStep, StudyPlanStatus } from '@common/study-plan';
import { ProgramType } from '@common/program';
import { UserRole } from '@common/user';

describe('StudyPlanService', () => {
  let studyPlanService: StudyPlanService;
  let mockLogger: sinon.SinonStubbedInstance<Logger>;
  let userModelFindByIdStub: sinon.SinonStub;
  let programModelFindByIdStub: sinon.SinonStub;
  let chatModelCreateStub: sinon.SinonStub;
  let studyPlanModelFindByIdStub: sinon.SinonStub;
  let studyPlanModelFindStub: sinon.SinonStub;
  let studyPlanModelCreateStub: sinon.SinonStub;
  let studyPlanModelFindOneAndUpdateStub: sinon.SinonStub;

  beforeEach(() => {
    mockLogger = sinon.createStubInstance(Logger);
    
    // Stub all model methods
    userModelFindByIdStub = sinon.stub(UserModel, 'findById');
    programModelFindByIdStub = sinon.stub(ProgramModel, 'findById');
    chatModelCreateStub = sinon.stub(ChatModel, 'create');
    studyPlanModelFindByIdStub = sinon.stub(StudyPlanModel, 'findById');
    studyPlanModelFindStub = sinon.stub(StudyPlanModel, 'find');
    studyPlanModelCreateStub = sinon.stub(StudyPlanModel, 'create');
    studyPlanModelFindOneAndUpdateStub = sinon.stub(StudyPlanModel, 'findOneAndUpdate');

    studyPlanService = new StudyPlanService(mockLogger);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('handleStudentSubmission', () => {
    it('should update existing study plan when student has current plan', async () => {
      const studyPlan: Partial<StudyPlan> = {
        _id: 'plan123',
        studentId: 'student123'
      };
      
      const mockStudent = {
        _id: 'student123',
        currentPlan: 'existing-plan-id'
      };

      const mockUpdatedPlan = {
        _id: 'plan123',
        stepValidation: StepValidationStatus.IN_PROGRESS
      };

      userModelFindByIdStub.resolves(mockStudent);
      studyPlanModelFindOneAndUpdateStub.resolves(mockUpdatedPlan);

      const result = await studyPlanService.handleStudentSubmission(studyPlan);

      expect(mockLogger.info.calledWith('Handle Student Submission')).to.be.true;
      expect(userModelFindByIdStub.calledOnceWith('student123')).to.be.true;
      expect(studyPlanModelFindOneAndUpdateStub.calledOnce).to.be.true;
      expect(result).to.equal(mockUpdatedPlan);
    });

    it('should create new study plan when student has no current plan', async () => {
      const studyPlan: Partial<StudyPlan> = {
        studentId: 'student123',
        programType: ProgramType.DESS
      };
      
      const mockStudent = {
        _id: 'student123',
        currentPlan: null as string | null,
        plans: [] as string[],
        save: sinon.stub().resolves()
      };

      const mockCreatedPlan = {
        _id: 'new-plan-id',
        save: sinon.stub().resolves()
      };

      const mockChat = {
        id: 'chat-id'
      };

      userModelFindByIdStub.resolves(mockStudent);
      studyPlanModelCreateStub.resolves(mockCreatedPlan);
      chatModelCreateStub.resolves(mockChat);

      const result = await studyPlanService.handleStudentSubmission(studyPlan);

      expect(userModelFindByIdStub.calledWith('student123')).to.be.true;
      expect(studyPlanModelCreateStub.calledOnce).to.be.true;
      expect(chatModelCreateStub.calledOnce).to.be.true;
      expect(result).to.equal(mockCreatedPlan);
    });

    it('should return null when error occurs', async () => {
      const studyPlan: Partial<StudyPlan> = {
        studentId: 'student123'
      };
      
      const error = new Error('Database error');
      userModelFindByIdStub.rejects(error);

      const result = await studyPlanService.handleStudentSubmission(studyPlan);

      expect(mockLogger.error.calledOnce).to.be.true;
      expect(mockLogger.error.firstCall.args[0]).to.equal(error);
      expect(result).to.be.null;
    });
  });

  describe('getStudyPlan', () => {
    it('should successfully return study plan by id', async () => {
      const studyPlanId = 'plan123';
      const mockStudyPlan = {
        _id: studyPlanId,
        studentId: 'student123'
      };

      studyPlanModelFindByIdStub.resolves(mockStudyPlan);

      const result = await studyPlanService.getStudyPlan(studyPlanId);

      expect(studyPlanModelFindByIdStub.calledOnceWith(studyPlanId)).to.be.true;
      expect(result).to.equal(mockStudyPlan);
    });

    it('should return null when error occurs', async () => {
      const studyPlanId = 'plan123';
      const error = new Error('Not found');
      
      studyPlanModelFindByIdStub.rejects(error);

      const result = await studyPlanService.getStudyPlan(studyPlanId);

      expect(mockLogger.error.calledOnce).to.be.true;
      expect(mockLogger.error.firstCall.args[0]).to.equal(error);
      expect(result).to.be.null;
    });
  });

  describe('getStudyPlans', () => {
    it('should return study plans for director role', async () => {
      const userId = 'director123';
      const mockUser = {
        _id: userId,
        role: UserRole.Directeur
      };

      const mockStudyPlans = [
        { _id: 'plan1', studentId: 'student1', modifiedDate: new Date() },
        { _id: 'plan2', studentId: 'student2', modifiedDate: new Date() }
      ];

      const mockStudents = [
        { firstName: 'John', lastName: 'Doe' },
        { firstName: 'Jane', lastName: 'Smith' }
      ];

      const mockPrograms = [
        { degree: 'Software Engineering' },
        { degree: 'Computer Science' }
      ];

      const mockExec = sinon.stub().resolves(mockStudyPlans);
      
      userModelFindByIdStub.resolves(mockUser);
      studyPlanModelFindStub.returns({ exec: mockExec });
      userModelFindByIdStub.onCall(1).resolves(mockStudents[0]);
      userModelFindByIdStub.onCall(2).resolves(mockStudents[1]);
      programModelFindByIdStub.onFirstCall().resolves(mockPrograms[0]);
      programModelFindByIdStub.onSecondCall().resolves(mockPrograms[1]);

      const result = await studyPlanService.getStudyPlans(userId);

      expect(userModelFindByIdStub.calledWith(userId)).to.be.true;
      expect(studyPlanModelFindStub.calledOnce).to.be.true;
      expect(result).to.have.lengthOf(2);
      expect(result[0]).to.have.property('firstName', 'John');
      expect(result[1]).to.have.property('degree', 'Computer Science');
    });

    it('should return study plans for coordinator role', async () => {
      const userId = 'coordinator123';
      const mockUser = {
        _id: userId,
        role: UserRole.Coordonnateur
      };

      const mockExec = sinon.stub().resolves([]);
      
      userModelFindByIdStub.resolves(mockUser);
      studyPlanModelFindStub.returns({ exec: mockExec });

      const result = await studyPlanService.getStudyPlans(userId);

      const queryCall = studyPlanModelFindStub.firstCall.args[0];
      expect(queryCall).to.have.property('coordonatorId', userId);
      expect(queryCall).to.have.property('studyPlanStep', StudyPlanStep.COORDONATOR);
      expect(result).to.be.an('array').that.is.empty;
    });

    it('should return study plans for agent role', async () => {
      const userId = 'agent123';
      const mockUser = {
        _id: userId,
        role: UserRole.Agent
      };

      const mockExec = sinon.stub().resolves([]);
      
      userModelFindByIdStub.resolves(mockUser);
      studyPlanModelFindStub.returns({ exec: mockExec });

      await studyPlanService.getStudyPlans(userId);

      const queryCall = studyPlanModelFindStub.firstCall.args[0];
      expect(queryCall).to.have.property('studyPlanStep', StudyPlanStep.ADMIN_AGENT);
      expect(queryCall).to.not.have.property('coordonatorId');
    });

    it('should return study plans for registrar role', async () => {
      const userId = 'registrar123';
      const mockUser = {
        _id: userId,
        role: UserRole.Registrar
      };

      const mockExec = sinon.stub().resolves([]);
      
      userModelFindByIdStub.resolves(mockUser);
      studyPlanModelFindStub.returns({ exec: mockExec });

      await studyPlanService.getStudyPlans(userId);

      const queryCall = studyPlanModelFindStub.firstCall.args[0];
      expect(queryCall).to.have.property('studyPlanStep', StudyPlanStep.REGISTRAR);
    });

    it('should return empty array when error occurs', async () => {
      const userId = 'user123';
      const error = new Error('Database error');
      
      userModelFindByIdStub.rejects(error);

      const result = await studyPlanService.getStudyPlans(userId);

      expect(mockLogger.error.calledOnce).to.be.true;
      expect(mockLogger.error.firstCall.args[0]).to.equal(error);
      expect(result).to.deep.equal([]);
    });
  });

  describe('cancelStudyPlan', () => {
    it('should successfully cancel study plan', async () => {
      const studyPlanId = 'plan123';
      const mockStudyPlan = {
        _id: studyPlanId,
        studentId: 'student123',
        status: StudyPlanStatus.LIVE,
        save: sinon.stub().resolves()
      };

      const mockStudent = {
        _id: 'student123',
        currentPlan: studyPlanId,
        save: sinon.stub().resolves()
      };

      studyPlanModelFindByIdStub.resolves(mockStudyPlan);
      userModelFindByIdStub.resolves(mockStudent);

      await studyPlanService.cancelStudyPlan(studyPlanId);

      expect(mockLogger.info.calledWith('Cancel study plan')).to.be.true;
      expect(studyPlanModelFindByIdStub.calledWith(studyPlanId)).to.be.true;
      expect(userModelFindByIdStub.calledWith('student123')).to.be.true;
      expect(mockStudyPlan.status).to.equal(StudyPlanStatus.CANCELLED);
      expect(mockStudent.currentPlan).to.equal('');
      expect(mockStudyPlan.save.calledOnce).to.be.true;
      expect(mockStudent.save.calledOnce).to.be.true;
    });

    it('should handle errors gracefully', async () => {
      const studyPlanId = 'plan123';
      const error = new Error('Database error');
      
      studyPlanModelFindByIdStub.rejects(error);

      await studyPlanService.cancelStudyPlan(studyPlanId);

      expect(mockLogger.error.calledOnce).to.be.true;
      expect(mockLogger.error.firstCall.args[0]).to.equal(error);
    });
  });

  describe('validateStudyPlan', () => {
    it('should validate non-DESS study plan and increment step', async () => {
      const studyPlanId = 'plan123';
      const mockStudyPlan = {
        _id: studyPlanId,
        programType: ProgramType.MASTER, // Changed to non-DESS type
        studyPlanStep: StudyPlanStep.DIRECTOR,
        stepValidation: StepValidationStatus.IN_PROGRESS,
        save: sinon.stub().resolves()
      };

      studyPlanModelFindByIdStub.resolves(mockStudyPlan);

      await studyPlanService.validateStudyPlan(studyPlanId);

      expect(mockLogger.info.calledWith('Validate study plan')).to.be.true;
      expect(mockStudyPlan.studyPlanStep).to.equal(StudyPlanStep.ADMIN_AGENT);
      expect(mockStudyPlan.stepValidation).to.equal(StepValidationStatus.IN_PROGRESS);
      expect(mockStudyPlan.save.calledOnce).to.be.true;
    });

    it('should validate DESS study plan and increment step', async () => {
      const studyPlanId = 'plan123';
      const mockStudyPlan = {
        _id: studyPlanId,
        programType: ProgramType.DESS,
        studyPlanStep: StudyPlanStep.ADMIN_AGENT,
        stepValidation: StepValidationStatus.IN_PROGRESS,
        save: sinon.stub().resolves()
      };

      studyPlanModelFindByIdStub.resolves(mockStudyPlan);

      await studyPlanService.validateStudyPlan(studyPlanId);

      expect(mockStudyPlan.studyPlanStep).to.equal(StudyPlanStep.DIRECTOR);
      expect(mockStudyPlan.stepValidation).to.equal(StepValidationStatus.IN_PROGRESS);
    });

    it('should mark as validated when at registrar step', async () => {
      const studyPlanId = 'plan123';
      const mockStudyPlan = {
        _id: studyPlanId,
        programType: ProgramType.DESS,
        studyPlanStep: StudyPlanStep.REGISTRAR,
        stepValidation: StepValidationStatus.IN_PROGRESS,
        status: StudyPlanStatus.LIVE,
        save: sinon.stub().resolves()
      };

      studyPlanModelFindByIdStub.resolves(mockStudyPlan);

      await studyPlanService.validateStudyPlan(studyPlanId);

      expect(mockStudyPlan.status).to.equal(StudyPlanStatus.VALIDATED);
      expect(mockStudyPlan.stepValidation).to.equal(StepValidationStatus.APPROVED);
    });

    it('should handle validation errors', async () => {
      const studyPlanId = 'plan123';
      const error = new Error('Validation error');
      
      studyPlanModelFindByIdStub.rejects(error);

      await studyPlanService.validateStudyPlan(studyPlanId);

      expect(mockLogger.error.calledOnce).to.be.true;
      expect(mockLogger.error.firstCall.args[0]).to.equal(error);
    });
  });

  describe('refuseStudyPlan', () => {
    it('should successfully refuse study plan', async () => {
      const studyPlanId = 'plan123';
      const mockStudyPlan = {
        _id: studyPlanId,
        stepValidation: StepValidationStatus.IN_PROGRESS,
        save: sinon.stub().resolves()
      };

      studyPlanModelFindByIdStub.resolves(mockStudyPlan);

      await studyPlanService.refuseStudyPlan(studyPlanId);

      expect(mockLogger.info.calledWith('Refuse study plan')).to.be.true;
      expect(studyPlanModelFindByIdStub.calledWith(studyPlanId)).to.be.true;
      expect(mockStudyPlan.stepValidation).to.equal(StepValidationStatus.NEEDS_CORRECTION);
      expect(mockStudyPlan.save.calledOnce).to.be.true;
    });

    it('should handle refusal errors', async () => {
      const studyPlanId = 'plan123';
      const error = new Error('Refusal error');
      
      studyPlanModelFindByIdStub.rejects(error);

      await studyPlanService.refuseStudyPlan(studyPlanId);

      expect(mockLogger.error.calledOnce).to.be.true;
      expect(mockLogger.error.firstCall.args[0]).to.equal(error);
    });
  });

  describe('private methods integration', () => {
    it('should create new study plan with DESS program type', async () => {
      const studyPlan: Partial<StudyPlan> = {
        studentId: 'student123',
        programType: ProgramType.DESS
      };
      
      const mockStudent = {
        _id: 'student123',
        currentPlan: null as string | null,
        plans: [] as string[],
        save: sinon.stub().resolves()
      };

      const mockCreatedPlan = {
        _id: 'new-plan-id',
        studyPlanStep: StudyPlanStep.ADMIN_AGENT,
        status: StudyPlanStatus.LIVE,
        stepValidation: StepValidationStatus.IN_PROGRESS,
        save: sinon.stub().resolves()
      };

      const mockChat = {
        id: 'chat-id'
      };

      userModelFindByIdStub.resolves(mockStudent);
      studyPlanModelCreateStub.resolves(mockCreatedPlan);
      chatModelCreateStub.resolves(mockChat);

      await studyPlanService.handleStudentSubmission(studyPlan);

      const createCall = studyPlanModelCreateStub.firstCall.args[0];
      expect(createCall.studyPlanStep).to.equal(StudyPlanStep.ADMIN_AGENT);
      expect(createCall.status).to.equal(StudyPlanStatus.LIVE);
      expect(createCall.stepValidation).to.equal(StepValidationStatus.IN_PROGRESS);
    });

    it('should create new study plan with non-DESS program type', async () => {
      const studyPlan: Partial<StudyPlan> = {
        studentId: 'student123',
        programType: ProgramType.MASTER // Changed to non-DESS type
      };
      
      const mockStudent = {
        _id: 'student123',
        currentPlan: null as string | null,
        plans: [] as string[],
        save: sinon.stub().resolves()
      };

      const mockCreatedPlan = {
        _id: 'new-plan-id',
        save: sinon.stub().resolves()
      };

      const mockChat = {
        id: 'chat-id'
      };

      userModelFindByIdStub.resolves(mockStudent);
      studyPlanModelCreateStub.resolves(mockCreatedPlan);
      chatModelCreateStub.resolves(mockChat);

      await studyPlanService.handleStudentSubmission(studyPlan);

      const createCall = studyPlanModelCreateStub.firstCall.args[0];
      expect(createCall.studyPlanStep).to.equal(StudyPlanStep.DIRECTOR);
    });

    it('should handle chat creation error during new study plan creation', async () => {
      const studyPlan: Partial<StudyPlan> = {
        studentId: 'student123',
        programType: ProgramType.DESS
      };
      
      const mockStudent = {
        _id: 'student123',
        currentPlan: null as string | null,
        plans: [] as string[],
        save: sinon.stub().resolves()
      };

      const mockCreatedPlan = {
        _id: 'new-plan-id',
        save: sinon.stub().resolves()
      };

      const chatError = new Error('Chat creation failed');

      userModelFindByIdStub.resolves(mockStudent);
      studyPlanModelCreateStub.resolves(mockCreatedPlan);
      chatModelCreateStub.rejects(chatError);

      const result = await studyPlanService.handleStudentSubmission(studyPlan);

      expect(mockLogger.error.calledOnce).to.be.true;
      expect(mockLogger.error.firstCall.args[0]).to.equal(chatError);
      expect(result).to.be.null;
    });
  });
});
