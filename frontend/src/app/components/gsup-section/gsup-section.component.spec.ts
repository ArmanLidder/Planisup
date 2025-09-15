import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GsupSectionComponent } from './gsup-section.component';

describe('GsupSectionComponent', () => {
  let component: GsupSectionComponent;
  let fixture: ComponentFixture<GsupSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GsupSectionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GsupSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
