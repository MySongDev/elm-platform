import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { AppModule } from './app.module'
import { AllExceptionsFilter } from './common/filters/http-exception.filter'
import { LoggingInterceptor } from './common/interceptors/logging.interceptor'
import { TransformInterceptor } from './common/interceptors/transform.interceptor'
import { requestIdMiddleware } from './common/middleware/request-id.middleware'
import { PrismaService } from './prisma/prisma.service'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const configService = app.get(ConfigService)

  app.use(requestIdMiddleware)

  // 全局前缀
  const prefix = configService.get<string>('APP_PREFIX', 'api')
  app.setGlobalPrefix(prefix)

  // 全局过滤器 - 异常处理
  app.useGlobalFilters(new AllExceptionsFilter())

  // 全局拦截器
  app.useGlobalInterceptors(
    new LoggingInterceptor(app.get(PrismaService)),
    new TransformInterceptor(),
  )

  // 全局管道 - 参数验证
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  )

  // CORS
  app.enableCors()

  // Swagger 配置
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Vue3 Elm API')
    .setDescription('Vue3 + Elm 项目后端 API 文档')
    .setVersion('1.0')
    .addBearerAuth()
    .build()
  const document = SwaggerModule.createDocument(app, swaggerConfig)
  SwaggerModule.setup('api-docs', app, document)

  // 启动服务
  const port = configService.get<number>('APP_PORT', 3000)
  await app.listen(port)

  console.log(`Application is running on: http://localhost:${port}`)
  console.log(`Swagger docs: http://localhost:${port}/api-docs`)
}
bootstrap()
