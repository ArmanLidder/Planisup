import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewPlan } from './view-plan';

describe('ViewPlan', () => {
  let component: ViewPlan;
  let fixture: ComponentFixture<ViewPlan>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewPlan]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewPlan);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
