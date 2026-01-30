
# Library Management System - Complete Documentation

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Project Structure](#project-structure)
3. [Workflow Explanation](#workflow-explanation)
4. [File-by-File Code Explanation](#file-by-file-code-explanation)
5. [Setup Instructions](#setup-instructions)
6. [API Documentation](#api-documentation)

## 🎯 Project Overview

This is a **Production-Ready Library Management System** built with:
- **Backend**: NestJS (Node.js framework)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT-based with role-based access control
- **Documentation**: Swagger/OpenAPI
- **Deployment**: Docker support

### Key Features
- 👥 **Multi-role Authentication** (Admin, Librarian, Member)
- 📚 **Book Management** (CRUD operations)
- 👤 **User Management** (Role-based access)
- � **Fine Management** (Automated fine calculation in Indian Rupees ₹)
- �📊 **Audit Logging** (Activity tracking)
- 🔍 **Advanced Search & Filtering**
- 📖 **API Documentation** (Interactive Swagger UI)

---

## 🏗️ Project Structure

```
LMS/
├── 📁 src/                          # Source code directory
│   ├── 📁 common/                   # Shared utilities and components
│   │   ├── 📁 decorators/           # Custom decorators
│   │   ├── 📁 enums/                # Enum definitions
│   │   ├── 📁 filters/              # Exception filters
│   │   ├── 📁 guards/               # Authentication guards
│   │   └── 📁 utils/                # Utility functions
│   ├── 📁 config/                   # Configuration files
│   ├── 📁 health/                   # Health check module
│   ├── 📁 modules/                  # Feature modules
│   │   ├── 📁 auth/                 # Authentication module
│   │   ├── 📁 users/                # User management module
│   │   ├── 📁 books/                # Book management module
│   │   └── 📁 audit-logs/           # Audit logging module
│   ├── 📁 prisma/                   # Prisma service
│   ├── 📄 app.module.ts             # Root application module
│   └── 📄 main.ts                   # Application entry point
├── 📁 prisma/                       # Database schema and migrations
├── 📄 package.json                  # Dependencies and scripts
├── 📄 tsconfig.json                 # TypeScript configuration
├── 📄 Dockerfile                    # Docker configuration
├── 📄 docker-compose.yml            # Multi-container setup
└── 📄 .env                          # Environment variables
```

---

## 🔄 Workflow Explanation

### 1. **Application Startup Flow**
```
main.ts → app.module.ts → Feature Modules → Database Connection → Server Start
```

### 2. **Request Processing Flow**
```
HTTP Request → Guards (Auth/Roles) → Controller → Service → Database → Response
```

### 3. **Authentication Flow**
```
Login Request → Validate Credentials → Generate JWT → Return Token → Use Token for Protected Routes
```

### 4. **Database Flow**
```
Prisma Schema → Migrations → Prisma Client → Service Layer → Database Operations
```

---

## 📝 File-by-File Code Explanation

### 🚀 **Entry Point Files**

#### `src/main.ts` - Application Bootstrap
This is the heart of our application - where everything starts up and gets configured.

```typescript
// Line 1-5: Import all the essential NestJS components we need
import { NestFactory } from '@nestjs/core';        // This creates our NestJS app
import { ValidationPipe, Logger } from '@nestjs/common';  // For validating requests and logging
import { ConfigService } from '@nestjs/config';    // Handles our environment variables
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';  // Creates API documentation
import { AppModule } from './app.module';          // Our main app module

// Line 7: This function sets up and starts our entire application
async function bootstrap() {
  // Line 9: Create a new NestJS application using our AppModule as the root
  const app = await NestFactory.create(AppModule);
  
  // Line 11-12: Get access to our configuration and create a logger for startup messages
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // Line 14-15: Set up the API prefix - all our routes will start with /api
  const apiPrefix = configService.get<string>('app.apiPrefix') || 'api';
  app.setGlobalPrefix(apiPrefix);

  // Line 17: Allow frontend applications to make requests to our API from different domains
  app.enableCors();

  // Line 19-27: Set up automatic validation for all incoming requests
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,                    // Only allow properties defined in our DTOs
      forbidNonWhitelisted: true,         // Reject requests with extra properties
      transform: true,                    // Convert request data to proper types
      transformOptions: {
        enableImplicitConversion: true,   // Automatically convert strings to numbers, etc.
      },
    }),
  );

  // Line 29-45: Configure Swagger for beautiful API documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Library Management System API')      // Title shown in docs
    .setDescription('Complete API documentation for LMS')  // Description
    .setVersion('1.0.0')                           // API version
    .addBearerAuth(                                // Add JWT token authentication
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
    .addTag('Authentication', 'User authentication and authorization')  // Group endpoints
    .addTag('Users', 'User management operations')
    .addTag('Books', 'Book catalog management')
    .addTag('Audit Logs', 'System activity audit logs')
    .build();

  // Line 47-58: Create the actual documentation and set it up at /api/docs
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
    swaggerOptions: {
      persistAuthorization: true,         // Remember the JWT token between page refreshes
      tagsSorter: 'alpha',               // Sort API sections alphabetically
      operationsSorter: 'alpha',         // Sort individual endpoints alphabetically
    },
    customSiteTitle: 'LMS API Documentation',      // Browser tab title
    customfavIcon: '/favicon.ico',                 // Icon in browser tab
    customCss: `
      .swagger-ui .topbar { display: none }        // Hide the Swagger logo bar
      .swagger-ui .info .title { color: #3b82f6 }  // Make title blue
    `,
  });

  // Line 60-61: Get the port and environment from our config
  const port = configService.get<number>('app.port') || 3000;
  const environment = configService.get<string>('app.environment') || 'development';

  // Line 63: Actually start the server and listen for requests
  await app.listen(port);

  // Line 65-68: Log helpful information about where our app is running
  logger.log(`🚀 Application is running on: http://localhost:${port}/${apiPrefix}`);
  logger.log(`📚 Swagger documentation: http://localhost:${port}/${apiPrefix}/docs`);
  logger.log(`🌍 Environment: ${environment}`);
  logger.log(`🔒 CORS enabled for: *`);
}

// Line 71-74: Start the app and handle any startup errors gracefully
bootstrap().catch((error) => {
  Logger.error('❌ Error starting server', error, 'Bootstrap');
  process.exit(1);  // Exit the process if we can't start
});
```

#### `src/app.module.ts` - Root Application Module
This file is like the main control center that brings together all parts of our application.

```typescript
// Line 1-3: Import the core NestJS decorators and utilities we need
import { Module } from '@nestjs/common';              // Decorator to define a module
import { ConfigModule } from '@nestjs/config';        // Handles environment variables globally
import { APP_FILTER } from '@nestjs/core';            // Token for global filters

// Line 5: Import our configuration files that define app settings
import { appConfig, databaseConfig, jwtConfig } from './config';

// Line 7-8: Import our core database module
import { PrismaModule } from './prisma/prisma.module';

// Line 10-14: Import all our feature modules - each handles a specific part of the app
import { AuthModule } from './modules/auth/auth.module';           // Login/logout functionality
import { UsersModule } from './modules/users/users.module';        // User management
import { BooksModule } from './modules/books/books.module';        // Book catalog
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';  // Activity tracking
import { HealthModule } from './health/health.module';             // Health checks

// Line 16: Import our global error handling filters
import { HttpExceptionFilter, AllExceptionsFilter } from './common/filters';

// Line 18: This decorator tells NestJS this is a module and defines its configuration
@Module({
  imports: [
    // Line 21-25: Set up global configuration that all modules can access
    ConfigModule.forRoot({
      isGlobal: true,                     // Make config available everywhere in the app
      load: [appConfig, databaseConfig, jwtConfig], // Load our config files
      envFilePath: ['.env.local', '.env'], // Look for environment files in this order
    }),

    // Line 27-28: Include our database module so all other modules can use it
    PrismaModule,

    // Line 30-34: Include all our feature modules
    AuthModule,                           // Handles user authentication
    UsersModule,                          // Manages user accounts
    BooksModule,                          // Manages the book catalog
    AuditLogsModule,                      // Tracks what users do in the system
    HealthModule,                         // Provides health check endpoints
  ],
  providers: [
    // Line 37-43: Set up global error handlers that catch problems anywhere in the app
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,     // Catches any unexpected errors
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,     // Handles known HTTP errors nicely
    },
  ],
})
// Line 45: Export the class so main.ts can use it to start the app
export class AppModule {}
```

### ⚙️ **Configuration Files**

#### `src/config/app.config.ts` - Application Configuration
This file defines the basic settings for our application like port and environment.

```typescript
// Line 1: Import the NestJS configuration utility
import { registerAs } from '@nestjs/config';

// Line 3-7: Export our app configuration as a function that returns settings
export default registerAs('app', () => ({
  port: parseInt(process.env.PORT || '3000', 10),        // Which port our server runs on (default 3000)
  environment: process.env.NODE_ENV || 'development',    // Are we in development or production?
  apiPrefix: process.env.API_PREFIX || 'api',            // What prefix to use for all our routes (/api)
}));
```

#### `src/config/database.config.ts` - Database Configuration
This tells our app how to connect to the PostgreSQL database.

```typescript
// Line 1: Import the configuration utility
import { registerAs } from '@nestjs/config';

// Line 3-5: Export database settings - just the connection URL for now
export default registerAs('database', () => ({
  url: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/library_db',
}));
```

#### `src/config/jwt.config.ts` - JWT Configuration
This configures how we handle user authentication tokens.

```typescript
// Line 1: Import the configuration utility
import { registerAs } from '@nestjs/config';

// Line 3-6: Export JWT settings for user authentication
export default registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production', // Secret key for signing tokens
  expiresIn: process.env.JWT_EXPIRES_IN || '24h',        // How long tokens stay valid (24 hours)
}));
```

#### `src/config/index.ts` - Configuration Exports
This file makes it easy to import all our config files at once.

```typescript
// Line 1-3: Export all our configuration modules so other files can import them easily
export { default as appConfig } from './app.config';
export { default as databaseConfig } from './database.config';
export { default as jwtConfig } from './jwt.config';
```

### 🗄️ **Database Layer**

#### `src/prisma/prisma.service.ts` - Database Service
This is our main database service that handles all connections and operations.

```typescript
// Line 1: Import NestJS decorators for dependency injection and lifecycle hooks
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
// Line 2: Import the Prisma client that talks to our database
import { PrismaClient } from '@prisma/client';

// Line 4: Make this class injectable so other parts of the app can use it
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    // Line 7-9: Set up the Prisma client with logging enabled so we can see what's happening
    super({
      log: ['query', 'info', 'warn', 'error'],           // Log database queries and any issues
    });
  }

  // Line 12-14: Connect to the database when the app starts up
  async onModuleInit() {
    await this.$connect();
  }

  // Line 16-18: Disconnect from the database when the app shuts down
  async onModuleDestroy() {
    await this.$disconnect();
  }

  // Line 20-28: Utility method to wipe the database clean (only for development/testing)
  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') return; // Never do this in production!

    // Get all the table names from Prisma
    const models = Reflect.ownKeys(this).filter((key) => typeof key === 'string' && key[0] !== '_');

    // Delete everything from every table
    return Promise.all(
      models.map((modelKey) => (this as any)[modelKey].deleteMany()),
    );
  }
}
```

#### `src/prisma/prisma.module.ts` - Database Module
This module makes our database service available throughout the entire application.

```typescript
// Line 1: Import NestJS decorators
import { Global, Module } from '@nestjs/common';
// Line 2: Import our database service
import { PrismaService } from './prisma.service';

