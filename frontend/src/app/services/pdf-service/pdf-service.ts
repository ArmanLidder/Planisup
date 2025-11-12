import { Injectable } from '@angular/core';
import { PDFDocument, PDFForm } from 'pdf-lib';
import { User, UserRole } from '@common/user';
import { ApiService } from '../api/api-service';
import { SerializedCourseState, StudyPlan } from '@common/study-plan';
import { lastValueFrom } from 'rxjs';
import { StudyPlanService } from '../study-plan/study-plan-service';
import { ProgramService } from '../program/program-service';

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
        const dateCreated = studyPlan.createdDate ? new Date(studyPlan.createdDate) : new Date();
        this.firstNameFile = member.firstName;
        this.lastNameFile = member.lastName;
        this.setTextField(form, 'nom', this.lastNameFile);
        this.setTextField(form, 'prénom', this.firstNameFile);
        this.setTextField(form, 'matricule', '2132752'); // changer qd on aura le bon matricule
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
          if (
            studyPlan.courseState[course].course.sigle === 'CAP7002' ||
            studyPlan.courseState[course].course.sigle === 'CAP7002E'
          ) {
            if (studyPlan.courseState[course].course.alreadyDone) {
              this.setTextField(form, 'av_a', 'A.P');
            }
            this.setTextField(
              form,
              'trimestre_atelier_1',
              `${studyPlan.courseState[course].course.trimester[0].term} ${studyPlan.courseState[course].course.trimester[0].year}`
            );
          } else if (
            studyPlan.courseState[course].course.sigle === 'CAP7005' ||
            studyPlan.courseState[course].course.sigle === 'CAP7005E'
          ) {
            if (studyPlan.courseState[course].course.alreadyDone) {
              this.setTextField(form, 'av_b', 'A.P');
            }
            this.setTextField(
              form,
              'trimestre_atelier_2',
              `${studyPlan.courseState[course].course.trimester[0].term} ${studyPlan.courseState[course].course.trimester[0].year}`
            );
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
          if (
            studyPlan.courseState[course].course.sigle === 'CAP7005' ||
            studyPlan.courseState[course].course.sigle === 'CAP7005E'
          ) {
            if (studyPlan.courseState[course].course.alreadyDone) {
              this.setTextField(form, 'av_b', 'A.P');
            }
            this.setTextField(
              form,
              'trimestre_atelier_2',
              `${studyPlan.courseState[course].course.trimester[0].term} ${studyPlan.courseState[course].course.trimester[0].year}`
            );
          } else if (
            studyPlan.courseState[course].course.sigle === 'CAP7003' ||
            studyPlan.courseState[course].course.sigle === 'CAP7003E'
          ) {
            if (studyPlan.courseState[course].course.alreadyDone) {
              this.setTextField(form, 'av_c', 'A.P');
            }
            this.setTextField(
              form,
              'trimestre_atelier_3',
              `${studyPlan.courseState[course].course.trimester[0].term} ${studyPlan.courseState[course].course.trimester[0].year}`
            );
          } else if (
            studyPlan.courseState[course].course.sigle === 'CAP7011' ||
            studyPlan.courseState[course].course.sigle === 'CAP7011E'
          ) {
            if (studyPlan.courseState[course].course.alreadyDone) {
              this.setTextField(form, 'av_d', 'A.P');
            }
            this.setTextField(
              form,
              'trimestre_atelier_4',
              `${studyPlan.courseState[course].course.trimester[0].term} ${studyPlan.courseState[course].course.trimester[0].year}`
            );
          } else if (
            studyPlan.courseState[course].course.sigle === 'CAP7015' ||
            studyPlan.courseState[course].course.sigle === 'CAP7015E'
          ) {
            if (studyPlan.courseState[course].course.alreadyDone) {
              this.setTextField(form, 'av_e', 'A.P');
            }
            this.setTextField(
              form,
              'trimestre_atelier_5',
              `${studyPlan.courseState[course].course.trimester[0].term} ${studyPlan.courseState[course].course.trimester[0].year}`
            );
          }
          this.setCheckBox(form, course);
        } else {
          continue;
        }
      }
    }
  }

  private async fillMandatoryCourses(form: PDFForm, studyPlan: StudyPlan) {
    let filteredCourses: SerializedCourseState[] = [];
    let credits = 0;

    filteredCourses = Object.entries(studyPlan.courseState)
      .map(([key, value]) => ({
        sigle: key,
        ...value,
      }))
      .filter((course) => course.selected && !this.verifyConditionsComplementary(course));

    filteredCourses.forEach((course, index) => {
      credits += course.credits;
      this.setTextField(
        form,
        `institution_cours_obligatoire_${index}`,
        course.course.institution ? course.course.institution : 'Polytechnique de Montréal'
      );
      this.setTextField(form, `sigle_cours_obligatoire_${index}`, course.course.sigle);
      this.setTextField(form, `titre_cours_obligatoire_${index}`, course.course.name);
      this.setTextField(
        form,
        `crédits_cours_obligatoire_${index}`,
        course.course.credits.toString()
      );

      if (Array.isArray(course.course.trimester)) {
        this.setTextField(
          form,
          `trimestre_cours_obligatoire_${index}`,
          course.course.trimester[0].term === '-'
            ? 'Aucun trimestre défini'
            : `${course.course.trimester[0].term} ${course.course.trimester[0].year}`
        );
      }

      if (!this.studyPlanService.isProgramPHD()) {
        this.setTextField(form, `module_cours_obligatoire_${index}`, course.selectedInModule!);
      }

      if (course.course.alreadyDone) {
        this.setTextField(form, `av_${index}`, 'A.P');
      }
    });
    this.setTextField(form, `credits_total_1`, credits.toString());
  }

  private async fillComplementaryCourses(form: PDFForm, studyPlan: StudyPlan) {
    let filteredCourses: SerializedCourseState[] = [];
    let credits = 0;

    filteredCourses = Object.entries(studyPlan.courseState)
      .map(([key, value]) => ({
        sigle: key,
        ...value,
      }))
      .filter(
        (course) =>
          course.selected &&
          !this.isExcludedFromComplementary(course) &&
          this.verifyConditionsComplementary(course)
      );

    filteredCourses.forEach((course, index) => {
      credits += course.credits;
      this.setTextField(
        form,
        `institution_cours_complémentaire_${index}`,
        course.course.institution ? course.course.institution : 'Polytechnique de Montréal'
      );
      this.setTextField(form, `sigle_cours_complémentaire_${index}`, course.course.sigle);
      this.setTextField(form, `titre_cours_complémentaire_${index}`, course.course.name);
      this.setTextField(
        form,
        `crédits_cours_complémentaire_${index}`,
        course.course.credits.toString()
      );

      if (Array.isArray(course.course.trimester)) {
        this.setTextField(
          form,
          `trimestre_cours_complémentaire_${index}`,
          course.course.trimester[0].term === '-'
            ? 'Aucun trimestre défini'
            : `${course.course.trimester[0].term} ${course.course.trimester[0].year}`
        );
      }

      if (course.course.alreadyDone) {
        this.setTextField(form, `av_complémentaire_${index}`, 'A.P');
      }

      // this.setTextField(form, `catégorie_cours_complémentaire_${index}`, course.categorie); // POSER COMME QUESTION C QUOI CATEGORIE
    });
    this.setTextField(form, `credits_total_2`, credits.toString());
  }

  private isExcludedFromComplementary(course: SerializedCourseState): boolean {
    if (
      this.studyPlanService.isProgramMaster() &&
      this.programService.program?.degree.includes('recherche') &&
      this.masterResearchCourses.includes(course.course.sigle)
    ) {
      return true;
    } else if (
      this.studyPlanService.isProgramPHD() &&
      this.phdResearchCourses.includes(course.course.sigle)
    ) {
      return true;
    }
    return false;
  }

  private verifyConditionsComplementary(course: SerializedCourseState): boolean {
    return [
      course.selectedInModule === 'Cours complémentaire',
      this.masterResearchCourses.includes(course.course.sigle),
      this.phdResearchCourses.includes(course.course.sigle),
    ].some((c) => c);
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
