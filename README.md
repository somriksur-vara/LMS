# Library Management System - Complete Documentation

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Key Features](#key-features)
3. [Project Structure](#project-structure)
4. [Architecture & Workflow](#architecture--workflow)
5. [Database Schema](#database-schema)
6. [File-by-File Code Explanation](#file-by-file-code-explanation)
7. [Fine Management System](#fine-management-system)
8. [API Documentation](#api-documentation)
9. [Setup Instructions](#setup-instructions)
10. [Testing Guide](#testing-guide)

## 🎯 Project Overview

This is a **Production-Ready Library Management System** built with modern technologies and best practices:

- **Backend**: NestJS (Node.js framework with TypeScript)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT-based with role-based access control
- **Documentation**: Interactive Swagger/OpenAPI
- **Deployment**: Docker & Docker Compose support
- **Currency**: Indian Rupees (₹) for fine calculations
- **Architecture**: Modular, scalable, and maintainable

## 🚀 Key Features

### 👥 **Multi-role Authentication System**
- **Admin**: Full system access, user management, configuration
- **Librarian**: Book and user management, fine operations
- **Member**: Read-only access, view personal information

### 📚 **Comprehensive Book Management**
- Complete CRUD operations with validation
- ISBN validation and duplicate prevention
- Author and category relationships
- Availability tracking and status management
- Advanced search and filtering capabilities

### 💰 **Advanced Fine Management System**
- **Automated fine calculation** based on overdue days
- **Configurable rates**: Daily fine amount, maximum limits, grace periods
- **Indian Rupee support**: ₹10/day default, ₹1000 maximum
- **Payment tracking**: Multiple payment methods (Cash, Card, Online, Bank Transfer)
- **Fine waiving**: Admin/Librarian can waive fines with reasons
- **Automated cron jobs**: Daily fine calculations and status updates

### 📊 **Comprehensive Audit System**
- Track all user activities and system changes
- Detailed logging for compliance and monitoring
- Fine-related audit trails (calculations, payments, waivers)
- User login/logout tracking

### 🔍 **Advanced Search & Filtering**
- Search books by title, author, ISBN, category
- Filter by availability, status, publication year
- Pagination support for large datasets
- Role-based data access control

### 📖 **Interactive API Documentation**
- Complete Swagger/OpenAPI documentation
- Step-by-step testing guide with examples
- Default test credentials for all roles
- Real-time API testing interface

---

## 🏗️ Project Structure

```
LMS/
├── 📁 src/                          # Source code directory
│   ├── 📁 common/                   # Shared utilities and components
│   │   ├── 📁 decorators/           # Custom decorators (@CurrentUser, @Roles)
│   │   ├── 📁 enums/                # Enum definitions (UserRole, BookStatus, etc.)
│   │   ├── 📁 filters/              # Exception filters (Global error handling)
│   │   ├── 📁 guards/               # Authentication guards (JWT, Roles)
│   │   └── 📁 utils/                # Utility functions (Pagination)
│   ├── 📁 config/                   # Configuration files
│   │   ├── 📄 app.config.ts         # Application settings
│   │   ├── 📄 database.config.ts    # Database connection
│   │   └── 📄 jwt.config.ts         # JWT configuration
│   ├── 📁 health/                   # Health check module
│   ├── 📁 modules/                  # Feature modules
│   │   ├── 📁 auth/                 # Authentication & authorization
│   │   ├── 📁 users/                # User management
│   │   ├── 📁 books/                # Book catalog management
│   │   ├── 📁 categories/           # Book categories
│   │   ├── 📁 issues/               # Book issue/return operations
│   │   ├── 📁 fines/                # Fine calculation & management
│   │   └── 📁 audit-logs/           # Activity tracking
│   ├── 📁 prisma/                   # Prisma service
│   ├── 📄 app.module.ts             # Root application module
│   └── 📄 main.ts                   # Application entry point
├── 📁 prisma/                       # Database schema and migrations
│   ├── 📄 schema.prisma             # Database schema definition
│   ├── 📄 seed.ts                   # Database seeding script
│   └── 📁 migrations/               # Database migration files
├── 📄 package.json                  # Dependencies and scripts
├── 📄 tsconfig.json                 # TypeScript configuration
├── 📄 Dockerfile                    # Docker configuration
├── 📄 docker-compose.yml            # Multi-container setup
└── 📄 .env                          # Environment variables
```

---

## 🔄 Architecture & Workflow

### 1. **Application Startup Flow**
```
main.ts → app.module.ts → Feature Modules → Database Connection → Swagger Setup → Server Start
```

### 2. **Request Processing Flow**
```
HTTP Request → CORS → Global Validation → Guards (Auth/Roles) → Controller → Service → Database → Response
```

### 3. **Authentication Flow**
```
Login Request → Validate Credentials → Generate JWT → Return Token → Use Token for Protected Routes
```

### 4. **Fine Calculation Flow**
```
Cron Job (Daily 2AM) → Get Active Issues → Calculate Overdue Days → Apply Grace Period → Calculate Fine → Update Database
```

### 5. **Database Flow**
```
Prisma Schema → Migrations → Prisma Client → Service Layer → Database Operations → Audit Logging
```

---

## 🗄️ Database Schema

### **Core Models**

#### **User Model**
```prisma
model User {
  id              String     @id @default(cuid())
  email           String     @unique
  password        String     // Hashed with bcryptjs
  firstName       String
  lastName        String
  role            UserRole   @default(MEMBER)
  isActive        Boolean    @default(true)
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt
  
  // Relations
  auditLogs       AuditLog[]
  issuedBooks     Issue[]    @relation("IssuedToUser")
  processedIssues Issue[]    @relation("ProcessedByUser")
}
```

#### **Book Model**
```prisma
model Book {
  id              String       @id @default(cuid())
  isbn            String       @unique
  title           String
  description     String?
  totalCopies     Int          @default(1)
  availableCopies Int          @default(1)
  status          BookStatus   @default(AVAILABLE)
  publishedYear   Int?
  categoryId      String?
  
  // Relations
  authors         BookAuthor[]
  category        Category?
  issues          Issue[]
}
```

#### **Issue Model (Book Lending)**
```prisma
model Issue {
  id                 String      @id @default(cuid())
  issueDate          DateTime    @default(now())
  expectedReturnDate DateTime
  actualReturnDate   DateTime?
  fineAmount         Decimal     @default(0) @db.Decimal(10, 2)
  status             IssueStatus @default(ACTIVE)
  notes              String?
  
  // Relations
  book               Book
  issuedTo           User
  processedBy        User
}
```

#### **FineConfiguration Model**
```prisma
model FineConfiguration {
  id                    String   @id @default(cuid())
  finePerDay            Decimal  @default(10.00) @db.Decimal(10, 2)  // ₹10/day
  maxFineAmount         Decimal  @default(1000.00) @db.Decimal(10, 2) // ₹1000 max
  gracePeriodDays       Int      @default(1)
  isActive              Boolean  @default(true)
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}
```

### **Enums**
```prisma
enum UserRole {
  ADMIN      // Full system access
  LIBRARIAN  // Book and user management
  MEMBER     // Read-only access
}

enum BookStatus {
  AVAILABLE   // Available for checkout
  ISSUED      // Currently issued
  MAINTENANCE // Under maintenance
  LOST        // Lost book
}

enum IssueStatus {
  ACTIVE      // Currently issued
  RETURNED    // Book returned
  OVERDUE     // Past due date
}
```

---

## 📝 File-by-File Code Explanation

### 🚀 **Entry Point Files**

#### `src/main.ts` - Application Bootstrap
The heart of our application where everything starts up and gets configured.

```typescript
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
    `)
    .setVersion('1.0.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      name: 'JWT',
      description: 'Enter JWT token',
      in: 'header',
    }, 'JWT-auth')
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
```

**Key Features:**
- **Global Validation**: Automatically validates all incoming requests
- **CORS Support**: Allows frontend applications to connect
- **Swagger Documentation**: Interactive API documentation
- **Environment Configuration**: Flexible configuration management
- **Error Handling**: Graceful startup error handling

#### `src/app.module.ts` - Root Application Module
The main control center that brings together all parts of our application.

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';

// Our configuration files that define app settings
import { appConfig, databaseConfig, jwtConfig } from './config';

// Our database module that handles all data operations
import { PrismaModule } from './prisma/prisma.module';

// All the different parts of our application
import { AuthModule } from './modules/auth/auth.module';           // Handles login/logout
import { UsersModule } from './modules/users/users.module';        // Manages user accounts
import { BooksModule } from './modules/books/books.module';        // Manages the book catalog
import { CategoriesModule } from './modules/categories/categories.module'; // Manages book categories
import { IssuesModule } from './modules/issues/issues.module';     // Handles book issue/return operations
import { FinesModule } from './modules/fines/fines.module';        // Handles fine calculations and payments
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';  // Tracks user activities
import { HealthModule } from './health/health.module';             // Provides health checks

// Error handling that works across the entire app
import { HttpExceptionFilter, AllExceptionsFilter } from './common/filters';

@Module({
  imports: [
    // Set up configuration that every part of the app can access
    ConfigModule.forRoot({
      isGlobal: true, // Make config available everywhere
      load: [appConfig, databaseConfig, jwtConfig], // Load our config files
      envFilePath: ['.env.local', '.env'], // Look for environment files in this order
    }),

    // Include our database module so everyone can access the database
    PrismaModule,

    // Include all our feature modules
    AuthModule,        // User authentication and authorization
    UsersModule,       // User management operations
    BooksModule,       // Book catalog management
    CategoriesModule,  // Book category management
    IssuesModule,      // Book issue and return operations
    FinesModule,       // Fine calculations and payment management
    AuditLogsModule,   // Activity tracking and logging
    HealthModule,      // Health check endpoints
  ],
  providers: [
    // Set up global error handlers that catch problems anywhere in the app
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter, // Catches any unexpected errors
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter, // Handles known HTTP errors nicely
    },
  ],
})
export class AppModule {}
```

**Key Features:**
- **Global Configuration**: Environment variables accessible everywhere
- **Modular Architecture**: Each feature is a separate module
- **Global Error Handling**: Consistent error responses
- **Database Integration**: Prisma ORM for database operations

### ⚙️ **Configuration Files**

#### `src/config/app.config.ts` - Application Configuration
```typescript
import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT || '3000', 10),        // Server port
  environment: process.env.NODE_ENV || 'development',    // Environment
  apiPrefix: process.env.API_PREFIX || 'api',            // API route prefix
}));
```

#### `src/config/database.config.ts` - Database Configuration
```typescript
import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  url: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/library_db',
}));
```

#### `src/config/jwt.config.ts` - JWT Configuration
```typescript
import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
  expiresIn: process.env.JWT_EXPIRES_IN || '24h',
}));
```

### 🗄️ **Database Layer**

#### `src/prisma/prisma.service.ts` - Database Service
```typescript
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: ['query', 'info', 'warn', 'error'], // Log database queries for debugging
    });
  }

  // Connect to the database when our app starts up
  async onModuleInit() {
    await this.$connect();
  }

  // Disconnect gracefully when the app shuts down
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

**Key Features:**
- **Connection Management**: Automatic connect/disconnect
- **Query Logging**: Debug database operations
- **Lifecycle Hooks**: Proper startup and shutdown handling

### 🔐 **Authentication Module**

#### `src/modules/auth/auth.service.ts` - Authentication Service
```typescript
@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private auditLogsService: AuditLogsService,
  ) {}

  // Validate user credentials
  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true, email: true, password: true,
        firstName: true, lastName: true, role: true, isActive: true,
      },
    });

    if (!user || !user.isActive) return null;

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return null;

    const { password: _, ...result } = user;
    return result;
  }

  // Handle user login and create JWT token
  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    // Log the login activity
    await this.auditLogsService.createLog({
      action: AuditAction.USER_LOGIN,
      entity: 'users',
      entityId: user.id,
      userId: user.id,
      metadata: { email: user.email, loginTime: new Date().toISOString() },
    });

    return {
      accessToken,
      user: {
        id: user.id, email: user.email,
        firstName: user.firstName, lastName: user.lastName, role: user.role,
      },
    };
  }
}
```

**Key Features:**
- **Password Hashing**: Secure password storage with bcryptjs
- **JWT Token Generation**: Stateless authentication
- **Audit Logging**: Track all authentication activities
- **Role-based Access**: Different user roles with different permissions

---

## 💰 Fine Management System

### **Overview**
The Fine Management System is a comprehensive solution for handling overdue book fines with automated calculations, payment tracking, and administrative controls.

### **Core Components**

#### **1. Fine Configuration**
```typescript
// Configurable fine settings
{
  finePerDay: 10.00,        // ₹10 per day (Indian Rupees)
  maxFineAmount: 1000.00,   // ₹1000 maximum fine
  gracePeriodDays: 1,       // 1 day grace period
  isActive: true            // Configuration status
}
```

#### **2. Fine Calculation Logic**
```typescript
// Automatic fine calculation
const overdueDays = Math.max(0, currentDate - expectedReturnDate);
const effectiveOverdueDays = Math.max(0, overdueDays - gracePeriodDays);
const fineAmount = Math.min(effectiveOverdueDays * finePerDay, maxFineAmount);
```

#### **3. Automated Cron Jobs**
```typescript
// Daily fine calculation at 2:00 AM
@Cron(CronExpression.EVERY_DAY_AT_2AM)
async calculateDailyFines() {
  const result = await this.finesService.calculateAllActiveFines();
  this.logger.log(`Updated ${result.updated} issues, total fines: ₹${result.totalFines}`);
}

