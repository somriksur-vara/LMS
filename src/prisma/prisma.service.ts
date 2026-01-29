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

  // Helper method to wipe the database clean (only for development/testing!)
  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') return; // Never do this in production

    // Get all our database table names
    const models = Reflect.ownKeys(this).filter((key) => typeof key === 'string' && key[0] !== '_');

    // Delete everything from every table
    return Promise.all(
      models.map((modelKey) => (this as any)[modelKey].deleteMany()),
    );
  }
}