import { Global, Module } from "@nestjs/common";
import { LogService } from "./logger";
import { CqrsModule } from "@nestjs/cqrs";

@Global()
@Module({
    imports: [CqrsModule.forRoot()],
    providers: [LogService],
    exports: [LogService],
})
export class CoreModule { }