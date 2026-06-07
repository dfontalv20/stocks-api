import { NestFactory } from '@nestjs/core';
import { WsAdapter } from '@nestjs/platform-ws';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { addAppConfig } from './config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = new DocumentBuilder()
    .setTitle('Finnhub Stocks')
    .setDescription('Finnhub stocks test API')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        name: 'authorization',
        bearerFormat: 'Bearer',
        scheme: 'Bearer',
      },
      'authorization',
    )
    .addSecurityRequirements('authorization')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory, {
    yamlDocumentUrl: '/api.yaml',
  });
  app.useWebSocketAdapter(new WsAdapter(app));
  addAppConfig(app);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