// Hourly status updates
@Cron(CronExpression.EVERY_HOUR)
async updateOverdueStatus() {
  await this.prisma.issue.updateMany({
    where: { status: 'ACTIVE', expectedReturnDate: { lt: new Date() } },
    data: { status: 'OVERDUE' },
  });
}
```

### **Fine Management Features**

#### **1. Fine Calculation**
- **Automatic calculation** based on overdue days
- **Grace period support** (default: 1 day)
- **Maximum fine limits** to prevent excessive charges
- **Real-time updates** when books are returned

#### **2. Payment Management**
- **Multiple payment methods**: Cash, Card, Online, Bank Transfer
- **Partial payment support** for large fines
- **Payment history tracking** with audit logs
- **Receipt generation** with payment details

#### **3. Administrative Controls**
- **Fine waiving** with reason tracking
- **Configuration management** (Admin only)
- **Overdue book reports** with fine details
- **User outstanding balance** tracking

#### **4. API Endpoints**
```typescript
// Fine Management Endpoints
GET    /fines/overdue                    // Get overdue books with fines
POST   /fines/calculate-all              // Calculate fines for all active issues
GET    /fines/issue/:id/calculate        // Calculate fine for specific issue
GET    /fines/user/:id/outstanding       // Get user's outstanding fines
GET    /fines/user/my-fines              // Get current user's fines
POST   /fines/issue/:id/waive            // Waive fine (admin/librarian)
POST   /fines/issue/:id/payment          // Record fine payment
GET    /fines/configuration              // Get fine configuration
PUT    /fines/configuration              // Update fine configuration (admin)
POST   /fines/test/create-overdue-sample // Create test data for development
```

### **Example Fine Calculation**
```
Book due: January 1st, 2024
Current date: January 10th, 2024
Grace period: 1 day
Fine per day: ₹10.00
Max fine: ₹1000.00

