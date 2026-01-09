import { DynamicModule, Module, Global } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { RabbitOptions } from "./options/RabbitOptions";
import { AmqpAdapter } from "./AmqpAdapter";

@Global() // Opcional: hace que el adaptador esté disponible en toda la app sin re-importar
@Module({})
export class AmqpConfig {
    static register(): DynamicModule {
        return {
            module: AmqpConfig,
            providers: [
                // 1. Factory para las opciones (lee del .env y valida)
                {
                    provide: RabbitOptions,
                    inject: [ConfigService],
                    useFactory: (config: ConfigService) => {
                        return new RabbitOptions(
                            config.get<string>('RABBIT_ADAPTER', 'amqp'),
                            config.get<string>('RABBITMQ_HOST', 'localhost'),
                            config.get<string>('RABBITMQ_PORT', '5672'),
                            config.get<string>('RABBITMQ_USER', 'guest'),
                            config.get<string>('RABBITMQ_PASS', 'guest'),
                            config.get<string>('RABBITMQ_VHOST', '/')
                        );
                    },
                },
                // 2. Factory para el Adaptador (crea la conexión)
                {
                    provide: AmqpAdapter,
                    inject: [RabbitOptions],
                    useFactory: async (options: RabbitOptions) => {
                        const adapter = new AmqpAdapter(options);
                        await adapter.connect(); // Conexión asíncrona al arrancar
                        return adapter;
                    },
                }
            ],
            exports: [AmqpAdapter] // Exportamos para que otros módulos lo usen
        };
    }
}