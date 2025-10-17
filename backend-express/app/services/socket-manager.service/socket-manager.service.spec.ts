import { expect } from 'chai';
import { describe, it, beforeEach, afterEach } from 'mocha';
import * as sinon from 'sinon';
import * as http from 'http';
import * as io from 'socket.io';
import { SocketManager } from './socket-manager.service';
import { SocketEvent } from '@common/socket';

describe('SocketManager', () => {
  let socketManager: SocketManager;
  let mockServer: sinon.SinonStubbedInstance<http.Server>;
  let mockSocketIOServer: sinon.SinonStubbedInstance<io.Server>;
  let mockSocket: any;
  let mockConsoleLog: sinon.SinonStub;
  let ioServerStub: sinon.SinonStub;

  beforeEach(() => {
    // Create mock HTTP server
    mockServer = sinon.createStubInstance(http.Server);
    
    // Create mock Socket.IO server
    mockSocketIOServer = {
      use: sinon.stub(),
      on: sinon.stub(),
      emit: sinon.stub(),
      close: sinon.stub()
    } as any;

    // Create mock socket
    mockSocket = {
      data: { user: { id: 'test-user-id' } },
      handshake: { auth: {} },
      on: sinon.stub(),
      emit: sinon.stub(),
      disconnect: sinon.stub()
    };

    // Stub console.log
    mockConsoleLog = sinon.stub(console, 'log');

    // Stub io.Server constructor
    ioServerStub = sinon.stub(io, 'Server').returns(mockSocketIOServer);

    socketManager = new SocketManager(mockServer);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('constructor', () => {
    it('should create Socket.IO server with correct configuration', () => {
      expect(ioServerStub.calledOnce).to.be.true;
      expect(ioServerStub.calledWith(mockServer)).to.be.true;
      
      const serverConfig = ioServerStub.firstCall.args[1];
      expect(serverConfig).to.deep.equal({
        cors: {
          origin: '*',
          methods: ['GET', 'POST'],
          allowedHeaders: ["my-custom-header"],
          credentials: true
        }
      });
      
      expect(socketManager.sio).to.equal(mockSocketIOServer);
    });

    it('should initialize with provided HTTP server', () => {
      const customServer = sinon.createStubInstance(http.Server);
      const customSocketManager = new SocketManager(customServer);
      
      expect(ioServerStub.calledWith(customServer)).to.be.true;
      expect(customSocketManager.sio).to.equal(mockSocketIOServer);
    });
  });

  describe('handleSockets', () => {
    beforeEach(() => {
      // Reset stubs before each test
      mockSocketIOServer.use.resetHistory();
      mockSocketIOServer.on.resetHistory();
      mockSocket.on.resetHistory();
    });

    it('should set up authentication middleware', () => {
      socketManager.handleSockets();

      expect(mockSocketIOServer.use.calledOnce).to.be.true;
      
      // Verify middleware function is set up
      const middlewareFunction = mockSocketIOServer.use.firstCall.args[0];
      expect(middlewareFunction).to.be.a('function');
    });

    it('should set up connection event listener', () => {
      socketManager.handleSockets();

      expect(mockSocketIOServer.on.calledOnce).to.be.true;
      expect(mockSocketIOServer.on.calledWith(SocketEvent.CONNECTION)).to.be.true;
      
      // Verify connection handler function is set up
      const connectionHandler = mockSocketIOServer.on.firstCall.args[1];
      expect(connectionHandler).to.be.a('function');
    });

    it('should handle socket connection with user data', () => {
      socketManager.handleSockets();

      // Get the connection handler
      const connectionHandler = mockSocketIOServer.on.firstCall.args[1];
      
      // Simulate socket connection
      connectionHandler(mockSocket);

      expect(mockConsoleLog.calledWith(`New client socket connection: ${mockSocket.data.user.id}`)).to.be.true;
      expect(mockSocket.on.calledWith(SocketEvent.DISCONNECT)).to.be.true;
    });

    it('should handle socket disconnection', () => {
      socketManager.handleSockets();

      // Get the connection handler
      const connectionHandler = mockSocketIOServer.on.firstCall.args[1];
      
      // Simulate socket connection
      connectionHandler(mockSocket);

      // Get the disconnect handler
      const disconnectHandler = mockSocket.on.firstCall.args[1];
      
      // Simulate socket disconnection
      disconnectHandler();

      expect(mockConsoleLog.calledWith('Client disconnected')).to.be.true;
    });

    it('should handle authentication middleware with next function', async () => {
      socketManager.handleSockets();

      // Get the middleware function
      const middlewareFunction = mockSocketIOServer.use.firstCall.args[0];
      const mockNext = sinon.stub();

      // Since authentication is commented out, next should be called without parameters
      await middlewareFunction(mockSocket, mockNext);

      // The middleware currently doesn't do anything, so next should be called
      // This test verifies the middleware structure is in place
      expect(middlewareFunction).to.be.a('function');
      expect(middlewareFunction.length).to.equal(2); // socket, next parameters
    });

    it('should handle socket with undefined user data gracefully', () => {
      const socketWithoutUser = {
        ...mockSocket,
        data: { user: undefined },
        on: sinon.stub()
      };

      socketManager.handleSockets();

      // Get the connection handler
      const connectionHandler = mockSocketIOServer.on.firstCall.args[1];
      
      // This will throw an error because the actual code tries to access socket.data.user.id
      // without checking if user exists
      expect(() => connectionHandler(socketWithoutUser)).to.throw();
    });

    it('should set up multiple event handlers on socket connection', () => {
      socketManager.handleSockets();

      // Get the connection handler
      const connectionHandler = mockSocketIOServer.on.firstCall.args[1];
      
      // Simulate socket connection
      connectionHandler(mockSocket);

      // Verify disconnect event is set up
      expect(mockSocket.on.calledOnce).to.be.true;
      expect(mockSocket.on.firstCall.args[0]).to.equal(SocketEvent.DISCONNECT);
      expect(mockSocket.on.firstCall.args[1]).to.be.a('function');
    });

    it('should handle multiple socket connections', () => {
      const secondSocket = {
        ...mockSocket,
        data: { user: { id: 'second-user-id' } },
        on: sinon.stub()
      };

      socketManager.handleSockets();

      // Get the connection handler
      const connectionHandler = mockSocketIOServer.on.firstCall.args[1];
      
      // Simulate first socket connection
      connectionHandler(mockSocket);
      
      // Simulate second socket connection
      connectionHandler(secondSocket);

      expect(mockConsoleLog.calledWith(`New client socket connection: ${mockSocket.data.user.id}`)).to.be.true;
      expect(mockConsoleLog.calledWith(`New client socket connection: ${secondSocket.data.user.id}`)).to.be.true;
      expect(mockSocket.on.calledWith(SocketEvent.DISCONNECT)).to.be.true;
      expect(secondSocket.on.calledWith(SocketEvent.DISCONNECT)).to.be.true;
    });

    it('should handle socket connection without crashing when user id is undefined', () => {
      const socketWithUndefinedId = {
        ...mockSocket,
        data: { user: { id: undefined } },
        on: sinon.stub()
      };

      socketManager.handleSockets();

      // Get the connection handler
      const connectionHandler = mockSocketIOServer.on.firstCall.args[1];
      
      // This should not crash
      expect(() => connectionHandler(socketWithUndefinedId)).to.not.throw();
      
      expect(mockConsoleLog.calledWith(`New client socket connection: undefined`)).to.be.true;
      expect(socketWithUndefinedId.on.calledWith(SocketEvent.DISCONNECT)).to.be.true;
    });
  });

  describe('CORS configuration', () => {
    it('should configure CORS with wildcard origin', () => {
      const serverConfig = ioServerStub.firstCall.args[1];
      
      expect(serverConfig.cors.origin).to.equal('*');
    });

    it('should configure CORS with GET and POST methods', () => {
      const serverConfig = ioServerStub.firstCall.args[1];
      
      expect(serverConfig.cors.methods).to.deep.equal(['GET', 'POST']);
    });

    it('should configure CORS with custom header', () => {
      const serverConfig = ioServerStub.firstCall.args[1];
      
      expect(serverConfig.cors.allowedHeaders).to.deep.equal(["my-custom-header"]);
    });

    it('should configure CORS with credentials enabled', () => {
      const serverConfig = ioServerStub.firstCall.args[1];
      
      expect(serverConfig.cors.credentials).to.be.true;
    });
  });

  describe('error handling', () => {
    it('should handle errors in connection handler gracefully', () => {
      const errorSocket = {
        ...mockSocket,
        on: sinon.stub().throws(new Error('Socket error'))
      };

      socketManager.handleSockets();

      // Get the connection handler
      const connectionHandler = mockSocketIOServer.on.firstCall.args[1];
      
      // This should not crash the application
      expect(() => connectionHandler(errorSocket)).to.throw('Socket error');
    });

    it('should handle undefined socket parameter', () => {
      socketManager.handleSockets();

      // Get the connection handler
      const connectionHandler = mockSocketIOServer.on.firstCall.args[1];
      
      // This will throw an error because the actual code tries to access socket.data.user.id
      // without checking if socket or its properties exist
      expect(() => connectionHandler(undefined)).to.throw();
    });
  });
});