Calculation:
- Overdue days: 9 days
- Effective overdue days: 9 - 1 = 8 days
- Fine amount: 8 × ₹10.00 = ₹80.00
```

---

## 📖 API Documentation

### **Swagger UI Features**
- **Interactive testing interface** at `/api/docs`
- **Step-by-step authentication guide**
- **Default test credentials** for all user roles
- **Real-time API testing** with example requests/responses
- **Comprehensive endpoint documentation** with Indian Rupee examples

### **Authentication Workflow**
1. **Login**: `POST /api/auth/login` with test credentials
2. **Get Token**: Copy `accessToken` from response
3. **Authorize**: Click 🔒 button and paste `Bearer YOUR_TOKEN`
4. **Test APIs**: All protected endpoints now accessible

### **Default Test Users**
```
Admin:     admin@library.com     / admin123
Librarian: librarian@library.com / librarian123
Member:    member@library.com    / member123
```

### **API Endpoints Overview**

#### **Authentication** 🔐
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout

#### **Users** 👥
- `GET /users` - List all users (Admin/Librarian)
- `POST /users` - Create new user (Admin)
- `GET /users/:id` - Get user details
- `PUT /users/:id` - Update user (Admin)
- `DELETE /users/:id` - Delete user (Admin)

#### **Books** 📚
- `GET /books` - List all books with search/filter
- `POST /books` - Add new book (Admin/Librarian)
- `GET /books/:id` - Get book details
- `PUT /books/:id` - Update book (Admin/Librarian)
- `DELETE /books/:id` - Delete book (Admin/Librarian)

#### **Categories** 📂
- `GET /categories` - List all categories
- `POST /categories` - Create category (Admin/Librarian)
- `PUT /categories/:id` - Update category (Admin/Librarian)
- `DELETE /categories/:id` - Delete category (Admin/Librarian)

#### **Issues** 📖
- `GET /issues` - List book issues with filters
- `POST /issues` - Issue book to user (Admin/Librarian)
- `GET /issues/:id` - Get issue details
- `POST /issues/:id/return` - Return book (Admin/Librarian)
- `PUT /issues/:id` - Update issue (Admin/Librarian)

#### **Fines** 💰
- `GET /fines/overdue` - Get overdue books with fines
- `POST /fines/calculate-all` - Calculate all fines
- `GET /fines/user/my-fines` - Get personal outstanding fines
- `POST /fines/issue/:id/payment` - Record fine payment
- `POST /fines/issue/:id/waive` - Waive fine (Admin/Librarian)
- `GET /fines/configuration` - Get fine settings
- `PUT /fines/configuration` - Update fine settings (Admin)

#### **Audit Logs** 📋
- `GET /audit-logs` - View system activity logs (Admin/Librarian)

#### **Health** ❤️
- `GET /health` - System health check

---

## 🛠️ Setup Instructions

### **Prerequisites**
- Node.js 18+ and npm
- PostgreSQL 12+
- Docker & Docker Compose (optional)

### **1. Clone Repository**
```bash
git clone https://github.com/somriksur-vara/LMS.git
cd LMS
```

### **2. Install Dependencies**
```bash
npm install
```

### **3. Environment Setup**
```bash
# Copy environment file
cp .env.example .env

