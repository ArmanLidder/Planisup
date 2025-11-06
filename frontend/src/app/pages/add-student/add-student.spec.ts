import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddStudentPage } from './add-student';

describe('AddStudent', () => {
  let component: AddStudentPage;
  let fixture: ComponentFixture<AddStudentPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddStudentPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddStudentPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
