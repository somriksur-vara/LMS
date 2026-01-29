import { ApiProperty } from '@nestjs/swagger';
import { AuditAction } from '@/common/enums';

export class AuditLogResponseDto {
  @ApiProperty({
    description: 'Audit log ID',
    example: 'clp123456789',
  })
  id: string;

  @ApiProperty({
    description: 'Action performed',
    enum: AuditAction,
    example: AuditAction.CREATE_BOOK,
  })
  action: AuditAction;

  @ApiProperty({
    description: 'Entity type affected',
    example: 'books',
  })
  entity: string;

  @ApiProperty({
    description: 'ID of the affected entity',
    example: 'book123',
  })
  entityId: string;

  @ApiProperty({
    description: 'Additional metadata',
    example: { title: 'Clean Code', isbn: '978-0132350884' },
    required: false,
  })
  metadata?: Record<string, any>;

  @ApiProperty({
    description: 'Timestamp of the action',
    example: '2024-01-01T12:00:00.000Z',
  })
  timestamp: Date;

  @ApiProperty({
    description: 'User who performed the action',
  })
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}