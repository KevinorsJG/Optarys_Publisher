import { Command } from "@nestjs/cqrs";
import { EC24PublicationResponse } from "./dtos/EC24PublicationResponse";
import { Result } from "@core/interfaces/result";
import { CreateEC24PublicationDto } from "./dtos/CreateEC24PublicationDto";

export class CreatePostEC24Command extends Command<Result<EC24PublicationResponse>> {
    constructor(
        public readonly dto: CreateEC24PublicationDto,
        public files: string[] | Buffer[]
    ) {
        super();
    }
}