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
import { FinesService } from './fines.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { UpdateFineConfigDto, WaiveFineDto, RecordPaymentDto } from './dto';
import { Decimal } from '@prisma/client/runtime/library';

@Controller('fines')
@UseGuards(JwtAuthGuard)
export class FinesController {
  constructor(private readonly finesService: FinesService) {}

  @Get('overdue')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
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
  async calculateIssueFine(@Param('issueId') issueId: string) {
    const fineAmount = await this.finesService.calculateFine(issueId);
    return {
      issueId,
      fineAmount,
    };
  }

  @Get('user/:userId/outstanding')
  async getUserOutstandingFines(@Param('userId') userId: string) {
    const totalFines = await this.finesService.getUserOutstandingFines(userId);
    return {
      userId,
      totalOutstandingFines: totalFines,
    };
  }

  @Get('user/my-fines')
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
  async getFineConfiguration() {
    return this.finesService.getFineConfiguration();
  }

  @Put('configuration')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
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
}