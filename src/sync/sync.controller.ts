import { Controller, Post, Get, Body, UseGuards, HttpCode } from '@nestjs/common';
import { IsString, IsIn, IsNumber, IsObject } from 'class-validator';
import { JwtAuthGuard, CurrentUser } from '../auth/jwt.strategy';
import { SyncService, SyncPayload } from './sync.service';

class SyncDto implements SyncPayload {
  @IsIn(['create', 'update', 'delete']) operation: 'create' | 'update' | 'delete';
  @IsString() entityId: string;
  @IsObject() payload: Record<string, unknown>;
  @IsNumber() clientTimestamp: number;
}

type CloudUser = { id: string; businessId: string; role: string };

@Controller('sync')
@UseGuards(JwtAuthGuard)
export class SyncController {
  constructor(private sync: SyncService) {}

  @Get('status')
  status(@CurrentUser() user: CloudUser) {
    return this.sync.getSyncStatus(user.businessId);
  }

  @Post('transactions') @HttpCode(200)
  syncTransaction(@CurrentUser() user: CloudUser, @Body() dto: SyncDto) {
    return this.sync.syncTransaction(user.businessId, dto);
  }

  @Post('shifts') @HttpCode(200)
  syncShift(@CurrentUser() user: CloudUser, @Body() dto: SyncDto) {
    return this.sync.syncShift(user.businessId, dto);
  }

  @Post('shifts/full') @HttpCode(200)
  syncShiftFull(@CurrentUser() user: CloudUser, @Body() dto: SyncDto) {
    return this.sync.syncShift(user.businessId, dto);
  }

  @Post('products') @HttpCode(200)
  syncProduct(@CurrentUser() user: CloudUser, @Body() dto: SyncDto) {
    return this.sync.syncProduct(user.businessId, dto);
  }

  @Post('customers') @HttpCode(200)
  syncCustomer(@CurrentUser() user: CloudUser, @Body() dto: SyncDto) {
    return this.sync.syncCustomer(user.businessId, dto);
  }

  @Post('employees') @HttpCode(200)
  syncEmployee(@CurrentUser() user: CloudUser, @Body() dto: SyncDto) {
    return this.sync.syncEmployee(user.businessId, dto);
  }

  @Post('stock-transactions') @HttpCode(200)
  syncStockTransaction(@CurrentUser() user: CloudUser, @Body() dto: SyncDto) {
    return this.sync.syncStockTransaction(user.businessId, dto);
  }

  // Accepted but not stored — prevents 404s until modules are built
  @Post('vendors') @HttpCode(200) syncVendor() { return { accepted: true }; }
  @Post('suppliers') @HttpCode(200) syncSupplier() { return { accepted: true }; }
  @Post('expenses') @HttpCode(200) syncExpense() { return { accepted: true }; }
  @Post('damages') @HttpCode(200) syncDamage() { return { accepted: true }; }
  @Post('purchase-orders') @HttpCode(200) syncPO() { return { accepted: true }; }
  @Post('layaways') @HttpCode(200) syncLayaway() { return { accepted: true }; }
  @Post('layaway-agreements') @HttpCode(200) syncLayawayAgreement() { return { accepted: true }; }
  @Post('refunds') @HttpCode(200) syncRefund() { return { accepted: true }; }
  @Post('cashier-sessions') @HttpCode(200) syncSession() { return { accepted: true }; }
  @Post('banking-records') @HttpCode(200) syncBanking() { return { accepted: true }; }
  @Post('card-settlements') @HttpCode(200) syncCard() { return { accepted: true }; }
  @Post('journal-entries') @HttpCode(200) syncJournal() { return { accepted: true }; }
  @Post('ap/invoices') @HttpCode(200) syncAPInvoice() { return { accepted: true }; }
  @Post('ap/payments') @HttpCode(200) syncAPPayment() { return { accepted: true }; }
  @Post('ap/credit-notes') @HttpCode(200) syncAPCreditNote() { return { accepted: true }; }
  @Post('ap/batch-payments') @HttpCode(200) syncAPBatch() { return { accepted: true }; }
  @Post('ar/invoices') @HttpCode(200) syncARInvoice() { return { accepted: true }; }
  @Post('ar/payments') @HttpCode(200) syncARPayment() { return { accepted: true }; }
  @Post('accounting/periods') @HttpCode(200) syncPeriod() { return { accepted: true }; }
  @Post('accounting/fiscal-years') @HttpCode(200) syncFiscalYear() { return { accepted: true }; }
  @Post('accounting/tax-periods') @HttpCode(200) syncTaxPeriod() { return { accepted: true }; }
}
