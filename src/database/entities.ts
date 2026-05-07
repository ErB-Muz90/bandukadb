import {
  Entity, PrimaryColumn, Column, CreateDateColumn,
  UpdateDateColumn, Index,
} from 'typeorm';

@Entity('businesses')
export class Business {
  @PrimaryColumn('uuid') id: string;
  @Column() name: string;
  @Column({ nullable: true }) phone: string;
  @Column({ nullable: true }) email: string;
  @Column({ nullable: true }) address: string;
  @Column({ nullable: true }) kraPin: string;
  @Column({ default: 'generic' }) verticalType: string;
  @Column({ type: 'jsonb', nullable: true }) verticalConfig: Record<string, unknown>;
  @Column({ default: 'active' }) status: string;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}

@Entity('directors')
export class Director {
  @PrimaryColumn('uuid') id: string;
  @Column() businessId: string;
  @Column({ unique: true }) email: string;
  @Column() passwordHash: string;
  @Column({ default: 'director' }) role: string;
  @Column({ default: 'active' }) status: string;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}

@Entity('transactions')
@Index(['businessId', 'date'])
@Index(['businessId', 'status'])
export class Transaction {
  @PrimaryColumn('uuid') id: string;
  @Column('uuid') businessId: string;
  @Column({ nullable: true }) transactionNumber: string;
  @Column({ type: 'bigint' }) date: number;
  @Column({ default: 'completed' }) status: string;
  @Column({ type: 'decimal', precision: 12, scale: 2 }) total: number;
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 }) subtotal: number;
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 }) taxTotal: number;
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 }) discountTotal: number;
  @Column({ nullable: true }) cashierId: string;
  @Column({ nullable: true }) cashierName: string;
  @Column({ nullable: true }) customerId: string;
  @Column({ nullable: true }) customerName: string;
  @Column({ nullable: true }) paymentMethod: string;
  @Column({ type: 'jsonb', nullable: true }) payments: unknown[];
  @Column({ type: 'jsonb', nullable: true }) items: unknown[];
  @Column({ type: 'bigint', nullable: true }) endTime: number;
  @Column({ nullable: true }) terminalId: string;
  @Column({ nullable: true }) shiftId: string;
  @Column({ type: 'jsonb', nullable: true }) raw: Record<string, unknown>;
  @CreateDateColumn() syncedAt: Date;
}

@Entity('shifts')
@Index(['businessId', 'status'])
export class Shift {
  @PrimaryColumn('uuid') id: string;
  @Column('uuid') businessId: string;
  @Column({ nullable: true }) shiftRef: string;
  @Column({ nullable: true }) employeeId: string;
  @Column({ nullable: true }) employeeName: string;
  @Column({ default: 'open' }) status: string;
  @Column({ nullable: true }) branchId: string;
  @Column({ nullable: true }) openedBy: string;
  @Column({ nullable: true }) openedAt: string;
  @Column({ nullable: true }) closedAt: string;
  @Column({ nullable: true }) closedBy: string;
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 }) openingFloat: number;
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 }) retainedFloat: number;
  @Column({ type: 'jsonb', nullable: true }) raw: Record<string, unknown>;
  @CreateDateColumn() syncedAt: Date;
}

@Entity('products')
@Index(['businessId', 'status'])
export class Product {
  @PrimaryColumn('uuid') id: string;
  @Column('uuid') businessId: string;
  @Column() name: string;
  @Column({ nullable: true }) sku: string;
  @Column({ nullable: true }) barcode: string;
  @Column({ type: 'decimal', precision: 12, scale: 2 }) price: number;
  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true }) costPrice: number;
  @Column({ type: 'int', default: 0 }) stock: number;
  @Column({ nullable: true }) category: string;
  @Column({ nullable: true }) status: string;
  @Column({ type: 'jsonb', nullable: true }) raw: Record<string, unknown>;
  @CreateDateColumn() syncedAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}

@Entity('customers')
@Index(['businessId'])
export class Customer {
  @PrimaryColumn('uuid') id: string;
  @Column('uuid') businessId: string;
  @Column() name: string;
  @Column({ nullable: true }) phone: string;
  @Column({ nullable: true }) email: string;
  @Column({ type: 'int', default: 0 }) points: number;
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 }) totalSpent: number;
  @Column({ type: 'jsonb', nullable: true }) raw: Record<string, unknown>;
  @CreateDateColumn() syncedAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}

@Entity('employees')
@Index(['businessId'])
export class Employee {
  @PrimaryColumn('uuid') id: string;
  @Column('uuid') businessId: string;
  @Column() name: string;
  @Column({ default: 'cashier' }) role: string;
  @Column({ default: 'active' }) status: string;
  @Column({ type: 'jsonb', nullable: true }) raw: Record<string, unknown>;
  @CreateDateColumn() syncedAt: Date;
}

@Entity('stock_transactions')
@Index(['businessId', 'productId'])
export class StockTransaction {
  @PrimaryColumn('uuid') id: string;
  @Column('uuid') businessId: string;
  @Column('uuid') productId: string;
  @Column() type: string;
  @Column({ type: 'int' }) quantity: number;
  @Column({ type: 'int' }) stockBefore: number;
  @Column({ type: 'int' }) stockAfter: number;
  @Column({ nullable: true }) referenceId: string;
  @Column({ type: 'bigint' }) timestamp: number;
  @Column({ type: 'jsonb', nullable: true }) raw: Record<string, unknown>;
  @CreateDateColumn() syncedAt: Date;
}

@Entity('sync_log')
@Index(['businessId', 'entity'])
@Index(['businessId', 'receivedAt'])
export class SyncLog {
  @PrimaryColumn('uuid') id: string;
  @Column('uuid') businessId: string;
  @Column() entity: string;
  @Column('uuid') entityId: string;
  @Column() operation: string;
  @Column({ default: 'ok' }) result: string;
  @Column({ nullable: true }) error: string;
  @Column({ type: 'bigint' }) clientTimestamp: number;
  @CreateDateColumn() receivedAt: Date;
}
