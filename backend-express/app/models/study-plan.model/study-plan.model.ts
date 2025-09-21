import mongoose, { Schema, Document } from "mongoose";
import { Grade, ProgramType, Course } from "@common/program";
import { StudyPlanStep, StudyPlanStatus, StepValidationStatus } from "@common/study-plan";

/**
 * Ce commentaire peut être effacer quand tout le monde aura compris
 * 
 * Le status permet de savoir si le studyplan est abandonné, terminé ou
 * toujours en processus de validation. C'est un état global qui va permettre
 * d'archivé sans effacer les données lors des query vers MongoDB.
 * 
 * La combinaison de studyPlanStep et de stepValidation permet la gestion
 * des échanges entre l'étudiant et le personnel. Le studyplan step permet
 * de savoir qui est responsable de cette étape de validation, alors que le 
 * step validation permet de voir de savoir si c'est le responsable qui doit
 * valider, si c'est l'édudiant qui doit corriger ou si c'est valider. Le premierr
 * step est spécial, car l'étudiant est responsable et interagit seulement avec
 * le système de validation donc pas besoin de correctif.
 *
 */


export interface IStudyPlan extends Document {
    status: StudyPlanStatus
    studentId: string,
    directorId: string,
    coordonatorId: string,
    programId: string,
    programType: ProgramType // DESS, Master and PHD for easy step modification in frontend
    studyPlanStep: StudyPlanStep,
    stepValidation: StepValidationStatus,
    coursesSelection: {
        modules: Course[]
    }
    chatId: string,
    createdDate?: Date,
    modifiedDate?: Date,
}

const TrimesterSchema: Schema = new mongoose.Schema({
    year: { type: Number },
    term: { type: String },
    dayNight: { type: String }
}, { _id: false});

const CourseSchema: Schema = new mongoose.Schema({
    sigle: { type: String },
    name: { type: String },
    credits: { type: Number },
    trimester: TrimesterSchema, // Student will only choose one date
    alreadyDone: { type: Boolean, default: false },
    grade: { type: String, enum: Object.values(Grade) }
}, { _id: false});

const StudyPlanSchema: Schema = new mongoose.Schema(
  {
    status: { type: String, enum: Object.values(StudyPlanStatus), required: true },
    studentId: { type: String, required: true, ref: "User" },
    directorId: { type: String, ref: "User" },
    coordonatorId: { type: String, ref: "User" },
    programId: { type: String, required: true, ref: "Program"},
    programType: { type: String, enum: Object.values(ProgramType), required: true },
    studyPlanStep: { type: String, enum: Object.values(StudyPlanStep), required: true },
    stepValidation: { type: String, enum: Object.values(StepValidationStatus), required: true },
    coursesSelection: {
      modules: [CourseSchema],
    },
    chatId: { type: String, ref: "Chat" },
    createdDate: { type: Date, default: Date.now },
    modifiedDate: { type: Date, default: Date.now },
  },
  { collection: "StudyPlan" }
);

StudyPlanSchema.pre("save", function (next) {
  this.modifiedDate = new Date();
  next();
});

StudyPlanSchema.pre("findOneAndUpdate", function (next) {
  this.set({ modifiedDate: new Date() });
  next();
});

export const StudyPlanModel = mongoose.model<IStudyPlan>("StudyPlan", StudyPlanSchema);

export const convertToStudyPLan = (studyPlan: IStudyPlan) => {
    return {
        _id: studyPlan._id,
        status: studyPlan.status,
        studentId: studyPlan.studentId,
        directorId: studyPlan.directorId,
        coordonatorId: studyPlan.coordonatorId,
        programId: studyPlan.programId,
        programType: studyPlan.programType,
        studyPlanStep: studyPlan.studyPlanStep,
        stepValidation: studyPlan.stepValidation,
        coursesSelection: studyPlan.coursesSelection,
        chatId: studyPlan.chatId,
        createdDate: studyPlan.createdDate,
        modifiedDate: studyPlan.modifiedDate,
    };
}