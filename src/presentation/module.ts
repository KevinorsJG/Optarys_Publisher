import { Module } from "@nestjs/common";
import { PublishController } from "./controllers";

@Module({
    controllers: [PublishController],
}) 
export class PresentationModule {}