# Update .env with your settings
DATABASE_URL="postgresql://postgres:password@localhost:5432/library_db"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="24h"
PORT=3000
```

### **4. Database Setup**
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed database with sample data
npx prisma db seed
```

### **5. Start Application**
```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

### **6. Docker Setup (Alternative)**
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f api
```

### **7. Access Application**
- **API**: http://localhost:3000/api
- **Swagger Documentation**: http://localhost:3000/api/docs
- **Database Studio**: `npx prisma studio`

---

## 🧪 Testing Guide

### **1. API Testing with Swagger**
1. Open http://localhost:3000/api/docs
2. Click on **Authentication** section
3. Use `POST /auth/login` with test credentials:
   ```json
   {
     "email": "admin@library.com",
     "password": "admin123"
   }
   ```
4. Copy the `accessToken` from response
5. Click 🔒 **Authorize** button at top
6. Enter: `Bearer YOUR_ACCESS_TOKEN`
7. Now test any protected endpoint!

### **2. Fine System Testing**
1. **Login as Admin/Librarian**
2. **Create test data**: `POST /fines/test/create-overdue-sample`
3. **View overdue books**: `GET /fines/overdue`
4. **Calculate fines**: `POST /fines/calculate-all`
5. **Check personal fines**: `GET /fines/user/my-fines`
6. **Record payment**: `POST /fines/issue/{id}/payment`
7. **Waive fine**: `POST /fines/issue/{id}/waive`

