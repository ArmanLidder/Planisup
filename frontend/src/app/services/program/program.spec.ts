import { TestBed } from '@angular/core/testing';

import { ProgrammeService } from './program';

describe('Program', () => {
  let service: ProgrammeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProgrammeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
