import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudyCourse } from './study-course';

describe('StudyCourse', () => {
  let component: StudyCourse;
  let fixture: ComponentFixture<StudyCourse>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudyCourse]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StudyCourse);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
