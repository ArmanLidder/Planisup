import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GsupDialog } from './gsup-dialog';

describe('GsupDialog', () => {
  let component: GsupDialog;
  let fixture: ComponentFixture<GsupDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GsupDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GsupDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
