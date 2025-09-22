import { ProgressHelperService } from './progress-helper.service';

export interface ProgressStepModel {
    stepIndex: number;
    status: Status;
}

export enum UiState {
    ACTIVE = 'active',
    COMPLETE = 'complete',
}

export enum Status {
    PENDING = 'en attente',
    IN_PROGRESS = 'en cours',
    COMPLETED = 'complété',
}

export class UiHelper {
    public itemProgressList: ProgressStepModel[] = [];
    public activeIndex: number = 0;
    
    constructor(protected progressHelper: ProgressHelperService) {}

    private isValidIndex(index: number): boolean {
        return index >= 0 && index < this.itemProgressList.length;
    }

    protected switchStatusNext(index: number) {
        if (this.isValidIndex(index - 1) && this.isValidIndex(index)) {
            this.itemProgressList[index - 1].status = Status.COMPLETED;
            this.itemProgressList[index].status = Status.IN_PROGRESS;
            this.onStatusChange();
        }
    }

    protected switchStatusPrev(index: number) {
        if (this.isValidIndex(index) && this.isValidIndex(index + 1)) {
            this.itemProgressList[index + 1].status = Status.PENDING;
            this.itemProgressList[index].status = Status.IN_PROGRESS;
            this.onStatusChange();
        }
    }

    completeLastStep() {
        if (this.isValidIndex(this.activeIndex)) {
            this.itemProgressList[this.activeIndex].status = Status.COMPLETED;
            this.onStatusChange();
        }
    }

    undoLastCompleted() {
        if (this.isValidIndex(this.activeIndex)) {
            this.itemProgressList[this.activeIndex].status = Status.IN_PROGRESS;
            this.onStatusChange();
        }
    }

    // Hook pour les classes enfants
    protected onStatusChange(): void {}
}