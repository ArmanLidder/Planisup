import { Injectable } from '@angular/core';
import { PDFDocument, PDFForm } from 'pdf-lib';
import { User, UserRole } from '@common/user';
import { ApiService } from '../api/api-service';
import { StudyPlan } from '@common/study-plan';
import { lastValueFrom } from 'rxjs';
import { StudyPlanService } from '../study-plan/study-plan-service';
import { ProgramService } from '../program/program-service';
import { Trimester } from '@common/program';

@Injectable({
  providedIn: 'root',
})
export class PdfService {
  private members: User[] = [];
  private codirectors: User[] = [];
  private readonly masterResearchCourses: string[] = ['CAP7002', 'CAP7005', 'CAP7002E', 'CAP7005E'];
  private readonly phdResearchCourses: string[] = [
    'CAP7003',
    'CAP7003E',
    'CAP7005',
    'CAP7005E',
    'CAP7011',
    'CAP7011E',
    'CAP7015',
    'CAP7015E',
  ];
  private firstNameFile: string = '';
  private lastNameFile: string = '';
  private codirectorsDateSignature: Date = new Date();

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
    let pdfUrl = '';
    if (this.studyPlanService.isProgramPHD()) {
      pdfUrl = '/assets/plan_etudes_doctorat.pdf';
    } else {
      pdfUrl = '/assets/plan_etudes_2cycle.pdf';
    }
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
    await this.fillCredentialsCodirectors(form, studyPlan);
    await this.fillAdditionalWorkShops(form, studyPlan);
    await this.fillMandatoryCourses(form, studyPlan);
    //await this.fillComplementaryCourses(form, studyPlan);
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
        const dateCreated = studyPlan.createdDate ? new Date(studyPlan.createdDate) : new Date();
        this.firstNameFile = member.firstName;
        this.lastNameFile = member.lastName;
        this.setTextField(form, 'nom', this.lastNameFile);
        this.setTextField(form, 'prénom', this.firstNameFile);
        this.setTextField(form, 'matricule', '2132752');
        this.setTextField(
          form,
          'signature_étudiant_et_date',
          `${this.firstNameFile} ${this.lastNameFile}, ${dateCreated.toLocaleDateString()}`
        );
      }

      if (member.role === UserRole.Directeur) {
        const dateValidated = studyPlan.directorValidationDate
          ? new Date(studyPlan.directorValidationDate)
          : new Date();
        this.codirectorsDateSignature = dateValidated;
        this.setTextField(
          form,
          'directeur_d’études_ou_de_recherche',
          `${member.firstName} ${member.lastName}`
        );
        this.setTextField(
          form,
          'signature_directeur_et_date',
          `${member.firstName} ${member.lastName}, ${dateValidated.toLocaleDateString()}`
        );
      }

      if (member.role === UserRole.Coordonnateur) {
        const dateValidated = studyPlan.coordonatorValidationDate
          ? new Date(studyPlan.coordonatorValidationDate)
          : new Date();
        this.setTextField(
          form,
          'signature_cpes_et_date',
          `${member.firstName} ${member.lastName}, ${dateValidated.toLocaleDateString()}`
        );
      }

      if (member.role === UserRole.Registrar) {
        const dateValidated = studyPlan.registrarValidationDate
          ? new Date(studyPlan.registrarValidationDate)
          : new Date();
        this.setTextField(form, 'commentaire_registrariat');
        this.setTextField(form, 'signature_registrariat', `${member.firstName} ${member.lastName}`);
        this.setTextField(
          form,
          'date_signature_registrariat',
          `${dateValidated.toLocaleDateString()}`
        );
      }
    });

    if (this.studyPlanService.isProgramPHD()) {
      this.setCheckBox(form, 'phd');
    } else if (this.studyPlanService.isProgramDESS()) {
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
      if (!this.studyPlanService.isProgramPHD()) {
        this.setTextField(form, 'option_ou_orientation', this.programService.program?.option || '');
      }
    }

    this.setCheckBox(form, 'acceptation_condition');
  }

  private async fillCredentialsCodirectors(form: PDFForm, studyPlan: StudyPlan) {
    if (studyPlan._id) {
      const codirectors = await lastValueFrom(
        this.apiService.getProcessCodirectorsByIdStudyPlan(studyPlan._id)
      );
      this.codirectors = codirectors;
    }

    if (this.codirectors.length === 0) {
      return;
    }

    if (this.codirectors[0]) {
      this.setTextField(
        form,
        'codirecteur_1',
        `${this.codirectors[0].firstName} ${this.codirectors[0].lastName}`
      );
    }

    if (this.codirectors[1]) {
      this.setTextField(
        form,
        'codirecteur_2',
        `${this.codirectors[1].firstName} ${this.codirectors[1].lastName}`
      );
    }

    const signatureText =
      this.codirectors
        .map((codirector) => `${codirector.firstName} ${codirector.lastName}`)
        .join(', ') + `, ${this.codirectorsDateSignature.toLocaleDateString()}`;

    this.setTextField(form, 'signature_codirecteur_et_date', signatureText);
  }

  private async fillAdditionalWorkShops(form: PDFForm, studyPlan: StudyPlan) {
    if (
      this.studyPlanService.isProgramMaster() &&
      this.programService.program?.degree.includes('recherche')
    ) {
      for (const course of this.masterResearchCourses) {
        if (
          studyPlan.courseState[course] &&
          studyPlan.courseState[course].selected &&
          Array.isArray(studyPlan.courseState[course].course.trimester)
        ) {
          const formattedTrimester = this.formatTrimester(
            studyPlan.courseState[course].course.trimester[0]
          );

          if (
            studyPlan.courseState[course].course.sigle === 'CAP7002' ||
            studyPlan.courseState[course].course.sigle === 'CAP7002E'
          ) {
            this.setTextField(form, 'trimestre_atelier_1', `${formattedTrimester}`);
          } else if (
            studyPlan.courseState[course].course.sigle === 'CAP7005' ||
            studyPlan.courseState[course].course.sigle === 'CAP7005E'
          ) {
            this.setTextField(form, 'trimestre_atelier_2', `${formattedTrimester}`);
          }

          this.setCheckBox(form, course);
        } else {
          continue;
        }
      }
    } else if (this.studyPlanService.isProgramPHD()) {
      for (const course of this.phdResearchCourses) {
        if (
          studyPlan.courseState[course] &&
          studyPlan.courseState[course].selected &&
          Array.isArray(studyPlan.courseState[course].course.trimester)
        ) {
          const formattedTrimester = this.formatTrimester(
            studyPlan.courseState[course].course.trimester[0]
          );

          if (
            studyPlan.courseState[course].course.sigle === 'CAP7005' ||
            studyPlan.courseState[course].course.sigle === 'CAP7005E'
          ) {
            this.setTextField(form, 'trimestre_atelier_2', `${formattedTrimester}`);
          } else if (
            studyPlan.courseState[course].course.sigle === 'CAP7003' ||
            studyPlan.courseState[course].course.sigle === 'CAP7003E'
          ) {
            this.setTextField(form, 'trimestre_atelier_3', `${formattedTrimester}`);
          } else if (
            studyPlan.courseState[course].course.sigle === 'CAP7011' ||
            studyPlan.courseState[course].course.sigle === 'CAP7011E'
          ) {
            this.setTextField(form, 'trimestre_atelier_4', `${formattedTrimester}`);
          } else if (
            studyPlan.courseState[course].course.sigle === 'CAP7015' ||
            studyPlan.courseState[course].course.sigle === 'CAP7015E'
          ) {
            this.setTextField(form, 'trimestre_atelier_5', `${formattedTrimester}`);
          }

          this.setCheckBox(form, course);
        } else {
          continue;
        }
      }
    }
  }

  private async fillMandatoryCourses(form: PDFForm, studyPlan: StudyPlan) {
    if (studyPlan.coursesSelection && studyPlan.coursesSelection.modules) {
      const allCourses = this.extractAllCourses(studyPlan);
      let creditsTotal = 0;
      allCourses.forEach((course, index) => {
        creditsTotal += course.credits || 0;
        const formattedTrimester = this.formatTrimester(course.trimester[0]);
        const pdfIndex = index + 1;
        this.setTextField(form, `institution_cours_obligatoire_${pdfIndex}`, 'Polytechnique'); // C POSSIBLE QUE CE SOIT A LEXTERIEUR DE POLY A VERIFIER plus tard
        this.setTextField(form, `trimestre_cours_obligatoire_${pdfIndex}`, formattedTrimester);
        this.setTextField(form, `sigle_cours_obligatoire_${pdfIndex}`, course.sigle || '');
        this.setTextField(form, `titre_cours_obligatoire_${pdfIndex}`, course.name || '');
        if (!this.studyPlanService.isProgramPHD()) {
          this.setTextField(form, `module_cours_obligatoire_${pdfIndex}`, course.moduleType || '');
        }
        if (course.alreadyDone) {
          this.setTextField(form, `av_${pdfIndex}`, 'A.P');
        }
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
        const formattedTrimester = this.formatTrimester(course.trimester[0]);
        const pdfIndex = index + 1;
        if (pdfIndex <= 9) {
          this.setTextField(form, `institution_cours_complémentaire_${pdfIndex}`, 'Polytechnique'); // C POSSIBLE QUE CE SOIT A LEXTERIEUR DE POLY A VERIFIER
          this.setTextField(form, `trimestre_cours_complémentaire_${pdfIndex}`, formattedTrimester);
          this.setTextField(form, `sigle_cours_complémentaire_${pdfIndex}`, course.sigle || '');
          this.setTextField(form, `titre_cours_complémentaire_${pdfIndex}`, course.name || '');
          if (course.alreadyDone) {
            this.setTextField(form, `av_complémentaire_${pdfIndex}`, 'A.P');
          }
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

  private formatTrimester(trimester: Trimester): string {
    if (!trimester) {
      return 'Non spécifié';
    }

    if (trimester.term && trimester.year) {
      return `${trimester.term} ${trimester.year}`;
    }

    console.warn('Format de trimestre non reconnu:', trimester);
    return 'Format inconnu';
  }

  private extractAllCourses(studyPlan: StudyPlan) {
    const allCourses: any[] = [];
    if (studyPlan.coursesSelection.modules) {
      studyPlan.coursesSelection.modules.forEach((module) => {
        if (module.courses) {
          module.courses.forEach((course) => {
            if (!this.studyPlanService.isProgramPHD()) {
              allCourses.push({
                ...course,
                module: module.title,
                moduleType: this.determineModuleType(module.title),
              });
            } else {
              allCourses.push({
                ...course,
                module: module.title,
              });
            }
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
    return '';
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
