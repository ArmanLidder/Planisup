import { Component } from '@angular/core';
import { Progress } from '@app/components/gsup-progress-bar/progress';
import { ProgressHelperService } from '@app/components/gsup-progress-bar/progress-helper.service';
import { ProgressStepModel } from '@app/components/gsup-progress-bar/uiHelper';

@Component({
  selector: 'app-view-plan',
  standalone: true,
  imports: [Progress],
  templateUrl: './view-plan.html',
  styleUrl: './view-plan.scss',
})
export class ViewPlan {
  constructor(private progressHelper: ProgressHelperService) {}

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
