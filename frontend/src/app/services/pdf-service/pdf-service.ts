import { Injectable } from '@angular/core';
import { PDFDocument, PDFForm } from 'pdf-lib';
import { ProgramType } from '@common/program';
import { User, UserRole } from '@common/user';
import { ApiService } from '../api/api-service';
import { StudyPlan, StudyPlanStep } from '@common/study-plan';
import { catchError, map, Observable, of } from 'rxjs';
import { lastValueFrom } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class PdfService {
  constructor(
    private readonly apiService: ApiService,
  ) {
  }

  async debugPdfFields(): Promise<string[]> {
    const pdfUrl = '/assets/plan_etudes_2cycle.pdf';
    const pdfBytes = await fetch(pdfUrl).then(res => res.arrayBuffer());
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const form = pdfDoc.getForm();
    
    const fieldNames: string[] = [];

    const fields = form.getFields();
    fields.forEach(field => {
      fieldNames.push(field.getName());
    });
    console.log('Tous les champs trouvés dans le PDF:', fieldNames);
    return fieldNames;
  }

  async generateStudyPlanPdf(studyPlan: StudyPlan, currentUser: User ): Promise<Uint8Array> {
    const pdfUrl = '/assets/plan_etudes_2cycle.pdf';
    const pdfBytes = await fetch(pdfUrl).then(res => res.arrayBuffer());

    const pdfDoc = await PDFDocument.load(pdfBytes);
    const form = pdfDoc.getForm();

    return new Promise((resolve, reject) => {
      this.fillFormFields(form, studyPlan, currentUser, resolve, reject);
    });

  }

  private async fillFormFields(form: PDFForm, studyPlan: StudyPlan, currentUser: User, resolve: (value: Uint8Array) => void , reject: (error: any) => void) {
    // await this.debugPdfFields(); // Utile pour voir les id dans le pdf

    if (currentUser?._id) {
      this.apiService.getStudyPlans(currentUser?._id).subscribe(async (plans) => {
        await this.fillFirstSection(form, plans, studyPlan);
        await this.fillAdditionalWorkShops(form, studyPlan);
        await this.fillMandatoryCourses(form, studyPlan);
        await this.fillComplementaryCourses(form, studyPlan);
        await this.fillConditionOfObtainingDegree(form, studyPlan);
        await this.fillSectionReservedForRegistrar(form, studyPlan);
        await this.completeForm(form, resolve, reject);
      });
    }
  }

  private async fillFirstSection(form: PDFForm, plans: any[], studyPlan: StudyPlan) {
    this.setTextField(form, 'nom', plans[0].lastName);
    this.setTextField(form, 'prénom', plans[0].firstName);
    this.setTextField(form, 'matricule', '21345678'); // À adapter si le matricule est disponible

    switch(studyPlan.programType) {
      case ProgramType.MASTER:
        this.setCheckBox(form, 'm_ing'); // ou 'm_sc_a' à ajouter plus tard
        break;
      case ProgramType.DESS:
        this.setCheckBox(form, 'dess');
        break;
      // case "microprogramme": // À ajouter plus tard
      //   this.setCheckBox(form, 'microprogramme');
    }

    this.apiService.getProgram(studyPlan.programId).subscribe((program) => {
      this.setTextField(form, 'programme', program.department);
      this.setTextField(form, 'option_ou_orientation', program.option || '');
    });
    
    const [director, codirecteur1 /*, codirecteur2*/] = await Promise.all([
      lastValueFrom(this.getUsersignature(studyPlan, UserRole.Directeur)),
      lastValueFrom(this.getUsersignature(studyPlan, "coodirector")),
      // lastValueFrom(this.getUsersignature(studyPlan, "coodirector")), // À adapter si deux codirecteurs existent
    ]);

    // Remplir le champ directeur d'études ou de recherche et le codirecteur
    this.setTextField(form, 'directeur_d_études_ou_de_recherche', director);
    this.setTextField(form, 'codirecteur_1', `${codirecteur1}`); // À adapter
    // this.setTextField(form, 'codirecteur_2', `${codirecteur2}    ${new Date().toLocaleDateString()}`); // À adapter
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
        this.setTextField(form, `crédits_cours_obligatoire_${pdfIndex}`, course.credits?.toString() || '');
        if (pdfIndex === allCourses.length) {
          this.setTextField(form, `credits_total_1`, creditsTotal.toString());
        }
      });
    }
  }

  private async fillComplementaryCourses(form: PDFForm, studyPlan: StudyPlan) { // À voir avec l'équipe comment gérer les cours complémentaires
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
        this.setTextField(form, `catégorie_cours_complémentaire_${pdfIndex}`, course.moduleType || '');
        this.setTextField(form, `crédits_cours_complémentaire_${pdfIndex}`, course.credits?.toString() || '');
        if (pdfIndex === allCourses.length) {
          this.setTextField(form, `credits_total_2`, creditsTotal.toString());
        }
      });
    }
  }

  private async fillConditionOfObtainingDegree(form: PDFForm, studyPlan: StudyPlan) {
    this.setCheckBox(form, "acceptation_condition");
    const [studentSignature, directorSignature, coordonatorSignature, codirectorSignature] = await Promise.all([
      lastValueFrom(this.getUsersignature(studyPlan, UserRole.Etudiant)),
      lastValueFrom(this.getUsersignature(studyPlan, UserRole.Directeur)),
      lastValueFrom(this.getUsersignature(studyPlan, UserRole.Coordonnateur)),
      lastValueFrom(this.getUsersignature(studyPlan, "coodirector")),
    ]);

    this.setTextField(form, "signature_étudiant_et_date", `${studentSignature}    ${new Date().toLocaleDateString()}`);
    this.setTextField(form, "signature_directeur_et_date", `${directorSignature}    ${new Date().toLocaleDateString()}`);
    this.setTextField(form, "signature_cpes_et_date", `${coordonatorSignature}    ${new Date().toLocaleDateString()}`);
    this.setTextField(form, "signature_codirecteur_et_date", `${codirectorSignature}    ${new Date().toLocaleDateString()}`);
  }

  private async fillSectionReservedForRegistrar(form: PDFForm, studyplan: StudyPlan) {
    const [registrarSignature] = await Promise.all([
      lastValueFrom(this.getUsersignature(studyplan, StudyPlanStep.REGISTRAR))
    ]);
    // this.setTextField(form, "commentaire_registrariat", "Remplie par le registraire"); // À adapter 
    this.setTextField(form, "signature_registrariat", `${registrarSignature}`);
    this.setTextField(form, "date_signature_registrariat", `${new Date().toLocaleDateString()}`);
  }

  private async completeForm(form: PDFForm, resolve: (value: Uint8Array) => void , reject: (error: any) => void) {
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

  private extractAllCourses(studyPlan: any) {
    const allCourses: any[] = [];
    if (studyPlan.coursesSelection.modules) {
      studyPlan.coursesSelection.modules.forEach((module: any) => {
        if (module.courses && Array.isArray(module.courses)) {
          module.courses.forEach((course: any) => {
            allCourses.push({
              ...course,
              module: module.title,
              moduleType: this.determineModuleType(module.title)
            });
          })
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

  private setTextField(form: PDFForm, fieldName: string, value: string) {
    try {
      const textField = form.getTextField(fieldName);
      if (textField && value) {
        textField.setText(value);
      }
    } catch (error) {
      console.warn(`Text field "${fieldName}" not found in the PDF form.`);
    }
  }

  private getUsersignature(studyPlan: any, role: any): Observable<string> {
    console.log('Getting signature for role:', studyPlan);
    switch(role) {
      case UserRole.Etudiant:
        return this.apiService.getUserById(studyPlan.studentId).pipe(
          map(user => user.user.firstName + " " + user.user.lastName),
          catchError(() => of(studyPlan.studentId || ""))
        );
      case UserRole.Directeur:
        return this.apiService.getUserById(studyPlan.directorId).pipe(
          map(user => user.user.firstName + " " + user.user.lastName),
          catchError(() => of(studyPlan.supervisor || ""))
        );
      case UserRole.Coordonnateur:
        return this.apiService.getUserById(studyPlan.coordonatorId).pipe(
          map(user => user.user.firstName + " " + user.user.lastName),
          catchError(() => of(studyPlan.coordonatorId || ""))
        );
      // case "coodirector": // à adapter si codirecteurId existe
      //   return this.apiService.getUserById(studyPlan.coodirectorId).pipe(
      //     map(user => user.user.firstName + " " + user.user.lastName),
      //     catchError(() => of(studyPlan.adminAgent || ""))
      //   );
      // case UserRole.Registrar: // à adapter si registrarId existe
      //   return this.apiService.getUserById(studyPlan.registrarId).pipe(
      //     map(user => user.user.firstName + " " + user.user.lastName),
      //     catchError(() => of(studyPlan.registrarId || ""))
      //   );
      default:
        return of("");
    }
  }

  async generateAndDownloadPdf(studyPlan: any, currentUser: User) {
    const pdfBytes = await this.generateStudyPlanPdf(studyPlan, currentUser);
    const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `plan_etudes_${currentUser.lastName}_${currentUser.firstName}.pdf`;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}
