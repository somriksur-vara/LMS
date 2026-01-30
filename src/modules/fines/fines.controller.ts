import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { FinesService } from './fines.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { RecordPaymentDto } from './dto';

@ApiTags('💰 Fines')
@Controller('fines')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class FinesController {
  constructor(private readonly finesService: FinesService) {}

  @Get('my-fines')
  @ApiOperation({
    summary: 'Check my fines',
    description: 'Shows your current outstanding fines for overdue books',
  })
  @ApiResponse({
    status: 200,
    description: 'Your current fine amount',
    schema: {
      example: {
        totalFines: 75.00,
        overdueBooks: [
          {
            issueId: 'issue_123',
            bookTitle: 'Clean Code',
            daysOverdue: 5,
            fineAmount: 40.00,
            dueDate: '2024-01-15'
          }
        ]
      }
    }
  })
  async getMyFines(@CurrentUser() user: any) {
    return this.finesService.getUserFines(user.id);
  }

  @Post('pay/:issueId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Pay fine for a book',
    description: 'Record payment for an overdue book fine',
  })
  @ApiParam({ name: 'issueId', description: 'Book issue ID' })
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
  })
  async payFine(
    @Param('issueId') issueId: string,
    @Body() paymentDto: RecordPaymentDto,
  ) {
    return this.finesService.recordPayment(issueId, paymentDto.paidAmount, paymentDto.paymentMethod);
  }

  @Get('overdue')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @ApiOperation({
    summary: 'View all overdue books (Admin only)',
    description: 'Shows all overdue books with fines for library staff',
  })
  @ApiResponse({
    status: 200,
    description: 'List of overdue books with fines',
  })
  async getOverdueBooks() {
    return this.finesService.getOverdueBooks();
  }

  @Post('waive/:issueId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Waive fine (Admin only)',
    description: 'Cancel a fine without payment',
  })
  @ApiParam({ name: 'issueId', description: 'Book issue ID' })
  @ApiBody({
    description: 'Reason for waiving',
    schema: {
      example: {
        reason: 'Book was damaged when issued'
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Fine waived successfully',
  })
  async waiveFine(
    @Param('issueId') issueId: string,
    @Body() body: { reason: string },
    @CurrentUser() user: any,
  ) {
    return this.finesService.waiveFine(issueId, body.reason, user.id);
  }
}