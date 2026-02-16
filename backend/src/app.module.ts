import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';


import { appConfig, databaseConfig, jwtConfig } from './config';


import { PrismaModule } from './prisma/prisma.module';


import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { BooksModule } from './modules/books/books.module';
import { IssuesModule } from './modules/issues/issues.module';
import { FinesModule } from './modules/fines/fines.module';

import { HealthModule } from './health/health.module';


import { HttpExceptionFilter, AllExceptionsFilter } from './common/filters';

@Module({
  imports: [

    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig],
      envFilePath: ['.env.local', '.env'],
    }),


    PrismaModule,


    AuthModule,
    UsersModule,
    BooksModule,
    IssuesModule,
    FinesModule,
    HealthModule,
  ],
  providers: [

    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}