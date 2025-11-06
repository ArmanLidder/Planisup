import { Component, ElementRef, inject, ViewChild, HostListener, ViewEncapsulation } from '@angular/core';
import { Message, Chat } from "@common/chat";
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgClass, NgFor, NgIf, CommonModule } from '@angular/common';
import { EditorComponent } from "../editor-component/editor-component";
import { UserRole } from '@common/user';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ChatService } from '@app/services/chat/chat-service';
import { AuthentificationService } from '@app/services/authentification/authentification-service';

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
    EditorComponent,
    CommonModule
  ],
  encapsulation: ViewEncapsulation.None,
})
export class ChatComponent {
  private fb: FormBuilder = inject(FormBuilder);
  private chatService = inject(ChatService);
  private auth = inject(AuthentificationService);

  @ViewChild('chatscrollable') private scrollContainer!: ElementRef;

  messageForm: FormGroup = this.fb.group({
    message: ['', [Validators.required, Validators.maxLength(200)]]
  });

  state: State = State.closed;
  isChatFocused: boolean = true;
  chat$: typeof this.chatService.chat$;

  constructor(private sanitizer: DomSanitizer) {
    this.setUp();
    this.chat$ = this.chatService.chat$;
  }

  ngOnInit() {
    // load initial messages
    this.chatService.loadMessages();
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
    return msg.senderId === this.auth.currentUser?._id ? 'sent' : 'received';
  }

  getSenderName(msg: Message): string {
    return `${msg.firstName} ${msg.lastName} | ${msg.role}`;
  }

  formatSentDate(date: Date | undefined): string {
    if (!date) return 'karim';
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  sendMessage() {
    if (this.messageForm.invalid || !this.chat$) return;

    const messageContent = this.messageForm.get('message')?.value?.trim();
    if (!messageContent) return;

    const newMessage: Message = {
      senderId: this.auth.currentUser?._id as string,
      firstName: this.auth.currentUser?.firstName as string,
      lastName: this.auth.currentUser?.lastName as string,
      role: this.auth.currentUser?.role as UserRole,
      message: messageContent,
    };

    // use service instead of pushing locally
    this.chatService.sendMessage(newMessage);

    this.messageForm.reset('');
    // this.scrollToBottom();
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
}

