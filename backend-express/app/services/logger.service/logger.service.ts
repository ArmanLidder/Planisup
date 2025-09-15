import { Service } from 'typedi';
import * as winston from "winston";
import * as fs from "fs";
import * as path from "path";

@Service()
export class Logger {
    private logger: winston.Logger;

    constructor(logFileName: string = "server.log") {
        const logDir = "logs";
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir);
        }

        this.logger = winston.createLogger({
            level: "info",
            format: winston.format.combine(
                winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
                winston.format.printf(({ timestamp, level, message }) => {
                    return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
                })
            ),
            transports: [
                new winston.transports.Console({
                    format: winston.format.combine(
                        winston.format.colorize(),
                        winston.format.simple()
                    ),
                }),
                new winston.transports.File({
                    filename: path.join(logDir, logFileName),
                }),
            ],
        });
    }

    info(message: string) {
        this.logger.info(message);
    }

    warn(message: string) {
        this.logger.warn(message);
    }

    error(message: string) {
        this.logger.error(message);
    }

    debug(message: string) {
        this.logger.debug(message);
    }
}
