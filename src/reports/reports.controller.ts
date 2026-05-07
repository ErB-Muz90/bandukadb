import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { IsOptional, IsString, IsNumberString } from 'class-validator';
import { JwtAuthGuard, CurrentUser } from '../auth/jwt.strategy';
import { ReportsService } from './reports.service';

class DateRangeQuery {
  @IsOptional() @IsString() from?: string;
  @IsOptional() @IsString() to?: string;
  @IsOptional() @IsNumberString() limit?: string;
}

type CloudUser = { id: string; businessId: string; role: string };

function parseRange(from?: string, to?: string): { from: Date; to: Date } {
  const now = new Date();
  const toDate = to ? new Date(to) : now;
  toDate.setHours(23, 59, 59, 999);
  const fromDate = from ? new Date(from) : new Date(now.getFullYear(), now.getMonth(), 1);
  fromDate.setHours(0, 0, 0, 0);
  return { from: fromDate, to: toDate };
}

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private reports: ReportsService) {}

  @Get('dashboard')
  dashboard(@CurrentUser() user: CloudUser, @Query() q: DateRangeQuery) {
    const { from, to } = parseRange(q.from, q.to);
    return this.reports.getDashboardSummary(user.businessId, from, to);
  }

  @Get('revenue/daily')
  dailyRevenue(@CurrentUser() user: CloudUser, @Query() q: DateRangeQuery) {
    const { from, to } = parseRange(q.from, q.to);
    return this.reports.getDailyRevenue(user.businessId, from, to);
  }

  @Get('products/top')
  topProducts(@CurrentUser() user: CloudUser, @Query() q: DateRangeQuery) {
    const { from, to } = parseRange(q.from, q.to);
    return this.reports.getTopProducts(user.businessId, from, to, q.limit ? parseInt(q.limit, 10) : 10);
  }

  @Get('shifts')
  shifts(@CurrentUser() user: CloudUser, @Query() q: DateRangeQuery) {
    const { from, to } = parseRange(q.from, q.to);
    return this.reports.getShiftSummary(user.businessId, from, to);
  }

  @Get('inventory')
  inventory(@CurrentUser() user: CloudUser) {
    return this.reports.getInventorySnapshot(user.businessId);
  }

  @Get('customers')
  customers(@CurrentUser() user: CloudUser, @Query() q: DateRangeQuery) {
    const { from, to } = parseRange(q.from, q.to);
    return this.reports.getCustomerInsights(user.businessId, from, to);
  }
}
