import { expect } from 'chai';
import { describe, it, beforeEach, afterEach } from 'mocha';
import * as sinon from 'sinon';
import { Request, Response, NextFunction } from 'express';
import { ProgramController } from './program.controller';
import { Logger } from '@app/services/logger.service/logger.service';
import { ProgramModel, IProgram } from '@app/models/program.model/program.model';

describe('ProgramController', () => {
  let programController: ProgramController;
  let mockLogger: sinon.SinonStubbedInstance<Logger>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: sinon.SinonStub;
  let responseJson: sinon.SinonStub;
  let responseStatus: sinon.SinonStub;
  let programModelFindStub: sinon.SinonStub;
  let programModelFindByIdStub: sinon.SinonStub;
  let convertToReduceProgramStub: sinon.SinonStub;

  beforeEach(() => {
    mockLogger = sinon.createStubInstance(Logger);
    
    responseJson = sinon.stub();
    responseStatus = sinon.stub().returns({ json: responseJson });
    mockNext = sinon.stub() as sinon.SinonStub & NextFunction;
    
    mockRequest = {
      params: {}
    };
    
    mockResponse = {
      status: responseStatus,
      json: responseJson
    };

    // Stub ProgramModel methods
    programModelFindStub = sinon.stub(ProgramModel, 'find');
    programModelFindByIdStub = sinon.stub(ProgramModel, 'findById');
    
    // Mock exec method for chaining
    const mockExec = sinon.stub().resolves([]);
    programModelFindStub.returns({ exec: mockExec });
    programModelFindByIdStub.returns({ exec: mockExec });

    // Stub convertToReduceProgram function
    convertToReduceProgramStub = sinon.stub();
    sinon.replace(require('@app/models/program.model/program.model'), 'convertToReduceProgram', convertToReduceProgramStub);

    programController = new ProgramController(mockLogger);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('constructor', () => {
    it('should initialize router with three routes', () => {
      expect(programController.router).to.exist;
      expect(programController.router.stack).to.have.lengthOf(4);
      expect(programController.router.stack[0].route.path).to.equal('/query/:type');
      expect(programController.router.stack[1].route.path).to.equal('/query/:type/:department');
      expect(programController.router.stack[2].route.path).to.equal('/:id');
    });
  });

  describe('GET /query/:type', () => {
    it('should successfully fetch departments for a given type and return 200', async () => {
      const mockPrograms: Partial<IProgram>[] = [
        { department: 'Computer Engineering', type: ['Graduate'] },
        { department: 'Electrical Engineering', type: ['Graduate'] },
        { department: 'Computer Engineering', type: ['Graduate'] }, // Duplicate
        { department: 'Mechanical Engineering', type: ['Graduate'] }
      ];
      
      const mockExec = sinon.stub().resolves(mockPrograms);
      programModelFindStub.returns({ exec: mockExec });
      
      mockRequest.params = { type: 'Graduate' };

      await programController.router.stack[0].route.stack[0].handle(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      const expectedDepartments = [
        'Computer Engineering',
        'Electrical Engineering', 
        'Mechanical Engineering'
      ];

      expect(mockLogger.info.calledOnceWith("Fetching Graduate' programs")).to.be.true;
      expect(programModelFindStub.calledOnceWith({ type: 'Graduate' })).to.be.true;
      expect(responseStatus.calledOnceWith(200)).to.be.true;
      expect(responseJson.calledOnceWith(expectedDepartments)).to.be.true;
    });

    it('should return empty array when no programs found for type', async () => {
      const mockExec = sinon.stub().resolves([]);
      programModelFindStub.returns({ exec: mockExec });
      
      mockRequest.params = { type: 'Unknown' };

      await programController.router.stack[0].route.stack[0].handle(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockLogger.info.calledOnceWith("Fetching Unknown' programs")).to.be.true;
      expect(responseStatus.calledOnceWith(200)).to.be.true;
      expect(responseJson.calledOnceWith([])).to.be.true;
    });

    it('should return 500 when database query fails', async () => {
      const error = new Error('Database connection failed');
      const mockExec = sinon.stub().rejects(error);
      programModelFindStub.returns({ exec: mockExec });
      
      mockRequest.params = { type: 'Graduate' };

      await programController.router.stack[0].route.stack[0].handle(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockLogger.warn.calledOnce).to.be.true;
      expect(mockLogger.warn.firstCall.args[0]).to.equal(error);
      expect(responseStatus.calledOnceWith(500)).to.be.true;
    });
  });

  describe('GET /query/:type/:department', () => {
    it('should successfully fetch programs for type and department and return 200', async () => {
      const mockPrograms: Partial<IProgram>[] = [
        { 
          _id: 'prog1',
          degree: 'Software Engineering',
          type: ['Graduate'],
          department: 'Computer Engineering'
        },
        { 
          _id: 'prog2',
          degree: 'Computer Science',
          type: ['Graduate'],
          department: 'Computer Engineering'
        }
      ];

      const mockReducedPrograms = [
        { id: 'prog1', name: 'Software Engineering', code: 'SE' },
        { id: 'prog2', name: 'Computer Science', code: 'CS' }
      ];
      
      const mockExec = sinon.stub().resolves(mockPrograms);
      programModelFindStub.returns({ exec: mockExec });
      convertToReduceProgramStub.onFirstCall().returns(mockReducedPrograms[0]);
      convertToReduceProgramStub.onSecondCall().returns(mockReducedPrograms[1]);
      
      mockRequest.params = { type: 'Graduate', department: 'Computer Engineering' };

      await programController.router.stack[1].route.stack[0].handle(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockLogger.info.calledOnceWith('Fetching programs for type=Graduate, departement=Computer Engineering')).to.be.true;
      expect(programModelFindStub.calledOnceWith({
        type: { $in: ['Graduate'] },
        department: 'Computer Engineering'
      })).to.be.true;
      expect(convertToReduceProgramStub.calledTwice).to.be.true;
      expect(responseStatus.calledOnceWith(200)).to.be.true;
      expect(responseJson.calledOnceWith(mockReducedPrograms)).to.be.true;
    });

    it('should return empty array when no programs found for type and department', async () => {
      const mockExec = sinon.stub().resolves([]);
      programModelFindStub.returns({ exec: mockExec });
      
      mockRequest.params = { type: 'Graduate', department: 'Unknown Department' };

      await programController.router.stack[1].route.stack[0].handle(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(responseStatus.calledOnceWith(200)).to.be.true;
      expect(responseJson.calledOnceWith([])).to.be.true;
    });

    it('should return 500 when database query fails', async () => {
      const error = new Error('Database error');
      const mockExec = sinon.stub().rejects(error);
      programModelFindStub.returns({ exec: mockExec });
      
      mockRequest.params = { type: 'Graduate', department: 'Computer Engineering' };

      await programController.router.stack[1].route.stack[0].handle(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockLogger.warn.calledOnce).to.be.true;
      expect(mockLogger.warn.firstCall.args[0]).to.equal(error);
      expect(responseStatus.calledOnceWith(500)).to.be.true;
      expect(responseJson.calledOnceWith({ error: 'Internal Server Error' })).to.be.true;
    });
  });

  describe('GET /:id', () => {
    it('should successfully fetch program by id and return 200', async () => {
      const mockProgram: Partial<IProgram> = {
        _id: 'program123',
        degree: 'Software Engineering',
        type: ['Graduate'],
        department: 'Computer Engineering',
        description: 'Advanced software engineering program'
      };
      
      const mockExec = sinon.stub().resolves(mockProgram);
      programModelFindByIdStub.returns({ exec: mockExec });
      
      mockRequest.params = { id: 'program123' };

      await programController.router.stack[2].route.stack[0].handle(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(programModelFindByIdStub.calledOnceWith('program123')).to.be.true;
      expect(responseStatus.calledOnceWith(200)).to.be.true;
      expect(responseJson.calledOnceWith(mockProgram)).to.be.true;
    });

    it('should return 404 when program not found', async () => {
      const mockExec = sinon.stub().resolves(null);
      programModelFindByIdStub.returns({ exec: mockExec });
      
      mockRequest.params = { id: 'nonexistent' };

      await programController.router.stack[2].route.stack[0].handle(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(programModelFindByIdStub.calledOnceWith('nonexistent')).to.be.true;
      expect(responseStatus.calledOnceWith(404)).to.be.true;
      expect(responseJson.calledOnceWith({ error: 'Program not found' })).to.be.true;
    });

    it('should return 500 when database query fails', async () => {
      const error = new Error('Database connection lost');
      const mockExec = sinon.stub().rejects(error);
      programModelFindByIdStub.returns({ exec: mockExec });
      
      mockRequest.params = { id: 'program123' };

      await programController.router.stack[2].route.stack[0].handle(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockLogger.warn.calledOnce).to.be.true;
      expect(mockLogger.warn.firstCall.args[0]).to.equal(error);
      expect(responseStatus.calledOnceWith(500)).to.be.true;
      expect(responseJson.calledOnceWith({ error: 'Internal Server Error' })).to.be.true;
    });

    it('should handle invalid ObjectId format', async () => {
      const error = new Error('Cast to ObjectId failed');
      const mockExec = sinon.stub().rejects(error);
      programModelFindByIdStub.returns({ exec: mockExec });
      
      mockRequest.params = { id: 'invalid-id' };

      await programController.router.stack[2].route.stack[0].handle(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockLogger.warn.calledOnce).to.be.true;
      expect(mockLogger.warn.firstCall.args[0]).to.equal(error);
      expect(responseStatus.calledOnceWith(500)).to.be.true;
      expect(responseJson.calledOnceWith({ error: 'Internal Server Error' })).to.be.true;
    });
  });
});
