import { CoreModule } from "@core/module";
import { InfrastructureModule } from "@infrastrucrue/module";
import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PresentationModule } from "@presentation/module";
import { CreatePostEC24Handler } from "./features/encuentra24/createPost/CreatePostEC24Handler";
import { PostEC24RequestedHandler } from "./features/encuentra24/createPost/events/postRequested/PostEC24RequestedHandler";
import { EC24Service } from "./features/encuentra24/createPost/services/ec24.service";
import { CorrelationMiddleware } from "@core/middlewares";
import { CreateAdsHandler } from "./features/CreateAdsHandler";

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        CoreModule,
        InfrastructureModule,
        PresentationModule
    ],
    providers: [EC24Service, CreatePostEC24Handler, PostEC24RequestedHandler, CreateAdsHandler]
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(CorrelationMiddleware).forRoutes('*');
    }
}