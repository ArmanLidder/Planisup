import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ProgressHelperService } from './progress-helper.service';
import { UiHelper, ProgressStepModel } from './uiHelper';
import { NgClass, NgFor, NgIf } from '@angular/common';

@Component({
  selector: 'app-progress',
  standalone: true,
  imports: [NgFor, NgIf, NgClass],
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

  protected getCurrentStepIndex(): number {
    const index = this.itemProgressList.findIndex(
      (item) => item.displayLabel === 'En cours' || item.displayLabel === 'Corrections requises'
    );
    return index === -1 ? this.itemProgressList.length : index;
  }
}
