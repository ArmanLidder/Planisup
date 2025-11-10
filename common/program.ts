export interface Program {
  _id?: string;
  degree: string;
  option?: string;
  type: string;
  department: string;
  description: string;
  coordonatorId?: string | null;
  modules: Module[];
}

export type RuleType =
    | 'credits_exact'
    | 'credits_minimum'
    | 'credits_maximum'
    | 'director_approval'
    | 'exclusive_submodules';

export interface RuleDefinition {
    type: RuleType;
    value?: number;
}


export interface Module {
  title: string;
  description: string[];
  courses?: Section[];
  subModules?: SubModule[];
  rules?: RuleDefinition[];
}

export interface SubModule {
  title: string;
  description: string[];
  courses: Section[];
  rules?: RuleDefinition[];
}

export interface Section {
  description: string;
  courses: Course[];
  rules?: RuleDefinition[];
}

export interface Course {
  sigle: string;
  name: string;
  credits: number;
  trimester: Trimester[] | Trimester | string;
  alreadyDone?: boolean;
  grade?: Grade;
}

export interface ExtendedInfoCourse extends Course {
  department: string;
  language: string;
  description: string;
  semester: {
    Automne?: string;
    Hiver?: string;
    Été?: string;
  };
  semesterList: string[];
}

export interface Trimester {
  year: number;
  term: string;
  dayNight?: string;
}

// This interface populate the list before fetching real program
export interface ReducedProgram {
  _id?: string;
  degree: string;
  option?: string;
  type: string[];
  department: string;
  coordonatorId?: string | null;
}

export enum Grade {
  AStar = "A*",
  A = "A",
  BPlus = "B+",
  B = "B",
  CPlus = "C+",
  C = "C",
  DPlus = "D+",
  D = "D",
  F = "F",
  P = "P",
  R = "R",
}

export enum ProgramType {
  DESS = "dess",
  MASTER = "maitrise",
  PHD = "doctorat",
}
