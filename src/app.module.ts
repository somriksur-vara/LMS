import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';

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