export declare class AppService {
    private programmes;
    constructor();
    getAll(): any[];
    getByType(type: string): any[];
    getByDiscipline(type: string, discipline: string): any[];
    getByName(name: string): any;
}
