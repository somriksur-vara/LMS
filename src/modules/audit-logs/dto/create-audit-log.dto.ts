import { AuditAction } from '@/common/enums';

export class CreateAuditLogDto {
  action: AuditAction;
  entity: string;
  entityId: string;
  userId: string;
  metadata?: Record<string, any>;
}