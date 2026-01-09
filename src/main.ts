import { NestFactory } from '@nestjs/core';
import { LogService } from '@core/logger';
import { AppModule } from '@app/module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true
  });
  const customLogger = await app.resolve(LogService);
  customLogger.setContext('Bootstrap');
  app.useLogger(customLogger);

   const config = new DocumentBuilder()
    .setTitle('OPT Publisher API')
    .setDescription('API para la publicación automatizada en Optarys Vizo')
    .setVersion('1.0')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, documentFactory);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
