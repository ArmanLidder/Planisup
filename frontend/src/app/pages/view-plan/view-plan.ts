import { Component, signal } from '@angular/core';
// import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Progress } from "@app/components/gsup-progress-bar/progress";
import { ProgressHelperService } from '@app/components/gsup-progress-bar/progress-helper.service';
import { ProgressStepModel } from '@app/components/gsup-progress-bar/uiHelper';
import { EditorComponent } from "@app/components/editor-component/editor-component";
import { Collapsible } from "@app/components/collapsible/collapsible";
import { ChatComponent } from '@app/components/chat/chat.component';
// import { NgxEditorModule } from 'ngx-editor';

@Component({
  selector: 'app-view-plan',
  standalone: true,
  imports: [Progress, ChatComponent],
  templateUrl: './view-plan.html',
  styleUrl: './view-plan.scss',
})
export class ViewPlan {
  open = signal(false);

  saveReview() {
  throw new Error('Method not implemented.');
  }
  constructor(private progressHelper: ProgressHelperService) {}

  editorContent: string = '<p>Veuillez écrire votre feedback ici...</p>';
  
  nextStep() {
    this.progressHelper.eventHelper.next({ next: true, prev: false });
  }
  
  prevStep() {
    this.progressHelper.eventHelper.next({ prev: true, next: false });
  }
  
  onProgressChange(steps: ProgressStepModel[]) {
    console.log('État actuel des étapes :', steps);
    // Tu peux sauvegarder, envoyer à une API, etc.
  }
}
