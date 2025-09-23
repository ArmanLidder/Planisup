import { NgClass } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-gsup-input',
  standalone: true,
  imports: [NgClass],
  templateUrl: './gsup-input.html',
  styleUrl: './gsup-input.scss',
})
export class GsupInput {
  @Input() valueInput: string = '';
  @Input() placeholder: string = '';
  @Input() image?: string = '';
  @Input() size: string = 'medium';

  @Output() value = new EventEmitter<string>();

  constructor() {}

  valueEmitted(event: Event): void {
    const inputValue = (event.target as HTMLInputElement).value;
    this.valueInput = inputValue;
    this.value.emit(this.valueInput);
  }
}
