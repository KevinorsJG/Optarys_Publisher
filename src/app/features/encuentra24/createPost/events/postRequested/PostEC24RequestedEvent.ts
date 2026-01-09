import { CreateEC24PublicationDto } from "../../dtos/CreateEC24PublicationDto";

export class PostEC24RequestedEvent {
    constructor(
        public readonly taskId: string,
        public readonly data: CreateEC24PublicationDto,       // Tu DTO con título, precio, etc.
        public files: string[] | Buffer[]
    ) {
    }
}