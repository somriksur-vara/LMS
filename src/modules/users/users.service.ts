import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { CreateUserDto, UpdateUserDto, UserResponseDto } from './dto/index';
import { PaginationOptions, calculatePagination, createPaginationResult } from '@/common/utils';
import { AuditAction, UserRole } from '@/common/enums';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private auditLogsService: AuditLogsService,
  ) {}

  async create(
    createUserDto: CreateUserDto,
    createdById: string,
  ): Promise<UserResponseDto> {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        ...createUserDto,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Log the creation
    await this.auditLogsService.createLog({
      action: AuditAction.CREATE_USER,
      entity: 'users',
      entityId: user.id,
      userId: createdById,
      metadata: {
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });

    return user;
  }

  async findAll(
    paginationOptions: PaginationOptions,
    filters?: {
      role?: UserRole;
      isActive?: boolean;
      search?: string;
    },
  ) {
    const { page, limit, skip } = calculatePagination(paginationOptions);

    const where: any = {};

    if (filters?.role) {
      where.role = filters.role;
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return createPaginationResult(users, total, page, limit);
  }

  async findOne(id: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    updatedById: string,
    updaterRole: UserRole,
  ): Promise<UserResponseDto> {
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    // Only admins can change roles or update other admins
    if (updateUserDto.role && updaterRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can change user roles');
    }

    if (existingUser.role === UserRole.ADMIN && updaterRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can update admin users');
    }

    // Check email uniqueness if email is being updated
    if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
      const emailExists = await this.prisma.user.findUnique({
        where: { email: updateUserDto.email },
      });

      if (emailExists) {
        throw new ConflictException('User with this email already exists');
      }
    }

    // Hash password if provided
    const updateData: any = { ...updateUserDto };
    if (updateUserDto.password) {
      updateData.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Log the update
    await this.auditLogsService.createLog({
      action: AuditAction.UPDATE_USER,
      entity: 'users',
      entityId: user.id,
      userId: updatedById,
      metadata: {
        updatedFields: Object.keys(updateUserDto),
        previousEmail: existingUser.email,
        newEmail: user.email,
        previousRole: existingUser.role,
        newRole: user.role,
      },
    });

    return user;
  }

  async remove(id: string, deletedById: string, deleterRole: UserRole): Promise<void> {
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    // Only admins can delete users, and admins can only be deleted by other admins
    if (deleterRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can delete users');
    }

    if (existingUser.role === UserRole.ADMIN && deleterRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can delete admin users');
    }

    // Prevent self-deletion
    if (id === deletedById) {
      throw new ForbiddenException('Cannot delete your own account');
    }

    await this.prisma.user.delete({
      where: { id },
    });

    // Log the deletion
    await this.auditLogsService.createLog({
      action: AuditAction.DELETE_USER,
      entity: 'users',
      entityId: id,
      userId: deletedById,
      metadata: {
        deletedEmail: existingUser.email,
        deletedRole: existingUser.role,
        deletedName: `${existingUser.firstName} ${existingUser.lastName}`,
      },
    });
  }
}