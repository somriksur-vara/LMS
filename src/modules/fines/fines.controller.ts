import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { FinesService } from './fines.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { UpdateFineConfigDto, WaiveFineDto, RecordPaymentDto } from './dto';
import { Decimal } from '@prisma/client/runtime/library';

@ApiTags('Fines')
@Controller('fines')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class FinesController {
  constructor(private readonly finesService: FinesService) {}

  @Get('overdue')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @ApiOperation({
    summary: '📋 Get overdue books with fines',
    description: 'Retrieve all books that are overdue with calculated fine amounts. Only Admin and Librarian can access this.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number for pagination',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of items per page',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'List of overdue books with fine details',
    schema: {
      example: {
        data: [
          {
            id: 'issue_123',
            issueDate: '2024-01-01T00:00:00.000Z',
            expectedReturnDate: '2024-01-15T00:00:00.000Z',
            fineAmount: 50.00,
            overdueDays: 5,
            book: {
              title: 'Clean Code',
              isbn: '978-0132350884'
            },
            issuedTo: {
              firstName: 'John',
              lastName: 'Doe',
              email: 'john@example.com'
            }
          }
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1
        }
      }
    }
  })
  async getOverdueBooks(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    
    return this.finesService.getOverdueBooks(pageNum, limitNum);
  }

  @Post('calculate-all')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '🔄 Calculate fines for all active issues',
    description: 'Automatically calculate fines for all currently active book issues. This updates fine amounts based on overdue days.',
  })
  @ApiResponse({
    status: 200,
    description: 'Fine calculation completed successfully',
    schema: {
      example: {
        message: 'Fine calculation completed',
        updated: 5,
        totalFines: 250.00
      }
    }
  })
  async calculateAllFines() {
    const result = await this.finesService.calculateAllActiveFines();
    return {
      message: 'Fine calculation completed',
      ...result,
    };
  }

  @Get('issue/:issueId/calculate')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @ApiOperation({
    summary: '🧮 Calculate fine for specific issue',
    description: 'Calculate the fine amount for a specific book issue based on overdue days.',
  })
  @ApiParam({
    name: 'issueId',
    description: 'ID of the book issue',
    example: 'clr123abc456def789'
  })
  @ApiResponse({
    status: 200,
    description: 'Fine calculated successfully',
    schema: {
      example: {
        issueId: 'clr123abc456def789',
        fineAmount: 50.00
      }
    }
  })
  async calculateIssueFine(@Param('issueId') issueId: string) {
    const fineAmount = await this.finesService.calculateFine(issueId);
    return {
      issueId,
      fineAmount,
    };
  }

  @Get('user/:userId/outstanding')
  @ApiOperation({
    summary: '💳 Get user\'s outstanding fines',
    description: 'Get the total outstanding fine amount for a specific user.',
  })
  @ApiParam({
    name: 'userId',
    description: 'ID of the user',
    example: 'clr123abc456def789'
  })
  @ApiResponse({
    status: 200,
    description: 'User outstanding fines retrieved',
    schema: {
      example: {
        userId: 'clr123abc456def789',
        totalOutstandingFines: 75.00
      }
    }
  })
  async getUserOutstandingFines(@Param('userId') userId: string) {
    const totalFines = await this.finesService.getUserOutstandingFines(userId);
    return {
      userId,
      totalOutstandingFines: totalFines,
    };
  }

  @Get('user/my-fines')
  @ApiOperation({
    summary: '👤 Get my outstanding fines',
    description: 'Get your own outstanding fine amount. Available to all authenticated users.',
  })
  @ApiResponse({
    status: 200,
    description: 'Your outstanding fines retrieved',
    schema: {
      example: {
        userId: 'clr123abc456def789',
        totalOutstandingFines: 25.00
      }
    }
  })
  async getMyOutstandingFines(@CurrentUser() user: any) {
    const totalFines = await this.finesService.getUserOutstandingFines(user.id);
    return {
      userId: user.id,
      totalOutstandingFines: totalFines,
    };
  }

  @Post('issue/:issueId/waive')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '❌ Waive fine for an issue',
    description: 'Waive (cancel) the fine for a specific book issue. Requires Admin or Librarian role.',
  })
  @ApiParam({
    name: 'issueId',
    description: 'ID of the book issue',
    example: 'clr123abc456def789'
  })
  @ApiBody({
    description: 'Reason for waiving the fine',
    schema: {
      example: {
        waiveReason: 'Book was damaged when issued'
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Fine waived successfully',
    schema: {
      example: {
        message: 'Fine waived successfully',
        issueId: 'clr123abc456def789'
      }
    }
  })
  async waiveFine(
    @Param('issueId') issueId: string,
    @Body() waiveFineDto: WaiveFineDto,
    @CurrentUser() user: any,
  ) {
    await this.finesService.waiveFine(issueId, waiveFineDto.waiveReason, user.id);
    return {
      message: 'Fine waived successfully',
      issueId,
    };
  }

  @Post('issue/:issueId/payment')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '💰 Record fine payment',
    description: 'Record a payment for a fine. Can be full or partial payment.',
  })
  @ApiParam({
    name: 'issueId',
    description: 'ID of the book issue',
    example: 'clr123abc456def789'
  })
  @ApiBody({
    description: 'Payment details',
    schema: {
      example: {
        paidAmount: 50.00,
        paymentMethod: 'CASH'
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Payment recorded successfully',
    schema: {
      example: {
        message: 'Payment recorded successfully',
        issueId: 'clr123abc456def789',
        paidAmount: 50.00
      }
    }
  })
  async recordPayment(
    @Param('issueId') issueId: string,
    @Body() recordPaymentDto: RecordPaymentDto,
  ) {
    await this.finesService.recordFinePayment(
      issueId,
      new Decimal(recordPaymentDto.paidAmount),
      recordPaymentDto.paymentMethod,
    );
    return {
      message: 'Payment recorded successfully',
      issueId,
      paidAmount: recordPaymentDto.paidAmount,
    };
  }

  @Get('configuration')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @ApiOperation({
    summary: '⚙️ Get fine configuration',
    description: 'Get current fine calculation settings (daily rate, maximum amount, grace period).',
  })
  @ApiResponse({
    status: 200,
    description: 'Fine configuration retrieved',
    schema: {
      example: {
        id: 'default-config',
        finePerDay: 10.00,
        maxFineAmount: 1000.00,
        gracePeriodDays: 1,
        isActive: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      }
    }
  })
  async getFineConfiguration() {
    return this.finesService.getFineConfiguration();
  }

  @Put('configuration')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: '🔧 Update fine configuration',
    description: 'Update fine calculation settings. Only Admin can modify these settings.',
  })
  @ApiBody({
    description: 'New fine configuration settings',
    schema: {
      example: {
        finePerDay: 15.00,
        maxFineAmount: 1500.00,
        gracePeriodDays: 2
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Fine configuration updated successfully',
    schema: {
      example: {
        message: 'Fine configuration updated successfully',
        configuration: {
          id: 'new-config-id',
          finePerDay: 15.00,
          maxFineAmount: 1500.00,
          gracePeriodDays: 2,
          isActive: true,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        }
      }
    }
  })
  async updateFineConfiguration(
    @Body() updateFineConfigDto: UpdateFineConfigDto,
    @CurrentUser() user: any,
  ) {
    const config = await this.finesService.updateFineConfiguration(
      updateFineConfigDto.finePerDay,
      updateFineConfigDto.maxFineAmount,
      updateFineConfigDto.gracePeriodDays,
      user.id,
    );
    return {
      message: 'Fine configuration updated successfully',
      configuration: config,
    };
  }

  @Post('test/create-overdue-sample')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '🧪 Create sample overdue issues for testing',
    description: `
      **FOR TESTING ONLY**: Creates sample overdue book issues so you can test the fine system.
      
      This will:
      1. Find available books and users
      2. Create issues with past due dates
      3. Calculate fines automatically
      
      **Use this to test:**
      - GET /fines/overdue
      - POST /fines/calculate-all
      - GET /fines/user/my-fines
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Sample overdue issues created successfully',
    schema: {
      example: {
        message: 'Sample overdue issues created for testing',
        created: 3,
        totalFines: 150.00
      }
    }
  })
  async createOverdueSample(@CurrentUser() user: any) {
    // This is a test helper method
    const result = await this.finesService.createSampleOverdueIssues(user.id);
    return {
      message: 'Sample overdue issues created for testing',
      ...result,
    };
  }
}