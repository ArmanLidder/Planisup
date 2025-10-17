import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EditorComponent } from './editor-component';

describe('EditorComponent', () => {
  let component: EditorComponent;
  let fixture: ComponentFixture<EditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set html when writeValue is called and reset on undefined', () => {
    component.writeValue('<p>hello</p>');
    expect(component.html).toBe('<p>hello</p>');

    component.writeValue(undefined as any);
    expect(component.html).toBe('');
  });

  it('writeValue should not call onChange', () => {
    const changeSpy = jasmine.createSpy('onChange');
    component.registerOnChange(changeSpy);

    component.writeValue('<i>no-propagation</i>');
    expect(component.html).toBe('<i>no-propagation</i>');
    expect(changeSpy).not.toHaveBeenCalled();
  });

  it('should register onChange and onTouched and call them onContentChange and log html', () => {
    const changeSpy = jasmine.createSpy('onChange');
    const touchedSpy = jasmine.createSpy('onTouched');

    component.registerOnChange(changeSpy);
    component.registerOnTouched(touchedSpy);

    component.html = '<b>test</b>';
    spyOn(console, 'log');

    component.onContentChange();

    expect(changeSpy).toHaveBeenCalledWith('<b>test</b>');
    expect(touchedSpy).toHaveBeenCalled();
    expect((console.log as jasmine.Spy)).toHaveBeenCalledWith('<b>test</b>');
  });

  it('registerOnChange should replace previous change handler', () => {
    const firstSpy = jasmine.createSpy('firstChange');
    const secondSpy = jasmine.createSpy('secondChange');

    component.registerOnChange(firstSpy);
    component.registerOnChange(secondSpy);

    component.html = 'replacement test';
    component.onContentChange();

    expect(firstSpy).not.toHaveBeenCalled();
    expect(secondSpy).toHaveBeenCalledWith('replacement test');
  });

  it('onContentChange without registered handlers should not throw and should log html', () => {
    // Do not register handlers; defaults are no-ops
    component.html = '<div>no handlers</div>';
    const consoleSpy = spyOn(console, 'log');

    expect(() => component.onContentChange()).not.toThrow();
    expect(consoleSpy).toHaveBeenCalledWith('<div>no handlers</div>');
  });

  it('should initialize editor in ngOnInit and provide a destroy function', () => {
    component.editor = undefined as any;
    component.ngOnInit();

    expect(component.editor).toBeTruthy();
    expect(typeof (component.editor as any).destroy).toBe('function');
  });

  it('should call destroy on editor during ngOnDestroy', () => {
    const destroySpy = jasmine.createSpy('destroy');
    component.editor = { destroy: destroySpy } as any;

    component.ngOnDestroy();

    expect(destroySpy).toHaveBeenCalled();
  });

  it('should not throw in ngOnDestroy when editor is undefined', () => {
    component.editor = undefined as any;
    expect(() => component.ngOnDestroy()).not.toThrow();
  });

  it('should call destroy on editor during ngOnDestroy', () => {
    const destroySpy = jasmine.createSpy('destroy');
    component.editor = { destroy: destroySpy } as any;

    component.ngOnDestroy();

    expect(destroySpy).toHaveBeenCalled();
  });

});
