import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {

  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');


  const apiPrefix = configService.get<string>('app.apiPrefix') || 'api';
  app.setGlobalPrefix(apiPrefix);


  app.enableCors();


  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );


  const swaggerConfig = new DocumentBuilder()
    .setTitle('Library Management System API')
    .setDescription(`
      ## 📚 Welcome to Library Management System API

      A complete solution for managing library operations with role-based access control.

      ### 🚀 Quick Start Guide
      1. **Login**: Use /auth/login with default credentials
      2. **Get Token**: Copy the access token from login response
      3. **Authorize**: Click 🔒 Authorize button and paste: Bearer YOUR_TOKEN
      4. **Test APIs**: Now you can test all protected endpoints!

      ### 👥 Default Test Users
      - **Librarian**: librarian@library.com / librarian123 (Full access)
      - **Member**: member@library.com / member123 (View books, manage own issues)

      ### ⚠️ Common Testing Mistakes
      - ❌ Wrong email: librarian@library.cm (missing 'o')
      - ✅ Correct email: librarian@library.com
      - ❌ Forgot Bearer: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
      - ✅ Correct format: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

      ### 🔍 How to Know if API Call Worked
      - ✅ Success: "success": true in response
      - ❌ Error: "success": false in response
      - 📊 Check the "message" field for clear explanation
      - 📋 Look for "data" field containing the actual results

      ### 📋 Response Format
      All endpoints return consistent format:
      - success: true/false
      - message: Clear description of what happened
      - data: Contains the actual results (only on success)
      - pagination: Page info for list endpoints
      - error: Error code (only on error)
      - errors: Validation errors array (only for validation errors)

      ### 🔑 Authentication Required
      Most endpoints need authentication. Look for the 🔒 lock icon next to endpoints.

      ### 💡 Testing Tips
      - Start with Authentication → Login
      - Use the Authorize button after login
      - Test in order: Auth → Users → Books → Issues → Fines
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
    .addTag('Authentication', '🔐 Login/logout and get access tokens')
    .addTag('Users', '👥 Manage user accounts and profiles')
    .addTag('Books', '📚 Manage book catalog and inventory')
    .addTag('Categories', '📂 Organize books by categories')
    .addTag('Issues', '📖 Book checkout, return and tracking')
    .addTag('Fines', '💰 Fine calculation and payment management')
    .addTag('Health', '❤️ System health and status checks')
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