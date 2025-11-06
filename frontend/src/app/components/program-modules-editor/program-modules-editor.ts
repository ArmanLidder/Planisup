import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Module, Section, SubModule, RuleDefinition, RuleType, Course } from '@common/program';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { CourseSearch } from '@app/components/course-search/course-search';
import { ApiService } from '@app/services/api/api-service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-program-modules-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatDialogModule, CourseSearch],
  templateUrl: './program-modules-editor.html',
  styleUrl: './program-modules-editor.scss',
})
export class ProgramModulesEditor implements OnChanges {
  @Input() modules: Module[] = [];
  @Output() modulesChange = new EventEmitter<Module[]>();

  draftModules: Module[] = [];
  editingIndex: number | null = null;
  editTemp: Module | null = null;
  subEditingIndex: number | null = null;
  subEditTemp: SubModule | null = null;
  // Module-level sections editing state
  secEditingIndex: number | null = null;
  secEditTemp: Section | null = null;
  // Submodule-level sections editing state
  subSecEditingIndex: number | null = null;
  subSecEditTemp: Section | null = null;
  ruleLabels: Record<RuleType, string> = {
    credits_exact: 'Crédits exacts',
    credits_minimum: 'Crédits minimum',
    credits_maximum: 'Crédits maximum',
    director_approval: 'Approbation du directeur',
    exclusive_submodules: 'Sous-modules exclusifs',
  };

