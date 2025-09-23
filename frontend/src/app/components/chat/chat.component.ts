import { Component, ElementRef, inject, ViewChild, HostListener, ViewEncapsulation } from '@angular/core';
import {Message} from "@common/chat";
import {FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';

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
        ReactiveFormsModule,  // nécessaire pour formGroup / formControlName
        NgClass,
    ],
    encapsulation: ViewEncapsulation.None, // 🔑 permet aux styles globaux d’agir

})
export class ChatComponent {
    private fb: FormBuilder = inject(FormBuilder);

    @ViewChild('chatscrollable') private scrollContainer!: ElementRef;
    messageForm: FormGroup = this.fb.group({
      message: ['', [Validators.required, Validators.maxLength(200)]]
    });


    // properties to control Chat component state => opened, closed or contextual
    state: State = State.closed;
    isChatFocused: boolean = true;

    private isLoadingCanalScroll = false;

    constructor() {
        this.setUp();
    }

    @HostListener('click', ['$event'])
    @HostListener('keydown', ['$event'])
    @HostListener('keypress', ['$event'])
    @HostListener('keyup', ['$event'])
    async handleEvents(event: Event) {
        if (this.state === State.opened) event.stopImmediatePropagation();
    }

    // integrated or contextual UI
    toggleChatState() {
      this.state = this.state === State.closed ? State.opened : State.closed;
    }

    // In chat room or not
    toggleIsChat() {
        this.isChatFocused = !this.isChatFocused;
        if (!this.isChatFocused) this.messageForm.reset('');
    }

        // Check who is the sender for css style
    getMessageClass(msg: Message, user: null): string {
        return 'sent'
        // return user.uid === msg.userUid ? 'sent' : 'received';
    }

    async sendMessage(message?: string) {
        // send message logic
    }

    private setUp() {
        this.messageForm = this.fb.group({
            message: ['', [Validators.required, Validators.maxLength(200)]]
        });
    }


    protected readonly console = console;
}