// Line 4: Make this module global so every other module can use it without importing
@Global()
@Module({
  providers: [PrismaService],                           // Register our database service
  exports: [PrismaService],                             // Make it available to other modules
})
export class PrismaModule {}
```

#### `prisma/schema.prisma` - Database Schema
```prisma
// Prisma configuration
generator client {
  provider = "prisma-client-js"                         // Generate TypeScript client
}

datasource db {
  provider = "postgresql"                               // Use PostgreSQL database
  url      = env("DATABASE_URL")                        // Connection string from env
}

// User roles enumeration
enum UserRole {
  ADMIN                                                 // Full system access
  LIBRARIAN                                             // Book and user management
  MEMBER                                                // Read-only access
}

// Book status enumeration
enum BookStatus {
  AVAILABLE                                             // Book is available for checkout
  ISSUED                                                // Book is currently issued
  MAINTENANCE                                           // Book is under maintenance
  LOST                                                  // Book is lost
}

// Issue status enumeration
enum IssueStatus {
  ACTIVE                                                // Book is currently issued
  RETURNED                                              // Book has been returned
  OVERDUE                                               // Book return is overdue
}

// Audit action enumeration
enum AuditAction {
  CREATE_USER
  UPDATE_USER
  DELETE_USER
  CREATE_BOOK
  UPDATE_BOOK
  DELETE_BOOK
  ISSUE_BOOK
  RETURN_BOOK
  CREATE_AUTHOR
  UPDATE_AUTHOR
  DELETE_AUTHOR
  CREATE_CATEGORY
  UPDATE_CATEGORY
  DELETE_CATEGORY
  USER_LOGIN
  USER_LOGOUT
}

