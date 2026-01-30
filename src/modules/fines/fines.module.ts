import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { FinesController } from './fines.controller';
import { FinesService } from './fines.service';
import { FinesCronService } from './fines-cron.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule, ScheduleModule.forRoot()],
  controllers: [FinesController],
  providers: [FinesService, FinesCronService],
  exports: [FinesService],
})
export class FinesModule {}