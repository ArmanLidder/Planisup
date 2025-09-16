import mongoose, { Schema, Document } from "mongoose";

// Define interfaces for better type safety
interface ICourse extends Document {
  sigle: string;
  titre: string;
  nom_departement: string;
  prerequis: string[];
  corequis: string[];
  credits: string;
  listPlanTriennal: { annee: string; trimestre: string; jourSoir: string }[];
  description: string;
}

interface ISection extends Document {
  title_section: string;
  courses: ICourse[];
}

interface ISousModule extends Document {
  title: string;
  texte_sous_module: string[];
  section: ISection[];
}

interface IModule extends Document {
  title: string;
  texte_module: string[];
  cours: ISection[];
  sous_modules: ISousModule[];
}

interface IProgram extends Document {
  degree: string;
  departement: string;
  type: string[];
  name: string;
  link: string;
  description: string;
  modules: IModule[];
}

// --- Define Mongoose Schemas ---
const CourseSchema: Schema = new mongoose.Schema({
  sigle: String,
  titre: String,
  nom_departement: String,
  prerequis: [String],
  corequis: [String],
  credits: String,
  listPlanTriennal: [{ annee: String, trimestre: String, jourSoir: String }],
  description: String,
});

const SectionSchema: Schema = new mongoose.Schema({
  title_section: String,
  courses: [CourseSchema],
});

const SousModuleSchema: Schema = new mongoose.Schema({
  title: String,
  texte_sous_module: [String],
  section: [SectionSchema],
});

const ModuleSchema: Schema = new mongoose.Schema({
  title: String,
  texte_module: [String],
  cours: [SectionSchema],
  sous_modules: [SousModuleSchema],
});

const ProgramSchema: Schema = new mongoose.Schema({
  degree: String,
  departement: String,
  type: [String],
  name: String,
  link: String,
  description: String,
  modules: [ModuleSchema],
}, {collection: 'Program'});

export const ProgramModel = mongoose.model<IProgram>("Program", ProgramSchema);