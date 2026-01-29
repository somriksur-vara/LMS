import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateAuditLogDto, AuditLogResponseDto } from './dto/index';
import { PaginationOptions, calculatePagination, createPaginationResult } from '@/common/utils';
import { AuditAction } from '@/common/enums';

@Injectable()
export class AuditLogsService {
  constructor(private prisma: PrismaService) {}

  async createLog(createAuditLogDto: CreateAuditLogDto): Promise<void> {
    await this.prisma.auditLog.create({
      data: createAuditLogDto,
    });
  }

  async findAll(
    paginationOptions: PaginationOptions,
    filters?: {
      action?: AuditAction;
      entity?: string;
      userId?: string;
      startDate?: Date;
      endDate?: Date;
    },
  ) {
    const { page, limit, skip } = calculatePagination(paginationOptions);

    const where: any = {};

    if (filters?.action) {
      where.action = filters.action;
    }

    if (filters?.entity) {
      where.entity = filters.entity;
    }

    if (filters?.userId) {
      where.userId = filters.userId;
    }

    if (filters?.startDate || filters?.endDate) {
      where.timestamp = {};
      if (filters.startDate) {
        where.timestamp.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.timestamp.lte = filters.endDate;
      }
    }

    const [auditLogs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { timestamp: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    const mappedLogs = auditLogs.map((log) => ({
      id: log.id,
      action: log.action,
      entity: log.entity,
      entityId: log.entityId,
      metadata: log.metadata as Record<string, any>,
      timestamp: log.timestamp,
      user: log.user,
    }));

    return createPaginationResult(mappedLogs, total, page, limit);
  }

  async findByEntity(entityType: string, entityId: string) {
    const auditLogs = await this.prisma.auditLog.findMany({
      where: {
        entity: entityType,
        entityId: entityId,
      },
      orderBy: { timestamp: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    return auditLogs.map((log) => ({
      id: log.id,
      action: log.action,
      entity: log.entity,
      entityId: log.entityId,
      metadata: log.metadata as Record<string, any>,
      timestamp: log.timestamp,
      user: log.user,
    }));
  }
}