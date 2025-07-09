import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: ['http://localhost:4200', 'http://localhost:3000'],
    credentials: true,
  }); 

  console.log('Backend startet auf Port 3000...');
  await app.listen(3000);
  console.log('Backend läuft auf http://localhost:3000');
}
bootstrap();