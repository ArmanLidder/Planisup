import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChatComponent, State } from './chat.component';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { ChatService } from '@app/services/chat/chat-service';
import { AuthentificationService } from '@app/services/authentification/authentification-service';
import { Message } from '@common/chat';
import { UserRole } from '@common/user';
import { BehaviorSubject } from 'rxjs';

describe('ChatComponent', () => {
  let component: ChatComponent;
  let fixture: ComponentFixture<ChatComponent>;
  let chatServiceMock: jasmine.SpyObj<ChatService>;
  let authServiceMock: jasmine.SpyObj<AuthentificationService>;
  let sanitizerMock: jasmine.SpyObj<DomSanitizer>;

  const mockUser = {
    _id: 'user-1',
    firstName: 'John',
    lastName: 'Doe',
    role: UserRole.Etudiant
  };

  const mockMessage: Message = {
    senderId: 'user-1',
    firstName: 'John',
    lastName: 'Doe',
    role: UserRole.Etudiant,
    message: 'Test message'
  };

  beforeEach(async () => {
    chatServiceMock = jasmine.createSpyObj('ChatService', ['loadMessages', 'sendMessage'], {
      chat$: new BehaviorSubject(null)
    });
    
    authServiceMock = jasmine.createSpyObj('AuthentificationService', [], {
      currentUser: mockUser
    });
    
    sanitizerMock = jasmine.createSpyObj('DomSanitizer', ['bypassSecurityTrustHtml']);

    await TestBed.configureTestingModule({
      imports: [ChatComponent, ReactiveFormsModule],
      providers: [
        FormBuilder,
        { provide: ChatService, useValue: chatServiceMock },
        { provide: AuthentificationService, useValue: authServiceMock },
        { provide: DomSanitizer, useValue: sanitizerMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ChatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default state', () => {
    expect(component.state).toBe(State.closed);
    expect(component.isChatFocused).toBeTrue();
    expect(component.messageForm.get('message')?.value).toBe('');
  });

  it('should load messages on init', () => {
    component.ngOnInit();
    expect(chatServiceMock.loadMessages).toHaveBeenCalled();
  });

  describe('handleEvents', () => {
    it('should stop event propagation when chat is opened', () => {
      const event = new Event('click');
      spyOn(event, 'stopImmediatePropagation');
      
      component.state = State.opened;
      component.handleEvents(event);
      
      expect(event.stopImmediatePropagation).toHaveBeenCalled();
    });

    it('should not stop event propagation when chat is closed', () => {
      const event = new Event('click');
      spyOn(event, 'stopImmediatePropagation');
      
      component.state = State.closed;
      component.handleEvents(event);
      
      expect(event.stopImmediatePropagation).not.toHaveBeenCalled();
    });
  });

  describe('toggleIsChat', () => {
    it('should toggle isChatFocused and reset form when unfocused', () => {
      component.messageForm.patchValue({ message: 'test' });
      
      component.toggleIsChat();
      
      expect(component.isChatFocused).toBeFalse();
      expect(component.messageForm.get('message')?.value).toBeNull();
    });
  });

  describe('sendMessage', () => {
    it('should not send invalid or empty messages', () => {
      component.messageForm.patchValue({ message: '' });
      component.sendMessage();
      expect(chatServiceMock.sendMessage).not.toHaveBeenCalled();

      component.messageForm.patchValue({ message: '   ' });
      component.sendMessage();
      expect(chatServiceMock.sendMessage).not.toHaveBeenCalled();
    });
  });

  describe('message handling', () => {
    it('should return correct message class based on sender', () => {
      expect(component.getMessageClass(mockMessage)).toBe('sent');
      
      const otherMessage = { ...mockMessage, senderId: 'other-user' };
      expect(component.getMessageClass(otherMessage)).toBe('received');
    });

    it('should format sender name correctly', () => {
      expect(component.getSenderName(mockMessage))
        .toBe('John Doe | ETUDIANT');
    });

    it('should format date correctly', () => {
      const date = new Date('2023-01-01T12:30:00');
      expect(component.formatSentDate(date)).toMatch(/\d{1,2}:\d{2}/);
      expect(component.formatSentDate(undefined)).toBe('karim');
    });
  });

  describe('sendMessage', () => {
    it('should not send invalid or empty messages', () => {
      component.messageForm.patchValue({ message: '' });
      component.sendMessage();
      expect(chatServiceMock.sendMessage).not.toHaveBeenCalled();

      component.messageForm.patchValue({ message: '   ' });
      component.sendMessage();
      expect(chatServiceMock.sendMessage).not.toHaveBeenCalled();
    });

    it('should send valid messages and reset form', () => {
      component.messageForm.patchValue({ message: 'test message' });
      component.sendMessage();

      expect(chatServiceMock.sendMessage).toHaveBeenCalledWith({
        senderId: mockUser._id,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        role: mockUser.role,
        message: 'test message'
      });
      expect(component.messageForm.get('message')?.value).toBeNull();
    });
  });

  it('should sanitize HTML content', () => {
    const html = '<p>test</p>';
    component.safeHtml(html);
    expect(sanitizerMock.bypassSecurityTrustHtml).toHaveBeenCalledWith(html);
  });
});