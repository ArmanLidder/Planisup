import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GsupButton } from './gsup-button';

describe('GsupButton', () => {
  let component: GsupButton;
  let fixture: ComponentFixture<GsupButton>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GsupButton],
    }).compileComponents();

    fixture = TestBed.createComponent(GsupButton);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should have default inputs', () => {
    expect(component.title).toBe('default');
    expect(component.color).toBe('black');
    expect(component.size).toBe('medium');
  });

  it('should accept input values', () => {
    component.title = 'Click Me';
    component.color = 'red';
    component.size = 'large';
    fixture.detectChanges();
    expect(component.title).toBe('Click Me');
    expect(component.color).toBe('red');
    expect(component.size).toBe('large');
  });

  it('should emit when buttonClicked() is called', () => {
    spyOn(component.clicked, 'emit');
    component.buttonClicked();
    expect(component.clicked.emit).toHaveBeenCalled();
  });
});
