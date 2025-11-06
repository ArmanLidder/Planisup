import { AppService } from './app.service';
export declare class AppController {
    private readonly programmeService;
    constructor(programmeService: AppService);
    getAll(): any[];
    getByType(type: string): any[];
    getByDiscipline(type: string, discipline: string): any[];
    getByName(name: string): any;
}
