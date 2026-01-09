import { DynamicModule, Global, Module } from "@nestjs/common";
import { WebSocketAdapter } from "./WsAdapter";

@Global() // Opcional: hace que el adaptador esté disponible en toda la app sin re-importar
@Module({})
export class WsConfig {
    static register(): DynamicModule {
        return {
            module: WsConfig,
            providers: [WebSocketAdapter],
            exports: [WebSocketAdapter] // Exportamos para que otros módulos lo usen
        }
    }
}