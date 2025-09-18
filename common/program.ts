export interface Program {
    _id?: string;
    degree: string;
    option?: string;
    type: string;
    department: string;
    description: string;
    modules: Module[];
}

export interface Module {
    title: string;
    description: string[];
    courses?: Section[];
    subModules?: SubModule[];
}

export interface SubModule {
    title: string;
    description: string[];
    courses: Section[];
}

export interface Section {
    description: string;
    courses: Course[];
}

export interface Course {
    sigle: string;
    name: string;
    credits: number;
    trimester: Trimester[];
    alreadyDone?: boolean;
    grade?: Grade;
}

export interface Trimester {
    year: number;
    term: string;
    dayNight?: string;
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