// User model
model User {
  id        String   @id @default(cuid())               // Unique identifier
  email     String   @unique                            // Unique email address
  password  String                                      // Hashed password
  firstName String                                      // User's first name
  lastName  String                                      // User's last name
  role      UserRole @default(MEMBER)                   // User role (default: MEMBER)
  isActive  Boolean  @default(true)                     // Account status
  createdAt DateTime @default(now())                    // Creation timestamp
  updatedAt DateTime @updatedAt                         // Last update timestamp

  // Relations
  issuedBooks    Issue[]     @relation("IssuedToUser")  // Books issued to this user
  processedIssues Issue[]    @relation("ProcessedByUser") // Issues processed by this user
  auditLogs      AuditLog[]                             // Audit logs for this user

  @@map("users")                                        // Table name in database
  @@index([email])                                      // Index on email for fast lookup
  @@index([role])                                       // Index on role for filtering
}

// Author model
model Author {
  id        String   @id @default(cuid())               // Unique identifier
  name      String                                      // Author's name
  biography String?                                     // Optional biography
  createdAt DateTime @default(now())                    // Creation timestamp
  updatedAt DateTime @updatedAt                         // Last update timestamp

  // Relations
  books BookAuthor[]                                    // Books by this author

  @@map("authors")                                      // Table name in database
  @@index([name])                                       // Index on name for searching
}

