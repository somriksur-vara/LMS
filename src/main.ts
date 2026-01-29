import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // Global prefix
  const apiPrefix = configService.get<string>('app.apiPrefix') || 'api';
  app.setGlobalPrefix(apiPrefix);

  // Enable CORS for frontend integration
  app.enableCors();

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that don't have decorators
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are present
      transform: true, // Automatically transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true, // Allow implicit type conversion
      },
    }),
  );

  // Swagger configuration
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Library Management System API')
    .setDescription(`
      A comprehensive Library Management System API built with NestJS, PostgreSQL, and Prisma.
      
      ## Features
      - **Multi-role Authentication**: Admin, Librarian, and Member roles with JWT-based authentication
      - **Book Management**: Complete CRUD operations with ISBN validation and availability tracking
      - **Issue Management**: Book checkout/return with fine calculation and overdue tracking
      - **Audit Logging**: Comprehensive activity tracking for compliance and monitoring
      - **Advanced Search**: Filter books by author, category, availability status
      - **Role-Based Access Control**: Granular permissions based on user roles
      
      ## Authentication
      Most endpoints require authentication. Use the login endpoint to obtain a JWT token,
      then include it in the Authorization header as: \`Bearer <token>\`
      
      ## Default Users (for testing)
      - **Admin**: admin@library.com / admin123
      - **Librarian**: librarian@library.com / librarian123  
      - **Member**: member@library.com / member123
    `)
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Authentication', 'User authentication and authorization')
    .addTag('Users', 'User management operations')
    .addTag('Books', 'Book catalog management')
    .addTag('Authors', 'Author management')
    .addTag('Categories', 'Book category management')
    .addTag('Issues', 'Book issue and return operations')
    .addTag('Audit Logs', 'System activity audit logs')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'LMS API Documentation',
    customfavIcon: '/favicon.ico',
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info .title { color: #3b82f6 }
    `,
  });

  // Start server
  const port = configService.get<number>('app.port') || 3000;
  const environment = configService.get<string>('app.environment') || 'development';

  await app.listen(port);

  logger.log(`🚀 Application is running on: http://localhost:${port}/${apiPrefix}`);
  logger.log(`📚 Swagger documentation: http://localhost:${port}/${apiPrefix}/docs`);
  logger.log(`🌍 Environment: ${environment}`);
  logger.log(`🔒 CORS enabled for: ${process.env.CORS_ORIGIN || '*'}`);
}

bootstrap().catch((error) => {
  Logger.error('❌ Error starting server', error, 'Bootstrap');
  process.exit(1);
});