import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GsupMenu } from './gsup-menu';

describe('GsupMenu', () => {
  let component: GsupMenu;
  let fixture: ComponentFixture<GsupMenu>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GsupMenu]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GsupMenu);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
