import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GsupInput } from './gsup-input';

describe('GsupInput', () => {
  let component: GsupInput;
  let fixture: ComponentFixture<GsupInput>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GsupInput]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GsupInput);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
