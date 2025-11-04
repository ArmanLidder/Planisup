import { TestBed } from '@angular/core/testing';
import { AddStudentFormService } from '@app/services/add-student-form/add-student-form';

describe('AddStudentForm', () => {
  let service: AddStudentFormService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AddStudentFormService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
