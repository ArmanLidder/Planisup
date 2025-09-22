import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudySection } from './study-section';

describe('StudySection', () => {
  let component: StudySection;
  let fixture: ComponentFixture<StudySection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudySection]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StudySection);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
