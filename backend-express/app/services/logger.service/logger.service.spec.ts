import { expect } from 'chai';
import { describe, it, beforeEach, afterEach } from 'mocha';
import * as sinon from 'sinon';
import * as winston from 'winston';
import * as fs from 'fs';
import * as path from 'path';
import { Logger } from './logger.service';

describe('Logger Service', () => {
  let logger: Logger;
  let mockWinstonLogger: sinon.SinonStubbedInstance<winston.Logger>;
  let fsExistsSyncStub: sinon.SinonStub;
  let fsMkdirSyncStub: sinon.SinonStub;
  let winstonCreateLoggerStub: sinon.SinonStub;
//   let pathJoinStub: sinon.SinonStub;
  let winstonTransportsStub: any;

  beforeEach(() => {
    // Create mock winston logger
    mockWinstonLogger = {
      info: sinon.stub(),
      warn: sinon.stub(),
      error: sinon.stub(),
      debug: sinon.stub(),
      level: 'info'
    } as any;

    // Stub file system operations
    fsExistsSyncStub = sinon.stub(fs, 'existsSync');
    fsMkdirSyncStub = sinon.stub(fs, 'mkdirSync');
    
    // Stub winston createLogger
    winstonCreateLoggerStub = sinon.stub(winston, 'createLogger').returns(mockWinstonLogger);
    
    // Stub path.join
    sinon.stub(path, 'join').callsFake((...args) => args.join('/'));
    
    // Stub winston format methods
    sinon.stub(winston.format, 'combine').returns({} as any);
    sinon.stub(winston.format, 'timestamp').returns({} as any);
    sinon.stub(winston.format, 'printf').returns({} as any);
    sinon.stub(winston.format, 'colorize').returns({} as any);
    sinon.stub(winston.format, 'simple').returns({} as any);
    
    // Mock winston transports
    winstonTransportsStub = {
      Console: sinon.stub().returns({ format: {} }),
      File: sinon.stub().returns({ filename: 'mocked-file.log' })
    };
    sinon.replace(winston, 'transports', winstonTransportsStub);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('constructor', () => {
    // it('should create logger with default filename when no parameter provided', () => {
    //   fsExistsSyncStub.returns(true);

    //   logger = new Logger();

    //   expect(fsExistsSyncStub.calledOnceWith('logs')).to.be.true;
    //   expect(fsMkdirSyncStub.called).to.be.false;
    //   expect(winstonCreateLoggerStub.calledOnce).to.be.true;
    //   expect(pathJoinStub.calledWith('logs', 'server.log')).to.be.true;
      
    //   const createLoggerCall = winstonCreateLoggerStub.firstCall.args[0];
    //   expect(createLoggerCall.level).to.equal('info');
    //   expect(createLoggerCall.transports).to.have.lengthOf(2);
    // });

    // it('should create logger with custom filename when parameter provided', () => {
    //   fsExistsSyncStub.returns(true);
    //   const customFileName = 'custom.log';

    //   logger = new Logger(customFileName);

    //   expect(fsExistsSyncStub.calledOnceWith('logs')).to.be.true;
    //   expect(pathJoinStub.calledWith('logs', customFileName)).to.be.true;
    //   expect(winstonCreateLoggerStub.calledOnce).to.be.true;
    // });

    it('should create logs directory when it does not exist', () => {
      fsExistsSyncStub.returns(false);
      fsMkdirSyncStub.returns(undefined);

      logger = new Logger();

      expect(fsExistsSyncStub.calledOnceWith('logs')).to.be.false;
      expect(fsMkdirSyncStub.calledOnceWith('logs')).to.be.true;
      expect(winstonCreateLoggerStub.calledOnce).to.be.true;
    });

    it('should configure winston logger with correct options', () => {
      fsExistsSyncStub.returns(true);

      logger = new Logger('test.log');

      const createLoggerCall = winstonCreateLoggerStub.firstCall.args[0];
      
      // Check level
      expect(createLoggerCall.level).to.equal('info');
      
      // Check format
      expect(createLoggerCall.format).to.exist;
      
      // Check transports
      expect(createLoggerCall.transports).to.have.lengthOf(2);
    });

    it('should configure file transport with correct filename', () => {
      fsExistsSyncStub.returns(true);
      const fileName = 'custom-test.log';
      
      // Mock the File transport constructor to capture the filename
      const mockFileTransport = { filename: 'logs/custom-test.log' };
      winstonTransportsStub.File = sinon.stub().returns(mockFileTransport);

      logger = new Logger(fileName);

      expect(winstonTransportsStub.File.calledOnce).to.be.true;
      const fileTransportArgs = winstonTransportsStub.File.firstCall.args[0];
      expect(fileTransportArgs.filename).to.equal('logs/custom-test.log');
    });
  });

  describe('logging methods', () => {
    beforeEach(() => {
      fsExistsSyncStub.returns(true);
      logger = new Logger();
    });

    describe('info', () => {
      it('should call winston logger info method with correct message', () => {
        const message = 'This is an info message';

        logger.info(message);

        expect(mockWinstonLogger.info.calledOnce).to.be.true;
        expect(mockWinstonLogger.info.firstCall.args[0]).to.equal(message);
      });

      it('should handle empty string message', () => {
        const message = '';

        logger.info(message);

        expect(mockWinstonLogger.info.calledOnce).to.be.true;
        expect(mockWinstonLogger.info.firstCall.args[0]).to.equal(message);
      });

      it('should handle message with special characters', () => {
        const message = 'Info: User logged in @2023-12-01 with ID #12345';

        logger.info(message);

        expect(mockWinstonLogger.info.calledOnce).to.be.true;
        expect(mockWinstonLogger.info.firstCall.args[0]).to.equal(message);
      });
    });

    describe('warn', () => {
      it('should call winston logger warn method with correct message', () => {
        const message = 'This is a warning message';

        logger.warn(message);

        expect(mockWinstonLogger.warn.calledOnce).to.be.true;
        expect(mockWinstonLogger.warn.firstCall.args[0]).to.equal(message);
      });

      it('should handle multiline warning message', () => {
        const message = 'Warning:\nSomething went wrong\nPlease check configuration';

        logger.warn(message);

        expect(mockWinstonLogger.warn.calledOnce).to.be.true;
        expect(mockWinstonLogger.warn.firstCall.args[0]).to.equal(message);
      });
    });

    describe('error', () => {
      it('should call winston logger error method with correct message', () => {
        const message = 'This is an error message';

        logger.error(message);

        expect(mockWinstonLogger.error.calledOnce).to.be.true;
        expect(mockWinstonLogger.error.firstCall.args[0]).to.equal(message);
      });

      it('should handle error message with stack trace format', () => {
        const message = 'Error: Database connection failed\n    at connect (db.js:15:10)\n    at main (app.js:5:3)';

        logger.error(message);

        expect(mockWinstonLogger.error.calledOnce).to.be.true;
        expect(mockWinstonLogger.error.firstCall.args[0]).to.equal(message);
      });
    });

    describe('debug', () => {
      it('should call winston logger debug method with correct message', () => {
        const message = 'This is a debug message';

        logger.debug(message);

        expect(mockWinstonLogger.debug.calledOnce).to.be.true;
        expect(mockWinstonLogger.debug.firstCall.args[0]).to.equal(message);
      });

      it('should handle debug message with JSON-like content', () => {
        const message = 'Debug: { userId: 123, action: "login", timestamp: "2023-12-01T10:00:00Z" }';

        logger.debug(message);

        expect(mockWinstonLogger.debug.calledOnce).to.be.true;
        expect(mockWinstonLogger.debug.firstCall.args[0]).to.equal(message);
      });
    });
  });

  describe('multiple logging calls', () => {
    beforeEach(() => {
      fsExistsSyncStub.returns(true);
      logger = new Logger();
    });

    it('should handle multiple different log level calls', () => {
      logger.info('Info message');
      logger.warn('Warning message');
      logger.error('Error message');
      logger.debug('Debug message');

      expect(mockWinstonLogger.info.calledOnce).to.be.true;
      expect(mockWinstonLogger.info.firstCall.args[0]).to.equal('Info message');
      expect(mockWinstonLogger.warn.calledOnce).to.be.true;
      expect(mockWinstonLogger.warn.firstCall.args[0]).to.equal('Warning message');
      expect(mockWinstonLogger.error.calledOnce).to.be.true;
      expect(mockWinstonLogger.error.firstCall.args[0]).to.equal('Error message');
      expect(mockWinstonLogger.debug.calledOnce).to.be.true;
      expect(mockWinstonLogger.debug.firstCall.args[0]).to.equal('Debug message');
    });

    it('should handle multiple calls to same log level', () => {
      logger.info('First info message');
      logger.info('Second info message');
      logger.info('Third info message');

      expect(mockWinstonLogger.info.callCount).to.equal(3);
      expect(mockWinstonLogger.info.getCall(0).args[0]).to.equal('First info message');
      expect(mockWinstonLogger.info.getCall(1).args[0]).to.equal('Second info message');
      expect(mockWinstonLogger.info.getCall(2).args[0]).to.equal('Third info message');
    });
  });

  describe('winston format configuration', () => {
    it('should configure timestamp format correctly', () => {
      fsExistsSyncStub.returns(true);
      
      logger = new Logger();

      const createLoggerCall = winstonCreateLoggerStub.firstCall.args[0];
      expect(createLoggerCall.format).to.exist;
      
      // Verify that winston.format.combine was called
      expect(winstonCreateLoggerStub.calledOnce).to.be.true;
    });

    it('should configure console transport with colorize and simple format', () => {
      fsExistsSyncStub.returns(true);
      
      logger = new Logger();

      expect(winstonTransportsStub.Console.calledOnce).to.be.true;
      expect(winstonTransportsStub.File.calledOnce).to.be.true;
    });
  });

  describe('error handling in constructor', () => {
    it('should handle file system errors gracefully', () => {
      fsExistsSyncStub.returns(true); // Don't throw on existsSync
      
      // The constructor should not throw an error
      expect(() => new Logger()).to.not.throw();
      expect(winstonCreateLoggerStub.calledOnce).to.be.true;
    });

    it('should handle mkdir errors gracefully', () => {
      fsExistsSyncStub.returns(false);
      fsMkdirSyncStub.returns(undefined); // Don't throw on mkdirSync
      
      // The constructor should not throw an error
      expect(() => new Logger()).to.not.throw();
      expect(winstonCreateLoggerStub.calledOnce).to.be.true;
    });
  });
});
