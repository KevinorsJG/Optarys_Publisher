import { LogService } from "@core/logger";
import { PostEC24RequestedEvent } from "./PostEC24RequestedEvent";
import { EventsHandler, IEventHandler } from "@nestjs/cqrs";
import { EC24Service } from "../../services/ec24.service";
import { WebSocketAdapter } from "@infrastrucrue/adapters";

@EventsHandler(PostEC24RequestedEvent)
export class PostEC24RequestedHandler implements IEventHandler<PostEC24RequestedEvent> {
    constructor(
        private readonly logger: LogService,
        private readonly ec24Service: EC24Service,
        private readonly wsService: WebSocketAdapter
    ) {
    }

    async handle(event: PostEC24RequestedEvent) {
        const { taskId } = event;
        const room = `task_${taskId}`;

        try {
            this.logger.log(`Iniciando publicación para tarea: ${taskId}`);

            const payload = {
                data: event.data,
                files: event.files
            }
            // Llamamos al servicio (que usa Playwright)
            await this.ec24Service.publish(payload, (msg, progress) => {

                // 1. Logueamos el progreso internamente
                this.logger.log(`[Progreso ${progress}%]: ${msg}`);

                // 2. Emitimos al WebSocket
                // Enviamos a la sala específica de esta tarea
                this.wsService.server.to(room).emit('task_progress', {
                    taskId,
                    message: msg,
                    progress: progress,
                    timestamp: new Date().toISOString()
                });
            });

            // Al finalizar con éxito
            this.wsService.server.to(room).emit('task_completed', {
                taskId,
                message: 'Publicación finalizada con éxito en Encuentra24',
                url: 'https://www.encuentra24.com/mis-anuncios'
            });

        } catch (error) {
            this.logger.error(`Error en tarea ${taskId}`, error.stack);

            // Informamos al socket que hubo un error
            this.wsService.server.to(room).emit('task_error', {
                taskId,
                error: error.message || 'Error inesperado en el proceso de publicación'
            });
        }
    }
}