import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Progress } from './progress';
import { ProgressHelperService } from './progress-helper.service';
import { ProgressStepModel } from './uiHelper';

describe('Progress', () => {
  let component: Progress;
  let fixture: ComponentFixture<Progress>;
  let progressHelperMock: jasmine.SpyObj<ProgressHelperService>;

  // Mock data for tests
  const mockProgressSteps: ProgressStepModel[] = [
    { stepIndex: 0, label: 'Step 1', displayLabel: 'First Step' },
    { stepIndex: 1, label: 'Step 2', displayLabel: 'Second Step' },
    { stepIndex: 2, label: 'Step 3', displayLabel: 'Third Step' }
  ];

  beforeEach(async () => {
    // Create spy object for ProgressHelperService
    progressHelperMock = jasmine.createSpyObj('ProgressHelperService', ['someMethod']);

    await TestBed.configureTestingModule({
      imports: [Progress],
      providers: [
        { provide: ProgressHelperService, useValue: progressHelperMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Progress);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty itemProgressList', () => {
    expect(component.itemProgressList).toEqual([]);
  });

  it('should set itemProgressList when input is provided', () => {
    component.itemProgressList = mockProgressSteps;
    expect(component.itemProgressList).toEqual(mockProgressSteps);
  });

  it('should set activeIndex when selectedIndex is provided', () => {
    component.selectedIndex = 2;
    expect(component['activeIndex']).toBe(2);
  });

  it('should set activeIndex to 0 when selectedIndex is undefined', () => {
    component.selectedIndex = undefined as any;
    expect(component['activeIndex']).toBe(0);
  });

  it('should emit progressStatusChange when onStatusChange is called', () => {
    // Spy on the event emitter
    spyOn(component.progressStatusChange, 'emit');
    
    // Set some progress items
    component.itemProgressList = mockProgressSteps;
    
    // Call protected method through type assertion
    (component as any).onStatusChange();
    
    // Verify emit was called with a copy of itemProgressList
    expect(component.progressStatusChange.emit).toHaveBeenCalledWith([...mockProgressSteps]);
  });

  it('should emit a different array instance than the original itemProgressList', () => {
    spyOn(component.progressStatusChange, 'emit').and.callFake((emitted: ProgressStepModel[]) => {
      expect(emitted).toEqual(mockProgressSteps);
      expect(emitted).not.toBe(component.itemProgressList); // Check it's a different instance
    });

    component.itemProgressList = mockProgressSteps;
    (component as any).onStatusChange();
    expect(component.progressStatusChange.emit).toHaveBeenCalled();
  });
});