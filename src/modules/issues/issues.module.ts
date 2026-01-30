import { Module } from '@nestjs/common';
import { IssuesController } from './issues.controller';
import { IssuesService } from './issues.service';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { FinesModule } from '../fines/fines.module';

@Module({
  imports: [AuditLogsModule, FinesModule],
  controllers: [IssuesController],
  providers: [IssuesService],
  exports: [IssuesService],
})
export class IssuesModule {}