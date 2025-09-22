import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Course } from '@common/program';

@Component({
  selector: 'app-study-course',
  imports: [CommonModule],
  templateUrl: './study-course.html',
  styleUrl: './study-course.scss'
})
export class StudyCourse {
  @Input() course!: Course;
  @Output() selectionChange = new EventEmitter<{courseSigle: string, selected: boolean}>();

  onSelectionChange(selected: boolean) {
    this.selectionChange.emit({
      courseSigle: this.course.sigle,
      selected: selected
    });
  }

  get isSelected(): boolean {
    return (this.course as any).selected || false;
  }

  get isDisabled(): boolean {
    return (this.course as any).disabled || false;
  }
}
