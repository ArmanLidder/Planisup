import { expect } from 'chai';
import { describe, it, beforeEach, afterEach } from 'mocha';
import * as sinon from 'sinon';
import { Request, Response, NextFunction } from 'express';
import { ChatController } from './chat.controller';
import { Logger } from '@app/services/logger.service/logger.service';
import { ChatModel, IMessage } from '@app/models/chat.model/chat.model';
import { UserRole } from '@common/user';

describe('ChatController', () => {
  let chatController: ChatController;
  let mockLogger: sinon.SinonStubbedInstance<Logger>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: sinon.SinonStub;
  let responseJson: sinon.SinonStub;
  let responseStatus: sinon.SinonStub;
  let chatModelStub: sinon.SinonStub;
  let chatModelUpdateStub: sinon.SinonStub;
  let convertToChatStub: sinon.SinonStub;
  let consoleLogStub: sinon.SinonStub;

  beforeEach(() => {
    mockLogger = sinon.createStubInstance(Logger);
    
    responseJson = sinon.stub();
    responseStatus = sinon.stub().returns({ json: responseJson });
    mockNext = sinon.stub() as sinon.SinonStub & NextFunction;
    
    mockRequest = {
      params: {},
      body: {}
    };
    
    mockResponse = {
      status: responseStatus,
      json: responseJson
    };

    // Stub ChatModel methods
    chatModelStub = sinon.stub(ChatModel, 'findById');
    chatModelUpdateStub = sinon.stub(ChatModel, 'findOneAndUpdate');
    
    // Stub convertToChat function
    convertToChatStub = sinon.stub();
    sinon.replace(require('@app/models/chat.model/chat.model'), 'convertToChat', convertToChatStub);
    
    // Stub console.log
    consoleLogStub = sinon.stub(console, 'log');

    chatController = new ChatController(mockLogger);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('constructor', () => {
    it('should initialize router with GET and POST routes', () => {
      expect(chatController.router).to.exist;
      expect(chatController.router.stack).to.have.lengthOf(2);
    });
  });

  describe('GET /:id', () => {
    it('should successfully fetch chat messages and return 200', async () => {
      const chatId = '507f1f77bcf86cd799439011';
      const mockChat = { _id: chatId, messages: [] as IMessage[] };
      const convertedChat = { id: chatId, messages: [] as IMessage[] };
      
      mockRequest.params = { id: chatId };
      chatModelStub.resolves(mockChat);
      convertToChatStub.returns(convertedChat);

      await chatController.router.stack[0].route.stack[0].handle(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockLogger.info.calledOnceWith('Fetching message for study-plan')).to.be.true;
      expect(chatModelStub.calledOnceWith(chatId)).to.be.true;
      expect(convertToChatStub.calledOnceWith(mockChat)).to.be.true;
      expect(responseStatus.calledOnceWith(200)).to.be.true;
      expect(responseJson.calledOnceWith(convertedChat)).to.be.true;
    });

    it('should return 500 when ChatModel.findById throws an error', async () => {
      const chatId = '507f1f77bcf86cd799439011';
      const error = new Error('Database connection failed');
      
      mockRequest.params = { id: chatId };
      chatModelStub.rejects(error);

      await chatController.router.stack[0].route.stack[0].handle(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockLogger.info.calledOnceWith('Fetching message for study-plan')).to.be.true;
      expect(mockLogger.error.calledOnceWith('Error fetching messages: Error: Database connection failed')).to.be.true;
      expect(responseStatus.calledOnceWith(500)).to.be.true;
      expect(responseJson.calledOnceWith({
        error: 'Internal server error',
        details: error
      })).to.be.true;
    });

    it('should handle non-Error exceptions', async () => {
      const chatId = '507f1f77bcf86cd799439011';
      const errorString = 'String error';
      
      mockRequest.params = { id: chatId };
      chatModelStub.rejects(errorString);

      await chatController.router.stack[0].route.stack[0].handle(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockLogger.info.calledOnceWith('Fetching message for study-plan')).to.be.true;
      expect(mockLogger.error.calledOnce).to.be.true;
      expect(mockLogger.error.firstCall.args[0]).to.equal('Error fetching messages: String error');
      expect(responseStatus.calledOnceWith(500)).to.be.true;
      expect(responseJson.calledOnceWith({
        error: 'Internal server error',
        details: errorString
      })).to.be.false;
    });
  });

  describe('POST /:id', () => {
    it('should successfully add message to chat and return 200', async () => {
      const chatId = '507f1f77bcf86cd799439011';
      const message: IMessage = {
        senderId: 'user123',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.Etudiant,
        message: 'Hello world',
        sentDate: new Date()
      };
      const updatedChat = {
        _id: chatId,
        messages: [message]
      };
      
      mockRequest.params = { id: chatId };
      mockRequest.body = message;
      chatModelUpdateStub.resolves(updatedChat);

      await chatController.router.stack[1].route.stack[0].handle(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockLogger.info.calledOnceWith('Handle message reception')).to.be.true;
      expect(consoleLogStub.calledWith('message', message)).to.be.true;
      expect(chatModelUpdateStub.calledOnceWith(
        { _id: chatId },
        { $push: { messages: message } },
        { new: true }
      )).to.be.true;
      expect(responseStatus.calledOnceWith(200)).to.be.true;
      expect(responseJson.calledOnceWith(updatedChat)).to.be.true;
    });

    it('should return 500 when ChatModel.findOneAndUpdate throws an error', async () => {
      const chatId = '507f1f77bcf86cd799439011';
      const message: IMessage = {
        senderId: 'user123',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.Etudiant,
        message: 'Hello world',
        sentDate: new Date()
      };
      const error = new Error('Update failed');
      
      mockRequest.params = { id: chatId };
      mockRequest.body = message;
      chatModelUpdateStub.rejects(error);

      await chatController.router.stack[1].route.stack[0].handle(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockLogger.info.calledOnceWith('Handle message reception')).to.be.true;
      expect(mockLogger.error.calledOnceWith('Error handling message reception: Error: Update failed')).to.be.true;
      expect(responseStatus.calledOnceWith(500)).to.be.true;
      expect(responseJson.calledOnceWith({
        error: 'Internal server error',
        details: error
      })).to.be.true;
    });

    it('should handle empty message body', async () => {
      const chatId = '507f1f77bcf86cd799439011';
      const emptyMessage = {};
      const updatedChat = {
        _id: chatId,
        messages: [emptyMessage]
      };
      
      mockRequest.params = { id: chatId };
      mockRequest.body = emptyMessage;
      chatModelUpdateStub.resolves(updatedChat);

      await chatController.router.stack[1].route.stack[0].handle(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockLogger.info.calledOnceWith('Handle message reception')).to.be.true;
      expect(consoleLogStub.calledWith('message', emptyMessage)).to.be.true;
      expect(responseStatus.calledOnceWith(200)).to.be.true;
      expect(responseJson.calledOnceWith(updatedChat)).to.be.true;
    });

    it('should handle non-Error exceptions in POST', async () => {
      const chatId = '507f1f77bcf86cd799439011';
      const message: IMessage = {
        senderId: 'user123',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.Etudiant,
        message: 'Hello world',
        sentDate: new Date()
      };
      const errorString = 'Database unavailable';
      
      mockRequest.params = { id: chatId };
      mockRequest.body = message;
      chatModelUpdateStub.rejects(errorString);

      await chatController.router.stack[1].route.stack[0].handle(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockLogger.info.calledOnceWith('Handle message reception')).to.be.true;
      expect(mockLogger.error.calledOnce).to.be.true;
      expect(mockLogger.error.firstCall.args[0]).to.equal('Error handling message reception: Database unavailable');
      expect(responseStatus.calledOnceWith(500)).to.be.true;
      expect(responseJson.calledOnceWith({
        error: 'Internal server error',
        details: errorString
      })).to.be.false;
    });
  });
});
