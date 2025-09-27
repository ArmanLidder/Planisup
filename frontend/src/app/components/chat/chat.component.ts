import { Component, ElementRef, inject, ViewChild, HostListener, ViewEncapsulation } from '@angular/core';
import { Message } from "@common/chat";
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { EditorComponent } from "../editor-component/editor-component";
import { UserRole } from '@common/user';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

export enum State {
  closed,
  opened,
}

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgClass,
    NgFor,
    NgIf,
    EditorComponent
  ],
  encapsulation: ViewEncapsulation.None,
})

export class ChatComponent {
  private fb: FormBuilder = inject(FormBuilder);

  @ViewChild('chatscrollable') private scrollContainer!: ElementRef;

  messageForm: FormGroup = this.fb.group({
    message: ['', [Validators.required, Validators.maxLength(200)]]
  });

  state: State = State.closed;
  isChatFocused: boolean = true;

  currentUserUid = 'user-123';
  currentUserFirstName = 'John';
  currentUserLastName = 'Doe';
  currentUserRole: UserRole = UserRole.Etudiant;

  canal: {
    messages: Message[];
  } = {
    messages: [
      {
        _id: 'msg-1',
        senderId: 'user-456',
        firstName: 'Alice',
        lastName: 'Smith',
        role: UserRole.Etudiant,
        message: 'Bonjour ! Comment ça va ?',
        sentDate: new Date(Date.now() - 60000)
      },
      {
        _id: 'msg-2',
        senderId: 'user-123',
        firstName: this.currentUserFirstName,
        lastName: this.currentUserLastName,
        role: this.currentUserRole,
        message: 'Salut ! Tout va bien, merci !',
        sentDate: new Date()
      }
    ]
  };

  constructor(private sanitizer: DomSanitizer) {
    this.setUp();
  }

  @HostListener('click', ['$event'])
  @HostListener('keydown', ['$event'])
  @HostListener('keypress', ['$event'])
  @HostListener('keyup', ['$event'])
  handleEvents(event: Event) {
    if (this.state === State.opened) {
      event.stopImmediatePropagation();
    }
  }

  toggleChatState() {
    this.state = this.state === State.closed ? State.opened : State.closed;

    // if (this.state === State.opened) {
    //   this.scrollToBottom();
    // }
  }

  toggleIsChat() {
    this.isChatFocused = !this.isChatFocused;
    if (!this.isChatFocused) {
      this.messageForm.reset('');
    }
  }

  getMessageClass(msg: Message): string {
    return msg.senderId === this.currentUserUid ? 'sent' : 'received';
  }

  getSenderName(msg: Message): string {
    return `${msg.firstName} ${msg.lastName}`;
  }

  formatSentDate(date: Date | undefined): string {
    if (!date) return '';
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  async sendMessage() {
    if (this.messageForm.invalid) return;

    const messageContent = this.messageForm.get('message')?.value?.trim();
    if (!messageContent) return;

    const newMessage: Message = {
      _id: `msg-${Date.now()}`,
      senderId: this.currentUserUid,
      firstName: this.currentUserFirstName,
      lastName: this.currentUserLastName,
      role: this.currentUserRole,
      message: messageContent,
      sentDate: new Date()
    };

    this.canal.messages.push(newMessage);

    this.messageForm.reset('');
    // this.scrollToBottom();
    console.log('Message sent:', newMessage);
  }

  // private scrollToBottom(): void {
  //   try {
  //     const container = this.scrollContainer.nativeElement;
  //     container.scrollTo({
  //       top: container.scrollHeight,
  //       behavior: 'smooth'
  //     });
  //   } catch (err) {
  //     console.error('Scroll failed:', err);
  //   }
  // }

  private setUp() {}

  safeHtml(content: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(content);
  }

  protected readonly console = console;
}