  availableCourses: Course[] = [];
  structureType: 'sections' | 'submodules' = 'sections';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['modules']) {
      this.draftModules = JSON.parse(JSON.stringify(this.modules || []));
      this.resetVariables();
    }
  }

  constructor(private dialog: MatDialog, private api: ApiService) {}

  addModule(): void {
    const newModule: Module = {
      title: 'Nouveau module',
      description: [],
      courses: [],
    };
    this.draftModules = [...this.draftModules, newModule];
  }

  async removeModule(index: number): Promise<void> {
    const target = this.draftModules[index];
    if (!target) return;
    const hasContent =
      (target.courses && target.courses.length > 0) ||
      (target.subModules && target.subModules.length > 0);
    if (hasContent) {
      const confirmed = await this.confirmRemoval('Êtes-vous sûr de vouloir supprimer ce module ?');
      if (!confirmed) return;
    }
    this.draftModules = this.draftModules.filter((_, i) => i !== index);
    if (this.editingIndex === index) this.resetVariables();
  }

  moveUp(index: number): void {
    if (index === 0) return;
    const arr = [...this.draftModules];
    [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
    this.draftModules = arr;
  }

  moveDown(index: number): void {
    if (index >= this.draftModules.length - 1) return;
    const arr = [...this.draftModules];
    [arr[index + 1], arr[index]] = [arr[index], arr[index + 1]];
    this.draftModules = arr;
  }

  onTitleChange(index: number, value: string): void {
    if (this.editingIndex !== index || !this.editTemp) return;
    this.editTemp = { ...this.editTemp, title: value };
  }

  onDescriptionChange(index: number, value: string): void {
    const lines = value.split(/\r?\n/).map((l) => l.trim());
    const desc = lines.filter((l) => l.length > 0);
    if (this.editingIndex !== index || !this.editTemp) return;
    this.editTemp = { ...this.editTemp, description: desc };
  }

  hasSections(m: Module): boolean {
    return !!m && Array.isArray((m as any).courses) && (m as any).courses.length > 0;
  }

  hasSubModules(m: Module): boolean {
    return !!m && Array.isArray((m as any).subModules) && (m as any).subModules.length > 0;
  }

  isStructureSections(): boolean {
    return this.structureType === 'sections';
  }

  async setStructure(index: number, kind: 'sections' | 'submodules'): Promise<void> {
    if (this.editingIndex !== index || !this.editTemp) return;
    if (this.structureType === kind) return;

    const hasSections = Array.isArray(this.editTemp.courses) && this.editTemp.courses.length > 0;
    const hasSubModules = Array.isArray(this.editTemp.subModules) && this.editTemp.subModules.length > 0;

    const willEraseSections = kind === 'submodules' && hasSections;
    const willEraseSubModules = kind === 'sections' && hasSubModules;

    if (willEraseSections || willEraseSubModules) {
      const confirmed = await this.confirmStructureSwap(kind);
      if (!confirmed) return;
    }

    this.structureType = kind;
    const m = { ...this.editTemp } as Module;
    if (kind === 'sections') {
      m.courses = Array.isArray(m.courses) ? m.courses : [];
      m.subModules = undefined;
      // Remove exclusive_submodules rule if present
      m.rules = (m.rules || []).filter((r) => r.type !== 'exclusive_submodules');
      this.subEditingIndex = null;
      this.subEditTemp = null;
      this.subSecEditingIndex = null;
      this.subSecEditTemp = null;
    } else {
      m.subModules = Array.isArray(m.subModules) ? m.subModules : [];
      m.courses = undefined;
      this.secEditingIndex = null;
      this.secEditTemp = null;
      this.subSecEditingIndex = null;
      this.subSecEditTemp = null;
    }
    this.editTemp = m;
  }

  private async confirmStructureSwap(target: 'sections' | 'submodules'): Promise<boolean> {
    const { GsupDialog } = await import('@app/components/gsup-dialog/gsup-dialog');
    const message =
      target === 'sections'
        ? 'Basculer vers les sections effacera tous les sous-modules existants. Continuer ?'
        : 'Basculer vers les sous-modules effacera toutes les sections existantes. Continuer ?';
    const dialogRef = this.dialog.open(GsupDialog, {
      data: {
        message,
        firstButton: 'Annuler',
        secondButton: 'Continuer',
      },
    });
    const result = await firstValueFrom(dialogRef.afterClosed());
    return !!result;
  }

  startEdit(index: number): void {
    this.editingIndex = index;
    this.editTemp = JSON.parse(JSON.stringify(this.draftModules[index]));
    if (!this.editTemp) return;
    // ✅ Ensure arrays (prevents *ngFor crashes)
    this.editTemp.courses = Array.isArray(this.editTemp.courses) ? this.editTemp.courses : [];
    this.editTemp.subModules = Array.isArray(this.editTemp.subModules) ? this.editTemp.subModules : [];

    const hasSubs= this.editTemp.subModules.length > 0;
    this.structureType = hasSubs ? 'submodules' : 'sections';
    this.subEditingIndex = null;
    this.subEditTemp = null;
    this.secEditingIndex = null;
    this.secEditTemp = null;
    this.subSecEditingIndex = null;
    this.subSecEditTemp = null;
    this.ensureCoursesLoaded();
  }

  cancelEdit(): void {
    this.editingIndex = null;
    this.editTemp = null;
  }

  saveEdit(): void {
    this.applyPendingModuleSectionEdit();
    this.applyPendingSubModuleSectionEdit();
    this.applyPendingSubModuleEdit();
    if (this.editingIndex === null || !this.editTemp) return;
    const arr = [...this.draftModules];
    arr[this.editingIndex] = this.editTemp;
    this.draftModules = arr;
    this.resetVariables();
  }

  resetVariables(): void {
    this.editingIndex = null;
    this.editTemp = null;
    this.subEditingIndex = null;
    this.subEditTemp = null;
    this.secEditingIndex = null;
    this.secEditTemp = null;
    this.subSecEditingIndex = null;
    this.subSecEditTemp = null;
  }

  addRule(type: RuleType): void {
    if (this.editTemp == null) return;
    const rules: RuleDefinition[] = [...(this.editTemp.rules || [])];
    if (rules.find((r) => r.type === type)) return; // prevent duplicates
    switch (type) {
      case 'credits_exact':
      case 'credits_minimum':
      case 'credits_maximum':
        rules.push({ type, value: 0 });
        break;
      case 'exclusive_submodules':
        rules.push({ type: 'exclusive_submodules' });
        break;
      case 'director_approval':
        rules.push({ type: 'director_approval' });
        break;

      default:
        break;
    }

    this.editTemp = { ...this.editTemp, rules };
  }


  removeRule(index: number): void {
    if (!this.editTemp?.rules) return;
    const rules = this.editTemp.rules.filter((_, i) => i !== index);
    this.editTemp = { ...this.editTemp, rules };
  }

  hasRule(type: RuleType): boolean {
    return !!this.editTemp?.rules?.some(r => r.type === type);
  }

  // ---------- Submodules editor (within current module edit) ----------
  addSubModule(): void {
    if (!this.editTemp) return;
    const list = [...(this.editTemp.subModules || [])];
    list.push({ title: 'Nouveau sous-module', description: [], courses: [], rules: [] });
    this.editTemp = { ...this.editTemp, subModules: list };

  }

  async removeSubModule(j: number): Promise<void> {
    if (!this.editTemp?.subModules) return;
    const target = this.editTemp.subModules[j];
    const hasContent = !!target && (
      (target.courses && target.courses.length > 0) ||
      (target.description && target.description.length > 0) ||
      (target.rules && target.rules.length > 0)
    );
    if (hasContent) {
      const confirmed = await this.confirmRemoval(' Êtes-vous sûr de vouloir supprimer ce sous-module?');
      if (!confirmed) return;
    }
    const list = this.editTemp.subModules.filter((_, i) => i !== j);
    this.editTemp = { ...this.editTemp, subModules: list };
    this.subEditingIndex = null;
    this.subEditTemp = null;

  }

  moveSubModuleUp(j: number): void {
    if (!this.editTemp?.subModules || j === 0) return;
    const list = [...this.editTemp.subModules];
    [list[j - 1], list[j]] = [list[j], list[j - 1]];
    this.editTemp = { ...this.editTemp, subModules: list };

  }

  moveSubModuleDown(j: number): void {
    if (!this.editTemp?.subModules || j >= this.editTemp.subModules.length - 1) return;
    const list = [...this.editTemp.subModules];
    [list[j + 1], list[j]] = [list[j], list[j + 1]];
    this.editTemp = { ...this.editTemp, subModules: list };
  }

  startSubEdit(j: number): void {
    if (!this.editTemp?.subModules) return;
    this.subEditingIndex = j;
    this.subEditTemp = JSON.parse(JSON.stringify(this.editTemp.subModules[j]));

    this.ensureCoursesLoaded();
  }

  cancelSubEdit(): void {
    this.subEditingIndex = null;
    this.subEditTemp = null;

  }

  saveSubEdit(): void {
    this.applyPendingSubModuleSectionEdit();
    this.applyPendingSubModuleEdit();
  }

  subOnTitleChange(val: string): void {
    if (!this.subEditTemp) return;
    this.subEditTemp = { ...this.subEditTemp, title: val };
  }

  subOnDescriptionChange(val: string): void {
    if (!this.subEditTemp) return;
    const lines = val.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    this.subEditTemp = { ...this.subEditTemp, description: lines };
  }

  subHasRule(type: RuleType): boolean {
    return !!this.subEditTemp?.rules?.some(r => r.type === type);
  }

  subAddRule(type: RuleType): void {
    if (!this.subEditTemp) return;
    const allowed: RuleType[] = ['credits_exact','credits_minimum','credits_maximum','director_approval'];
    if (!allowed.includes(type)) return;
    const rules: RuleDefinition[] = [...(this.subEditTemp.rules || [])];
    if (rules.find(r => r.type === type)) return;
    if (type === 'director_approval') {
      rules.push({ type });
    } else {
      rules.push({ type, value: 0 });
    }
    this.subEditTemp = { ...this.subEditTemp, rules };
  }

  subRemoveRule(index: number): void {
    if (!this.subEditTemp?.rules) return;
    const rules = this.subEditTemp.rules.filter((_, i) => i !== index);
    this.subEditTemp = { ...this.subEditTemp, rules };
  }


  // ---------- Module-level sections editor ----------
  addSection(): void {
    if (!this.editTemp) return;
    const list = [...(this.editTemp.courses || [])];
    list.push({ description: 'Nouvelle section', courses: [], rules: [] });
    this.editTemp = { ...this.editTemp, courses: list };
  }

  async removeSection(k: number): Promise<void> {
    if (!this.editTemp?.courses) return;
    const target = this.editTemp.courses[k];
    const hasContent = !!target && (
      (target.courses && target.courses.length > 0) ||
      (target.rules && target.rules.length > 0) ||
      (!!target.description && target.description.trim().length > 0)
    );
    if (hasContent) {
      const confirmed = await this.confirmRemoval('Êtes-vous sûr de vouloir supprimer cette section?');
      if (!confirmed) return;
    }
    const list = this.editTemp.courses.filter((_, i) => i !== k);
    this.editTemp = { ...this.editTemp, courses: list };
    if (this.secEditingIndex === k) { this.secEditingIndex = null; this.secEditTemp = null; }
  }

  startSecEdit(k: number): void {
    if (!this.editTemp?.courses) return;
    this.secEditingIndex = k;
    this.secEditTemp = JSON.parse(JSON.stringify(this.editTemp.courses[k]));
    this.ensureCoursesLoaded();
  }

  cancelSecEdit(): void {
    this.secEditingIndex = null;
    this.secEditTemp = null;
  }

  saveSecEdit(): void {
    this.applyPendingModuleSectionEdit();
  }

  secOnDescriptionChange(val: string): void {
    if (!this.secEditTemp) return;
    this.secEditTemp = { ...this.secEditTemp, description: val };
  }

  secHasRule(type: RuleType): boolean {
    return !!this.secEditTemp?.rules?.some(r => r.type === type);
  }
  secAddRule(type: RuleType): void {
    if (!this.secEditTemp) return;
    const allowed: RuleType[] = ['credits_exact','credits_minimum','credits_maximum','director_approval'];
    if (!allowed.includes(type)) return;
    const rules: RuleDefinition[] = [...(this.secEditTemp.rules || [])];
    if (rules.find(r => r.type === type)) return;
    if (type === 'director_approval') {
      rules.push({ type});
    } else {
      rules.push({ type, value: 0});
    }
    this.secEditTemp = { ...this.secEditTemp, rules };
  }

  secRemoveRule(idx: number): void {
    if (!this.secEditTemp?.rules) return;
    const rules = this.secEditTemp.rules.filter((_, i) => i !== idx);
    this.secEditTemp = { ...this.secEditTemp, rules };
  }

  secOnAddRule(selectEl: HTMLSelectElement): void {
    const val = (selectEl.value || 'credits_exact') as RuleType;
    this.secAddRule(val);
    selectEl.value = 'credits_exact';
  }

  // ---------- Submodule-level sections editor ----------
  subAddSection(): void {
    if (!this.subEditTemp) return;
    const list = [...(this.subEditTemp.courses || [])];
    list.push({ description: 'Nouvelle section', courses: [], rules: [] });
    this.subEditTemp = { ...this.subEditTemp, courses: list };
  }
  async subRemoveSection(k: number): Promise<void> {
    if (!this.subEditTemp?.courses) return;
    const target = this.subEditTemp.courses[k];
    const hasContent = !!target && (
      (target.courses && target.courses.length > 0) ||
      (target.rules && target.rules.length > 0) ||
      (!!target.description && target.description.trim().length > 0)
    );
    if (hasContent) {
      const confirmed = await this.confirmRemoval('Supprimer cette section du sous-module et tous ses cours ?');
      if (!confirmed) return;
    }
    const list = this.subEditTemp.courses.filter((_, i) => i !== k);
    this.subEditTemp = { ...this.subEditTemp, courses: list };
    if (this.subSecEditingIndex === k) { this.subSecEditingIndex = null; this.subSecEditTemp = null; }
  }
  subStartSecEdit(k: number): void {
    if (!this.subEditTemp?.courses) return;
    this.subSecEditingIndex = k;
    this.subSecEditTemp = JSON.parse(JSON.stringify(this.subEditTemp.courses[k]));

    this.ensureCoursesLoaded();
  }
  subCancelSecEdit(): void {
    this.subSecEditingIndex = null;
    this.subSecEditTemp = null;

  }
  subSaveSecEdit(): void {
    this.applyPendingSubModuleSectionEdit();
  }
  subSecOnDescriptionChange(val: string): void {
    if (!this.subSecEditTemp) return;
    this.subSecEditTemp = { ...this.subSecEditTemp, description: val };
  }
  subSecHasRule(type: RuleType): boolean {
    return !!this.subSecEditTemp?.rules?.some(r => r.type === type);
  }
  subSecAddRule(type: RuleType): void {
    if (!this.subSecEditTemp) return;
    const allowed: RuleType[] = ['credits_exact','credits_minimum','credits_maximum','director_approval'];
    if (!allowed.includes(type)) return;
    const rules: RuleDefinition[] = [...(this.subSecEditTemp.rules || [])];
    if (rules.find(r => r.type === type)) return;
    if (type === 'director_approval') {
      rules.push({ type });
    } else {
      rules.push({ type, value: 0});
    }
    this.subSecEditTemp = { ...this.subSecEditTemp, rules };
  }

  subSecRemoveRule(idx: number): void {
    if (!this.subSecEditTemp?.rules) return;
    const rules = this.subSecEditTemp.rules.filter((_, i) => i !== idx);
    this.subSecEditTemp = { ...this.subSecEditTemp, rules };
  }
  subSecOnAddRule(selectEl: HTMLSelectElement): void {
    const val = (selectEl.value || 'credits_exact') as RuleType;
    this.subSecAddRule(val);
    selectEl.value = 'credits_exact';
  }

  onAddRule(selectEl: HTMLSelectElement): void {
    const val = (selectEl.value || 'credits_exact') as RuleType;
    this.addRule(val);
    selectEl.value = 'credits_exact';
  }

  formatRules(rules?: RuleDefinition[]): string {
    if (!rules || rules.length === 0) return '-';
    const parts = rules.map((r) => {
      const label = this.ruleLabels[r.type] || r.type;
      if (r.type === 'credits_exact' && r.value != null) return `${label}: ${r.value} cr`;
      if (r.type === 'credits_minimum' && r.value != null) return `${label}: ${r.value} cr`;
      if (r.type === 'credits_maximum' && r.value != null) return `${label}: ${r.value} cr`;
      if (r.type === 'director_approval') return label;
return label;
    });
    return parts.join(', ');
  }

  ruleSymbol(rule: RuleDefinition): string {
    switch (rule.type) {
      case 'credits_exact':
        return '=';
      case 'credits_minimum':
        return '≥';
      case 'credits_maximum':
        return '≤';
      default:
        return '';
    }
  }

  ruleValue(rule: RuleDefinition): string | null {
    if (rule.type === 'credits_exact' || rule.type === 'credits_minimum' || rule.type === 'credits_maximum') {
      return rule.value != null ? `${rule.value} cr` : null;
    }
return null;
  }

  requiresRuleValue(type: RuleType): boolean {
    return type === 'credits_exact' || type === 'credits_minimum' || type === 'credits_maximum';
  }

  ruleTooltip(rule: RuleDefinition): string {
    return this.formatRules([rule]);
  }

  subOnAddRule(selectEl: HTMLSelectElement): void {
    const val = (selectEl.value || 'credits_exact') as RuleType;
    this.subAddRule(val);
    selectEl.value = 'credits_exact';
  }

  isLastSubModule(j: number): boolean {
    const len = this.editTemp?.subModules?.length || 0;
    return len === 0 || j >= len - 1;
  }

  // Section/module summary helpers for view mode
  sectionCourseCount(s?: Section | null): number {
    return s?.courses?.length || 0;
  }

  moduleCoursesCount(m?: Module | null): number {
    if (!m?.courses) return 0;
    return m.courses.reduce((sum, sec) => sum + (sec.courses?.length || 0), 0);
  }

  commitDrafts(): void {
    this.modulesChange.emit(JSON.parse(JSON.stringify(this.draftModules)));
  }

  onModuleSectionCourseChange(ev: { course: Course; selected: boolean }): void {
    if (!this.secEditTemp) return;
    const list = [...(this.secEditTemp.courses || [])];
    const idx = list.findIndex(c => c.sigle === ev.course.sigle);
    if (ev.selected && idx === -1) list.push(ev.course);
    if (!ev.selected && idx !== -1) list.splice(idx, 1);
    this.secEditTemp = { ...this.secEditTemp, courses: list };
  }

  onSubSectionCourseChange(ev: { course: Course; selected: boolean }): void {
    if (!this.subSecEditTemp) return;
    const list = [...(this.subSecEditTemp.courses || [])];
    const idx = list.findIndex(c => c.sigle === ev.course.sigle);
    if (ev.selected && idx === -1) list.push(ev.course);
    if (!ev.selected && idx !== -1) list.splice(idx, 1);
    this.subSecEditTemp = { ...this.subSecEditTemp, courses: list };
  }

  removeCourseFromModuleSection(sigle: string): void {
    if (!this.secEditTemp) return;
    const list = (this.secEditTemp.courses || []).filter(c => c.sigle !== sigle);
    this.secEditTemp = { ...this.secEditTemp, courses: list };
  }

  removeCourseFromSubSection(sigle: string): void {
    if (!this.subSecEditTemp) return;
    const list = (this.subSecEditTemp.courses || []).filter(c => c.sigle !== sigle);
    this.subSecEditTemp = { ...this.subSecEditTemp, courses: list };
  }

  private ensureCoursesLoaded(): void {
    if (this.availableCourses.length > 0) return;
    this.api.getCourses().subscribe(c => this.availableCourses = c || []);
  }

  subModulesSectionsCount(m: Module): number {
    if (!Array.isArray(m?.subModules)) return 0;
    return m.subModules.reduce((acc, sm) => {
      const count = Array.isArray(sm?.courses) ? sm.courses.length : 0;
      return acc + count;
    }, 0);
  }

  subModulesCoursesCount(m: Module): number {
    if (!Array.isArray(m?.subModules)) return 0;
    return m.subModules.reduce((acc, sm) => {
      if (!Array.isArray(sm?.courses)) return acc;
      const inSm = sm.courses.reduce((a, sec) => a + (Array.isArray(sec?.courses) ? sec.courses.length : 0), 0);
      return acc + inSm;
    }, 0);
  }

  hasPendingEdits(): boolean {
    return (
      this.editingIndex !== null ||
      this.subEditingIndex !== null ||
      this.secEditingIndex !== null ||
      this.subSecEditingIndex !== null
    );
  }

  applyAllPendingEdits(): void {
    this.applyPendingModuleSectionEdit();
    this.applyPendingSubModuleSectionEdit();
    this.applyPendingSubModuleEdit();
    if (this.editingIndex !== null && this.editTemp) {
      const arr = [...this.draftModules];
      arr[this.editingIndex] = this.editTemp;
      this.draftModules = arr;
      this.resetVariables();
    }
  }

  private applyPendingModuleSectionEdit(): void {
    if (this.secEditingIndex === null || !this.secEditTemp || !this.editTemp?.courses) return;
    const list = [...this.editTemp.courses];
    list[this.secEditingIndex] = this.secEditTemp;
    this.editTemp = { ...this.editTemp, courses: list };
    this.secEditingIndex = null;
    this.secEditTemp = null;
  }

  private applyPendingSubModuleSectionEdit(): void {
    if (this.subSecEditingIndex === null || !this.subSecEditTemp || !this.subEditTemp?.courses) return;
    const list = [...this.subEditTemp.courses];
    list[this.subSecEditingIndex] = this.subSecEditTemp;
    this.subEditTemp = { ...this.subEditTemp, courses: list };
    this.subSecEditingIndex = null;
    this.subSecEditTemp = null;
  }

  private applyPendingSubModuleEdit(): void {
    if (this.subEditingIndex === null || !this.subEditTemp || !this.editTemp?.subModules) return;
    const list = [...this.editTemp.subModules];
    list[this.subEditingIndex] = this.subEditTemp;
    this.editTemp = { ...this.editTemp, subModules: list };
    this.subEditingIndex = null;
    this.subEditTemp = null;
  }

  private async confirmRemoval(message: string): Promise<boolean> {
    const { GsupDialog } = await import('@app/components/gsup-dialog/gsup-dialog');
    const dialogRef = this.dialog.open(GsupDialog, {
      data: {
        message,
        firstButton: 'Annuler',
        secondButton: 'Supprimer',
      },
    });
    const result = await firstValueFrom(dialogRef.afterClosed());
    return !!result;
  }

}
