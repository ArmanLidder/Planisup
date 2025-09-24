import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CourseSearch } from './course-search';

describe('CourseSearch', () => {
  let component: CourseSearch;
  let fixture: ComponentFixture<CourseSearch>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CourseSearch]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CourseSearch);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
