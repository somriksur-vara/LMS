import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { FinesService } from './fines.service';

@Injectable()
export class FinesCronService {
  private readonly logger = new Logger(FinesCronService.name);

  constructor(private readonly finesService: FinesService) {}

  /**
   * Run daily at 2 AM to calculate fines for all active issues
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async calculateDailyFines() {
    this.logger.log('Starting daily fine calculation...');
    
    try {
      const result = await this.finesService.calculateAllActiveFines();
      
      this.logger.log(
        `Daily fine calculation completed: ${result.updated} issues updated, total fines: ₹${result.totalFines}`
      );
    } catch (error) {
      this.logger.error('Error during daily fine calculation:', error);
    }
  }

  /**
   * Run every hour to update overdue status
   */
  @Cron(CronExpression.EVERY_HOUR)
  async updateOverdueStatus() {
    this.logger.log('Updating overdue status...');
    
    try {
      // Update issues that are now overdue
      const result = await this.finesService['prisma'].issue.updateMany({
        where: {
          status: 'ACTIVE',
          expectedReturnDate: { lt: new Date() },
          actualReturnDate: null,
        },
        data: {
          status: 'OVERDUE',
        },
      });

      if (result.count > 0) {
        this.logger.log(`Updated ${result.count} issues to OVERDUE status`);
      }
    } catch (error) {
      this.logger.error('Error updating overdue status:', error);
    }
  }
}