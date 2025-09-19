import mongoose, { Schema, Document } from "mongoose";
import { Grade } from "@common/program";

export interface IProgram extends Document {
    degree: string;
    option?: string;
    type: string[];
    department: string;
    description: string;
    modules: IModule[];
}

export interface IModule extends Document {
    title: string;
    description: string[];
    courses?: ISection[];
    subModules?: ISubModule[];
}

export interface ISubModule extends Document {
    title: string;
    description: string[];
    courses: ISection[];
}

export interface ISection extends Document {
    description: string;
    courses: ICourse[];
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


const TrimesterSchema: Schema = new mongoose.Schema({
    year: { type: Number },
    term: { type: String },
    dayNight: { type: String }
});

const CourseSchema: Schema = new mongoose.Schema({
    sigle: { type: String },
    name: { type: String },
    credits: { type: Number },
    trimester: [TrimesterSchema],
    alreadyDone: { type: Boolean, default: false },
    grade: { type: String, enum: Object.values(Grade) }
});

const SectionSchema: Schema = new mongoose.Schema({
    description: { type: String },
    courses: [CourseSchema]
});

const SubModuleSchema: Schema = new mongoose.Schema({
    title: { type: String },
    description: [String],
    courses: [SectionSchema]
});

const ModuleSchema: Schema = new mongoose.Schema({
    title: { type: String },
    description: [String],
    courses: [SectionSchema],
    subModules: [SubModuleSchema]
});

const ProgramSchema: Schema = new mongoose.Schema({
    degree: { type: String},
    option: { type: String},
    type: { type: [String]},
    department: { type: String},
    description: { type: String},
    modules: [ModuleSchema]
}, { collection: 'Program' });

export const ProgramModel = mongoose.model<IProgram>("Program", ProgramSchema);

export const convertToReduceProgram = (program: IProgram) => {
    return {
      _id: program._id,
      degree: program.degree,
      option: program.option,
      type: program.type,
      department: program.department,
    };
}