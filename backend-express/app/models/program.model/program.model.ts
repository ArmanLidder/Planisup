import mongoose, { Schema, Document } from "mongoose";
import { Grade, ReducedProgram } from "@common/program";

export interface IRuleDefinition extends Document {
  type: string;       // 'credits_exact' | 'credits_minimum' | 'credits_maximum' | 'director_approval' | 'exclusive_submodules'
  value?: number;     // optional; semantics validated in controller later
}

export interface IProgram extends Document {
    degree: string;
    option?: string;
    type: string[];
    department: string;
    description: string;
    coordonatorId?: string | null;
    modules: IModule[];
}

export interface IModule extends Document {
    title: string;
    description: string[];
    courses?: ISection[];
    subModules?: ISubModule[];
    rules?: IRuleDefinition[];
}

export interface ISubModule extends Document {
    title: string;
    description: string[];
    courses: ISection[];
    rules?: IRuleDefinition[];
}

export interface ISection extends Document {
    description: string;
    courses: ICourse[];
    rules?: IRuleDefinition[];
}

export interface ICourse extends Document {
    sigle: string;
    name: string;
    credits: number;
    trimester: ITrimester[];
    alreadyDone?: boolean;
    grade?: Grade;
}

export interface ITrimester extends Document {
    year: number;
    term: string;
    dayNight?: string;
}

const RuleDefinitionSchema: Schema = new mongoose.Schema({
  type: { type: String, required: true },
  value: { type: Number }
});

const TrimesterSchema: Schema = new mongoose.Schema({
    year: { type: Number },
    term: { type: String },
    dayNight: { type: String }
});

const CourseSchema: Schema = new mongoose.Schema({
    sigle: { type: String, required: true },
    name: { type: String },
    credits: { type: Number, required: true },
    trimester: [TrimesterSchema],
    alreadyDone: { type: Boolean, default: false },
    grade: { type: String, enum: Object.values(Grade) }
});

const SectionSchema: Schema = new mongoose.Schema({
    description: { type: String , default : ''},
    courses: [CourseSchema], default: [],
    rules: { type: [RuleDefinitionSchema], default: [] }
});

const SubModuleSchema: Schema = new mongoose.Schema({
    title: { type: String, required: true},
    description: [String],
    courses: [SectionSchema],
    rules: { type: [RuleDefinitionSchema], default: [] }
});

const ModuleSchema: Schema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: [String], default: [] },
  courses: { type: [SectionSchema], default: [] },
  subModules: { type: [SubModuleSchema], default: [] },
  rules: { type: [RuleDefinitionSchema], default: [] }
});

const ProgramSchema: Schema = new mongoose.Schema({
  degree: { type: String, required: true },
  option: { type: String },
  type: {
    type: [String],
    required: [true, 'Program type is required.'],
    validate: {
      validator: (arr: string[]) => Array.isArray(arr) && arr.length > 0,
      message: 'Program type must contain at least one value.'
    }
  },
  department: { type: String, required: true },
  description: { type: String, default: '' },
  coordonatorId: { type: String, ref: "User" },
  modules: { type: [ModuleSchema], default: [] }
}, { collection: 'Program' });


export const ProgramModel = mongoose.model<IProgram>("Program", ProgramSchema);

export const convertToReduceProgram = (program: IProgram) => {
    return {
      _id: program._id,
      degree: program.degree,
      option: program.option,
      type: program.type,
      department: program.department,
      coordonatorId: program.coordonatorId ?? null,
    };
}

export const convertToReducePrograms = (programs: IProgram[]) => {
    const reducedPrograms: ReducedProgram[] = [];
    programs.forEach((program: IProgram) => {
        reducedPrograms.push({
          _id: program._id,
          degree: program.degree,
          option: program.option,
          type: program.type,
          department: program.department,
          coordonatorId: program.coordonatorId ?? null,
        } as ReducedProgram);
    });
    return reducedPrograms;
} 
