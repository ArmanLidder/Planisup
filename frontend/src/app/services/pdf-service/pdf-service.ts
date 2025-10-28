import { Injectable } from '@angular/core';
import { PDFDocument, PDFForm } from 'pdf-lib';
import { User, UserRole } from '@common/user';
import { ApiService } from '../api/api-service';
import { StudyPlan } from '@common/study-plan';
import { lastValueFrom } from 'rxjs';
import { StudyPlanService } from '../study-plan/study-plan-service';
import { ProgramService } from '../program/program-service';

@Injectable({
  providedIn: 'root',
})
export class PdfService {
  private members: User[] = [];
  private firstNameFile: string = '';
  private lastNameFile: string = '';

  constructor(
    private readonly apiService: ApiService,
    private readonly programService: ProgramService,
    private readonly studyPlanService: StudyPlanService
  ) {}

  async generateAndDownloadPdf(studyPlan: StudyPlan) {
    const pdfBytes = await this.generateStudyPlanPdf(studyPlan);
    const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `plan_etudes_${this.firstNameFile}_${this.lastNameFile}.pdf`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  private async generateStudyPlanPdf(studyPlan: StudyPlan): Promise<Uint8Array> {
    const pdfUrl = '/assets/plan_etudes_2cycle.pdf';
    const pdfBytes = await fetch(pdfUrl).then((res) => res.arrayBuffer());
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const form = pdfDoc.getForm();
    return new Promise((resolve, reject) => {
      this.fillFormFields(form, studyPlan, resolve, reject);
    });
  }

  private async fillFormFields(
    form: PDFForm,
    studyPlan: StudyPlan,
    resolve: (value: Uint8Array) => void,
    reject: (error: any) => void
  ) {
    await this.fillCredentialsAndObtentionSections(form, studyPlan);
    await this.fillAdditionalWorkShops(form, studyPlan);
    await this.fillMandatoryCourses(form, studyPlan);
    await this.fillComplementaryCourses(form, studyPlan);
    await this.completeForm(form, resolve, reject);
  }

  private async fillCredentialsAndObtentionSections(form: PDFForm, studyPlan: StudyPlan) {
    if (studyPlan?._id) {
      const members = await lastValueFrom(
        this.apiService.getProcessMembersByIdStudyPlan(studyPlan._id)
      );
      this.members = members;
    }

    this.members.forEach((member) => {
      if (member.role === UserRole.Etudiant) {
        this.firstNameFile = member.firstName;
        this.lastNameFile = member.lastName;
        this.setTextField(form, 'nom', this.lastNameFile);
        this.setTextField(form, 'prénom', this.firstNameFile);
        this.setTextField(form, 'matricule', '2132752');
        this.setTextField(
          form,
          'signature_étudiant_et_date',
          `${this.firstNameFile} ${this.lastNameFile}, ${new Date().toLocaleDateString()}`
        );
      }

      if (member.role === UserRole.Directeur) {
        this.setTextField(
          form,
          'directeur_d’études_ou_de_recherche',
          `${member.firstName} ${member.lastName}`
        );
        this.setTextField(
          form,
          'signature_directeur_et_date',
          `${member.firstName} ${member.lastName}, ${new Date().toLocaleDateString()}`
        );
      }

      if (member.role === UserRole.Coordonnateur) {
        this.setTextField(
          form,
          'signature_cpes_et_date',
          `${member.firstName} ${member.lastName}, ${new Date().toLocaleDateString()}`
        );
      }

      if (member.role === UserRole.Registrar) {
        this.setTextField(form, 'commentaire_registrariat');
        this.setTextField(form, 'signature_registrariat', `${member.firstName} ${member.lastName}`);
        this.setTextField(
          form,
          'date_signature_registrariat',
          `${new Date().toLocaleDateString()}`
        );
      }

      /* if (member.role === UserRole.Codirector) {
        this.setTextField(form, 'codirecteur_1', `${codirecteur1}`);
        this.setTextField(
          form,
          'codirecteur_2',
          `${codirecteur2}, ${new Date().toLocaleDateString()}`
        );
        this.setTextField(
          form,
          'signature_codirecteur_et_date',
          `${member.firstName} ${member.lastName}, ${new Date().toLocaleDateString())}`
        );
      }*/
    });

    if (this.studyPlanService.isProgramDESS()) {
      this.setCheckBox(form, 'dess');
    } else if (
      this.studyPlanService.isProgramMaster() &&
      this.programService.program?.degree.includes('recherche')
    ) {
      this.setCheckBox(form, 'm_sc_a');
    } else if (
      this.studyPlanService.isProgramMaster() &&
      !this.programService.program?.degree.includes('recherche')
    ) {
      this.setCheckBox(form, 'm_ing');
    }

    if (this.programService.program) {
      this.setTextField(form, 'programme', this.programService.program?.department);
      this.setTextField(form, 'option_ou_orientation', this.programService.program?.option || '');
    }

    this.setCheckBox(form, 'acceptation_condition');
  }

  private async fillAdditionalWorkShops(form: PDFForm, studyPlan: StudyPlan) {
    // Remplir les ateliers complémentaires si c'est une maitrise de recherche
    // this.setCheckBox(form, 'CAP7002');
    // this.setCheckBox(form, 'CAP7002E');
    // this.setCheckBox(form, 'CAP7005');
    // this.setCheckBox(form, 'CAP7005E');
    // Remplir les trimestres pour les ateliers si c'est une maitrise de recherche
    // this.setTextField(form, 'trimestre_atelier_1', 'Automne 2024'); // À adapter
    // this.setTextField(form, 'trimestre_atelier_2', 'Hiver 2025'); // À adapter
  }

  private async fillMandatoryCourses(form: PDFForm, studyPlan: StudyPlan) {
    if (studyPlan.coursesSelection && studyPlan.coursesSelection.modules) {
      const allCourses = this.extractAllCourses(studyPlan);
      let creditsTotal = 0;
      allCourses.forEach((course, index) => {
        creditsTotal += course.credits || 0;
        const formattedTrimester = this.formatTrimester(course.trimester);
        const pdfIndex = index + 1;
        this.setTextField(form, `institution_cours_obligatoire_${pdfIndex}`, 'Polytechnique');
        this.setTextField(form, `trimestre_cours_obligatoire_${pdfIndex}`, formattedTrimester);
        this.setTextField(form, `sigle_cours_obligatoire_${pdfIndex}`, course.sigle || '');
        this.setTextField(form, `titre_cours_obligatoire_${pdfIndex}`, course.name || '');
        this.setTextField(form, `module_cours_obligatoire_${pdfIndex}`, course.moduleType || '');
        this.setTextField(
          form,
          `crédits_cours_obligatoire_${pdfIndex}`,
          course.credits?.toString() || ''
        );
        if (pdfIndex === allCourses.length) {
          this.setTextField(form, `credits_total_1`, creditsTotal.toString());
        }
      });
    }
  }

  private async fillComplementaryCourses(form: PDFForm, studyPlan: StudyPlan) {
    if (studyPlan.coursesSelection && studyPlan.coursesSelection.modules) {
      const allCourses = this.extractAllCourses(studyPlan);
      let creditsTotal = 0;
      allCourses.forEach((course, index) => {
        creditsTotal += course.credits || 0;
        const formattedTrimester = this.formatTrimester(course.trimester);
        const pdfIndex = index + 1;
        this.setTextField(form, `institution_cours_complémentaire_${pdfIndex}`, 'Polytechnique');
        this.setTextField(form, `trimestre_cours_complémentaire_${pdfIndex}`, formattedTrimester);
        this.setTextField(form, `sigle_cours_complémentaire_${pdfIndex}`, course.sigle || '');
        this.setTextField(form, `titre_cours_complémentaire_${pdfIndex}`, course.name || '');
        this.setTextField(
          form,
          `catégorie_cours_complémentaire_${pdfIndex}`,
          course.moduleType || ''
        );
        this.setTextField(
          form,
          `crédits_cours_complémentaire_${pdfIndex}`,
          course.credits?.toString() || ''
        );
        if (pdfIndex === allCourses.length) {
          this.setTextField(form, `credits_total_2`, creditsTotal.toString());
        }
      });
    }
  }

  private async completeForm(
    form: PDFForm,
    resolve: (value: Uint8Array) => void,
    reject: (error: any) => void
  ) {
    try {
      resolve(await form.doc.save());
    } catch (error) {
      reject(error);
    }
  }

  private formatTrimester(trimester: any): string {
    if (!trimester) {
      return 'Non spécifié';
    }

    if (trimester.term && trimester.year) {
      return `${trimester.term} ${trimester.year}`;
    }

    console.warn('Format de trimestre non reconnu:', trimester);
    return 'Format inconnu';
  }

  private extractAllCourses(studyPlan: any) {
    const allCourses: any[] = [];
    if (studyPlan.coursesSelection.modules) {
      studyPlan.coursesSelection.modules.forEach((module: any) => {
        if (module.courses && Array.isArray(module.courses)) {
          module.courses.forEach((course: any) => {
            allCourses.push({
              ...course,
              module: module.title,
              moduleType: this.determineModuleType(module.title),
            });
          });
        }
      });
    }
    return allCourses;
  }

  private determineModuleType(moduleTitle: string): string {
    if (moduleTitle.includes('(A)')) return 'A';
    if (moduleTitle.includes('(B)')) return 'B';
    if (moduleTitle.includes('(C)')) return 'C';
    return 'autre';
  }

  private setTextField(form: PDFForm, fieldName: string, value?: string) {
    try {
      const textField = form.getTextField(fieldName);
      if (textField && value) {
        textField.setText(value);
      }
    } catch (error) {
      console.warn(`Text field "${fieldName}" not found in the PDF form.`);
    }
  }

  private setCheckBox(form: PDFForm, fieldName: string) {
    try {
      const checkBox = form.getCheckBox(fieldName);
      if (checkBox) {
        checkBox.check();
      }
    } catch (error) {
      console.warn(`Checkbox "${fieldName}" not found:`, error);
    }
  }
}