// Category model
model Category {
  id          String   @id @default(cuid())             // Unique identifier
  name        String   @unique                          // Unique category name
  description String?                                   // Optional description
  createdAt   DateTime @default(now())                  // Creation timestamp
  updatedAt   DateTime @updatedAt                       // Last update timestamp

  // Relations
  books Book[]                                          // Books in this category

  @@map("categories")                                   // Table name in database
  @@index([name])                                       // Index on name for searching
}

// Book model
model Book {
  id              String     @id @default(cuid())       // Unique identifier
  isbn            String     @unique                    // Unique ISBN
  title           String                                // Book title
  description     String?                               // Optional description
  totalCopies     Int        @default(1)               // Total number of copies
  availableCopies Int        @default(1)               // Available copies
  status          BookStatus @default(AVAILABLE)       // Book status
  publishedYear   Int?                                  // Publication year
  createdAt       DateTime   @default(now())           // Creation timestamp
  updatedAt       DateTime   @updatedAt                // Last update timestamp

  // Foreign Keys
  categoryId String?                                    // Optional category reference

  // Relations
  category Category?     @relation(fields: [categoryId], references: [id]) // Book category
  authors  BookAuthor[]                                 // Book authors (many-to-many)
  issues   Issue[]                                      // Issue records for this book

  @@map("books")                                        // Table name in database
  @@index([isbn])                                       // Index on ISBN for fast lookup
  @@index([title])                                      // Index on title for searching
  @@index([status])                                     // Index on status for filtering
  @@index([categoryId])                                 // Index on category for filtering
}

// Junction table for Book-Author many-to-many relationship
model BookAuthor {
  id       String @id @default(cuid())                  // Unique identifier
  bookId   String                                       // Book reference
  authorId String                                       // Author reference

  // Relations
  book   Book   @relation(fields: [bookId], references: [id], onDelete: Cascade)   // Book reference
  author Author @relation(fields: [authorId], references: [id], onDelete: Cascade) // Author reference

  @@unique([bookId, authorId])                          // Prevent duplicate relationships
  @@map("book_authors")                                 // Table name in database
}

// Issue model for book lending operations
model Issue {
  id                 String      @id @default(cuid())   // Unique identifier
  issueDate          DateTime    @default(now())        // Issue date
  expectedReturnDate DateTime                           // Expected return date
  actualReturnDate   DateTime?                          // Actual return date (nullable)
  fineAmount         Decimal     @default(0) @db.Decimal(10, 2) // Fine amount
  status             IssueStatus @default(ACTIVE)       // Issue status
  notes              String?                            // Optional notes
  createdAt          DateTime    @default(now())        // Creation timestamp
  updatedAt          DateTime    @updatedAt             // Last update timestamp

  // Foreign Keys
  bookId        String                                  // Book reference
  issuedToId    String                                  // User who received the book
  processedById String                                  // User who processed the issue

  // Relations
  book        Book @relation(fields: [bookId], references: [id])        // Book reference
  issuedTo    User @relation("IssuedToUser", fields: [issuedToId], references: [id])    // User who received book
  processedBy User @relation("ProcessedByUser", fields: [processedById], references: [id]) // User who processed

  @@map("issues")                                       // Table name in database
  @@index([bookId])                                     // Index on book for filtering
  @@index([issuedToId])                                 // Index on user for filtering
  @@index([status])                                     // Index on status for filtering
  @@index([issueDate])                                  // Index on issue date for sorting
  @@index([expectedReturnDate])                         // Index on return date for overdue checks
}

