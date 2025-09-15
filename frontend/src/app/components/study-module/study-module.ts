import { Component, EventEmitter, Input, Output } from '@angular/core';
import { StudyCourse } from '../study-course/study-course';
import { CommonModule } from '@angular/common';
import { Module } from '../../pages/study-plan/study-plan';


@Component({
  selector: 'app-study-module',
  imports: [StudyCourse, CommonModule],
  templateUrl: './study-module.html',
  styleUrl: './study-module.scss'
})
export class StudyModule {
  @Input() module!: Module;
  @Input() progressStyle!: any;
  @Output() courseSelectionChange = new EventEmitter<{courseId: string, moduleId: string, selected: boolean}>();
  @Output() subModuleCourseSelectionChange = new EventEmitter<{courseId: string, moduleId: string, subModuleId: string, selected: boolean}>();

  onCourseSelectionChange(event: {courseId: string, selected: boolean}) {
    this.courseSelectionChange.emit({
      courseId: event.courseId,
      moduleId: this.module.id,
      selected: event.selected
    });
  }

  onSubModuleCourseSelectionChange(event: {courseId: string, subModuleId: string, selected: boolean}) {
    this.subModuleCourseSelectionChange.emit({
      courseId: event.courseId,
      moduleId: this.module.id,
      subModuleId: event.subModuleId,
      selected: event.selected
    });
  }
}
