import { Component, EventEmitter, Output } from '@angular/core';
import { GsupButton } from '../gsup-button/gsup-button';
import { CommonModule } from '@angular/common';
import { ModalService } from '../../services/modal-service';

@Component({
  selector: 'app-gsup-modal',
  standalone: true,
  imports: [CommonModule, GsupButton],
  templateUrl: './gsup-modal.html',
  styleUrl: './gsup-modal.scss',
})
export class GsupModal {
  @Output() result = new EventEmitter<boolean>();

  constructor(public modalService: ModalService) {}

  onClickingNo(): void {
    this.modalService.closeModal();
    this.result.emit(false);
  }

  onClickingYes(): void {
    this.modalService.closeModal();
    this.result.emit(true);
  }
}
