import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GsupButton } from './gsup-button';

describe('GsupButton', () => {
  let component: GsupButton;
  let fixture: ComponentFixture<GsupButton>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GsupButton]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GsupButton);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
