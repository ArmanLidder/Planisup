import { Injectable } from '@angular/core';
import { ApiService } from '@app/services/api/api-service';
import { BehaviorSubject } from 'rxjs';
import { Chat, Message } from '@common/chat';
import { StudyPlanService } from '@app/services/study-plan/study-plan-service';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
    private chatSubject = new BehaviorSubject<Chat|null>(null);
    public chat$ = this.chatSubject.asObservable();

    constructor(
      private apiService: ApiService,
      private sPS: StudyPlanService,
    ) {}

    loadMessages() {
      if (this.sPS.studyPlan?.chatId)
        this.apiService.getChat(this.sPS.studyPlan.chatId).subscribe((chat: Chat) => {
          this.chatSubject.next(chat);
        });
    }

    sendMessage(message: Message) {
      if (this.sPS.studyPlan?.chatId)
        this.apiService.sendMessage(this.sPS.studyPlan.chatId, message).subscribe((chat: Chat) => {
          this.chatSubject.next(chat);
        });
    }
}
