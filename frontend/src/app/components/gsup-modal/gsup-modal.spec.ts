import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GsupModal } from './gsup-modal';

describe('GsupModal', () => {
  let component: GsupModal;
  let fixture: ComponentFixture<GsupModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GsupModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GsupModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
