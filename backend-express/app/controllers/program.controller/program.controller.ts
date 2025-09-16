import { Request, Response, Router } from 'express';
import { Service } from 'typedi';
import { ProgramModel, IProgram } from '@app/models/program.model/program.model';
import { Logger } from '@app/services/logger.service/logger.service';

// Faut ajouter les interfaces que l'on veut dans commun pour les cast plus tard.

// Exemple de route https:localhost:3000/api/program/dess/19y7w812873wIsmkhdjs

@Service()
export class ProgramController {
    public router: Router;

    constructor(private logger: Logger) {
        this.configureRouter();
    }
    
    private configureRouter(): void {
        this.router = Router();

        this.router.get('/:type', async (req: Request, res: Response) => {
            try {
                const type = req.params.type;
                this.logger.info(`Fetching ${type}' programs`);
                const programs: IProgram[] = await ProgramModel.find({ type : { $in: [type]}});
                const departements = programs.map((p: IProgram) => { return p.departement });
                return res.status(200).json(departements)
            } catch (error) {
                this.logger.warn(error);
                return res.status(500);
            }
        });

        this.router.get('/dess/:departement', async (req: Request, res: Response) => {
             try {
                const id = req.params.id;
                this.logger.info(`Fetching DESS program: ${id}`)
                const program = await ProgramModel.findById(req.params.id).exec();
                return res.status(200).json(program)
            } catch (error) {
                this.logger.warn(error);
                return res.status(500);
            }
        });
        
        this.router.get('/maitrise', async (req: Request, res: Response) => {
            try {
                this.logger.info("Fetching Mastsers programs");
                const programs = await ProgramModel.find({ type : {$contains: "Maîtrise"}}).exec();
                return res.status(200).json(programs)
            } catch (error) {
                this.logger.warn(error);
                return res.status(500);
            }
        });
          
        this.router.get('/maitrise/:id', async (req: Request, res: Response) => {
             try {
                const id = req.params.id;
                this.logger.info(`Fetching master program: ${id}`)
                const program = await ProgramModel.findById(req.params.id).exec();
                return res.status(200).json(program)
            } catch (error) {
                this.logger.warn(error);
                return res.status(500);
            }
        });
        
        this.router.get('/doctorat', async (req: Request, res: Response) => {
            try {
                this.logger.info("Fetching Doctorat programs");
                const programs = await ProgramModel.find({ type : {$contains: "Doctorat"}}).exec();
                return res.status(200).json(programs)
            } catch (error) {
                this.logger.warn(error);
                return res.status(500);
            }
        });
          
        this.router.get('/doctorat/:id', async (req: Request, res: Response) => {
             try {
                const id = req.params.id;
                this.logger.info(`Fetching Doctorat program: ${id}`)
                const program = await ProgramModel.findById(req.params.id).exec();
                return res.status(200).json(program)
            } catch (error) {
                this.logger.warn(error);
                return res.status(500);
            }
        }); 
    }  
}