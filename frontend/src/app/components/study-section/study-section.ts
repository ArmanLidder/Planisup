import { Component, EventEmitter, Input, Output } from '@angular/core';
import { StudyCourse } from '../study-course/study-course';
import { CommonModule } from '@angular/common';
import { Section } from '@common/program';

@Component({
  selector: 'app-study-section',
  imports: [StudyCourse, CommonModule],
  templateUrl: './study-section.html',
  styleUrl: './study-section.scss'
})
export class StudySection {
  @Input() section!: Section;
  @Output() courseSelectionChange = new EventEmitter<{courseSigle: string, selected: boolean}>();

  onCourseSelectionChange(event: {courseSigle: string, selected: boolean}) {
    this.courseSelectionChange.emit(event);
  }
}
