import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { CreateAdsCommand } from "./CreateAdsCommand";

@CommandHandler(CreateAdsCommand)
export class CreateAdsHandler implements ICommandHandler<CreateAdsCommand, void> {
    constructor(

    ) { }
    execute(command: CreateAdsCommand): Promise<void> {
        throw new Error("Method not implemented.");
    }
}  