// Audit log for system activity tracking
model AuditLog {
  id        String      @id @default(cuid())            // Unique identifier
  action    AuditAction                                 // Action performed
  entity    String                                      // Entity type (table name)
  entityId  String                                      // ID of affected record
  metadata  Json?                                       // Additional context data
  timestamp DateTime    @default(now())                 // Action timestamp

  // Foreign Keys
  userId String                                         // User who performed action

  // Relations
  user User @relation(fields: [userId], references: [id]) // User reference

  @@map("audit_logs")                                   // Table name in database
  @@index([action])                                     // Index on action for filtering
  @@index([entity])                                     // Index on entity for filtering
  @@index([userId])                                     // Index on user for filtering
  @@index([timestamp])                                  // Index on timestamp for sorting
}
```

### 🔐 **Authentication Module**

#### `src/modules/auth/auth.module.ts` - Authentication Module
```typescript
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [
    PassportModule,                                     // Passport authentication
    JwtModule.registerAsync({                           // JWT module with async config
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'), // JWT secret from config
        signOptions: {
          expiresIn: configService.get<string>('jwt.expiresIn'), // Token expiration
        },
      }),
      inject: [ConfigService],
    }),
    ConfigModule,                                       // Configuration module
    AuditLogsModule,                                    // For audit logging
  ],
  controllers: [AuthController],                        // Register controller
  providers: [AuthService, JwtStrategy, LocalStrategy], // Register services and strategies
  exports: [AuthService],                              // Export service for other modules
})
export class AuthModule {}
```

### 🔐 **Authentication Module**

#### `src/modules/auth/auth.service.ts` - Authentication Service
This service handles all the login/logout logic and JWT token creation.

```typescript
// Line 1-7: Import all the tools we need for authentication
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';                    // For creating JWT tokens
import { PrismaService } from '@/prisma/prisma.service';     // For database access
import { AuditLogsService } from '../audit-logs/audit-logs.service'; // For tracking activities
import { AuditAction } from '@/common/enums';                // Enum for different actions
import * as bcrypt from 'bcryptjs';                          // For password hashing
import { LoginDto, AuthResponseDto } from './dto/index';     // Data transfer objects

// Line 9: Make this class injectable so other parts can use it
@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,        // For database operations
    private jwtService: JwtService,       // For creating JWT tokens
    private auditLogsService: AuditLogsService, // For tracking user activities
  ) {}

  // Line 17-42: Check if a user's email and password are correct
  async validateUser(email: string, password: string): Promise<any> {
    // Look up the user by their email address
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true, // We need this to check the password
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
    });

    // If user doesn't exist or their account is disabled, reject them
    if (!user || !user.isActive) {
      return null;
    }

    // Check if the password they provided matches what we have stored
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    // Return user info without the password (for security)
    const { password: _, ...result } = user;
    return result;
  }

  // Line 44-85: Handle user login and create a JWT token
  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    // First, make sure their credentials are valid
    const user = await this.validateUser(loginDto.email, loginDto.password);
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Create the JWT token payload with user info
    const payload = {
      sub: user.id,     // 'sub' is the standard JWT field for user ID
      email: user.email,
      role: user.role,
    };

    // Generate the actual JWT token
    const accessToken = this.jwtService.sign(payload);

    // Keep track of when this user logged in
    await this.auditLogsService.createLog({
      action: AuditAction.USER_LOGIN,
      entity: 'users',
      entityId: user.id,
      userId: user.id,
      metadata: {
        email: user.email,
        loginTime: new Date().toISOString(),
      },
    });

    // Send back the token and user info
    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  // Line 87-98: Handle user logout (mainly just for logging purposes)
  async logout(userId: string): Promise<void> {
    // Keep track of when this user logged out
    await this.auditLogsService.createLog({
      action: AuditAction.USER_LOGOUT,
      entity: 'users',
      entityId: userId,
      userId: userId,
      metadata: {
        logoutTime: new Date().toISOString(),
      },
    });
  }
}
```

#### `src/modules/auth/auth.controller.ts` - Authentication Controller
```typescript
import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '@/common/guards';
import { CurrentUser, CurrentUserPayload } from '@/common/decorators';
import { LoginDto, AuthResponseDto } from './dto/index';

