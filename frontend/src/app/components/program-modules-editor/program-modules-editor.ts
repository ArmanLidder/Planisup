import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Module, Section, SubModule, RuleDefinition, RuleType, Course } from '@common/program';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { CourseSearch } from '@app/components/course-search/course-search';
import { ApiService } from '@app/services/api/api-service';

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

  manualCourseSigle = '';
  manualCourseName = '';
  manualCourseCredits: number | null = null;
  manualCourseError: string | null = null;

  subManualCourseSigle = '';
  subManualCourseName = '';
  subManualCourseCredits: number | null = null;
  subManualCourseError: string | null = null;

  availableCourses: Course[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['modules']) {
      // Deep clone input to draft when program changes
      this.draftModules = JSON.parse(JSON.stringify(this.modules || []));
      this.editingIndex = null;
      this.editTemp = null;
      this.subEditingIndex = null;
      this.subEditTemp = null;
      this.secEditingIndex = null;
      this.secEditTemp = null;
      this.subSecEditingIndex = null;
      this.subSecEditTemp = null;
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

  removeModule(index: number): void {
    this.draftModules = this.draftModules.filter((_, i) => i !== index);
    if (this.editingIndex === index) {
      this.editingIndex = null;
      this.editTemp = null;
    }
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
    return !!m.courses && !m.subModules;
  }

  hasSubModules(m: Module): boolean {
    return !!m.subModules && !m.courses;
  }

  isStructureSections(): boolean {
    if (!this.editTemp) return false;
    if (this.editTemp.courses) return true;
    if (this.editTemp.subModules) return false;
    return true;
  }

  setStructure(index: number, kind: 'sections' | 'submodules'): void {
    if (this.editingIndex !== index || !this.editTemp) return;
    const m = { ...this.editTemp } as Module;
    if (kind === 'sections') {
      m.subModules = undefined;
      m.courses = (m.courses || []) as Section[];
      // Remove exclusive_submodules rule if present
      m.rules = (m.rules || []).filter((r) => r.type !== 'exclusive_submodules');
    } else {
      m.courses = undefined;
      m.subModules = (m.subModules || []) as SubModule[];
      // Ensure exclusive_submodules rule is present and inferred
      const prefixes = this.inferSubmodulePrefixes(m);
      const rules = m.rules || [];
      if (!rules.find((r) => r.type === 'exclusive_submodules')) {
        rules.push({ type: 'exclusive_submodules', enforced: true, appliesToSubModules: prefixes });
      } else {
        rules.forEach((r) => {
          if (r.type === 'exclusive_submodules') r.appliesToSubModules = prefixes;
        });
      }
      m.rules = rules;
    }
    this.editTemp = m;
  }

  // View/Edit toggle for a module
  startEdit(index: number): void {
    this.editingIndex = index;
    this.editTemp = JSON.parse(JSON.stringify(this.draftModules[index]));
    // Normalize structure on load: prefer Sections when both exist; default to Sections when none
    if (this.editTemp) {
      const hasCourses = !!this.editTemp.courses;
      const hasSubs = !!this.editTemp.subModules;
      if (hasCourses && hasSubs) {
        this.editTemp.subModules = undefined as any;
      } else if (!hasCourses && !hasSubs) {
        this.editTemp.courses = [] as any;
      }
    }
    this.subEditingIndex = null;
    this.subEditTemp = null;
    this.secEditingIndex = null;
    this.secEditTemp = null;
    this.subSecEditingIndex = null;
    this.subSecEditTemp = null;
    this.resetManualSectionCourseInputs();
    this.resetSubManualCourseInputs();
    this.ensureCoursesLoaded();
  }

  cancelEdit(): void {
    this.editingIndex = null;
    this.editTemp = null;
  }

  saveEdit(): void {
    if (this.editingIndex === null || !this.editTemp) return;
    const arr = [...this.draftModules];
    arr[this.editingIndex] = this.editTemp;
    this.draftModules = arr;
    this.editingIndex = null;
    this.editTemp = null;
    this.subEditingIndex = null;
    this.subEditTemp = null;
    this.secEditingIndex = null;
    this.secEditTemp = null;
    this.subSecEditingIndex = null;
    this.subSecEditTemp = null;
  }

  // Save/Cancel all changes
  saveAll(): void {
    this.confirm('Enregistrer toutes les modifications des modules ?', 'Annuler', 'Enregistrer')
      .then((ok) => {
        if (ok) this.modulesChange.emit(JSON.parse(JSON.stringify(this.draftModules)));
      });
  }

  cancelAll(): void {
    this.confirm('Annuler toutes les modifications des modules ?', 'Non', 'Oui')
      .then((ok) => {
        if (!ok) return;
        this.draftModules = JSON.parse(JSON.stringify(this.modules || []));
        this.editingIndex = null;
        this.editTemp = null;
        this.subEditingIndex = null;
        this.subEditTemp = null;
        this.secEditingIndex = null;
        this.secEditTemp = null;
        this.subSecEditingIndex = null;
        this.subSecEditTemp = null;
        this.resetManualSectionCourseInputs();
        this.resetSubManualCourseInputs();
      });
  }

  get hasChanges(): boolean {
    try {
      return JSON.stringify(this.draftModules) !== JSON.stringify(this.modules || []);
    } catch {
      return true;
    }
  }

  // Rules handling for module edit
  addRule(type: RuleType): void {
    if (this.editTemp == null) return;
    const rules: RuleDefinition[] = [...(this.editTemp.rules || [])];
    if (rules.find((r) => r.type === type)) return; // prevent duplicates
    if (type === 'credits_exact' || type === 'credits_minimum' || type === 'credits_maximum') {
      rules.push({ type, value: 0, enforced: true });
    } else if (type === 'exclusive_submodules') {
      const prefixes = this.inferSubmodulePrefixes(this.editTemp);
      rules.push({ type: 'exclusive_submodules', enforced: true, appliesToSubModules: prefixes });
    }
    this.editTemp = { ...this.editTemp, rules };
  }

  updateRule(index: number, patch: Partial<RuleDefinition>): void {
    if (!this.editTemp?.rules) return;
    // Mutate in place to avoid input losing focus
    Object.assign(this.editTemp.rules[index], patch);
  }

  removeRule(index: number): void {
    if (!this.editTemp?.rules) return;
    const rules = this.editTemp.rules.filter((_, i) => i !== index);
    this.editTemp = { ...this.editTemp, rules };
  }

  inferSubmodulePrefixes(mod: Module): string[] {
    const set = new Set<string>();
    (mod.subModules || []).forEach((sm) => {
      const m = sm.title.match(/\(([A-Z]\d+)\)/);
      if (m && m[1]) set.add(m[1]);
    });
    return Array.from(set);
  }

  toNumber(val: any): number { return Number(val) || 0; }

  setRuleValue(index: number, value: number): void {
    if (!this.editTemp?.rules) return;
    this.editTemp.rules[index].value = value;
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
    this.updateExclusiveRuleFromSubmodules(this.editTemp);
  }

  removeSubModule(j: number): void {
    if (!this.editTemp?.subModules) return;
    const list = this.editTemp.subModules.filter((_, i) => i !== j);
    this.editTemp = { ...this.editTemp, subModules: list };
    this.subEditingIndex = null;
    this.subEditTemp = null;
    this.updateExclusiveRuleFromSubmodules(this.editTemp);
  }

  moveSubModuleUp(j: number): void {
    if (!this.editTemp?.subModules || j === 0) return;
    const list = [...this.editTemp.subModules];
    [list[j - 1], list[j]] = [list[j], list[j - 1]];
    this.editTemp = { ...this.editTemp, subModules: list };
    this.updateExclusiveRuleFromSubmodules(this.editTemp);
  }

  moveSubModuleDown(j: number): void {
    if (!this.editTemp?.subModules || j >= this.editTemp.subModules.length - 1) return;
    const list = [...this.editTemp.subModules];
    [list[j + 1], list[j]] = [list[j], list[j + 1]];
    this.editTemp = { ...this.editTemp, subModules: list };
    this.updateExclusiveRuleFromSubmodules(this.editTemp);
  }

  startSubEdit(j: number): void {
    if (!this.editTemp?.subModules) return;
    this.subEditingIndex = j;
    this.subEditTemp = JSON.parse(JSON.stringify(this.editTemp.subModules[j]));
    this.resetSubManualCourseInputs();
    this.ensureCoursesLoaded();
  }

  cancelSubEdit(): void {
    this.subEditingIndex = null;
    this.subEditTemp = null;
    this.resetSubManualCourseInputs();
  }

  saveSubEdit(): void {
    if (this.subEditingIndex === null || !this.subEditTemp || !this.editTemp?.subModules) return;
    const list = [...this.editTemp.subModules];
    list[this.subEditingIndex] = this.subEditTemp;
    this.editTemp = { ...this.editTemp, subModules: list };
    this.subEditingIndex = null;
    this.subEditTemp = null;
    this.resetSubManualCourseInputs();
    this.updateExclusiveRuleFromSubmodules(this.editTemp);
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
      rules.push({ type, enforced: true });
    } else {
      rules.push({ type, value: 0, enforced: true });
    }
    this.subEditTemp = { ...this.subEditTemp, rules };
  }

  subUpdateRule(index: number, patch: Partial<RuleDefinition>): void {
    if (!this.subEditTemp?.rules) return;
    Object.assign(this.subEditTemp.rules[index], patch);
  }

  subRemoveRule(index: number): void {
    if (!this.subEditTemp?.rules) return;
    const rules = this.subEditTemp.rules.filter((_, i) => i !== index);
    this.subEditTemp = { ...this.subEditTemp, rules };
  }

  // Keep module exclusive_submodules rule in sync with current submodule titles
  private updateExclusiveRuleFromSubmodules(mod: Module): void {
    if (!mod.rules) return;
    const ex = mod.rules.find(r => r.type === 'exclusive_submodules');
    if (ex) ex.appliesToSubModules = this.inferSubmodulePrefixes(mod);
  }

  // ---------- Module-level sections editor ----------
  addSection(): void {
    if (!this.editTemp) return;
    const list = [...(this.editTemp.courses || [])];
    list.push({ description: 'Nouvelle section', courses: [], rules: [] });
    this.editTemp = { ...this.editTemp, courses: list };
  }

  removeSection(k: number): void {
    if (!this.editTemp?.courses) return;
    const list = this.editTemp.courses.filter((_, i) => i !== k);
    this.editTemp = { ...this.editTemp, courses: list };
    if (this.secEditingIndex === k) { this.secEditingIndex = null; this.secEditTemp = null; }
  }

  startSecEdit(k: number): void {
    if (!this.editTemp?.courses) return;
    this.secEditingIndex = k;
    this.secEditTemp = JSON.parse(JSON.stringify(this.editTemp.courses[k]));
    this.resetManualSectionCourseInputs();
    this.ensureCoursesLoaded();
  }

  cancelSecEdit(): void {
    this.secEditingIndex = null;
    this.secEditTemp = null;
    this.resetManualSectionCourseInputs();
  }

  saveSecEdit(): void {
    if (this.secEditingIndex === null || !this.secEditTemp || !this.editTemp?.courses) return;
    const list = [...this.editTemp.courses];
    list[this.secEditingIndex] = this.secEditTemp;
    this.editTemp = { ...this.editTemp, courses: list };
    this.secEditingIndex = null;
    this.secEditTemp = null;
    this.resetManualSectionCourseInputs();
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
      rules.push({ type, enforced: true });
    } else {
      rules.push({ type, value: 0, enforced: true });
    }
    this.secEditTemp = { ...this.secEditTemp, rules };
  }
  secUpdateRule(idx: number, patch: Partial<RuleDefinition>): void {
    if (!this.secEditTemp?.rules) return;
    Object.assign(this.secEditTemp.rules[idx], patch);
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
  subRemoveSection(k: number): void {
    if (!this.subEditTemp?.courses) return;
    const list = this.subEditTemp.courses.filter((_, i) => i !== k);
    this.subEditTemp = { ...this.subEditTemp, courses: list };
    if (this.subSecEditingIndex === k) { this.subSecEditingIndex = null; this.subSecEditTemp = null; }
  }
  subStartSecEdit(k: number): void {
    if (!this.subEditTemp?.courses) return;
    this.subSecEditingIndex = k;
    this.subSecEditTemp = JSON.parse(JSON.stringify(this.subEditTemp.courses[k]));
    this.resetSubManualCourseInputs();
    this.ensureCoursesLoaded();
  }
  subCancelSecEdit(): void {
    this.subSecEditingIndex = null;
    this.subSecEditTemp = null;
    this.resetSubManualCourseInputs();
  }
  subSaveSecEdit(): void {
    if (this.subSecEditingIndex === null || !this.subSecEditTemp || !this.subEditTemp?.courses) return;
    const list = [...this.subEditTemp.courses];
    list[this.subSecEditingIndex] = this.subSecEditTemp;
    this.subEditTemp = { ...this.subEditTemp, courses: list };
    this.subSecEditingIndex = null;
    this.subSecEditTemp = null;
    this.resetSubManualCourseInputs();
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
      rules.push({ type, enforced: true });
    } else {
      rules.push({ type, value: 0, enforced: true });
    }
    this.subSecEditTemp = { ...this.subSecEditTemp, rules };
  }
  subSecUpdateRule(idx: number, patch: Partial<RuleDefinition>): void {
    if (!this.subSecEditTemp?.rules) return;
    Object.assign(this.subSecEditTemp.rules[idx], patch);
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

  private async confirm(message: string, first: string, second: string): Promise<boolean> {
    const { GsupDialog } = await import('@app/components/gsup-dialog/gsup-dialog');
    const ref = this.dialog.open(GsupDialog as any, { data: { message, firstButton: first, secondButton: second } });
    return await ref.afterClosed().toPromise();
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
      if (r.type === 'exclusive_submodules' && r.appliesToSubModules?.length)
        return `${label}: ${r.appliesToSubModules.join(', ')}`;
      return label;
    });
    return parts.join(', ');
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

  addManualCourseToSection(): void {
    if (!this.secEditTemp) return;
    this.manualCourseError = null;
    const sigle = (this.manualCourseSigle || '').trim().toUpperCase();
    const name = (this.manualCourseName || '').trim();
    const rawCredits = this.manualCourseCredits;
    if (!sigle || !name || rawCredits === null || rawCredits === undefined) {
      this.manualCourseError = 'Renseignez le sigle, le titre et les crédits du cours.';
      return;
    }
    const credits = Number(rawCredits);
    if (!Number.isFinite(credits) || credits <= 0) {
      this.manualCourseError = 'Les crédits doivent être un nombre positif.';
      return;
    }
    const courses = [...(this.secEditTemp.courses || [])];
    if (courses.some((c) => c.sigle.toUpperCase() === sigle)) {
      this.manualCourseError = 'Ce sigle est déjà présent dans cette section.';
      return;
    }
    const course: Course = { sigle, name, credits, trimester: 'N/A' };
    courses.push(course);
    this.secEditTemp = { ...this.secEditTemp, courses };
    this.includeCourseInAvailableList(course);
    this.resetManualSectionCourseInputs();
  }

  addManualCourseToSubSection(): void {
    if (!this.subSecEditTemp) return;
    this.subManualCourseError = null;
    const sigle = (this.subManualCourseSigle || '').trim().toUpperCase();
    const name = (this.subManualCourseName || '').trim();
    const rawCredits = this.subManualCourseCredits;
    if (!sigle || !name || rawCredits === null || rawCredits === undefined) {
      this.subManualCourseError = 'Renseignez le sigle, le titre et les crédits du cours.';
      return;
    }
    const credits = Number(rawCredits);
    if (!Number.isFinite(credits) || credits <= 0) {
      this.subManualCourseError = 'Les crédits doivent être un nombre positif.';
      return;
    }
    const courses = [...(this.subSecEditTemp.courses || [])];
    if (courses.some((c) => c.sigle.toUpperCase() === sigle)) {
      this.subManualCourseError = 'Ce sigle est déjà présent dans cette section.';
      return;
    }
    const course: Course = { sigle, name, credits, trimester: 'N/A' };
    courses.push(course);
    this.subSecEditTemp = { ...this.subSecEditTemp, courses };
    this.includeCourseInAvailableList(course);
    this.resetSubManualCourseInputs();
  }

  // Courses selection handlers
  onModuleSectionCourseChange(ev: { course: Course; selected: boolean }): void {
    if (!this.secEditTemp) return;
    const list = [...(this.secEditTemp.courses || [])];
    const idx = list.findIndex(c => c.sigle === ev.course.sigle);
    if (ev.selected && idx === -1) list.push(ev.course);
    if (!ev.selected && idx !== -1) list.splice(idx, 1);
    this.secEditTemp = { ...this.secEditTemp, courses: list };
  }

  onSubSectionCourseChange(ev: { course: Course; selected: boolean }): void {
    console.log("On Sub Section Course Change", ev.course);
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

  private resetManualSectionCourseInputs(): void {
    this.manualCourseSigle = '';
    this.manualCourseName = '';
    this.manualCourseCredits = null;
    this.manualCourseError = null;
  }

  private resetSubManualCourseInputs(): void {
    this.subManualCourseSigle = '';
    this.subManualCourseName = '';
    this.subManualCourseCredits = null;
    this.subManualCourseError = null;
  }

  private includeCourseInAvailableList(course: Course): void {
    if (this.availableCourses.some((c) => c.sigle.toUpperCase() === course.sigle.toUpperCase())) {
      return;
    }
    this.availableCourses = [...this.availableCourses, course];
  }

  private ensureCoursesLoaded(): void {
    if (this.availableCourses.length > 0) return;
    this.api.getCourses().subscribe(c => this.availableCourses = c || []);
  }
}
