import { CommandHandler, ICommandHandler, EventBus } from "@nestjs/cqrs";
import { CreatePostEC24Command } from "./CreatePostEC24Command";
import { EC24PublicationResponse } from "./dtos/EC24PublicationResponse";
import { Result } from "@core/interfaces/result";
import { randomUUID } from "node:crypto";
import { PostEC24RequestedEvent } from "./events/postRequested/PostEC24RequestedEvent";
import { LogService } from "@core/logger";

@CommandHandler(CreatePostEC24Command)
export class CreatePostEC24Handler implements ICommandHandler<CreatePostEC24Command, EC24PublicationResponse> {

    constructor(
        private readonly logger: LogService,
        private readonly eventBus: EventBus,
    ) { }

    async execute(command: CreatePostEC24Command): Promise<Result<EC24PublicationResponse>> {
        try {
            // 1. Generar el ID único de rastreo (Correlation ID)
            const taskId = randomUUID();

            // 2. PUBLICAR EVENTO INTERNO DE NESTJS (CQRS)
            this.eventBus.publish(new PostEC24RequestedEvent(taskId, command.dto, command.files));

            this.logger.log('Evento publicado, se espera a que inicie el proceso')

            // 3. RETORNAR EL RESULTADO INMEDIATO
            return Result.ok<EC24PublicationResponse>({
                taskId: taskId,
                status: 'QUEUED',
                message: 'La publicación se está procesando en segundo plano.'
            });

        } catch (error) {
            this.logger.error(`Ocurrio un error al crear la publicacion`, error)
            return Result.fail<EC24PublicationResponse>(error);
        }
    }
}