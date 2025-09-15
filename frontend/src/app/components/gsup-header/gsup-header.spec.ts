import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GsupHeader } from './gsup-header';

describe('GsupHeader', () => {
  let component: GsupHeader;
  let fixture: ComponentFixture<GsupHeader>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GsupHeader]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GsupHeader);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
