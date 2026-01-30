import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  // Create our main application instance
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // Set up our API prefix so all routes start with /api
  const apiPrefix = configService.get<string>('app.apiPrefix') || 'api';
  app.setGlobalPrefix(apiPrefix);

  // Allow frontend apps to connect from different domains
  app.enableCors();

  // Set up automatic request validation to keep bad data out
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Only allow properties we expect in our DTOs
      forbidNonWhitelisted: true, // Reject requests with extra unwanted properties
      transform: true, // Convert incoming data to the right types automatically
      transformOptions: {
        enableImplicitConversion: true, // Smart conversion like "123" string to 123 number
      },
    }),
  );

  // Build our beautiful API documentation with Swagger
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
      - **Admin**: admin@library.com / admin123 (Full access)
      - **Librarian**: librarian@library.com / librarian123 (Manage books & users)
      - **Member**: member@library.com / member123 (View only)
      
      ### ⚠️ Common Testing Mistakes
      - ❌ Wrong email: admin@library.cm (missing 'o')
      - ✅ Correct email: admin@library.com
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
    .addTag('Audit Logs', '📋 Track all system activities')
    .addTag('Health', '❤️ System health and status checks')
    .build();

  // Create the documentation and make it available at /api/docs
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
    swaggerOptions: {
      persistAuthorization: true, // Remember JWT tokens between page refreshes
      tagsSorter: 'alpha', // Keep API sections organized alphabetically
      operationsSorter: 'alpha', // Sort individual endpoints alphabetically too
    },
    customSiteTitle: 'LMS API Documentation',
    customfavIcon: '/favicon.ico',
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info .title { color: #3b82f6 }
    `,
  });

  // Get our server configuration and fire it up!
  const port = configService.get<number>('app.port') || 3000;
  const environment = configService.get<string>('app.environment') || 'development';

  await app.listen(port);

  // Let everyone know we're ready to go
  logger.log(`🚀 Application is running on: http://localhost:${port}/${apiPrefix}`);
  logger.log(`📚 Swagger documentation: http://localhost:${port}/${apiPrefix}/docs`);
  logger.log(`🌍 Environment: ${environment}`);
  logger.log(`🔒 CORS enabled for: ${process.env.CORS_ORIGIN || '*'}`);
}

// Start everything up and handle any problems that might occur
bootstrap().catch((error) => {
  Logger.error('❌ Error starting server', error, 'Bootstrap');
  process.exit(1);
});