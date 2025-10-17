import { TestBed } from '@angular/core/testing';
import { ChatService } from './chat-service';
import { ApiService } from '@app/services/api/api-service';
import { StudyPlanService } from '@app/services/study-plan/study-plan-service';
import { Chat, Message } from '@common/chat';
import { of } from 'rxjs';
import { UserRole } from '@common/user';

describe('ChatService', () => {
  let service: ChatService;
  let apiServiceMock: jasmine.SpyObj<ApiService>;
  let studyPlanServiceMock: jasmine.SpyObj<StudyPlanService>;

  const mockChat: Chat = {
    _id: 'chat-1',
    studyPlanId: 'plan-1',
    messages: []
  };

  const mockMessage: Message = {
    senderId: 'user-1',
    firstName: 'Test message',
    lastName: 'User',
    role: UserRole.Etudiant,
    message: 'string',
    createdAt: new Date()
  };

  beforeEach(() => {
    // Create API service mock
    apiServiceMock = jasmine.createSpyObj('ApiService', ['getChat', 'sendMessage']);
    
    // Create StudyPlan service mock with studyPlan getter
    studyPlanServiceMock = jasmine.createSpyObj('StudyPlanService', [], {
      studyPlan: { chatId: 'chat-1' }
    });

    TestBed.configureTestingModule({
      providers: [
        ChatService,
        { provide: ApiService, useValue: apiServiceMock },
        { provide: StudyPlanService, useValue: studyPlanServiceMock }
      ]
    });

    service = TestBed.inject(ChatService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('loadMessages', () => {
    it('should load messages when chatId exists', (done) => {
      apiServiceMock.getChat.and.returnValue(of(mockChat));

      service.loadMessages();
      
      expect(apiServiceMock.getChat).toHaveBeenCalledWith('chat-1');
      
      service.chat$.subscribe(chat => {
        expect(chat).toEqual(mockChat);
        done();
      });
    });

    it('should not load messages when chatId is undefined', () => {
      // Override studyPlan to return undefined chatId
      Object.defineProperty(studyPlanServiceMock, 'studyPlan', {
        get: () => ({ chatId: undefined })
      });

      service.loadMessages();
      
      expect(apiServiceMock.getChat).not.toHaveBeenCalled();
    });
  });

  describe('sendMessage', () => {
    it('should send message when chatId exists', (done) => {
      apiServiceMock.sendMessage.and.returnValue(of(mockChat));

      service.sendMessage(mockMessage);
      
      expect(apiServiceMock.sendMessage).toHaveBeenCalledWith('chat-1', mockMessage);
      
      service.chat$.subscribe(chat => {
        expect(chat).toEqual(mockChat);
        done();
      });
    });

    it('should not send message when chatId is undefined', () => {
      // Override studyPlan to return undefined chatId
      Object.defineProperty(studyPlanServiceMock, 'studyPlan', {
        get: () => ({ chatId: undefined })
      });

      service.sendMessage(mockMessage);
      
      expect(apiServiceMock.sendMessage).not.toHaveBeenCalled();
    });
  });

  describe('chat$ Observable', () => {
    it('should initially emit null', (done) => {
      service.chat$.subscribe(chat => {
        expect(chat).toBeNull();
        done();
      });
    });

    it('should emit new chat after successful operations', (done) => {
      apiServiceMock.sendMessage.and.returnValue(of(mockChat));

      service.sendMessage(mockMessage);
      
      service.chat$.subscribe(chat => {
        expect(chat).toEqual(mockChat);
        done();
      });
    });
  });
});