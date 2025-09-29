// progress.component.ts
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ProgressHelperService } from './progress-helper.service';
import { UiHelper, ProgressStepModel } from './uiHelper';
import { NgFor, NgIf } from '@angular/common';

@Component({
  selector: 'app-progress',
  standalone: true,
  imports: [NgFor, NgIf],
  templateUrl: './progress.html',
  styleUrls: ['./progress.scss'],
})
export class Progress extends UiHelper {
  @Output() progressStatusChange = new EventEmitter<ProgressStepModel[]>();
  @Input() override itemProgressList: ProgressStepModel[] = [];
  @Input() public set selectedIndex(value: number) {
    this.activeIndex = value || 0;
  }

  constructor(progressHelper: ProgressHelperService) {
    super(progressHelper);
  }
    
  protected override onStatusChange(): void {
    this.progressStatusChange.emit([...this.itemProgressList]);
  }
}
