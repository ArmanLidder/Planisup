/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { ProgressHelperService } from './progress-helper.service';

describe('Service: ProgressHelper', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ProgressHelperService]
    });
  });

  it('should ...', inject([ProgressHelperService], (service: ProgressHelperService) => {
    expect(service).toBeTruthy();
  }));
});
