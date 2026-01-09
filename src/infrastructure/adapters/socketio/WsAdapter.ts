import {
    ConnectedSocket,
    MessageBody,
    OnGatewayConnection,
    OnGatewayDisconnect, SubscribeMessage,
    WebSocketGateway, WebSocketServer
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { wsGatewayOptions } from "./options/WsOptions";
import { LogService } from "src/core/logger/service/loggerService";

@WebSocketGateway(wsGatewayOptions)
export class WebSocketAdapter implements OnGatewayConnection, OnGatewayDisconnect {

    constructor(private logger: LogService) {  
    }
    @WebSocketServer()
    server: Server;

    handleConnection(client: Socket): void {
        this.logger.log(`Cliente conectado: ${client.id}`);
    }

    handleDisconnect(client: Socket): void {
        this.logger.log(`Cliente desconectado: ${client.id}`);
    }

    @SubscribeMessage('join_task')
    handleJoinTask(@ConnectedSocket() client: Socket, @MessageBody() data: { taskId: string }) {
        const room = `task_${data.taskId}`;
        client.join(room);
        this.logger.log(`[WS] Cliente ${client.id} unido a sala ${room}`);
    }
}