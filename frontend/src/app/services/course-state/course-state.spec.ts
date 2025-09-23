import { TestBed } from '@angular/core/testing';

import { CourseState } from './course-state';

describe('CourseState', () => {
  let service: CourseState;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CourseState);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
