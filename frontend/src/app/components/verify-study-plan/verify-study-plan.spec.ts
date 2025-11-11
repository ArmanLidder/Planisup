import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerifyStudyPlan } from './verify-study-plan';

describe('VerifyStudyPlan', () => {
  let component: VerifyStudyPlan;
  let fixture: ComponentFixture<VerifyStudyPlan>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerifyStudyPlan]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VerifyStudyPlan);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
