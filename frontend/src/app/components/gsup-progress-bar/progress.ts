// progress.component.ts
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ProgressHelperService } from './progress-helper.service';
import { UiHelper, Status, ProgressStepModel } from './uiHelper';
import { NgFor, NgIf } from '@angular/common';

@Component({
  selector: 'app-progress',
  standalone: true,
  imports: [NgFor, NgIf],
  templateUrl: './progress.html',
  styleUrls: ['./progress.scss'],
})
export class Progress extends UiHelper implements OnInit {
  @Output() progressStatusChange = new EventEmitter<ProgressStepModel[]>();
  @Input() totalSteps: number = 5;
  @Input() override itemProgressList: ProgressStepModel[] = [];
  @Input() public set selectedIndex(value: number) {
    this.activeIndex = value || 0;
  }

  constructor(progressHelper: ProgressHelperService) {
    super(progressHelper);
  }

  ngOnInit(): void {
    if (!this.itemProgressList || this.itemProgressList.length === 0) {
      this.initProgress(this.totalSteps);
    }

    this.progressHelper.eventHelper.subscribe({
      next: ({ prev, next }) => {
        if (next) this.next();
        if (prev) this.prev();
      },
    });
  }

  public next() {
    this.increaseStep();
  }

  public prev() {
    this.decreaseStep();
  }

  private decreaseStep() {
    if (
      this.activeIndex === this.itemProgressList.length - 1 &&
      this.itemProgressList[this.activeIndex].status === Status.COMPLETED
    ) {
      this.undoLastCompleted();
    } else if (this.activeIndex > 0) {
      this.activeIndex--;
      this.switchStatusPrev(this.activeIndex);
    }
  }

  private increaseStep() {
    if (
      this.activeIndex === this.itemProgressList.length - 1 &&
      this.itemProgressList[this.activeIndex].status !== Status.COMPLETED
    ) {
      this.completeLastStep();
    } else if (this.activeIndex < this.itemProgressList.length - 1) {
      this.activeIndex++;
      this.switchStatusNext(this.activeIndex);
    }
  }

  generateProgressArray(length: number): ProgressStepModel[] {
    return [...Array(length).keys()].map((key) => ({
      stepIndex: key,
      status: key === this.activeIndex ? Status.IN_PROGRESS : Status.PENDING,
    }));
  }

  private initProgress(value: number) {
    this.itemProgressList = this.generateProgressArray(value);
  }

  protected override onStatusChange(): void {
    this.progressStatusChange.emit([...this.itemProgressList]);
  }
}