### **3. User Role Testing**
- **Admin**: Test user management, fine configuration
- **Librarian**: Test book management, fine operations
- **Member**: Test read-only access, personal data

### **4. Database Testing**
```bash
# Access database directly
npx prisma studio

# Reset database
npx prisma migrate reset

# Check database status
npx prisma db pull
```

---

## 🚀 Production Deployment

### **Environment Variables**
```bash
NODE_ENV=production
DATABASE_URL="your-production-database-url"
JWT_SECRET="your-production-jwt-secret"
PORT=3000
CORS_ORIGIN="https://your-frontend-domain.com"
```

### **Docker Production**
```bash
# Build production image
docker build -t lms-api .

# Run with production settings
docker run -p 3000:3000 --env-file .env.production lms-api
```

### **Health Monitoring**
- **Health Check**: `GET /api/health`
- **Database Status**: Included in health check
- **Application Logs**: Structured logging with timestamps

---

## 📚 Additional Resources

### **Technologies Used**
- **NestJS**: Progressive Node.js framework
- **Prisma**: Next-generation ORM
- **PostgreSQL**: Reliable relational database
- **JWT**: Stateless authentication
- **Swagger**: API documentation
- **Docker**: Containerization
- **TypeScript**: Type-safe development

### **Best Practices Implemented**
- **Modular Architecture**: Separation of concerns
- **Role-based Access Control**: Security by design
- **Input Validation**: Data integrity
- **Error Handling**: Graceful error responses
- **Audit Logging**: Compliance and monitoring
- **API Documentation**: Developer-friendly docs
- **Database Migrations**: Version-controlled schema changes
- **Environment Configuration**: Flexible deployment

### **Security Features**
- **Password Hashing**: bcryptjs for secure storage
- **JWT Authentication**: Stateless and secure
- **Role-based Authorization**: Granular permissions
- **Input Sanitization**: Prevent injection attacks
- **CORS Configuration**: Cross-origin security
- **Audit Trails**: Complete activity tracking

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Check the API documentation at `/api/docs`
- Review the code examples in this README

---

**Built with ❤️ using NestJS, Prisma, and PostgreSQL**