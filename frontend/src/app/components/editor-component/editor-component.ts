import { Component, Input, OnDestroy, OnInit, forwardRef } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Editor, NgxEditorMenuComponent, NgxEditorComponent, NgxEditorModule } from 'ngx-editor';

@Component({
  selector: 'app-editor-component',
  standalone: true,
  imports: [NgxEditorMenuComponent, NgxEditorComponent, FormsModule, NgxEditorModule],
  templateUrl: './editor-component.html',
  styleUrl: './editor-component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => EditorComponent),
      multi: true
    }
  ]
})
export class EditorComponent implements OnInit, OnDestroy, ControlValueAccessor {
  editor!: Editor;
  html: string = '';

  // For ControlValueAccessor
  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string): void {
    this.html = value || '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  ngOnInit(): void {
    this.editor = new Editor();
  }

  onContentChange(): void {
    this.onChange(this.html); // Notify parent form
    this.onTouched();         // Mark as touched for validation
    console.log(this.html);
  }

  ngOnDestroy() {
    if (this.editor) {
      this.editor.destroy();
    }
  }
}