import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { NestExpressApplication } from '@nestjs/platform-express'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { AppModule } from './app.module'
import { AllExceptionsFilter } from './common/filters/http-exception.filter'
import { LoggingInterceptor } from './common/interceptors/logging.interceptor'
import { TransformInterceptor } from './common/interceptors/transform.interceptor'
import { requestIdMiddleware } from './common/middleware/request-id.middleware'
import { UPLOAD_DIR, UPLOAD_PUBLIC_PREFIX } from './modules/storage/local-disk.storage'
import { PrismaService } from './prisma/prisma.service'

async function bootstrap() {
  // 微信通知按原始字节验签，保留 rawBody，不能用解析后的 JSON 重组签名原文。
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { rawBody: true })
  const configService = app.get(ConfigService)

  // 全局前缀（控制器路由用）。注意：useStaticAssets 是 Express 层中间件，
  // 不受 setGlobalPrefix 影响，所以静态目录的 prefix 要手动带上同一前缀，
  // 否则前端按 /<prefix>/uploads 取文件会 404。
  const prefix = configService.get<string>('APP_PREFIX', 'api')

  // 对外暴露本地上传目录。数据库里只存相对路径，这里把它映射成可访问的 URL，
  // 并与全局前缀对齐（前端 UPLOAD_BASE_URL = API_BASE_URL + '/uploads/'）。
  app.useStaticAssets(UPLOAD_DIR, { prefix: `/${prefix}${UPLOAD_PUBLIC_PREFIX}` })

  app.use(requestIdMiddleware)

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
  const allowedOrigins = configService.get<string>('CORS_ORIGIN', '').split(',').map(s => s.trim()).filter(Boolean)
  app.enableCors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })

  // Swagger 配置
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Vue3 Elm API')
    .setDescription('Vue3 + Elm 项目后端 API 文档')
    .setVersion('1.0')
    .addBearerAuth()
    .build()
  const document = SwaggerModule.createDocument(app, swaggerConfig)
  SwaggerModule.setup('api-docs', app, document)

  // 显式启用关闭钩子，确保 SIGTERM（Render 等平台）时执行各模块的 onModuleDestroy
  app.enableShutdownHooks()

  // 启动服务
  const port = configService.get<number>('APP_PORT', 3000)
  await app.listen(port)

  console.log(`Application is running on: http://localhost:${port}`)
  console.log(`Swagger docs: http://localhost:${port}/api-docs`)
}
bootstrap()
