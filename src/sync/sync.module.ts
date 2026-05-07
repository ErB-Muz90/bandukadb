import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';
import {
  Transaction, Shift, Product, Customer,
  Employee, StockTransaction, SyncLog,
} from '../database/entities';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Transaction, Shift, Product, Customer,
      Employee, StockTransaction, SyncLog,
    ]),
    AuthModule,
  ],
  controllers: [SyncController],
  providers: [SyncService],
  exports: [SyncService],
})
export class SyncModule {}
