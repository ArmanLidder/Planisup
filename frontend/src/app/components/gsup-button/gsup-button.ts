import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-gsup-button',
  standalone: true,
  imports: [NgClass],
  templateUrl: './gsup-button.html',
  styleUrl: './gsup-button.scss',
})
export class GsupButton {
  @Input() title: string = 'default';
  @Input() color: string = 'black';
  @Input() size: string = 'medium';

  @Output() clicked = new EventEmitter<void>();

  constructor() {}

  buttonClicked(): void {
    this.clicked.emit();
  }
}
