import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddStudentForm } from './add-student-form';

describe('AddStudentForm', () => {
  let component: AddStudentForm;
  let fixture: ComponentFixture<AddStudentForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddStudentForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddStudentForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