@ApiTags('Authentication')                              // Swagger tag
@Controller('auth')                                     // Route prefix: /auth
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')                                        // POST /auth/login
  @HttpCode(HttpStatus.OK)                              // Return 200 instead of 201
  @ApiOperation({ summary: 'User login' })             // Swagger operation description
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Login successful',
    type: AuthResponseDto,                              // Response type for Swagger
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid credentials',
  })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }

  @Post('logout')                                       // POST /auth/logout
  @UseGuards(JwtAuthGuard)                              // Require authentication
  @ApiBearerAuth('JWT-auth')                            // Swagger auth requirement
  @ApiOperation({ summary: 'User logout' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Logout successful',
  })
  async logout(@CurrentUser() user: CurrentUserPayload): Promise<{ message: string }> {
    await this.authService.logout(user.id);
    return { message: 'Logout successful' };
  }
}
```

### 🛡️ **Security Components**

#### `src/common/guards/jwt-auth.guard.ts` - JWT Authentication Guard
```typescript
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // Extends Passport's JWT authentication guard
  // Automatically validates JWT tokens and populates request.user
}
```

#### `src/common/guards/roles.guard.ts` - Role-Based Authorization Guard
```typescript
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../enums';
import { ROLES_KEY } from '../decorators';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Get required roles from decorator metadata
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no roles required, allow access
    if (!requiredRoles) {
      return true;
    }

    // Get user from request (populated by JWT guard)
    const { user } = context.switchToHttp().getRequest();
    
    // Check if user has required role
    return requiredRoles.some((role) => user.role === role);
  }
}
```

#### `src/modules/auth/strategies/jwt.strategy.ts` - JWT Strategy
```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '@/prisma/prisma.service';

export interface JwtPayload {
  sub: string;                                          // User ID
  email: string;                                        // User email
  role: string;                                         // User role
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Extract from Authorization header
      ignoreExpiration: false,                          // Check token expiration
      secretOrKey: configService.get<string>('jwt.secret'), // JWT secret
    });
  }

  // Validate JWT payload and return user
  async validate(payload: JwtPayload) {
    // Find user by ID from token
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
    });

    // Check if user exists and is active
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Return user object (will be available as request.user)
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }
}
```

#### `src/modules/auth/strategies/local.strategy.ts` - Local Strategy
```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'email',                           // Use email instead of username
    });
  }

  // Validate user credentials
  async validate(email: string, password: string): Promise<any> {
    const user = await this.authService.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return user;
  }
}
```

### 🎭 **Custom Decorators**

#### `src/common/decorators/roles.decorator.ts` - Roles Decorator
```typescript
import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../enums';

export const ROLES_KEY = 'roles';                      // Metadata key for roles

// Decorator to specify required roles for endpoints
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

// Usage: @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
```

#### `src/common/decorators/current-user.decorator.ts` - Current User Decorator
```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentUserPayload {
  id: string;                                           // User ID
  email: string;                                        // User email
  role: string;                                         // User role
}

// Decorator to extract current user from request
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): CurrentUserPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;                                // User populated by JWT guard
  },
);

// Usage: @CurrentUser() user: CurrentUserPayload
```

### 📊 **Data Transfer Objects (DTOs)**

#### `src/modules/auth/dto/login.dto.ts` - Login DTO
```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'User email address',
    example: 'admin@library.com',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'admin123',
    minLength: 6,
  })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;
}
```

#### `src/modules/auth/dto/auth-response.dto.ts` - Authentication Response DTO
```typescript
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@/common/enums';

export class UserDto {
  @ApiProperty({ description: 'User ID', example: 'clm123456789' })
  id: string;

  @ApiProperty({ description: 'User email', example: 'admin@library.com' })
  email: string;

  @ApiProperty({ description: 'First name', example: 'John' })
  firstName: string;

  @ApiProperty({ description: 'Last name', example: 'Doe' })
  lastName: string;

  @ApiProperty({ description: 'User role', enum: UserRole, example: UserRole.ADMIN })
  role: UserRole;
}

export class AuthResponseDto {
  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({ description: 'User information', type: UserDto })
  user: UserDto;
}
```

### 👥 **Users Module**

#### `src/modules/users/users.service.ts` - Users Service (Key Methods)
```typescript
import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { CreateUserDto, UpdateUserDto, UserResponseDto } from './dto/index';
import { PaginationOptions, calculatePagination, createPaginationResult } from '@/common/utils';
import { AuditAction, UserRole } from '@/common/enums';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private auditLogsService: AuditLogsService,
  ) {}

  // Create new user
  async create(
    createUserDto: CreateUserDto,
    createdById: string,
  ): Promise<UserResponseDto> {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password using bcrypt
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Create user in database
    const user = await this.prisma.user.create({
      data: {
        ...createUserDto,
        password: hashedPassword,                       // Store hashed password
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        // Exclude password from response
      },
    });

    // Log the action
    await this.auditLogsService.createLog({
      action: AuditAction.CREATE_USER,
      entity: 'User',
      entityId: user.id,
      userId: createdById,
      metadata: {
        email: user.email,
        role: user.role,
      },
    });

    return user;
  }

  // Get all users with pagination and filtering
  async findAll(
    paginationOptions: PaginationOptions,
    filters?: {
      role?: UserRole;
      isActive?: boolean;
      search?: string;
    },
  ) {
    const { page, limit, skip } = calculatePagination(paginationOptions);

    // Build where clause for filtering
    const where: any = {};

    if (filters?.role) {
      where.role = filters.role;
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // Execute queries in parallel
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          // Exclude password
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return createPaginationResult(users, total, page, limit);
  }

  // Additional methods: findOne, update, remove...
  // (Similar pattern with validation, database operations, and audit logging)
}
```

### 📚 **Books Module**

#### `src/modules/books/books.service.ts` - Books Service (Key Methods)
```typescript
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { CreateBookDto, UpdateBookDto, BookResponseDto } from './dto/index';
import { PaginationOptions, calculatePagination, createPaginationResult } from '@/common/utils';
import { AuditAction, BookStatus } from '@/common/enums';

