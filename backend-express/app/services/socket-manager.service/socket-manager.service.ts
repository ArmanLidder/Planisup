import { Service } from 'typedi';
import * as http from 'http';
import * as io from 'socket.io';
import { SocketEvent } from '@common/socket';

@Service()
export class SocketManager {
    sio: io.Server;
    constructor(server: http.Server) {
        this.sio = new io.Server(server, {
            cors: {
                origin: '*',
                methods: ['GET', 'POST'],
                allowedHeaders: ["my-custom-header"], 
                credentials: true
            }
        });
    }

    handleSockets(): void {
        this.sio.use(async (socket, next) => {
            // AUTH GUARD
            // const firebaseToken = socket.handshake.auth.token;
            // if (!firebaseToken) {
            //     return next(new Error('Authentication error: No Firebase token provided'));
            // }
            // try {
            //     const decodedToken = await Auth.verifyIdToken(firebaseToken);
            //     const uid = decodedToken.uid;
            //     logger.info(`User authenticated with UID: ${uid}`);
            //     socket.data.user = { id: uid };
            //     socket.data.regionalKey = null;
            //     next(); 
            // } catch (error) {
            //     logger.error(`Socket authentication error: ${error.message}`);
            //     next(new Error('Authentication error: Invalid Firebase token'));
            // }
        });

        this.sio.on(SocketEvent.CONNECTION,  (socket) => {
            console.log(`New client socket connection: ${socket.data.user.id}`);
            // Plug all socket connection from services here
            // this.eventSocket.configureEventSockets(this.eventManager, this.eventScheduler, socket, this.sio);
            // this.chatSocket.configureChatSockets(this.eventManager, socket, this.sio);
            socket.on(SocketEvent.DISCONNECT, () => {
                console.log('Client disconnected')
            });
        });
    }
}
