import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: ['query', 'info', 'warn', 'error'], // Log database queries so we can debug issues
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