@Injectable()
export class BooksService {
  constructor(
    private prisma: PrismaService,
    private auditLogsService: AuditLogsService,
  ) {}

  // Create new book
  async create(createBookDto: CreateBookDto, createdById: string): Promise<BookResponseDto> {
    // Check if ISBN already exists
    const existingBook = await this.prisma.book.findUnique({
      where: { isbn: createBookDto.isbn },
    });

    if (existingBook) {
      throw new ConflictException('Book with this ISBN already exists');
    }

    // Verify authors exist
    const authors = await this.prisma.author.findMany({
      where: { id: { in: createBookDto.authorIds } },
    });

    if (authors.length !== createBookDto.authorIds.length) {
      throw new BadRequestException('One or more authors not found');
    }

    // Verify category exists if provided
    if (createBookDto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: createBookDto.categoryId },
      });

      if (!category) {
        throw new BadRequestException('Category not found');
      }
    }

    const { authorIds, ...bookData } = createBookDto;

    // Create book and author relationships in transaction
    const book = await this.prisma.$transaction(async (prisma) => {
      // Create book
      const newBook = await prisma.book.create({
        data: bookData,
        include: {
          category: {
            select: { id: true, name: true },
          },
          authors: {
            include: {
              author: {
                select: { id: true, name: true },
              },
            },
          },
        },
      });

      // Create book-author relationships
      await Promise.all(
        authorIds.map((authorId) =>
          prisma.bookAuthor.create({
            data: {
              bookId: newBook.id,
              authorId,
            },
          }),
        ),
      );

      return newBook;
    });

    // Log the action
    await this.auditLogsService.createLog({
      action: AuditAction.CREATE_BOOK,
      entity: 'Book',
      entityId: book.id,
      userId: createdById,
      metadata: {
        title: book.title,
        isbn: book.isbn,
        authorIds,
      },
    });

    // Format response
    return {
      id: book.id,
      isbn: book.isbn,
      title: book.title,
      description: book.description,
      totalCopies: book.totalCopies,
      availableCopies: book.availableCopies,
      status: book.status,
      publishedYear: book.publishedYear,
      category: book.category,
      authors: book.authors.map((ba) => ba.author),
      createdAt: book.createdAt,
      updatedAt: book.updatedAt,
    };
  }

  // Get all books with advanced filtering
  async findAll(
    paginationOptions: PaginationOptions,
    filters?: {
      search?: string;
      categoryId?: string;
      authorId?: string;
      status?: BookStatus;
      availableOnly?: boolean;
    },
  ) {
    const { page, limit, skip } = calculatePagination(paginationOptions);

    // Build complex where clause
    const where: any = {};

    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { isbn: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters?.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters?.authorId) {
      where.authors = {
        some: { authorId: filters.authorId },
      };
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.availableOnly) {
      where.availableCopies = { gt: 0 };
      where.status = BookStatus.AVAILABLE;
    }

    // Execute queries
    const [books, total] = await Promise.all([
      this.prisma.book.findMany({
        where,
        skip,
        take: limit,
        include: {
          category: {
            select: { id: true, name: true },
          },
          authors: {
            include: {
              author: {
                select: { id: true, name: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.book.count({ where }),
    ]);

    // Format response
    const data = books.map((book) => ({
      id: book.id,
      isbn: book.isbn,
      title: book.title,
      description: book.description,
      totalCopies: book.totalCopies,
      availableCopies: book.availableCopies,
      status: book.status,
      publishedYear: book.publishedYear,
      category: book.category,
      authors: book.authors.map((ba) => ba.author),
      createdAt: book.createdAt,
      updatedAt: book.updatedAt,
    }));

    return createPaginationResult(data, total, page, limit);
  }

  // Additional methods: findOne, update, remove...
}
```

### 🔍 **Utility Functions**

#### `src/common/utils/pagination.util.ts` - Pagination Utilities
```typescript
export interface PaginationOptions {
  page?: number;                                        // Page number (1-based)
  limit?: number;                                       // Items per page
}

export interface PaginationResult<T> {
  data: T[];                                            // Array of items
  meta: {
    total: number;                                      // Total number of items
    page: number;                                       // Current page
    limit: number;                                      // Items per page
    totalPages: number;                                 // Total number of pages
    hasNextPage: boolean;                               // Has next page
    hasPreviousPage: boolean;                           // Has previous page
  };
}

// Calculate pagination parameters
export function calculatePagination(options: PaginationOptions) {
  const page = Math.max(1, options.page || 1);         // Ensure page >= 1
  const limit = Math.min(100, Math.max(1, options.limit || 10)); // Limit between 1-100
  const skip = (page - 1) * limit;                     // Calculate offset

  return { page, limit, skip };
}

// Create paginated result
export function createPaginationResult<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): PaginationResult<T> {
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
}
```

### 🚨 **Error Handling**

#### `src/common/filters/http-exception.filter.ts` - Exception Filters
```typescript
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

// Handle HTTP exceptions
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    const errorResponse: any = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: exception.message || 'Internal server error',
    };

    // Add validation errors if they exist
    const exceptionResponse = exception.getResponse();
    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const responseObj = exceptionResponse as any;
      if (responseObj.message && Array.isArray(responseObj.message)) {
        errorResponse.validationErrors = responseObj.message;
      }
    }

    response.status(status).json(errorResponse);
  }
}

// Handle all exceptions
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.message
        : 'Internal server error';

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
    });
  }
}
```

### 🏥 **Health Check Module**

#### `src/health/health.controller.ts` - Health Check Controller
```typescript
import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '@/prisma/prisma.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        database: { type: 'string', example: 'connected' },
        timestamp: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
      },
    },
  })
  async check() {
    try {
      // Test database connection
      await this.prisma.$queryRaw`SELECT 1`;
      
      return {
        status: 'ok',
        database: 'connected',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'error',
        database: 'disconnected',
        timestamp: new Date().toISOString(),
        error: error.message,
      };
    }
  }
}
```

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js 18+ installed
- PostgreSQL database running
- Git (optional)

### Installation Steps

1. **Clone/Download Project**
   ```bash
   git clone <repository-url>
   cd LMS
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. **Database Setup**
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   npx prisma db seed
   ```

5. **Start Application**
   ```bash
   npm run start:dev
   ```

### Available Scripts
- `npm run start:dev` - Development mode with hot reload
- `npm run start:prod` - Production mode
- `npm run build` - Build for production
- `npm run test` - Run tests
- `npx prisma studio` - Database admin interface

---

## 📖 API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### User Management
- `GET /api/users` - List users (Admin/Librarian)
- `POST /api/users` - Create user (Admin/Librarian)
- `GET /api/users/:id` - Get user details
- `PATCH /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (Admin only)

