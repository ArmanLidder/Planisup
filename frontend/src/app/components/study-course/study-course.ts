import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Course } from '../../pages/study-plan/study-plan';

@Component({
  selector: 'app-study-course',
  imports: [CommonModule],
  templateUrl: './study-course.html',
  styleUrl: './study-course.scss'
})
export class StudyCourse {
  @Input() course!: Course;
  @Output() selectionChange = new EventEmitter<{courseId: string, selected: boolean}>();

  onSelectionChange(selected: boolean) {
    this.selectionChange.emit({
      courseId: this.course.id,
      selected: selected
    });
  }
}
