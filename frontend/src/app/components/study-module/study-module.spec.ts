import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudyModule } from './study-module';

describe('StudyModule', () => {
  let component: StudyModule;
  let fixture: ComponentFixture<StudyModule>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudyModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StudyModule);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