### Book Management
- `GET /api/books` - List books (All authenticated users)
- `POST /api/books` - Create book (Admin/Librarian)
- `GET /api/books/:id` - Get book details
- `PATCH /api/books/:id` - Update book (Admin/Librarian)
- `DELETE /api/books/:id` - Delete book (Admin/Librarian)

### Audit Logs
- `GET /api/audit-logs` - View audit logs (Admin/Librarian)

### Health Check
- `GET /api/health` - System health status

### Interactive Documentation
Visit `http://localhost:3000/api/docs` for complete interactive API documentation with Swagger UI.

### Default Test Users
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@library.com | admin123 |
| Librarian | librarian@library.com | librarian123 |
| Member | member@library.com | member123 |

---

## 🔧 Development Notes

### Code Organization
- **Modular Architecture**: Each feature is a separate module
- **Separation of Concerns**: Controllers handle HTTP, Services handle business logic
- **Type Safety**: Full TypeScript support with strict typing
- **Validation**: Input validation using class-validator
- **Security**: JWT authentication with role-based access control
- **Logging**: Comprehensive audit logging for all operations
- **Documentation**: Auto-generated API documentation

### Best Practices Implemented
- ✅ Clean Architecture principles
- ✅ SOLID principles
- ✅ Error handling and validation
- ✅ Security best practices
- ✅ Database transactions for data consistency
- ✅ Comprehensive logging and monitoring
- ✅ API documentation and testing support

This documentation provides a complete understanding of the Library Management System codebase, from high-level architecture to detailed code explanations.

