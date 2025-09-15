import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ModalService {
  public showModal: boolean = false;
  public title: string = '';
  public message: string = '';

  openModal(title: string, message: string): void {
    this.title = title;
    this.message = message;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.title = '';
    this.message = '';
  }
}
