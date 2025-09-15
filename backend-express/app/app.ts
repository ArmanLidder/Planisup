import * as cookieParser from 'cookie-parser';
import * as cors from 'cors';
import * as express from 'express';
import * as compression from 'compression';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { StatusCodes } from 'http-status-codes';
import { Service } from 'typedi';
import { HttpException } from "@app/classes/http.exception";
import { AuthController } from '@app/controllers/auth.controller/auth.controller';

@Service()
export class Application {
    app: express.Application;
    private readonly internalError: number = StatusCodes.INTERNAL_SERVER_ERROR;

    constructor(  
        private readonly authController: AuthController
    ) {
        this.app = express();
        this.initialiseDatabaseConnection();
        this.config();
        this.bindRoutes();
    }

    bindRoutes(): void {
        this.app.use('/api/auth', this.authController.router);
        this.app.use('/', (req, res) => {
            res.redirect('/');
        });
        this.errorHandling();
    }

    private initialiseDatabaseConnection(): void {
        const api_key = process.env.MONGODB_URI;
        mongoose.connect(api_key);
    }

    private config(): void {
        // Middlewares configuration
        this.app.use(helmet());
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
        this.app.use(cookieParser());
        this.app.use(cors());
        this.app.use(compression());
    }

    private errorHandling(): void {
        // When previous handlers have not served a request: path wasn't found
        this.app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
            const err: HttpException = new HttpException('Not Found');
            next(err);
        });

        // development error handler
        // will print stacktrace
        if (this.app.get('env') === 'development') {
            this.app.use((err: HttpException, req: express.Request, res: express.Response) => {
                res.status(err.status || this.internalError);
                res.send({
                    message: err.message,
                    error: err,
                });
            });
        }

        // production error handler
        // no stacktraces  leaked to user (in production env only)
        this.app.use((err: HttpException, req: express.Request, res: express.Response) => {
            res.status(err.status || this.internalError);
            res.send({
                message: err.message,
                error: {},
            });
        });
    }
}
