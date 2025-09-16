import mongoose, { Schema, Document } from "mongoose";

// Define interfaces for better type safety


// // --- Define Mongoose Schemas ---
// const CourseSchema = new mongoose.Schema({
//   sigle: String,
//   titre: String,
//   nom_departement: String,
//   prerequis: [String],
//   corequis: [String],
//   credits: String,
//   listPlanTriennal: [{ annee: String, trimestre: String, jourSoir: String }],
//   description: String,
// });

// const SectionSchema = new mongoose.Schema({
//   title_section: String,
//   courses: [Object],
// });

// const SousModuleSchema = new mongoose.Schema({
//   title: String,
//   texte_sous_module: [String],
//   section: [SectionSchema],
// });

// const ModuleSchema = new mongoose.Schema({
//   title: String,
//   texte_module: [String],
//   cours: [SectionSchema],
//   sous_modules: [SousModuleSchema],
// });

export interface IProgram extends Document {
    id_: String,
    degree: String,
    departement: String,
    type: [String],
    name: String,
    link: String,
    description: String,
    modules: [Object],
}

const ProgramSchema: Schema = new mongoose.Schema({
  degree: String,
  departement: String,
  type: [String],
  name: String,
  link: String,
  description: String,
  modules: [Object],
}, {collection: 'Program'});

export const ProgramModel = mongoose.model<IProgram>("Program", ProgramSchema);