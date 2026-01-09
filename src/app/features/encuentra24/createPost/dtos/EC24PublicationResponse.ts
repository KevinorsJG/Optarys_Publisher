export class EC24PublicationResponse {
    constructor(
        public readonly taskId: string, 
        public readonly status: string, 
        public readonly message: string
    ) {}
}