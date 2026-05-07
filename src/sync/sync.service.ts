import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import {
  Transaction, Shift, Product, Customer,
  Employee, StockTransaction, SyncLog,
} from '../database/entities';

export interface SyncPayload {
  operation: 'create' | 'update' | 'delete';
  entityId: string;
  payload: Record<string, unknown>;
  clientTimestamp: number;
}

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    @InjectRepository(Transaction) private transactions: Repository<Transaction>,
    @InjectRepository(Shift) private shifts: Repository<Shift>,
    @InjectRepository(Product) private products: Repository<Product>,
    @InjectRepository(Customer) private customers: Repository<Customer>,
    @InjectRepository(Employee) private employees: Repository<Employee>,
    @InjectRepository(StockTransaction) private stockTxs: Repository<StockTransaction>,
    @InjectRepository(SyncLog) private syncLog: Repository<SyncLog>,
  ) {}

  private async upsert<T extends object>(
    repo: Repository<T>,
    businessId: string,
    entity: string,
    dto: SyncPayload,
    transform: (payload: Record<string, unknown>, businessId: string) => Partial<T>,
  ): Promise<void> {
    const logEntry = {
      id: uuid(), businessId, entity,
      entityId: dto.entityId,
      operation: dto.operation,
      clientTimestamp: dto.clientTimestamp,
    };
    try {
      if (dto.operation === 'delete') {
        await repo.delete(dto.entityId as never);
      } else {
        await repo.upsert(transform(dto.payload, businessId) as never, ['id']);
      }
      await this.syncLog.save({ ...logEntry, result: 'ok' });
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      this.logger.error(`Sync failed [${entity}:${dto.entityId}]: ${error}`);
      await this.syncLog.save({ ...logEntry, result: 'error', error: error.slice(0, 500) });
      throw err;
    }
  }

  async syncTransaction(businessId: string, dto: SyncPayload): Promise<void> {
    await this.upsert(this.transactions, businessId, 'transaction', dto, (p, bId) => ({
      id: p.id as string, businessId: bId,
      transactionNumber: p.transactionNumber as string,
      date: p.date as number ?? p.startTime as number,
      status: p.status as string ?? 'completed',
      total: Number(p.total ?? 0), subtotal: Number(p.subtotal ?? 0),
      taxTotal: Number(p.taxTotal ?? 0),
      discountTotal: Number(p.discountTotal ?? p.discount ?? 0),
      cashierId: p.cashierId as string, cashierName: p.cashierName as string,
      customerId: p.customerId as string, customerName: p.customerName as string,
      paymentMethod: p.paymentMethod as string,
      payments: p.payments as unknown[], items: p.items as unknown[],
      endTime: p.endTime as number, terminalId: p.terminalId as string,
      shiftId: p.shiftId as string, raw: p,
    }));
  }

  async syncShift(businessId: string, dto: SyncPayload): Promise<void> {
    await this.upsert(this.shifts, businessId, 'shift', dto, (p, bId) => ({
      id: p.id as string, businessId: bId,
      shiftRef: p.shiftRef as string,
      employeeId: p.employeeId as string ?? p.openedBy as string,
      employeeName: p.employeeName as string ?? p.openedByName as string,
      status: p.status as string ?? 'open',
      branchId: p.branchId as string, openedBy: p.openedBy as string,
      openedAt: p.openedAt as string, closedAt: p.closedAt as string,
      closedBy: p.closedBy as string,
      openingFloat: Number(p.openingFloat ?? 0),
      retainedFloat: Number(p.retainedFloat ?? 0), raw: p,
    }));
  }

  async syncProduct(businessId: string, dto: SyncPayload): Promise<void> {
    await this.upsert(this.products, businessId, 'product', dto, (p, bId) => ({
      id: p.id as string, businessId: bId,
      name: p.name as string, sku: p.sku as string, barcode: p.barcode as string,
      price: Number(p.price ?? p.sellingPrice ?? 0),
      costPrice: Number(p.costPrice ?? 0), stock: Number(p.stock ?? 0),
      category: p.category as string, status: p.status as string ?? 'active', raw: p,
    }));
  }

  async syncCustomer(businessId: string, dto: SyncPayload): Promise<void> {
    await this.upsert(this.customers, businessId, 'customer', dto, (p, bId) => ({
      id: p.id as string, businessId: bId,
      name: p.name as string, phone: p.phone as string, email: p.email as string,
      points: Number(p.points ?? p.loyaltyPoints ?? 0),
      totalSpent: Number(p.totalSpent ?? 0), raw: p,
    }));
  }

  async syncEmployee(businessId: string, dto: SyncPayload): Promise<void> {
    await this.upsert(this.employees, businessId, 'employee', dto, (p, bId) => ({
      id: p.id as string, businessId: bId,
      name: p.name as string, role: p.role as string ?? 'cashier',
      status: p.status as string ?? 'active',
      raw: { ...p, pin: undefined },
    }));
  }

  async syncStockTransaction(businessId: string, dto: SyncPayload): Promise<void> {
    await this.upsert(this.stockTxs, businessId, 'stock_transaction', dto, (p, bId) => ({
      id: p.id as string, businessId: bId,
      productId: p.productId as string, type: p.type as string,
      quantity: Number(p.quantity ?? 0), stockBefore: Number(p.stockBefore ?? 0),
      stockAfter: Number(p.stockAfter ?? 0), referenceId: p.referenceId as string,
      timestamp: Number(p.timestamp ?? Date.now()), raw: p,
    }));
  }

  async getSyncStatus(businessId: string) {
    const [transactions, products, customers, lastLog] = await Promise.all([
      this.transactions.count({ where: { businessId } }),
      this.products.count({ where: { businessId } }),
      this.customers.count({ where: { businessId } }),
      this.syncLog.findOne({ where: { businessId }, order: { receivedAt: 'DESC' } }),
    ]);
    return { transactions, products, customers, lastSync: lastLog?.receivedAt ?? null };
  }
}
