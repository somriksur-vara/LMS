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
    description: 'Overdue books retrieved successfully',
    schema: {
      example: {
        success: true,
        message: 'Found 2 overdue books',
        data: [
          {
            id: 'issue_123',
            bookTitle: 'Clean Code',
            userName: 'John Doe',
            userEmail: 'john@example.com',
            daysOverdue: 5,
            fineAmount: 50.00,
            issueDate: '2024-01-01',
            dueDate: '2024-01-15'
          }
        ],
        pagination: {
          page: 1,
          total: 2,
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
    
    const result = await this.finesService.getOverdueBooks(pageNum, limitNum);
    
    return {
      success: true,
      message: `Found ${result.data.length} overdue book(s)`,
      data: result.data.map(issue => ({
        id: issue.id,
        bookTitle: issue.book.title,
        userName: `${issue.issuedTo.firstName} ${issue.issuedTo.lastName}`,
        userEmail: issue.issuedTo.email,
        daysOverdue: issue.overdueDays,
        fineAmount: Number(issue.fineAmount),
        issueDate: issue.issueDate.toISOString().split('T')[0],
        dueDate: issue.expectedReturnDate.toISOString().split('T')[0]
      })),
      pagination: {
        page: result.pagination.page,
        total: result.pagination.total,
        totalPages: result.pagination.totalPages
      }
    };
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
        success: true,
        message: 'Calculated fines for all overdue books',
        data: {
          booksUpdated: 5,
          totalFines: 250.00
        }
      }
    }
  })
  async calculateAllFines() {
    const result = await this.finesService.calculateAllActiveFines();
    return {
      success: true,
      message: 'Calculated fines for all overdue books',
      data: {
        booksUpdated: result.updated,
        totalFines: result.totalFines,
      }
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
        success: true,
        message: 'Fine calculated for this book',
        data: {
          issueId: 'clr123abc456def789',
          fineAmount: 50.00,
          daysOverdue: 5
        }
      }
    }
  })
  async calculateIssueFine(@Param('issueId') issueId: string) {
    const fineAmount = await this.finesService.calculateFine(issueId);
    const overdueDays = Math.ceil((new Date().getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return {
      success: true,
      message: 'Fine calculated for this book',
      data: {
        issueId,
        fineAmount,
        daysOverdue: Math.max(0, overdueDays),
      }
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
    description: 'Outstanding fines retrieved successfully',
    schema: {
      example: {
        success: true,
        message: 'User has outstanding fines',
        data: {
          userId: 'clr123abc456def789',
          totalFines: 75.00,
          overdueBooks: 2
        }
      }
    }
  })
  async getUserOutstandingFines(@Param('userId') userId: string) {
    const totalFines = await this.finesService.getUserOutstandingFines(userId);
    const fineAmount = Number(totalFines);
    return {
      success: true,
      message: fineAmount > 0 ? 'User has outstanding fines' : 'No outstanding fines',
      data: {
        userId,
        totalFines: fineAmount,
        overdueBooks: fineAmount > 0 ? Math.ceil(fineAmount / 10) : 0,
      }
    };
  }

  @Get('user/my-fines')
  @ApiOperation({
    summary: '👤 Get my outstanding fines',
    description: 'Get your own outstanding fine amount. Available to all authenticated users.',
  })
  @ApiResponse({
    status: 200,
    description: 'Your outstanding fines retrieved successfully',
    schema: {
      example: {
        success: true,
        message: 'Your current outstanding fines',
        data: {
          totalFines: 25.00,
          overdueBooks: 1,
          details: 'You have 1 overdue book with ₹25 fine'
        }
      }
    }
  })
  async getMyOutstandingFines(@CurrentUser() user: any) {
    const totalFines = await this.finesService.getUserOutstandingFines(user.id);
    const fineAmount = Number(totalFines);
    const overdueBooks = fineAmount > 0 ? Math.ceil(fineAmount / 10) : 0;
    return {
      success: true,
      message: fineAmount > 0 ? 'Your current outstanding fines' : 'You have no outstanding fines',
      data: {
        totalFines: fineAmount,
        overdueBooks,
        details: fineAmount > 0 
          ? `You have ${overdueBooks} overdue book(s) with ₹${fineAmount} fine`
          : 'All your books are returned on time!'
      }
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
        success: true,
        message: 'Fine has been waived',
        data: {
          issueId: 'clr123abc456def789',
          reason: 'Book was damaged when issued',
          waiveAmount: 50.00
        }
      }
    }
  })
  async waiveFine(
    @Param('issueId') issueId: string,
    @Body() waiveFineDto: WaiveFineDto,
    @CurrentUser() user: any,
  ) {
    const issue = await this.finesService['prisma'].issue.findUnique({ where: { id: issueId } });
    const waiveAmount = issue?.fineAmount || 0;
    
    await this.finesService.waiveFine(issueId, waiveFineDto.waiveReason, user.id);
    return {
      success: true,
      message: 'Fine has been waived',
      data: {
        issueId,
        reason: waiveFineDto.waiveReason,
        waiveAmount: Number(waiveAmount),
      }
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
        success: true,
        message: 'Payment recorded successfully',
        data: {
          issueId: 'clr123abc456def789',
          paidAmount: 50.00,
          paymentMethod: 'CASH',
          remainingFine: 0.00,
          status: 'PAID'
        }
      }
    }
  })
  async recordPayment(
    @Param('issueId') issueId: string,
    @Body() recordPaymentDto: RecordPaymentDto,
  ) {
    const issue = await this.finesService['prisma'].issue.findUnique({ where: { id: issueId } });
    const originalFine = Number(issue?.fineAmount || 0);
    const paidAmount = recordPaymentDto.paidAmount;
    const remainingFine = Math.max(0, originalFine - paidAmount);
    
    await this.finesService.recordFinePayment(
      issueId,
      new Decimal(paidAmount),
      recordPaymentDto.paymentMethod,
    );
    
    return {
      success: true,
      message: 'Payment recorded successfully',
      data: {
        issueId,
        paidAmount,
        paymentMethod: recordPaymentDto.paymentMethod,
        remainingFine,
        status: remainingFine === 0 ? 'PAID' : 'PARTIAL'
      }
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
    description: 'Fine configuration retrieved successfully',
    schema: {
      example: {
        success: true,
        message: 'Current fine settings',
        data: {
          finePerDay: 10.00,
          maxFineAmount: 1000.00,
          gracePeriodDays: 1,
          currency: 'INR'
        }
      }
    }
  })
  async getFineConfiguration() {
    const config = await this.finesService.getFineConfiguration();
    return {
      success: true,
      message: 'Current fine settings',
      data: {
        finePerDay: Number(config.finePerDay),
        maxFineAmount: Number(config.maxFineAmount),
        gracePeriodDays: config.gracePeriodDays,
        currency: 'INR'
      }
    };
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
        success: true,
        message: 'Fine settings updated successfully',
        data: {
          finePerDay: 15.00,
          maxFineAmount: 1500.00,
          gracePeriodDays: 2,
          updatedBy: 'admin@library.com'
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
      success: true,
      message: 'Fine settings updated successfully',
      data: {
        finePerDay: updateFineConfigDto.finePerDay,
        maxFineAmount: updateFineConfigDto.maxFineAmount,
        gracePeriodDays: updateFineConfigDto.gracePeriodDays,
        updatedBy: user.email
      }
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
        success: true,
        message: 'Test data created successfully',
        data: {
          overdueIssuesCreated: 3,
          totalFines: 150.00,
          note: 'You can now test the fine system endpoints'
        }
      }
    }
  })
  async createOverdueSample(@CurrentUser() user: any) {
    const result = await this.finesService.createSampleOverdueIssues(user.id);
    return {
      success: true,
      message: 'Test data created successfully',
      data: {
        overdueIssuesCreated: result.created,
        totalFines: Number(result.totalFines),
        note: 'You can now test the fine system endpoints'
      }
    };
  }
}