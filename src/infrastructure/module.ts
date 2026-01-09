import { Module } from '@nestjs/common';
import { AmqpConfig } from './adapters/rabbit/AmqpConfig';
import { WsConfig } from './adapters/socketio/WsConfig';
import { StorageConfig } from './persistence/storage/storageConfig';

@Module({
  imports: [
    AmqpConfig.register(),
    WsConfig.register(),
    StorageConfig.register(),
  ],
})
export class InfrastructureModule { }