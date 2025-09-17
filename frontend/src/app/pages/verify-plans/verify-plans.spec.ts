import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerifyPlans } from './verify-plans';

describe('VerifyPlans', () => {
  let component: VerifyPlans;
  let fixture: ComponentFixture<VerifyPlans>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerifyPlans]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VerifyPlans);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
